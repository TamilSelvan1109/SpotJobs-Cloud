import {
  Briefcase,
  Calendar,
  FileText,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Tags,
  Linkedin,
  Github,
} from "lucide-react";
import moment from "moment";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";

const UserProfile = () => {
  const { userData, jobsApplied, isLoading } = useContext(AppContext);
  const navigate = useNavigate();

  if (!userData) return null;

  const latestJobs = jobsApplied ? [...jobsApplied].reverse().slice(0, 4) : [];

  return isLoading ? (
    <Loading />
  ) : (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Cover Background */}
            <div className="h-20 bg-gradient-to-r from-blue-900 to-blue-700"></div>

            {/* Profile Content */}
            <div className="px-6 sm:px-8 pb-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-12">
                {/* Avatar */}
                <img
                  src={userData.image}
                  alt="User Avatar"
                  className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-lg"
                />

                {/* Name & Role */}
                <div className="text-center sm:text-left mb-4 sm:mb-0 flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">
                    {userData.name}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {userData.profile.role || userData.role}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 border-l-8 border-l-blue-900">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <NotebookPen className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">About</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {userData.profile.bio || "No bio provided."}
                </p>
              </div>

              {/* Skills Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Tags className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Skills</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userData.profile.skills.length > 0 ? (
                    userData.profile.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills listed.</p>
                  )}
                </div>
              </div>

              {/* Recent Applications */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Recent Applications
                  </h2>
                </div>

                {latestJobs.length > 0 ? (
                  <div className="space-y-4">
                    {latestJobs.map((job, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col sm:flex-row gap-4">
                          <img
                            src={job.logo}
                            alt={job.company}
                            className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                          />

                          <div className="flex-1 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {job.title}
                              </h3>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold w-fit ${
                                  job.status === "Accepted"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : job.status === "Rejected"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : job.status === "Pending"
                                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {job.status}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                {moment(job.date).format("MMM DD, YYYY")}
                              </span>
                            </div>

                            <button
                              onClick={() =>
                                navigate(`/apply-job/${job.jobId}`)
                              }
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Resume <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No recent applications found.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Contact</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Email
                      </p>
                      <p className="text-sm text-gray-900 break-all">
                        {userData.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Phone
                      </p>
                      <p className="text-sm text-gray-900">
                        {userData.phone || "Not Available"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Links */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Professional Links
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* LinkedIn */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Linkedin className="w-4 h-4 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        LinkedIn
                      </p>
                      {userData.profile.linkedin ? (
                        <a
                          href={userData.profile.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Visit LinkedIn →
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Github className="w-4 h-4 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        GitHub
                      </p>
                      {userData.profile.github ? (
                        <a
                          href={userData.profile.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Visit GitHub →
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>
                  </div>

                  {/* Resume */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Resume
                      </p>
                      {userData.profile.resume ? (
                        <a
                          href={userData.profile.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Resume →
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not uploaded</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;
