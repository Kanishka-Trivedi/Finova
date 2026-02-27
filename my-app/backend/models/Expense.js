import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  date: { type: Date, default: Date.now },
  vendorName: { type: String, required: true },
  category: {
    type: String,
    enum: ["Cement", "Steel", "Sand", "Bricks", "Labor", "Equipment", "Transport", "Miscellaneous"],
    required: true,
  },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  ratePerUnit: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paymentMode: {
    type: String,
    enum: ["Cash", "UPI", "Bank Transfer", "Cheque", "Credit"],
    default: "Cash",
  },
  projectTag: { type: String, default: "" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
