import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
import Income from "../models/Income.js";
import Backup from "../models/Backup.js";
import bcrypt from "bcryptjs";
import xlsx from "xlsx";
import PDFDocument from "pdfkit";

// @desc    Export data to Excel
// @route   GET /api/data/export/excel
// @access  Private
export const exportToExcel = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });

    // Transform data for Excel
    const data = expenses.map((exp) => ({
        Date: exp.date.toISOString().split("T")[0],
        Vendor: exp.vendorName,
        Category: exp.category,
        Quantity: exp.quantity,
        Unit: exp.unit,
        Rate: exp.ratePerUnit,
        Total: exp.totalAmount,
        "Payment Mode": exp.paymentMode,
        Project: exp.projectTag || "",
        Notes: exp.notes || "",
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Expenses");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=expenses.xlsx");
    res.send(buffer);
});

// @desc    Export data to PDF with Date Filtering
// @route   GET /api/data/export/pdf?range=all
// @access  Private
export const exportToPDF = asyncHandler(async (req, res) => {
    const { range } = req.query;
    let query = { user: req.user._id };

    if (range && range !== 'all') {
        const now = new Date();
        let startDate = new Date();

        switch (range) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case '1m':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case '3m':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case '6m':
                startDate.setMonth(now.getMonth() - 6);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        query.date = { $gte: startDate };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });

    const doc = new PDFDocument();
    let buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
        let pdfData = Buffer.concat(buffers);
        res
            .writeHead(200, {
                "Content-Length": Buffer.byteLength(pdfData),
                "Content-Type": "application/pdf",
                "Content-disposition": `attachment;filename=expenses_${range || 'all'}.pdf`,
            })
            .end(pdfData);
    });

    const user = req.user;
    const currency = user.currency || "INR";
    const exchangeRate = user.exchangeRate || 1;
    const isUSD = currency === "USD";
    const symbol = isUSD ? "$" : "₹";

    const convert = (amount) => {
        if (isUSD) return (amount / exchangeRate).toFixed(2);
        return amount.toLocaleString("en-IN");
    };

    doc.fontSize(22).fillColor("#4ADE80").text("Finova Expense Report", { align: "center" });
    doc.fontSize(10).fillColor("#888888").text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown();

    doc.fontSize(12).fillColor("#000000").text(`User: ${req.user.name}`);
    doc.text(`Email: ${req.user.email}`);
    doc.text(`Time Range: ${range ? range.toUpperCase() : "ALL"}`);
    doc.text(`Currency: ${currency} (${isUSD ? `Rate: 1 USD = ${exchangeRate} INR` : "Base"})`);
    doc.text(`Total Records: ${expenses.length}`);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEEEEE").stroke();
    doc.moveDown();

    let grandTotal = 0;
    expenses.forEach((exp, index) => {
        doc.fontSize(10).fillColor("#333333").text(`${index + 1}. ${exp.date.toISOString().split("T")[0]} - ${exp.vendorName}`, { bold: true });
        doc.fillColor("#666666").text(`   ${exp.category} | ${exp.quantity} ${exp.unit} @ ${symbol}${convert(exp.ratePerUnit)}`);
        doc.fillColor("#000000").text(`   Amount: ${symbol}${convert(exp.totalAmount)} | Mode: ${exp.paymentMode}`);
        doc.moveDown(0.5);
        grandTotal += exp.totalAmount;
    });

    doc.moveDown();
    doc.fontSize(14).fillColor("#000000").text(`Grand Total: ${symbol}${convert(grandTotal)}`, { align: "right", bold: true });

    doc.end();
});

// @desc    JSON Backup for Local Download
// @route   GET /api/data/backup/local
// @access  Private
export const localJSONBackup = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    const incomes = await Income.find({ user: req.user._id }).sort({ date: -1 });
    const backupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        user: {
            name: req.user.name,
            email: req.user.email
        },
        data: {
            expenses,
            incomes
        }
    };

    res.json(backupData);
});

// @desc    Import from Excel
// @route   POST /api/data/import/excel
// @access  Private
export const importFromExcel = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "Please upload an Excel file" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const newExpenses = data.map((item) => ({
        user: req.user._id,
        date: item.Date ? new Date(item.Date) : new Date(),
        vendorName: item.Vendor || "Imported Vendor",
        category: item.Category || "Other",
        quantity: Number(item.Quantity) || 0,
        unit: item.Unit || "None",
        ratePerUnit: Number(item.Rate) || 0,
        totalAmount: Number(item.Total) || (Number(item.Quantity) * Number(item.Rate)) || 0,
        paymentMode: item["Payment Mode"] || "Cash",
        projectTag: item.Project || "",
        notes: item.Notes || "",
    }));

    const savedExpenses = await Expense.insertMany(newExpenses);
    res.status(201).json({ count: savedExpenses.length });
});

// @desc    Clear all user data
// @route   POST /api/data/clear
// @access  Private
export const clearAllData = asyncHandler(async (req, res) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ message: "Password is required for confirmation" });
    }

    const user = await User.findById(req.user._id);
    if (user && (await bcrypt.compare(password, user.password))) {
        await Promise.all([
            Expense.deleteMany({ user: req.user._id }),
            Income.deleteMany({ user: req.user._id })
        ]);
        res.json({ message: "All data (expenses & incomes) has been cleared successfully" });
    } else {
        res.status(401).json({ message: "Invalid password. Data not cleared." });
    }
});

// @desc    Get storage statistics
// @route   GET /api/data/stats
// @access  Private
export const getStats = asyncHandler(async (req, res) => {
    // Perform aggregation to get exact BSON size of both expenses and incomes
    const [expenseStats, incomeStats] = await Promise.all([
        Expense.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: { $bsonSize: "$$ROOT" } },
                    count: { $sum: 1 }
                }
            }
        ]),
        Income.aggregate([
            { $match: { user: req.user._id } },
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: { $bsonSize: "$$ROOT" } },
                    count: { $sum: 1 }
                }
            }
        ])
    ]);

    const expSize = expenseStats.length > 0 ? expenseStats[0].totalSize : 0;
    const incSize = incomeStats.length > 0 ? incomeStats[0].totalSize : 0;
    const totalBytes = expSize + incSize;

    const expCount = expenseStats.length > 0 ? expenseStats[0].count : 0;
    const incCount = incomeStats.length > 0 ? incomeStats[0].count : 0;
    const totalCount = expCount + incCount;

    // Limits based on actual MongoDB Atlas Free Tier (512MB)
    const usedKB = totalBytes / 1024;
    const limitKB = 512 * 1024; // 524288 KB

    const backupCount = await Backup.countDocuments({ user: req.user._id });

    res.json({
        count: totalCount,
        usedKB: parseFloat(usedKB.toFixed(2)),
        limitKB,
        percentage: parseFloat(((usedKB / limitKB) * 100).toFixed(4)),
        lastBackup: req.user.lastBackup,
        backupFrequency: req.user.backupFrequency || "None",
        vaultSnapshots: backupCount
    });
});

// @desc    Update backup settings
// @route   PUT /api/data/backup-settings
// @access  Private
export const updateBackupSettings = asyncHandler(async (req, res) => {
    const { frequency } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
        user.backupFrequency = frequency;
        await user.save();
        res.json({ message: "Backup frequency updated", frequency: user.backupFrequency });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

// @desc    Trigger manual backup
// @route   POST /api/data/backup
// @access  Private
export const manualBackup = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ user: req.user._id });
    const incomes = await Income.find({ user: req.user._id });

    const user = await User.findById(req.user._id);
    if (user) {
        // Create actual backup snapshot
        const backup = await Backup.create({
            user: req.user._id,
            timestamp: new Date(),
            label: "Manual Snapshot",
            data: {
                expenses,
                incomes
            },
            stats: {
                expenseCount: expenses.length,
                incomeCount: incomes.length,
                totalVolume: req.body.stats?.usedKB || 0
            }
        });

        user.lastBackup = new Date();
        await user.save();

        res.json({
            message: "Data snapshot stored in Cloud Vault",
            timestamp: user.lastBackup,
            snapshotId: backup._id
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});


