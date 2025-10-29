import axios from "axios";
import { FileText, Filter, ArrowLeft } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";

const JobApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContext);
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/company/job-applicants/${jobId}`,
          { withCredentials: true }
        );

        if (data.success) {
          setApplications(data.formattedApplications);
          setFilteredApps(data.formattedApplications);
        } else {
          setApplications([]);
          setFilteredApps([]);
        }
      } catch (error) {
        console.log(error);
        setApplications([]);
        setFilteredApps([]);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [backendUrl, jobId]);

  // Apply filters
  useEffect(() => {
    let filtered = applications;

    if (statusFilter)
      filtered = filtered.filter(
        (app) => app.status?.toLowerCase() === statusFilter.toLowerCase()
      );

    setFilteredApps(filtered);
  }, [statusFilter, applications]);

  // Update status
  const handleStatusChange = async (appId, newStatus) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/company/change-status`,
        { status: newStatus, id: appId },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Status updated successfully!");
        setApplications((prev) =>
          prev.map((a) =>
            a.applicationId === appId ? { ...a, status: newStatus } : a
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update status");
      console.log(error);
    }
  };

  if (loading) return <Loading />;

  const totalApplicationsCount = applications.length;

  // Handle back navigation
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/recruiter/manage-jobs");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-blue-700 font-medium hover:text-blue-900 transition mb-4"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          {filteredApps.length > 0
            ? `${filteredApps[0].job.title} Applicants`
            : "Applicants"}
        </h1>
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-4 rounded-lg shadow-md">
          <p className="text-sm uppercase opacity-80">Total Applications</p>
          <p className="text-2xl font-bold">{totalApplicationsCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white shadow-sm px-3 py-2 rounded-lg border">
          <Filter size={18} className="text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="outline-none text-sm w-full bg-transparent"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-28 text-gray-500">
          No applications found.
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-blue-900 text-white font-semibold">
              <tr>
                <th className="px-6 py-3 text-left w-[16%]">Applicant</th>
                <th className="px-6 py-3 text-left w-[14%]">Location</th>
                <th className="px-6 py-3 text-left w-[12%]">Applied On</th>
                <th className="px-6 py-3 text-left w-[12%]">Resume</th>
                <th className="px-6 py-3 text-left w-[8%]">Status</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-700">
              {filteredApps.map((app, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 hover:bg-gray-50 transition"
                >
                  {/* Applicant */}
                  <td className="px-6 py-4 flex items-center gap-3">
                    <img
                      src={app.applicant.image || "/default-avatar.png"}
                      alt={app.applicant.name || "Applicant"}
                      className="w-10 h-10 rounded-full border border-gray-300 object-cover flex-shrink-0"
                    />
                    <span className="truncate max-w-[120px] text-gray-800 font-medium">
                      {app.applicant.name || "N/A"}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4 truncate max-w-[100px]">
                    {app.job.location || "N/A"}
                  </td>

                  {/* Applied On */}
                  <td className="px-6 py-4">
                    {app.appliedAt
                      ? new Date(app.appliedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A"}
                  </td>

                  {/* Resume */}
                  <td className="px-6 py-4">
                    {app.applicant.resume ? (
                      <a
                        href={app.applicant.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <FileText size={15} /> View
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">No Resume</span>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td className="px-6 py-4">
                    <select
                      value={app.status || "Pending"}
                      onChange={(e) =>
                        handleStatusChange(app.applicationId, e.target.value)
                      }
                      className={`px-3 py-1.5 rounded-md text-sm border font-medium focus:ring-2 focus:ring-blue-200 transition
                    ${
                      app.status === "Shortlisted"
                        ? "bg-green-100 text-green-700 border-green-300"
                        : app.status === "Accepted"
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : app.status === "Rejected"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : "bg-yellow-100 text-yellow-700 border-yellow-300"
                    }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Shortlisted">Shortlisted</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
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

export default JobApplicants;
