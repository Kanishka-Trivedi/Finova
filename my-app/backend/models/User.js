import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // Builder specific fields
  profilePhoto: { type: String, default: "" },
  firmName: { type: String, default: "" },
  gstNumber: { type: String, default: "" },
  panNumber: { type: String, default: "" },
  businessType: { type: String, enum: ["Proprietorship", "Partnership", "Pvt Ltd", "Public Ltd", "Other"], default: "Other" },
  yearsInBusiness: { type: Number, default: 0 },
  registeredAddress: { type: String, default: "" },
  pincode: { type: String, default: "" },
  siteLocation: { type: String, default: "" },
  primaryPhone: { type: String, default: "" },
  alternatePhone: { type: String, default: "" },
  website: { type: String, default: "" },
  // Data Management
  lastBackup: { type: Date },
  backupFrequency: { type: String, enum: ["None", "Daily", "Weekly", "Monthly"], default: "None" },
  googleDriveConnected: { type: Boolean, default: false },
  // Security Settings
  biometricsEnabled: { type: Boolean, default: false },
  pinCode: { type: String }, // Hashed PIN
  pinLength: { type: Number, enum: [4, 6], default: 4 },
  autoLockTimer: { type: Number, default: 0 }, // 0 means disabled, otherwise seconds
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String },
  otp: {
    code: { type: String },
    expiresAt: { type: Date }
  },
  loginActivity: [
    {
      device: { type: String },
      timestamp: { type: Date, default: Date.now },
      ip: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

export default User;
