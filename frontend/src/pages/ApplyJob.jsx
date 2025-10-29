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
import { Briefcase, MapPin, UserCheck, IndianRupee } from "lucide-react";

const ApplyJob = () => {
  const { id } = useParams();
  const [jobData, setJobData] = useState(null);
  const { jobs, backendUrl, userData, jobsApplied, fetchAppliedJobs } =
    useContext(AppContext);
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false);

  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      if (data.success) setJobData(data.job);
      else toast.error(data.message);
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
      if (!userData) return toast.error("Login to apply for a job!");
      if (userData.role !== "User") return toast.error("Only users can apply!");
      if (!userData.profile.resume)
        return toast.error("Upload your resume in profile section!");

      const { data } = await axios.post(
        `${backendUrl}/api/users/apply`,
        { jobId: id },
        { withCredentials: true }
      );

      if (!data.success) return toast.error(data.message);
      toast.success(data.message);
      setIsAlreadyApplied(true);
      await fetchAppliedJobs();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!jobData) return <Loading />;

  return (
    <>
      <Navbar />

      <div className="min-h-screen flex flex-col py-10 container mt-20 px-4 2xl:px-20 mx-auto">
        <div className="bg-white text-black rounded-2xl shadow-lg w-full border border-sky-100">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 px-10 py-10 bg-gradient-to-r from-sky-50 to-sky-100 border-b border-sky-200 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link to={`/apply-job/company-details/${jobData.companyId._id}`}>
                <img
                  className="h-24 w-24 bg-white rounded-xl p-3 border border-sky-300 shadow-sm hover:shadow-md transition"
                  src={jobData.companyId.image}
                  alt={jobData.companyId.name}
                />
              </Link>

              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold text-sky-800 mb-2">
                  {jobData.title}
                </h1>
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-gray-700 text-lg">
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-sky-700" />
                    {jobData.companyId.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-sky-700" />
                    {jobData.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-sky-700" />
                    {jobData.level}
                  </span>
                  <span className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-sky-700" />
                    LPA: {kconvert.convertTo(jobData.salary)}
                  </span>
                </div>
              </div>
            </div>

            {/* Apply Button */}
            <div className="text-center">
              {!isAlreadyApplied ? (
                <button
                  onClick={applyHandler}
                  className="bg-blue-600 hover:bg-blue-700 px-10 py-3 text-lg font-semibold text-white rounded-lg shadow transition"
                >
                  Apply Now
                </button>
              ) : (
                <p className="text-green-700 font-semibold mt-3 text-lg">
                  You’ve applied
                </p>
              )}
              <p className="mt-3 text-gray-600 text-sm">
                Posted {moment(jobData.date).format("MMM D, YYYY")} (
                {moment(jobData.date).fromNow()})
              </p>
            </div>
          </div>

          {/* Body Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start px-10 py-10">
            {/* Left Column */}
            <div className="w-full lg:w-2/3 pr-0 lg:pr-8">
              {/* Required Skills on Top */}
              {jobData.skills && jobData.skills.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-3 text-sky-800">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {jobData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-1.5 bg-sky-100 text-sky-800 rounded-full text-sm font-medium border border-sky-200 hover:bg-sky-200 transition"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Description */}
              <h2 className="font-bold text-2xl mb-4 text-sky-900">
                Job Description
              </h2>
              <div
                className="rich-text prose max-w-none leading-relaxed text-gray-800"
                dangerouslySetInnerHTML={{ __html: jobData.description }}
              ></div>

              {/* Apply Button Bottom */}
              {!isAlreadyApplied ? (
                <button
                  onClick={applyHandler}
                  className="bg-blue-600 hover:bg-blue-700 mt-8 px-10 py-3 text-lg font-semibold text-white rounded-lg shadow transition"
                >
                  Apply Now
                </button>
              ) : (
                <p className="text-green-700 font-semibold mt-6 text-lg">
                  You’ve applied
                </p>
              )}
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-1/3 mt-10 lg:mt-0 space-y-5">
              <h2 className="font-bold text-2xl text-sky-900">
                More Jobs from {jobData.companyId.name}
              </h2>
              <div className="border-t border-sky-200 pt-4 space-y-4">
                {jobs
                  .filter(
                    (job) =>
                      job._id !== jobData._id &&
                      job.companyId._id === jobData.companyId._id
                  )
                  .filter(
                    (job) => !jobsApplied.some((item) => item.jobId === job._id)
                  )
                  .slice(0, 4)
                  .map((job, index) => (
                    <JobCard key={index} job={job} />
                  ))}
                {jobs
                  .filter(
                    (job) =>
                      job._id !== jobData._id &&
                      job.companyId._id === jobData.companyId._id
                  )
                  .filter(
                    (job) => !jobsApplied.some((item) => item.jobId === job._id)
                  ).length === 0 && (
                  <p className="text-gray-500 text-sm">
                    No other jobs available from this company.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ApplyJob;
