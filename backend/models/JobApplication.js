import mongoose from "mongoose";

const JobApplicationSchema = new mongoose.Schema({
  userId: { type: String, ref: "User", required: true },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  status: { type: String, default: "Pending" },
  score: { type: Number, default: null },
  scoringDetails: { type: Object, default: null },
  date: { type: Number, required: true },
});

const JobApplication = mongoose.model("JobApplication", JobApplicationSchema);

export default JobApplication;
