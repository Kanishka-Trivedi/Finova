import mongoose from "mongoose";

const incomeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    date: { type: Date, default: Date.now },
    dealerName: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMode: {
        type: String,
        enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Credit Card"],
        default: "Cash",
    },
    notes: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
});

const Income = mongoose.model("Income", incomeSchema);

export default Income;
