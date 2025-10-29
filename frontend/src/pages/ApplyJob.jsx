import axios from "axios";
import kconvert from "k-convert";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";

const ApplyJob = () => {
  const { id } = useParams();
  const [jobData, setJobData] = useState(null);
  const { jobs, backendUrl, userData, jobsApplied, fetchAppliedJobs } =
    useContext(AppContext);
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false);

  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      if (data.success) {
        setJobData(data.job);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const checkIsApplied = async () => {
    const hasApplied = jobsApplied.some((item) => item.jobId === id);
    setIsAlreadyApplied(hasApplied);
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  useEffect(() => {
    checkIsApplied();
  }, [jobData, jobsApplied, id, backendUrl]);

  const applyHandler = async () => {
    try {
      if (!userData) {
        return toast.error("Login to apply for a job!");
      }

      if (userData.role != "User") {
        return toast.error("User only can apply!");
      }

      if (!userData.profile.resume) {
        return toast.error("Upload resume in profile section!");
      }

      const { data } = await axios.post(
        `${backendUrl}/api/users/apply`,
        { jobId: id },
        { withCredentials: true }
      );
      if (!data.success) {
        return toast.error(data.message);
      }
      toast.success(data.message);
      setIsAlreadyApplied(true);
      await fetchAppliedJobs();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return jobData ? (
    <>
      <Navbar />

      <div className="min-h-screen flex flex-col py-10 pt-30 container px-4 2xl:px-20 mx-auto">
        <div className="bg-white text-black rounded-lg w-full">
          <div className="flex justify-center md:justify-between flex-wrap gap-8 px-14 py-20 mb-6 bg-sky-100 border-sky-500 rounded-xl">
            <div className="flex flex-col md:flex-row items-center">
              <Link to={`/apply-job/company-details/${jobData.companyId._id}`}>
                <img
                  className="h-24 bg-white rounded-lg p-4 mr-4 max-md:mb-4 border border-sky-800"
                  src={jobData.companyId.image}
                  alt=""
                />
              </Link>
              <div className="text-center md:text-left text-neutral-900">
                <h1 className="text-2xl sm:text-4xl font-medium">
                  {jobData.title}
                </h1>
                <div className="flex flex-row flex-wrap max-md:justify-center gap-y-2 gap-6 items-center text-gray-700 mt-4 ml-1">
                  <span className="flex items-center gap-1">
                    <img src={assets.suitcase_icon} alt="" />
                    {jobData.companyId.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <img src={assets.location_icon} alt="" />
                    {jobData.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <img className="" src={assets.person_icon} alt="" />
                    {jobData.level}
                  </span>
                  <span className="flex items-center gap-1">
                    <img src={assets.money_icon} alt="" />
                    CTC: {kconvert.convertTo(jobData.salary)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center text-end text-sm max-md:mx-auto max-md:text-center">
              {!isAlreadyApplied ? (
                <button
                  onClick={applyHandler}
                  className="bg-blue-600 p-2.5 px-10 text-lg text-white rounded cursor-pointer"
                >
                  Apply Now
                </button>
              ) : (
                <p className="text-green-700 font-semibold mt-3">
                  You’ve already applied
                </p>
              )}
              <p className="mt-4 text-gray-800">
                Posted {moment(jobData.date).format("MMM D, YYYY")} (
                {moment(jobData.date).fromNow()})
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start">
            <div className="w-full lg:w-2/3">
              <h2 className="font-bold text-2xl mb-4">Job Description</h2>
              <div
                className="rich-text"
                dangerouslySetInnerHTML={{ __html: jobData.description }}
              ></div>

              {!isAlreadyApplied ? (
                <button
                  onClick={applyHandler}
                  className="bg-blue-600 p-2.5 px-10 text-lg text-white rounded cursor-pointer"
                >
                  Apply Now
                </button>
              ) : (
                <p className="text-green-700 font-semibold mt-3">
                  You’ve already applied
                </p>
              )}
            </div>

            {/* Right section More Jobs */}
            <div className="w-full lg:w-1/3 mt-8 lg:mt-0 lg:ml-8 space-y-5">
              <h2 className="font-bold mt-2">
                More Jobs from {jobData.companyId.name}
              </h2>

              {jobs
                .filter(
                  (job) =>
                    job._id !== jobData._id &&
                    job.companyId._id === jobData.companyId._id
                )
                .filter((job) => {
                  // Set of applied jobIds
                  const appliedJobsIds = new Set(
                    jobsApplied.map((item) => item.jobId)
                  );
                  // Exclude applied jobs
                  return !appliedJobsIds.has(job._id);
                }).length === 0 ? (
                <p className="text-gray-500 text-sm mt-2">
                  No other jobs available from this company.
                </p>
              ) : (
                jobs
                  .filter(
                    (job) =>
                      job._id !== jobData._id &&
                      job.companyId._id === jobData.companyId._id
                  )
                  .filter((job) => {
                    const appliedJobsIds = new Set(
                      jobsApplied.map((item) => item.jobId)
                    );
                    return !appliedJobsIds.has(job._id);
                  })
                  .slice(0, 4)
                  .map((job, index) => <JobCard key={index} job={job} />)
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : (
    <Loading />
  );
};

export default ApplyJob;
