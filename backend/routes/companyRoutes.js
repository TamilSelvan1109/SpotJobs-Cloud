import express from "express";
import {
  changeJobApllicationStatus,
  changeJobVisiblty,
  getApplicantsByJobId,
  getCompanyData,
  getCompanyDataById,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  postJob,
} from "../controllers/companyController.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get company data
router.get("/company", isAuthenticated, getCompanyData);

// Get company data by Id
router.get("/company-details/:id", isAuthenticated, getCompanyDataById);

// Post a job
router.post("/post-job", isAuthenticated, postJob);

// Get applicants data of company
router.get("/applicants", isAuthenticated, getCompanyJobApplicants);

// Get company job list
router.get("/list-jobs", isAuthenticated, getCompanyPostedJobs);

// Change application status
router.put("/change-status", isAuthenticated, changeJobApllicationStatus);

// Change application visiblity
router.post("/change-visiblity", isAuthenticated, changeJobVisiblty);

// Get a applicants for a specified job
router.get("/job-applicants/:jobId", isAuthenticated, getApplicantsByJobId);

export default router;
