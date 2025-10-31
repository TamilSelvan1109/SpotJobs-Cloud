import bcrypt from "bcrypt";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import generateToken from "../utils/generateToken.js";
import { sendOTPEmail, sendVerificationEmail } from "../utils/sendEmail.js";
import { uploadToS3 } from "../utils/s3Upload.js";
import crypto from "crypto";

const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Password Reset Functions
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: "If your email is registered, you will receive an OTP.",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOTP = otp;
    user.passwordResetExpires = expires;
    await user.save();

    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    res.json({
      success: true,
      message: "OTP sent to your email address.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    // amazonq-ignore-next-line
    const user = await User.findOne({
      email,
      passwordResetOTP: otp,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    res.json({ success: true, message: "OTP verified. You can now reset." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
      email,
      passwordResetOTP: otp,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---
// User & Auth Functions (File Uploads Changed)
// ---

export const sendVerificationOTP = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const profileImage = req.file;

    if (!name || !email || !phone || !password || !role || !profileImage) {
      return res
        .status(400)
        .json({ success: false, message: "Some details are missing" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    // Generate OTP and send email first
    const otp = crypto.randomInt(100000, 999999).toString();
    const emailSent = await sendVerificationEmail(email, otp);
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email.",
      });
    }

    // Store registration data temporarily
    const registrationData = {
      name,
      email,
      phone,
      password,
      role,
      // amazonq-ignore-next-line
      imageBuffer: profileImage.buffer.toString('base64'),
      mimetype: profileImage.mimetype,
      otp,
      expires: new Date(Date.now() + 10 * 60 * 1000)
    };

    // Store in a temporary collection or use Redis/session
    // For now, we'll use the existing OTP model
    await Otp.deleteMany({ email });
    await Otp.create({ 
      email, 
      otp, 
      registrationData: JSON.stringify(registrationData)
    });

    res.status(200).json({
      success: true,
      message: "Verification OTP sent to your email.",
      email,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    // amazonq-ignore-next-line
    const registrationData = JSON.parse(otpRecord.registrationData);
    const { name, phone, password, role, imageBuffer, mimetype } = registrationData;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload image to S3
    // amazonq-ignore-next-line
    const imageFile = { buffer: Buffer.from(imageBuffer, 'base64'), mimetype };
    const imageUrl = await uploadToS3(imageFile);

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      image: imageUrl,
      isVerified: true,
    });

    let companyId = null;
    if (role === "Recruiter") {
      const newCompany = await Company.create({
        name,
        contactEmail: email,
        image: imageUrl,
        createdBy: newUser._id,
      });
      companyId = newCompany._id;
      newUser.profile = { company: companyId };
      await newUser.save();
    }

    // Delete OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: "Registration successful!",
      token: token,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        image: newUser.image,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// User login (Unchanged)
export const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Some details are missing" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Please verify your email first" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }
    if (role !== user.role) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid role selected" });
    }

    const token = generateToken(user.id);

    return res
      .status(200)
      .json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        token: token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          image: user.image,
        },
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// User logout (Unchanged)
export const logoutUser = async (req, res) => {
  try {
    res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update the User profile
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.id;
    const {
      name,
      phone,
      bio,
      skills,
      role,
      linkedin,
      github,
      companyWebsite,
      companyIndustry,
      companySize,
      companyContactEmail,
      companyLocation,
      companyDescription,
    } = req.body;

    const profileImage = req.file;
    let uploadedImageUrl = null;

    if (profileImage) {
      // amazonq-ignore-next-line
      uploadedImageUrl = await uploadToS3(profileImage);
    }

    const user = await User.findById(userId).populate("profile.company");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (uploadedImageUrl) user.image = uploadedImageUrl; // <-- Use S3 URL

    if (user.role === "User") {
      if (bio) user.profile.bio = bio;
      if (skills) user.profile.skills = skills.split(",").map((s) => s.trim());
      if (role) user.profile.role = role;
      if (linkedin) user.profile.linkedin = linkedin;
      if (github) user.profile.github = github;
    }

    if (user.role === "Recruiter") {
      if (!user.profile?.company) {
        return res
          .status(400)
          .json({ success: false, message: "No company linked with user!" });
      }

      let company = await Company.findById(user.profile.company);
      if (!company) {
        return res
          .status(400)
          .json({ success: false, message: "Company not found!" });
      }

      if (uploadedImageUrl) company.image = uploadedImageUrl; // <-- Use S3 URL
      if (name) company.name = name;
      if (companyWebsite) company.website = companyWebsite;
      if (companyIndustry) company.industry = companyIndustry;
      if (companySize) company.size = companySize;
      if (companyDescription) company.description = companyDescription;
      if (companyLocation) company.location = companyLocation;
      if (companyContactEmail) company.contactEmail = companyContactEmail;

      await company.save();
    }

    await user.save();

    const userData = await User.findById(userId);

    // Response structure is unchanged
    return res.json({
      success: true,
      message: "Profile updated successfully",
      userData,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get the user data
export const getUserData = async (req, res) => {
  try {
    const userId = req.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User Not Authorized" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get the user data by Id
export const getUserDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select("-password");
    console.log(user);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Apply for a job
export const applyForJob = async (req, res) => {
  const { jobId } = req.body;
  const userId = req.id;
  try {
    const isAlreadyApplied = await JobApplication.find({ jobId, userId });
    if (isAlreadyApplied.length > 0) {
      return res.json({ success: false, message: "Already Applied" });
    }

    const jobData = await Job.findById(jobId);
    if (!jobData) {
      return res.json({ success: false, message: "Job Not Found" });
    }

    const userData = await User.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User Not Found" });
    }

    const application = await JobApplication.create({
      companyId: jobData.companyId,
      userId,
      jobId,
      date: Date.now(),
    });

    // Trigger high-precision Lambda scoring
    try {
      const lambdaPayload = {
        jobTitle: jobData.title,
        jobDescription: jobData.description,
        jobLocation: jobData.location,
        jobCategory: jobData.category,
        jobLevel: jobData.level,
        jobSalary: jobData.salary,
        requiredSkills: jobData.skills || [],
        userSkills: userData.profile?.skills || [],
        userBio: userData.profile?.bio || '',
        userRole: userData.profile?.role || '',
        resumeUrl: userData.profile?.resume || '',
        applicationId: application._id.toString(),
        backendUrl: process.env.BACKEND_URL || 'http://localhost:5000'
      };

      console.log('Triggering high-precision Lambda scoring:', {
        applicationId: application._id.toString(),
        jobTitle: jobData.title,
        hasDescription: !!jobData.description,
        requiredSkillsCount: (jobData.skills || []).length,
        userSkillsCount: (userData.profile?.skills || []).length,
        hasBio: !!userData.profile?.bio,
        hasResume: !!userData.profile?.resume,
        jobLevel: jobData.level,
        userRole: userData.profile?.role
      });

      const command = new InvokeCommand({
        FunctionName: process.env.LAMBDA_FUNCTION_NAME || 'resumeScoring',
        Payload: JSON.stringify({ body: JSON.stringify(lambdaPayload) }),
        InvocationType: 'Event'
      });

      const result = await lambdaClient.send(command);
      
      console.log('High-precision Lambda invoked:', {
        statusCode: result.StatusCode,
        applicationId: application._id.toString(),
        functionName: process.env.LAMBDA_FUNCTION_NAME || 'resumeScoring'
      });
      
    } catch (lambdaError) {
      console.error('Lambda invocation failed:', lambdaError.message);
    }

    res.json({ 
      success: true, 
      message: "Applied Successfully - High-precision scoring in progress",
      applicationId: application._id.toString()
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get user applied applications
export const getUserJobApplications = async (req, res) => {
  try {
    const userId = req.id;

    const applications = await JobApplication.find({ userId })
      .populate("companyId", "name email image")
      .populate("jobId", "title description location category level salary")
      .exec();

    if (!applications || applications.length === 0) {
      return res.json({
        success: false,
        message: "No job applications found for this user",
      });
    }

    const formattedApplications = applications.map((application) => ({
      company: application.companyId.name,
      logo: application.companyId.image,
      title: application.jobId.title,
      location: application.jobId.location,
      date: application.date,
      status: application.status || "Pending",
      score: application.score,
      jobId: application.jobId._id,
    }));

    return res.json({
      success: true,
      applications: formattedApplications,
      message: "Job applications fetched successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update user resume
export const updateUserResume = async (req, res) => {
  try {
    const userId = req.id;
    const resumeFile = req.file;
    const userData = await User.findById(userId);
    if (!resumeFile) {
      return res
        .status(400)
        .json({ success: false, message: "Upload resume!" });
    }

    const resumeUrl = await uploadToS3(resumeFile);

    userData.profile.resume = resumeUrl; // <-- Use S3 URL
    await userData.save();
    
    // Response structure is unchanged
    return res.json({
      success: true,
      message: "Resume Updated",
      user: userData,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Update application score from Lambda
export const updateApplicationScore = async (req, res) => {
  try {
    const { applicationId, score, error, errorMessage } = req.body;
    
    if (error) {
      console.error('Lambda scoring error:', {
        applicationId,
        errorMessage,
        timestamp: new Date().toISOString()
      });
      return res.json({ success: false, message: "Scoring failed", error: errorMessage });
    }
    
    console.log('Resume scoring completed:', {
      applicationId,
      finalScore: score + '%',
      timestamp: new Date().toISOString()
    });
    
    // Update application with only the score
    const application = await JobApplication.findByIdAndUpdate(
      applicationId,
      { score },
      { new: true }
    );
    
    if (!application) {
      console.error('Application not found:', applicationId);
      return res.json({ success: false, message: "Application not found" });
    }
    
    console.log('Application score updated:', {
      applicationId,
      score: score + '%'
    });
    
    return res.json({ 
      success: true, 
      message: "Score updated successfully",
      applicationId,
      score
    });
    
  } catch (error) {
    console.error('Score update error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Check if applied
export const isApplied = async (req, res) => {
  try {
    const userId = req.id;
    const { jobId } = req.body;

    const isExisted = await JobApplication.findOne({ userId, jobId });
    if (isExisted) {
      return res.json({ success: true, applied: true });
    } else {
      res.json({ success: false, applied: false });
    }
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};