import axios from "axios";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";

const ManageJobs = () => {
  const navigate = useNavigate();
  const { backendUrl, fetchJobs } = useContext(AppContext);
  const [companyJobs, setCompanyJobs] = useState(false);

  const fetchCompanyJobs = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/list-jobs`, {
        withCredentials: true,
      });

      if (data.success) {
        setCompanyJobs(data.jobsData.reverse());
      } else {
        toast.error(data.message || "Failed to load jobs");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const changeJobVisibility = async (id) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/company/change-visiblity`,
        { id },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        await fetchCompanyJobs();
        await fetchJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchCompanyJobs();
  }, []);

  if (!companyJobs) return <Loading />;

  if (companyJobs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[70vh] text-center px-4">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4076/4076509.png"
          alt="no-jobs"
          className="w-32 h-32 mb-4 opacity-80"
        />
        <p className="text-gray-600 text-lg mb-3">
          You haven’t posted any jobs yet.
        </p>
        <button
          onClick={() => navigate("/recruiter/add-job")}
          className="bg-blue-900 text-white py-2 px-6 rounded-lg hover:bg-blue-800 transition"
        >
          + Post Your First Job
        </button>
      </div>
    );
  }

  // Calculate Stats
  const totalJobs = companyJobs.length;
  const activeJobs = companyJobs.filter((job) => job.visible).length;
  const hiddenJobs = totalJobs - activeJobs;
  const totalApplicants = companyJobs.reduce(
    (sum, job) => sum + (job.applicants || 0),
    0
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Top Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-5 rounded-xl shadow-md">
          <h3 className="text-sm uppercase opacity-80">Total Jobs</h3>
          <p className="text-3xl font-bold mt-1">{totalJobs}</p>
        </div>
        <div className="bg-gradient-to-r from-green-600 to-green-400 text-white p-5 rounded-xl shadow-md">
          <h3 className="text-sm uppercase opacity-80">Active Jobs</h3>
          <p className="text-3xl font-bold mt-1">{activeJobs}</p>
        </div>
        <div className="bg-gradient-to-r from-red-600 to-red-400 text-white p-5 rounded-xl shadow-md">
          <h3 className="text-sm uppercase opacity-80">Hidden Jobs</h3>
          <p className="text-3xl font-bold mt-1">{hiddenJobs}</p>
        </div>
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-400 text-white p-5 rounded-xl shadow-md">
          <h3 className="text-sm uppercase opacity-80">Total Applicants</h3>
          <p className="text-3xl font-bold mt-1">{totalApplicants}</p>
        </div>
      </div>

      {/* Manage Jobs Header */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-3xl font-semibold text-blue-900">Manage Jobs</h2>
        <button
          onClick={() => navigate("/recruiter/add-job")}
          className="bg-blue-900 text-white py-2 px-6 rounded-lg hover:bg-blue-800 transition-all duration-300"
        >
          + Post New Job
        </button>
      </div>

      {/* Job Table */}
      <div className="overflow-x-auto bg-white border border-gray-200 shadow-md rounded-xl">
        <table className="min-w-full text-l text-left">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="py-3 px-5 font-medium">#</th>
              <th className="py-3 px-5 font-medium">Job Title</th>
              <th className="py-3 px-5 font-medium max-sm:hidden">Posted On</th>
              <th className="py-3 px-5 font-medium max-sm:hidden">Location</th>
              <th className="py-3 px-5 font-medium text-center">Applicants</th>
              <th className="py-3 px-5 font-medium text-center">Visible</th>
              <th className="py-3 px-5 font-medium text-center">
                View Applicants
              </th>
            </tr>
          </thead>
          <tbody>
            {companyJobs.map((job, index) => (
              <tr
                key={job._id}
                className="border-b hover:bg-gray-50 transition duration-200"
              >
                <td className="py-3 px-5 text-gray-600">{index + 1}</td>
                <td className="py-3 px-5 font-medium text-gray-800">
                  <span className="block text-lg">{job.title}</span>
                  <span className="text-xs text-gray-400">
                    {job.category || "General"}
                  </span>
                </td>
                <td className="py-3 px-5 text-gray-500 max-sm:hidden">
                  {moment(job.date).format("MMM DD, YYYY")}
                </td>
                <td className="py-3 px-5 text-gray-500 max-sm:hidden">
                  {job.location}
                </td>
                <td className="py-3 px-5 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      job.applicants > 0
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {job.applicants || 0}
                  </span>
                </td>
                <td className="py-3 px-5 text-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="hidden peer"
                      checked={job.visible}
                      onChange={() => changeJobVisibility(job._id)}
                    />
                    <span className="w-10 h-5 flex items-center bg-gray-300 rounded-full p-1 duration-300 peer-checked:bg-blue-900">
                      <span className="bg-white w-4 h-4 rounded-full shadow-md transform duration-300 peer-checked:translate-x-5"></span>
                    </span>
                  </label>
                </td>
                <td>
                  <Link
                    to={`/recruiter/job-applicants/${job._id}`}
                    className="underlined text-blue-700 hover:text-blue-900 transition-all"
                  >
                    Applicants
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageJobs;
