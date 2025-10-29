import axios from "axios";
import {
  Building2,
  Camera,
  Edit,
  Globe,
  Layers,
  LocationEditIcon,
  Mail,
  NotebookPen,
  Phone,
  Save,
  UserCog,
  Users2,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const UpdateRecruiter = () => {
  const { userData, companyData, backendUrl, setUserData, fetchCompanyData } =
    useContext(AppContext);

  // UI states
  const [loading, setLoading] = useState(false);

  // Profile data
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Company data
  const [companyContactEmail, setCompanyContactEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companySize, setCompanySize] = useState("1-10");
  const [companyDescription, setCompanyDescription] = useState("");

  // Handle recruiter profile image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      if (image) formData.append("image", image);

      formData.append("companyContactEmail", companyContactEmail);
      formData.append("companyWebsite", companyWebsite);
      formData.append("companyIndustry", companyIndustry);
      formData.append("companySize", companySize);
      formData.append("companyLocation", companyLocation);
      formData.append("companyDescription", companyDescription);

      const { data } = await axios.post(
        `${backendUrl}/api/users/profile/update`,
        formData,
        { withCredentials: true }
      );

      if (data.success) {
        setUserData(data.userData);
        await fetchCompanyData();
        toast.success("Recruiter profile updated successfully!");
      } else {
        toast.error(data.message || "Update failed.");
      }
    } catch (error) {
      toast.error("Failed to update recruiter profile.");
    } finally {
      setLoading(false);
    }
  };

  // Load user data
  useEffect(() => {
    if (companyData) {
      setName(companyData.name || "");
      setPhone(userData.phone || "");
      setImagePreview(companyData.image || "");
      setCompanyContactEmail(companyData.contactEmail || "");
      setCompanyWebsite(companyData.website || "");
      setCompanyIndustry(companyData.industry || "");
      setCompanySize(companyData.size || "1-10");
      setCompanyLocation(companyData.location || "");
      setCompanyDescription(companyData.description || "");
    }
  }, [companyData]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10">
      {/* Header */}
      <h2 className="text-3xl font-bold text-gray-800 border-b pb-4 flex items-center gap-3">
        <UserCog className="text-blue-600" size={26} />
        Recruiter Profile
      </h2>

      {/* Profile Section */}
      <form
        onSubmit={handleUpdateProfile}
        className="bg-white p-8 rounded-xl shadow-md space-y-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <label htmlFor="profileImage" className="cursor-pointer group">
              <div className="relative w-40 h-40 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 transition group-hover:border-blue-500">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera size={60} className="text-gray-300" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/0 group-hover:bg-black/40 transition">
                  <Edit
                    size={26}
                    className="text-white opacity-0 group-hover:opacity-100"
                  />
                  <span className="text-xs text-white mt-1 opacity-0 group-hover:opacity-100">
                    Change
                  </span>
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
            {/* Company Details */}
            <div className="sm:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 border-b pb-2 flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                Company Details
              </h3>
            </div>

            <Input
              label="Company Name"
              icon={<Building2 size={16} />}
              value={name}
              setValue={setName}
            />
            <Input
              label="Website"
              icon={<Globe size={16} />}
              value={companyWebsite}
              setValue={setCompanyWebsite}
            />
            <Input
              label="Contact Email"
              type="email"
              icon={<Mail size={16} />}
              value={companyContactEmail}
              setValue={setCompanyContactEmail}
            />
            <Input
              label="Phone"
              icon={<Phone size={16} />}
              value={phone}
              setValue={setPhone}
            />
            <Input
              label="Industry"
              icon={<Layers size={16} />}
              value={companyIndustry}
              setValue={setCompanyIndustry}
            />

            <Input
              label="Location"
              icon={<LocationEditIcon size={16} />}
              value={companyLocation}
              setValue={setCompanyLocation}
            />

            <Select
              label="Company Size"
              icon={<Users2 size={16} />}
              value={companySize}
              setValue={setCompanySize}
              options={["1-10", "11-50", "51-200", "201-500", "500+"]}
            />
            <TextArea
              label="Description"
              icon={<NotebookPen size={16} />}
              value={companyDescription}
              setValue={setCompanyDescription}
              rows={3}
            />

            {/* Submit */}
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg flex items-center gap-2 transition ${
                  loading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-blue-700"
                }`}
              >
                <Save size={18} />
                {loading ? "Updating..." : "Update Profile"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

/* Reusable Inputs */
const Input = ({ label, icon, value, setValue, placeholder }) => (
  <div>
    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <span className="text-blue-700">{icon}</span>
      <span className="text-gray-700">{label}</span>
    </label>
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const TextArea = ({ label, icon, value, setValue, rows }) => (
  <div className="sm:col-span-2">
    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
      <span className="text-blue-700">{icon}</span>
      <span className="text-gray-700">{label}</span>
    </label>
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="mt-1 w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
);

const Select = ({ label, icon, value, setValue, options }) => (
  <div>
    <label className="text-sm font-medium flex items-center gap-2">
      <span className="text-blue-700">{icon}</span>
      <span className="text-gray-700">{label}</span>
    </label>
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="mt-1 w-full border border-gray-300 rounded-md p-2.5 focus:ring-blue-500 focus:border-blue-500"
    >
      {options.map((opt, i) => (
        <option key={i} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default UpdateRecruiter;
