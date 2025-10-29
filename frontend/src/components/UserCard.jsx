import axios from "axios";
import {
  ArrowLeft,
  FileText,
  Github,
  Linkedin,
  Mail,
  NotebookPen,
  Phone,
  Tags,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";

const UserCard = () => {
  const { id } = useParams();
  const { backendUrl } = useContext(AppContext);
  const navigate = useNavigate();
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/users/user/${id}`, {
        withCredentials: true,
      });
      if (!data) {
        return toast.error("User data not found!");
      }
      setUserData(data.user);
      console.log(data.user);
      setLoading(false);
    } catch (error) {
      return toast.error(error.message);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserData();
    }
  }, [id, backendUrl]);

  const handleBack = () => {
    navigate(-1);
  };

  return loading ? (
    <Loading />
  ) : (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
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
                  src={userData.image}
                  alt="User Avatar"
                  className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-lg"
                />

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
            </div>

            {/* Right Column - Contact Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-8 border-l-blue-900 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Contact</h2>
                </div>

                <div className="space-y-4">
                  {/* Email */}
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

                  {/* Phone */}
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

                  {/* LinkedIn */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Linkedin className="w-4 h-4 text-gray-600" />
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
                          View Profile
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>
                  </div>

                  {/* GitHub */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Github className="w-4 h-4 text-gray-600" />
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
                          View Repository
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
                          className="flex gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Resume{" "}
                          <FileText className="w-4 h-4 text-blue-600" />
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

export default UserCard;
