// components/RegisterUser.jsx
import { useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import InputField from "./InputFields";
import { Building, Camera, Loader2, LockKeyhole, Mail, Phone, User, Hash } from "lucide-react";

const RegisterUser = ({ onClose, switchToLogin }) => {
  const [formStep, setFormStep] = useState("register"); // register | verify
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "User",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState("");

  const { backendUrl, setUserData } = useContext(AppContext);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // STEP 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, role, image } = formData;

    if (!name || !email || !phone || !password || !role || !image) {
      toast.error("Please fill all the fields and upload an image!");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));
      const { data } = await axios.post(`${backendUrl}/api/users/send-verification-otp`, fd, {
        withCredentials: true,
      });
      if (data.success) {
        toast.success(data.message);
        setFormStep("verify");
      } else toast.error(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify Email
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await axios.post(
        `${backendUrl}/api/users/register`,
        { email: formData.email, otp },
        { withCredentials: true }
      );
      if (data.success) {
        toast.success(data.message);
        setUserData(data.user);
        onClose();
      } else toast.error(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- UI ---
  if (formStep === "verify")
    return (
      <div className="w-full">
        <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">Verify Your Email</h2>
        <p className="text-center text-gray-600 mb-8">
          Enter the OTP sent to <strong>{formData.email}</strong>
        </p>
        <form className="flex flex-col gap-5" onSubmit={handleVerifyOtp}>
          <InputField
            icon={<Hash size={18} className="text-gray-400" />}
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4
                        hover:bg-blue-700 flex items-center justify-center gap-2 transition
                        ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Verifying...</> : "Verify Email"}
          </button>
        </form>
      </div>
    );

  // Register form
  return (
    <div className="w-full grid md:grid-cols-2 gap-10 items-center">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold text-sky-800 mb-2">Create an Account</h2>
        <p className="text-gray-600 mb-6">Join our community of professionals.</p>

        <label htmlFor="profileImage" className="cursor-pointer mb-6">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-sky-300
                          flex items-center justify-center bg-sky-50 text-sky-600 hover:bg-sky-100
                          transition relative overflow-hidden">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Camera size={40} className="text-gray-400" />
            )}
          </div>
        </label>
        <input type="file" id="profileImage" className="hidden" accept="image/*" onChange={handleImageChange} />

        <div className="w-full max-w-xs grid grid-cols-2 gap-3">
          {["User", "Recruiter"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleChange("role", r)}
              className={`py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2
                          ${formData.role === r ? "bg-sky-700 text-white" : "bg-sky-100 text-sky-800"}`}
            >
              {r === "User" ? <User size={18} /> : <Building size={18} />} {r}
            </button>
          ))}
        </div>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSendOtp}>
        <InputField
          icon={formData.role === "Recruiter" ? <Building size={18} className="text-gray-400" /> : <User size={18} className="text-gray-400" />}
          type="text"
          placeholder={formData.role === "Recruiter" ? "Company Name" : "Full Name"}
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
        />
        <InputField
          icon={<Mail size={18} className="text-gray-400" />}
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          required
        />
        <InputField
          icon={<Phone size={18} className="text-gray-400" />}
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          required
        />
        <InputField
          icon={<LockKeyhole size={18} className="text-gray-400" />}
          type="password"
          placeholder="Create Password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700
                      flex items-center justify-center gap-2 transition
                      ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading ? <><Loader2 size={20} className="animate-spin" /> Sending OTP...</> : "Create Account"}
        </button>
      </form>

      <p className="text-center md:col-span-2 mt-4 text-sm">
        Already have an account?{" "}
        <button onClick={switchToLogin} className="text-blue-600 hover:underline font-medium">
          Sign In
        </button>
      </p>
    </div>
  );
};

export default RegisterUser;
