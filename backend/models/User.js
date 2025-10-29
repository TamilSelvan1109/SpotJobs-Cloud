import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["User", "Recruiter"],
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    passwordResetOTP: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    profile: {
      bio: { type: String, default: "" },
      website: { type: String, default: "" },
      role: { type: String, default: "" },
      skills: { type: [String], default: [] },
      resume: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      github: { type: String, default: "" },
      company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        default: null,
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
