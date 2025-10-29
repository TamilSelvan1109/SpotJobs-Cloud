// utils/checkSESStatus.js
import { SESClient, GetIdentityVerificationAttributesCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const checkEmailVerification = async () => {
  try {
    const command = new GetIdentityVerificationAttributesCommand({
      Identities: [process.env.SES_VERIFIED_EMAIL]
    });
    
    const response = await sesClient.send(command);
    console.log("Email verification status:", response.VerificationAttributes);
    return response.VerificationAttributes;
  } catch (error) {
    console.error("Error checking email verification:", error);
    return null;
  }
};