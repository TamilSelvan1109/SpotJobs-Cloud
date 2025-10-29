// utils/sendEmail.js
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Configure SES
const sesClient = new SESClient({
  region: process.env.AWS_REGION?.trim(),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim(),
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  },
});

export const sendVerificationEmail = async (toEmail, otp) => {
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
        Data: "Verify Your SpotJobs Account",
        Charset: "UTF-8"
      },
      Body: {
        Html: {
          Data: `
            <h3>Welcome to SpotJobs!</h3>
            <p>Please verify your email address to complete your registration.</p>
            <p>Your verification code is:</p>
            <h1><b>${otp}</b></h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't create an account, please ignore this email.</p>
          `,
          Charset: "UTF-8"
        },
        Text: {
          Data: `Welcome to SpotJobs!\n\nPlease verify your email address to complete your registration.\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you didn't create an account, please ignore this email.`,
          Charset: "UTF-8"
        }
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const data = await sesClient.send(command);
    console.log("Verification email sent successfully. MessageId:", data.MessageId);
    return true;
  } catch (error) {
    console.error("SES error:", error.message);
    return false;
  }
};

export const sendOTPEmail = async (toEmail, otp) => {
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
    const command = new SendEmailCommand(params);
    const data = await sesClient.send(command);
    console.log("Password reset email sent successfully. MessageId:", data.MessageId);
    return true;
  } catch (error) {
    console.error("SES error:", error.message);
    return false;
  }
}; 