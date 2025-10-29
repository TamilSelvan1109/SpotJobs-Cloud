import axios from "axios";
import {
  Camera,
  Edit,
  Eye,
  FileText,
  NotebookPen,
  Phone,
  Save,
  Tags,
  Upload,
  User,
  UserCog,
  X,
  Link2,
  Github,
  Linkedin,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const UpdateUser = () => {
  const { userData, backendUrl, setUserData } = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);

  // Profile data
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [role, setRole] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  // Resume data
  const [resumeUrl, setResumeUrl] = useState(null);
  const [newResumeFile, setNewResumeFile] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("bio", bio);
      formData.append("skills", skills);
      formData.append("role", role);
      formData.append("linkedin", linkedin);
      formData.append("github", github);
      if (image) formData.append("image", image);

      const { data } = await axios.post(
        `${backendUrl}/api/users/profile/update`,
        formData,
        { withCredentials: true }
      );

      if (data.success) {
        setUserData(data.userData);
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data.message || "Update failed.");
      }
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  const handleUpdateResume = async (e) => {
    e.preventDefault();
    if (!newResumeFile) {
      toast.error("Please select a resume file.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("resume", newResumeFile);

      const { data } = await axios.patch(
        `${backendUrl}/api/users/profile/update-resume`,
        formData,
        { withCredentials: true }
      );

      if (data.success) {
        setUserData(data.user);
        setIsEdit(false);
        setNewResumeFile(null);
        toast.success("Resume updated successfully!");
      } else {
        toast.error(data.message || "Failed to upload resume.");
      }
    } catch (error) {
      toast.error("Resume upload failed.");
    }
  };

  useEffect(() => {
    if (userData) {
      setName(userData.name || "");
      setPhone(userData.phone || "");
      setImagePreview(userData.image || "");
      if (userData.profile) {
        setBio(userData.profile.bio || "");
        setRole(userData.profile.role || "");
        setResumeUrl(userData.profile.resume || null);
        setSkills(userData.profile.skills?.join(", ") || "");
        setLinkedin(userData.profile.linkedin || "");
        setGithub(userData.profile.github || "");
      }
    }
  }, [userData]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10">
      {/* Profile Section */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white p-8 rounded-xl border-l-8 border-l-blue-900 shadow-md space-y-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <UserCog className="w-5 h-5 text-blue-600" />
          </div>
          Profile Details
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <label htmlFor="profileImage" className="cursor-pointer">
              <div className="relative w-40 h-40 rounded-full border border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-6 h-6 text-blue-600" />
                )}
                <div className="absolute bottom-0 w-full bg-gray-800/70 text-white text-sm py-1 text-center">
                  Change
                </div>
              </div>
              <input
                id="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Profile Fields */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-600" />
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            {/* Role */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Role
              </label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g., Frontend Developer"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            {/* Bio */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <NotebookPen className="w-5 h-5 text-blue-600" />
                Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            {/* Skills */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Tags className="w-5 h-5 text-blue-600" />
                Skills (comma separated)
              </label>
              <textarea
                rows={2}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Linkedin className="w-5 h-5 text-blue-600" />
                LinkedIn Profile
              </label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            {/* GitHub */}
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Github className="w-5 h-5 text-blue-600" />
                GitHub Profile
              </label>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/yourusername"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:border-blue-700 focus:ring-1 focus:ring-blue-700 outline-none"
              />
            </div>

            {/* Update Button */}
            <div className="sm:col-span-2 flex justify-end mt-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-5 h-5 text-white" />
                Update Profile
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Resume Section */}
      <div className="bg-white p-8 rounded-xl border-l-8 border-l-blue-900 shadow-md space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 border-b pb-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          Manage Resume
        </h2>

        {isEdit ? (
          <form onSubmit={handleUpdateResume} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload a new resume (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                required
                onChange={(e) => setNewResumeFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsEdit(false);
                  setNewResumeFile(null);
                }}
                className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 flex items-center gap-2"
              >
                <X className="w-5 h-5 text-gray-600" />
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-5 h-5 text-white" />
                Save Resume
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <p className="text-gray-600">
              {resumeUrl
                ? "Click 'View Resume' to view your resume."
                : "No resume uploaded yet."}
            </p>
            <div className="flex gap-3">
              <a
                href={resumeUrl || "#"}
                onClick={(e) => {
                  if (!resumeUrl) {
                    e.preventDefault();
                    toast.error("No resume uploaded!");
                  }
                }}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-5 py-2 flex items-center gap-2 rounded-md font-medium ${
                  resumeUrl
                    ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Eye className="w-5 h-5 text-blue-600" />
                View Resume
              </a>

              <button
                onClick={() => setIsEdit(true)}
                className="px-5 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                {resumeUrl ? (
                  <Edit className="w-5 h-5 text-white" />
                ) : (
                  <Upload className="w-5 h-5 text-white" />
                )}
                {resumeUrl ? "Change Resume" : "Upload Resume"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateUser;