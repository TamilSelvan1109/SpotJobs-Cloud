import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3.js";
import crypto from "crypto";

// Helper function to generate unique filenames
const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");

// Upload file to S3
export const uploadToS3 = async (file) => {
  const fileName = generateFileName();
  const s3Params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  
  await s3Client.send(new PutObjectCommand(s3Params));
  
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
};