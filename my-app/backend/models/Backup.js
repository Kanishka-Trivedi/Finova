import mongoose from "mongoose";

const backupSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    data: {
        type: Object, // Stores the JSON snapshot of all income and expenses
        required: true,
    },
    stats: {
        expenseCount: Number,
        incomeCount: Number,
        totalVolume: Number,
    },
    label: {
        type: String, // Manual Backup, Auto Daily Backup, etc.
        default: "Manual Snapshot",
    }
}, {
    timestamps: true
});

const Backup = mongoose.model("Backup", backupSchema);

export default Backup;
