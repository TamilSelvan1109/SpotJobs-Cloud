import moment from "moment";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";

const Applications = () => {
  const navigate = useNavigate();
  const { jobsApplied, fetchAppliedJobs } = useContext(AppContext);
  const [filter, setFilter] = useState("All");

  // Poll for score updates every 5 seconds for pending scores
  useEffect(() => {
    if (!jobsApplied) return;
    
    const hasPendingScores = jobsApplied.some(job => job.score === null || job.score === undefined);
    
    if (hasPendingScores) {
      const interval = setInterval(() => {
        fetchAppliedJobs();
      }, 3000); // Check every 3 seconds for pending scores

      return () => clearInterval(interval);
    }
  }, [jobsApplied, fetchAppliedJobs]);

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    if (!jobsApplied) return [];
    const sorted = [...jobsApplied].reverse();
    return filter === "All"
      ? sorted
      : sorted.filter((job) => job.status === filter);
  }, [jobsApplied, filter]);

  if (!jobsApplied) return <Loading />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header + Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h2 className="text-3xl font-semibold text-blue-900">
          Jobs You’ve Applied For
        </h2>

        <div className="flex items-center gap-3">
          <label
            htmlFor="statusFilter"
            className="text-gray-700 font-medium text-sm"
          >
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* No results message */}
      {filteredJobs.length === 0 ? (
        <div className="flex flex-col justify-center items-center min-h-[60vh] text-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4076/4076509.png"
            alt="no-applications"
            className="w-32 h-32 mb-4 opacity-80"
          />
          <p className="text-gray-600 text-lg mb-3">
            No applications found for the selected filter.
          </p>
        </div>
      ) : (
        // Job list table
        <div className="overflow-x-auto bg-white border border-gray-200 shadow-lg rounded-xl">
          <table className="min-w-full text-sm text-left border-collapse">
            <thead className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
              <tr>
                <th className="py-3 px-5 font-medium">Company</th>
                <th className="py-3 px-5 font-medium">Job Title</th>
                <th className="py-3 px-5 font-medium max-sm:hidden">
                  Location
                </th>
                <th className="py-3 px-5 font-medium max-sm:hidden">Date</th>
                <th className="py-3 px-5 font-medium text-center">AI Match Score</th>
                <th className="py-3 px-5 font-medium text-center">Status</th>
                <th className="py-3 px-5 font-medium text-center">
                  Job Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job, index) => (
                <tr
                  key={index}
                  className="border-b hover:bg-blue-50 transition duration-150"
                >
                  <td className="py-3 px-5 flex items-center gap-3">
                    <img
                      className="w-10 h-10 object-cover rounded-full border border-gray-300"
                      src={job.logo}
                      alt={job.company}
                    />
                    <span className="font-medium text-gray-800">
                      {job.company}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-gray-700">{job.title}</td>
                  <td className="py-3 px-5 text-gray-600 max-sm:hidden">
                    {job.location}
                  </td>
                  <td className="py-3 px-5 text-gray-600 max-sm:hidden">
                    {moment(job.date).format("MMM DD, YYYY")}
                  </td>
                  <td className="py-3 px-5 text-center">
                    {job.score !== null && job.score !== undefined ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                          job.score >= 85 ? 'bg-green-50 text-green-700 border-green-200' :
                          job.score >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          job.score >= 55 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          job.score >= 40 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {job.score}%
                        </div>
                        <span className={`text-xs mt-1 font-medium ${
                          job.score >= 85 ? 'text-green-600' :
                          job.score >= 70 ? 'text-blue-600' :
                          job.score >= 55 ? 'text-yellow-600' :
                          job.score >= 40 ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {
                            job.score >= 85 ? 'Excellent' :
                            job.score >= 70 ? 'Good Match' :
                            job.score >= 55 ? 'Fair Match' :
                            job.score >= 40 ? 'Weak Match' :
                            'Poor Match'
                          }
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-100 border-2 border-gray-200">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                        <span className="text-gray-500 text-xs mt-1">Analyzing...</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-5 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        job.status === "Accepted"
                          ? "bg-green-100 text-green-800"
                          : job.status === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : job.status === "Shortlisted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-center">
                    <button
                      onClick={() => navigate(`/apply-job/${job.jobId}`)}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Applications;
