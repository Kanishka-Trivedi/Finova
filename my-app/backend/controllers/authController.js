import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret123", {
    expiresIn: "30d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password, deviceName } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Record login activity
      user.loginActivity.unshift({
        device: deviceName || "Unknown Device",
        timestamp: new Date(),
        ip: req.ip,
      });

      // Keep only last 5 activities
      if (user.loginActivity.length > 5) {
        user.loginActivity = user.loginActivity.slice(0, 5);
      }

      await user.save();

      if (user.twoFactorEnabled) {
        // Generate and store OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = {
          code: otpCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
        };
        await user.save();

        // In a real app, send OTP via email/SMS here
        console.log(`OTP for ${user.email}: ${otpCode}`);

        return res.json({
          _id: user._id,
          email: user.email,
          twoFactorRequired: true,
          message: "OTP sent to your registered device/email",
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otp || user.otp.code !== otp || user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (user && (await bcrypt.compare(currentPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      res.json({ message: "Password updated successfully" });
    } else {
      res.status(401).json({ message: "Invalid current password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSecuritySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const {
      biometricsEnabled,
      pinCode,
      pinLength,
      autoLockTimer,
      twoFactorEnabled,
    } = req.body;

    if (biometricsEnabled !== undefined) user.biometricsEnabled = biometricsEnabled;
    if (pinLength !== undefined) user.pinLength = pinLength;
    if (autoLockTimer !== undefined) user.autoLockTimer = autoLockTimer;
    if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

    if (pinCode) {
      const salt = await bcrypt.genSalt(10);
      user.pinCode = await bcrypt.hash(pinCode.toString(), salt);
    } else if (pinCode === null) {
      user.pinCode = undefined;
    }

    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.pinCode) return res.status(400).json({ message: "No PIN set" });

    const match = await bcrypt.compare(pin.toString(), user.pinCode);
    if (match) {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: "Incorrect PIN" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSecuritySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "biometricsEnabled pinLength autoLockTimer twoFactorEnabled loginActivity pinCode"
    );
    if (user) {
      // Don't send the actual hashed PIN, just whether it's set
      const settings = user.toObject();
      settings.hasPin = !!user.pinCode;
      delete settings.pinCode;
      res.json(settings);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendSecurityOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
    await user.save();

    // In production: send via email/SMS. For dev: log to console.
    console.log(`[Security OTP] for ${user.email}: ${otpCode}`);

    res.json({ message: "OTP sent to your registered email", email: user.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.profilePhoto = req.body.profilePhoto || user.profilePhoto;
      user.firmName = req.body.firmName || user.firmName;
      user.gstNumber = req.body.gstNumber || user.gstNumber;
      user.panNumber = req.body.panNumber || user.panNumber;
      user.businessType = req.body.businessType || user.businessType;
      user.yearsInBusiness = req.body.yearsInBusiness || user.yearsInBusiness;
      user.registeredAddress = req.body.registeredAddress || user.registeredAddress;
      user.pincode = req.body.pincode || user.pincode;
      user.siteLocation = req.body.siteLocation || user.siteLocation;
      user.primaryPhone = req.body.primaryPhone || user.primaryPhone;
      user.alternatePhone = req.body.alternatePhone || user.alternatePhone;
      user.website = req.body.website || user.website;

      const updatedUser = await user.save();
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePhoto: updatedUser.profilePhoto,
        firmName: updatedUser.firmName,
        gstNumber: updatedUser.gstNumber,
        panNumber: updatedUser.panNumber,
        businessType: updatedUser.businessType,
        yearsInBusiness: updatedUser.yearsInBusiness,
        registeredAddress: updatedUser.registeredAddress,
        pincode: updatedUser.pincode,
        siteLocation: updatedUser.siteLocation,
        primaryPhone: updatedUser.primaryPhone,
        alternatePhone: updatedUser.alternatePhone,
        website: updatedUser.website,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    const { image } = req.body; // base64 data URI
    if (!image) return res.status(400).json({ message: "No image provided" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Delete old photo from Cloudinary if it exists
    if (user.profilePhoto) {
      try {
        // Extract public_id from URL
        const parts = user.profilePhoto.split("/");
        const filenameWithExt = parts[parts.length - 1]; // e.g. "abc123.jpg"
        const folder = parts[parts.length - 2]; // e.g. "profile_photos"
        const publicId = `${folder}/${filenameWithExt.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (delErr) {
        console.log("Old photo delete warning:", delErr.message);
      }
    }

    // Upload new image
    const result = await cloudinary.uploader.upload(image, {
      folder: "profile_photos",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
      overwrite: true,
    });

    // Save URL to user
    user.profilePhoto = result.secure_url;
    await user.save();

    res.json({
      profilePhoto: result.secure_url,
      message: "Profile photo updated successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message || "Upload failed" });
  }
};
