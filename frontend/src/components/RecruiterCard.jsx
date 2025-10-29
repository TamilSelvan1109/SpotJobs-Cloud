import axios from "axios";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  Globe,
  Mail,
  MapPin,
  Phone,
  Users2,
} from "lucide-react";
import moment from "moment";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import Loading from "./Loading";

const RecruiterCard = () => {
  const { id } = useParams();
  const { backendUrl, jobs } = useContext(AppContext);
  const navigate = useNavigate();

  const [recruiterData, setRecruiterData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecruiterData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/company/company-details/${id}`,
        {
          withCredentials: true,
        }
      );
      if (!data) {
        return toast.error("Company not found!");
      }
      setRecruiterData(data.company);
      setLoading(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Filter and sort jobs for this recruiter’s company
  const recruiterJobs = jobs
    ?.filter((job) => job.companyId._id === id)
    ?.sort((a, b) => b.date - a.date)
    ?.slice(0, 4);

  useEffect(() => {
    if (id) {
      fetchRecruiterData();
    }
  }, [id, backendUrl]);

  const handleBack = () => {
      navigate(-1);
  };

  return loading ? (
    <>
      <Loading />
    </>
  ) : (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-700 font-medium hover:text-blue-900 transition mb-4 cursor-pointer"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-blue-900 to-blue-700"></div>

          <div className="px-6 sm:px-8 pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 sm:-mt-12">
              <img
                src={recruiterData.image}
                alt="Company Logo"
                className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-lg"
              />

              <div className="text-center sm:text-left mb-4 sm:mb-0 flex-1">
                <h1
                  className="
              text-xl sm:text-3xl font-bold xl:text-shadow-white 
              mb-2 sm:mb-10 leading-snug break-words whitespace-normal
              text-blue-900 sm:text-white
            "
                >
                  {recruiterData.name}
                </h1>

                <p className="text-sm font-semibold sm:text-lg text-blue-700 ">
                  Recruiter
                </p>

                <p className="text-xs sm:text-base text-blue-700">
                  Industry: {recruiterData.industry || "Not available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Company */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  About Company
                </h2>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {recruiterData.description ||
                  "No company description provided."}
              </p>
            </div>

            {/* Company Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Company Details
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {recruiterData.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Website</p>
                      <a
                        href={recruiterData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {recruiterData.website}
                      </a>
                    </div>
                  </div>
                )}
                {recruiterData.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm text-gray-900">
                        {recruiterData.location}
                      </p>
                    </div>
                  </div>
                )}
                {recruiterData.contactEmail && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Contact Email</p>
                      <p className="text-sm text-gray-900">
                        {recruiterData.contactEmail}
                      </p>
                    </div>
                  </div>
                )}
                {recruiterData.size && (
                  <div className="flex items-start gap-3">
                    <Users2 className="w-5 h-5 text-orange-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Company Size</p>
                      <p className="text-sm text-gray-900">
                        {recruiterData.size}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recently Posted Jobs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Recently Posted Jobs
                </h2>
              </div>

              {recruiterJobs?.length > 0 ? (
                <div className="space-y-4">
                  {recruiterJobs.map((job, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                          <Link to={`/apply-job/${job._id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-900">
                              {job.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            {job.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          {moment(job.date).format("MMM DD, YYYY")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent job postings found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Contact & Highlights */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Phone className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Contact Info
                </h2>
              </div>

              <div className="space-y-5">
                <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                  <Mail className="w-4 h-4 text-blue-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900 break-all">
                      {recruiterData.createdBy.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-green-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">
                      {recruiterData.createdBy.phone || "Not Available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterCard;
