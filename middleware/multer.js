import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "cloudinary";

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile images
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "profileImages of Online Auction System",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 300, height: 300, crop: "limit" }],
  },
});

// Storage for auction images
const auctionImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "auctionImages of Online Auction System",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});
//Storage of Commission Proofs
const commissionProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: "commissionProofs of Online Auction System",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
    transformation: [{ width: 800, height: 600, crop: "limit" }],
  },
});

// Multer uploaders
export const uploadProfile = multer({ storage: profileImageStorage });
export const uploadAuction = multer({ storage: auctionImageStorage });
export const uploadComissionProof = multer({ storage: commissionProofStorage });
