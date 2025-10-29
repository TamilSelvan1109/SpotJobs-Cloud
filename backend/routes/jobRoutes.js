import express from "express";
import { getJobById, getJobs, getJobsByCompanyId } from "../controllers/jobController.js";

const router = express.Router();

// route to get all jobs data
router.get("/", getJobs);

// route to get all jobs of patricular company by Id
router.get("/jobsById/:id", getJobsByCompanyId);

// route to get a single job by ID
router.get("/:id", getJobById);

export default router;
