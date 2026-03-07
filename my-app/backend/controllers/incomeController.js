import Income from "../models/Income.js";

// CREATE
export const createIncome = async (req, res) => {
    try {
        const { date, dealerName, amount, paymentMode, notes } = req.body;

        if (!dealerName || !amount) {
            return res.status(400).json({ message: "Dealer name and amount are required." });
        }

        const income = await Income.create({
            user: req.user._id,
            date: date || Date.now(),
            dealerName,
            amount: Number(amount),
            paymentMode: paymentMode || "Cash",
            notes: notes || "",
        });

        res.status(201).json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// READ
export const getIncomes = async (req, res) => {
    try {
        const incomes = await Income.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(incomes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE
export const deleteIncome = async (req, res) => {
    try {
        const income = await Income.findById(req.params.id);

        if (!income) {
            return res.status(404).json({ message: "Income not found" });
        }

        if (income.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        await Income.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE
export const updateIncome = async (req, res) => {
    try {
        const income = await Income.findById(req.params.id);

        if (!income) {
            return res.status(404).json({ message: "Income not found" });
        }

        if (income.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "User not authorized" });
        }

        const { dealerName, amount, paymentMode, notes, date } = req.body;

        const updatedIncome = await Income.findByIdAndUpdate(
            req.params.id,
            {
                dealerName: dealerName || income.dealerName,
                amount: amount !== undefined ? Number(amount) : income.amount,
                paymentMode: paymentMode || income.paymentMode,
                notes: notes !== undefined ? notes : income.notes,
                date: date || income.date,
            },
            { new: true }
        );

        res.status(200).json(updatedIncome);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
