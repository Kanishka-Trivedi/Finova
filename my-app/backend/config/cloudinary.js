import { v2 as cloudinary } from "cloudinary";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Resolve .env from the backend root (one level up from config/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Debug: verify config loaded
console.log("[Cloudinary] cloud_name:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ loaded" : "❌ MISSING");

export default cloudinary;
