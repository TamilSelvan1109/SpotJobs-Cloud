// utils/testSES.js
import dotenv from 'dotenv';
import { sendOTPEmail } from './sendEmail.js';
import { checkEmailVerification } from './checkSESStatus.js';

dotenv.config();

const testSES = async () => {
  console.log("=== Testing SES Configuration ===");
  
  // Check environment variables
  console.log("Environment variables:");
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("SES_VERIFIED_EMAIL:", process.env.SES_VERIFIED_EMAIL);
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "Set" : "Missing");
  console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "Set" : "Missing");
  
  // Check email verification status
  console.log("\n=== Checking Email Verification ===");
  await checkEmailVerification();
  
  // Test sending email
  console.log("\n=== Testing Email Send ===");
  const testEmail = process.env.SES_VERIFIED_EMAIL; // Send to verified email for testing
  const testOTP = "123456";
  
  const result = await sendOTPEmail(testEmail, testOTP);
  console.log("Email send result:", result);
};

testSES().catch(console.error);