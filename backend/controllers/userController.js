import bcrypt from "bcrypt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"; // S3 SDK
import Company from "../models/Company.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { sendOTPEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

// --- S3 Client Setup ---
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper function to generate unique filenames
const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString("hex");
// --- End S3 Client Setup ---

// ---
// Password Reset Functions (Unchanged)
// ---

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Send a generic message for security (don't reveal if email exists)
      return res.json({
        success: true,
        message: "If your email is registered, you will receive an OTP.",
      });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    // Set expiry time (10 minutes from now)
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.passwordResetOTP = otp;
    user.passwordResetExpires = expires;
    await user.save();

    // Send the email
    const emailSent = await sendOTPEmail(user.email, otp);

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
    const user = await User.findOne({
      email,
      passwordResetOTP: otp,
      passwordResetExpires: { $gt: Date.now() }, // Check if not expired
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    // OTP is verified
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

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    // Invalidate the OTP
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

export const registerUser = async (req, res) => {
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // --- S3 UPLOAD LOGIC ---
    const fileName = generateFileName();
    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: profileImage.buffer,
      ContentType: profileImage.mimetype,
      ACL: "public-read", // Make the file publicly readable
    };
    await s3Client.send(new PutObjectCommand(s3Params));
    const imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    // --- END S3 LOGIC ---

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role,
      image: imageUrl, // <-- Use S3 URL
    });

    let companyId = null;

    if (role === "Recruiter") {
      const newCompany = await Company.create({
        name,
        contactEmail: email,
        image: imageUrl, // <-- Use S3 URL
        createdBy: newUser._id,
      });

      companyId = newCompany._id;

      newUser.profile = { company: companyId };
      await newUser.save();
    }

    const token = generateToken(newUser._id);

    res.cookie("token", token, {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });

    // Response structure is unchanged
    res.status(201).json({
      success: true,
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
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .json({
        success: true,
        message: `Welcome back, ${user.name}!`,
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
      .clearCookie("token", {
        httpOnly: true,
        path: "/",
        sameSite: "none",
        secure: true,
      })
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
      // --- S3 UPLOAD LOGIC ---
      const fileName = generateFileName();
      const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: profileImage.buffer,
        ContentType: profileImage.mimetype,
        ACL: "public-read",
      };
      await s3Client.send(new PutObjectCommand(s3Params));
      uploadedImageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      // --- END S3 LOGIC ---
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

// ---
// Other User Functions (Unchanged)
// ---

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

    await JobApplication.create({
      companyId: jobData.companyId,
      userId,
      jobId,
      date: Date.now(),
    });

    res.json({ success: true, message: "Applied Successfully" });
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

    // --- S3 UPLOAD LOGIC ---
    const fileName = generateFileName();
    const s3Params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: resumeFile.buffer,
      ContentType: resumeFile.mimetype,
      ACL: "public-read",
    };
    await s3Client.send(new PutObjectCommand(s3Params));
    const resumeUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
    // --- END S3 LOGIC ---

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