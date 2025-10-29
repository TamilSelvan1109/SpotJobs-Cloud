// utils/sendEmail.js
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Configure SES
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const sendOTPEmail = async (toEmail, otp) => {
  // Validate environment variables
  if (!process.env.SES_VERIFIED_EMAIL || !process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("Missing AWS SES configuration in environment variables");
    return false;
  }

  const params = {
    Source: process.env.SES_VERIFIED_EMAIL,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: "Your Password Reset OTP",
        Charset: "UTF-8"
      },
      Body: {
        Html: {
          Data: `
            <h3>Password Reset Request</h3>
            <p>Your OTP to reset your password is:</p>
            <h1><b>${otp}</b></h1>
            <p>This OTP will expire in 10 minutes.</p>
          `,
          Charset: "UTF-8"
        },
        Text: {
          Data: `Password Reset Request\n\nYour OTP to reset your password is: ${otp}\n\nThis OTP will expire in 10 minutes.`,
          Charset: "UTF-8"
        }
      },
    },
  };

  try {
    console.log("Attempting to send email to:", toEmail);
    console.log("Using SES region:", process.env.AWS_REGION);
    console.log("From email:", process.env.SES_VERIFIED_EMAIL);
    
    const command = new SendEmailCommand(params);
    const data = await sesClient.send(command);
    console.log("Email sent successfully. MessageId:", data.MessageId);
    return true;
  } catch (error) {
    console.error("Detailed SES error:", {
      message: error.message,
      code: error.name,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
      stack: error.stack
    });
    return false;
  }
}; 