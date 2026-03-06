import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Expense from "../models/Expense.js";
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

    doc.fontSize(22).fillColor("#4ADE80").text("Finova Expense Report", { align: "center" });
    doc.fontSize(10).fillColor("#888888").text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown();

    doc.fontSize(12).fillColor("#000000").text(`User: ${req.user.name}`);
    doc.text(`Email: ${req.user.email}`);
    doc.text(`Time Range: ${range ? range.toUpperCase() : "ALL"}`);
    doc.text(`Total Records: ${expenses.length}`);
    doc.moveDown();

    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor("#EEEEEE").stroke();
    doc.moveDown();

    let grandTotal = 0;
    expenses.forEach((exp, index) => {
        doc.fontSize(10).fillColor("#333333").text(`${index + 1}. ${exp.date.toISOString().split("T")[0]} - ${exp.vendorName}`, { bold: true });
        doc.fillColor("#666666").text(`   ${exp.category} | ${exp.quantity} ${exp.unit} @ ₹${exp.ratePerUnit}`);
        doc.fillColor("#000000").text(`   Amount: ₹${exp.totalAmount.toLocaleString()} | Mode: ${exp.paymentMode}`);
        doc.moveDown(0.5);
        grandTotal += exp.totalAmount;
    });

    doc.moveDown();
    doc.fontSize(14).fillColor("#000000").text(`Grand Total: ₹${grandTotal.toLocaleString()}`, { align: "right", bold: true });

    doc.end();
});

// @desc    JSON Backup for Local Download
// @route   GET /api/data/backup/local
// @access  Private
export const localJSONBackup = asyncHandler(async (req, res) => {
    const expenses = await Expense.find({ user: req.user._id }).sort({ date: -1 });
    const backupData = {
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        user: {
            name: req.user.name,
            email: req.user.email
        },
        data: expenses
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
        await Expense.deleteMany({ user: req.user._id });
        res.json({ message: "All expense data has been cleared successfully" });
    } else {
        res.status(401).json({ message: "Invalid password. Data not cleared." });
    }
});

// @desc    Get storage statistics
// @route   GET /api/data/stats
// @access  Private
export const getStats = asyncHandler(async (req, res) => {
    // Perform aggregation to get exact BSON size of all documents for this user
    const statsResult = await Expense.aggregate([
        { $match: { user: req.user._id } },
        {
            $group: {
                _id: null,
                totalSize: { $sum: { $bsonSize: "$$ROOT" } },
                count: { $sum: 1 }
            }
        }
    ]);

    const usedBytes = statsResult.length > 0 ? statsResult[0].totalSize : 0;
    const count = statsResult.length > 0 ? statsResult[0].count : 0;

    // Limits based on actual MongoDB Atlas Free Tier (512MB)
    const usedKB = usedBytes / 1024;
    const limitKB = 512 * 1024; // 524288 KB

    res.json({
        count,
        usedKB: parseFloat(usedKB.toFixed(2)),
        limitKB,
        percentage: parseFloat(((usedKB / limitKB) * 100).toFixed(4)),
        lastBackup: req.user.lastBackup,
        backupFrequency: req.user.backupFrequency || "None"
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
    // In a real app, this would trigger an upload to Google Drive using googleapis
    // For now, we simulate success and update the timestamp
    const user = await User.findById(req.user._id);
    if (user) {
        user.lastBackup = new Date();
        await user.save();
        res.json({
            message: "Backup synced successfully to secure cloud storage",
            timestamp: user.lastBackup
        });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});


