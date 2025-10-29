import axios from "axios";
import { Briefcase, FileText, Filter, MapPin } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";

const ViewApplications = () => {
  const { backendUrl } = useContext(AppContext);
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [jobFilter, setJobFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);
  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `${backendUrl}/api/company/applicants`,
          {
            withCredentials: true,
          }
        );
        if (data.success) {
          setApplications(data.applications);
          setFilteredApps(data.applications);
          console.log(data.applications);
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
  }, [backendUrl]);

  // Apply filters
  useEffect(() => {
    let filtered = applications;

    if (jobFilter)
      filtered = filtered.filter((app) =>
        app.jobTitle?.toLowerCase().includes(jobFilter.toLowerCase())
      );

    if (locationFilter)
      filtered = filtered.filter((app) =>
        app.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );

    if (statusFilter)
      filtered = filtered.filter(
        (app) => app.status?.toLowerCase() === statusFilter.toLowerCase()
      );

    setFilteredApps(filtered);
  }, [jobFilter, locationFilter, statusFilter, applications]);

  // Update status
  const handleStatusChange = async (appId, newStatus) => {
    try {
      const { data } = await axios.put(
        `${backendUrl}/api/company/change-status`,
        { id: appId, status: newStatus },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success("Status updated successfully!");
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (error) {
      toast.error("Failed to update status");
      console.log(error);
    }
  };

  const totalApplicationsCount = applications.length || 0;

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Top Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white p-5 rounded-xl shadow-md">
          <h3 className="text-sm uppercase opacity-80">Total Applications</h3>
          <p className="text-3xl font-bold mt-1">{totalApplicationsCount}</p>
        </div>
      </div>

      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          View Applications
        </h1>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Job Filter */}
          <div className="flex items-center gap-2 bg-white shadow-sm px-3 py-2 rounded-lg border">
            <Briefcase size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search by Job Title..."
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="outline-none text-sm w-full"
            />
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2 bg-white shadow-sm px-3 py-2 rounded-lg border">
            <MapPin size={18} className="text-gray-500" />
            <input
              type="text"
              placeholder="Search by Location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="outline-none text-sm w-full"
            />
          </div>

          {/* Status Filter */}
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
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
          <table className="min-w-full table-fixed border-collapse">
            <thead className="bg-blue-900 text-white font-semibold">
              <tr>
                <th className="px-6 py-3 text-left w-[18%]">Applicant</th>
                <th className="px-6 py-3 text-left w-[18%]">Email</th>
                <th className="px-6 py-3 text-left w-[18%]">Job Title</th>
                <th className="px-6 py-3 text-left w-[14%]">Location</th>
                <th className="px-6 py-3 text-left w-[14%]">Applied On</th>
                <th className="px-6 py-3 text-left w-[10%]">Resume</th>
                <th className="px-6 py-3 text-left w-[8%]">Status</th>
              </tr>
            </thead>
            <tbody
              className="text-sm text-gray-700"
              style={{ minHeight: "350px" }}
            >
              {filteredApps.length > 0 ? (
                filteredApps.map((app, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 hover:bg-gray-50 transition"
                  >
                    {/* Applicant */}
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={app.image || "/default-avatar.png"}
                        alt={app.name || "Applicant"}
                        className="w-10 h-10 rounded-full border border-gray-300 object-cover flex-shrink-0"
                      />
                      <Link
                        to={`/company/view-applications/user-details/${app.userId}`}
                      >
                        <span className="truncate max-w-[120px] text-l text-gray-800 font-medium hover:text-blue-500">
                          {app.name || "N/A"}
                        </span>
                      </Link>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 truncate max-w-[140px]">
                      {app.email || "N/A"}
                    </td>

                    {/* Job Title */}
                    <td className="px-6 py-4 truncate max-w-[140px]">
                      {app.jobTitle || "N/A"}
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 truncate max-w-[100px]">
                      {app.location || "N/A"}
                    </td>

                    {/* Applied Date */}
                    <td className="px-6 py-4">
                      {app.date
                        ? new Date(app.date).toLocaleDateString()
                        : "N/A"}
                    </td>

                    {/* Resume */}
                    <td className="px-6 py-4">
                      {app.resume ? (
                        <a
                          href={app.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <FileText size={15} />
                          View
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
                          handleStatusChange(app.id, e.target.value)
                        }
                        className={`px-3 py-1.5 rounded-md text-sm border font-medium focus:ring-2 focus:ring-blue-200 transition
                        ${
                          app.status === "Accepted"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : app.status === "Rejected"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : app.status === "Shortlisted"
                            ? "bg-blue-100 text-blue-700 border-blue-300"
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
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-28 text-gray-500">
                    No applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewApplications;
