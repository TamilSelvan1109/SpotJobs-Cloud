import Company from "../models/Company.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplication.js";
import User from "../models/User.js";

// Get company data
export const getCompanyData = async (req, res) => {
  try {
    const id = req.id;
    const user = await User.findById(id);
    const company = await Company.findById(user.profile.company);
    if (!company) {
      return res.json({ success: false, message: "Company not found" });
    }
    res.json({ success: true, company });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get company data by Id
export const getCompanyDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findById(id).populate(
      "createdBy",
      "name email phone"
    );
    if (!company) {
      return res.json({ success: false, message: "Company not found" });
    }
    console.log(company);
    res.json({ success: true, company });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Post a new job
export const postJob = async (req, res) => {
  const { title, description, location, salary, level, category, skills } = req.body;
  const userId = req.id;
  const user = await User.findById(userId);
  const company = await Company.findOne(user.profile.company);
  try {
    const newJob = new Job({
      title,
      description,
      location,
      salary,
      companyId: company._id,
      date: Date.now(),
      level,
      category,
      skills: skills || [],
    });

    await newJob.save();
    res.json({ success: true, newJob, message: "Job posted successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get company job applicants
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);
    const company = await Company.findById(user.profile.company);

    if (!company) {
      return res.json({ success: false, message: "Company not found" });
    }

    const applications = await JobApplication.find({ companyId: company._id })
      .populate("userId", "_id name email profile image")
      .populate("jobId", "title location")
      .exec();

    if (!applications || applications.length === 0) {
      return res.json({
        success: false,
        message: "No applicants found for this company",
      });
    }

    const formattedApplications = applications.map((application) => ({
      id: application._id,
      userId: application.userId._id, 
      name: application.userId.name,
      email: application.userId.email,
      image: application.userId.image,
      jobId: application.jobId._id,
      jobTitle: application.jobId.title,
      location: application.jobId.location,
      resume: application.userId.profile.resume,
      date: application.date,
      status: application.status || "Pending",
    }));

    return res.json({
      success: true,
      applications: formattedApplications,
      message: "Job applicants fetched successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get company posted jobs
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId);

    if (!user || !user.profile.company) {
      return res.json({ success: false, message: "User or company not found" });
    }

    const company = await Company.findById(user.profile.company);
    if (!company) {
      return res.json({ success: false, message: "Company not found" });
    }

    // Fetch all jobs posted by this company
    const jobs = await Job.find({ companyId: company._id });

    // For each job, count its applicants
    const jobsData = await Promise.all(
      jobs.map(async (job) => {
        const applicants = await JobApplication.find({ jobId: job._id });
        return { ...job.toObject(), applicants: applicants.length };
      })
    );

    res.json({
      success: true,
      jobsData,
      message: "Company jobs with applicant counts fetched successfully",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Change job application status
export const changeJobApllicationStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    const application = await JobApplication.findById(id);
    if (!application) {
      return res.json({ success: false, message: "Application not found" });
    }
    application.status = status;
    await application.save();
    res.json({
      success: true,
      message: "Application status updated successfully",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Change job visibility
export const changeJobVisiblty = async (req, res) => {
  try {
    const { id } = req.body;
    console.log(id);
    const job = await Job.findById(id);
    console.log(job);
    if (!job) {
      return res.json({ success: false, message: "Job not found" });
    }
    job.visible = !job.visible;
    await job.save();
    res.json({
      success: true,
      message: `${job.title} is now ${job.visible ? "active" : "inactive"}`,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getApplicantsByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.json({ success: false, message: "Job ID is required" });
    }

    const applications = await JobApplication.find({ jobId })
      .populate("userId", "name email image profile.resume")
      .populate("jobId", "title location")
      .exec();

    if (!applications.length) {
      return res.json({ success: false, message: "No applicants found" });
    }

    // Only keep necessary fields
    const formattedApplications = applications.map((app) => ({
      applicationId: app._id,
      status: app.status,
      appliedAt: app.date,
      applicant: {
        name: app.userId?.name,
        email: app.userId?.email,
        image: app.userId?.image || null,
        resume: app.userId?.profile?.resume || null,
      },
      job: {
        title: app.jobId?.title,
        location: app.jobId?.location,
      },
    }));

    res.json({
      success: true,
      formattedApplications,
    });
  } catch (error) {
    console.error("Error fetching applicants:", error);
    res.json({ success: false, message: error.message });
  }
};
