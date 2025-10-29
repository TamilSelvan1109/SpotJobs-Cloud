// components/LoginUser.jsx
import { useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import InputField from "./InputFields";
import { Building, Loader2, LockKeyhole, Mail, User, Hash } from "lucide-react";

const LoginUser = ({ onClose, switchToRegister }) => {
  const [formStep, setFormStep] = useState("login"); // login | forgot | verify | reset
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailForReset, setEmailForReset] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [role, setRole] = useState("User");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const { backendUrl, setUserData } = useContext(AppContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (formStep === "login") {
        const { data } = await axios.post(`${backendUrl}/api/users/login`, { ...formData, role }, { withCredentials: true });
        if (data.success) {
          toast.success(data.message);
          setUserData(data.user);
          onClose();
        } else toast.error(data.message);
      }

      else if (formStep === "forgot") {
        const { data } = await axios.post(`${backendUrl}/api/users/forgot-password`, { email: formData.email });
        if (data.success) {
          toast.success(data.message);
          setEmailForReset(formData.email);
          setFormStep("verify");
        } else toast.error(data.message);
      }

      else if (formStep === "verify") {
        const { data } = await axios.post(`${backendUrl}/api/users/verify-otp`, { email: emailForReset, otp });
        if (data.success) {
          toast.success(data.message);
          setFormStep("reset");
        } else toast.error(data.message);
      }

      else if (formStep === "reset") {
        const { data } = await axios.post(`${backendUrl}/api/users/reset-password`, {
          email: emailForReset, otp, newPassword,
        });
        if (data.success) {
          toast.success(data.message);
          setFormStep("login");
        } else toast.error(data.message);
      }

    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // UI step rendering
  const forms = {
    login: (
      <>
        <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">Welcome Back</h2>
        <p className="text-center text-gray-600 mb-8">Sign in to continue.</p>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <InputField
            icon={<Mail size={18} className="text-gray-400" />}
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <InputField
            icon={<LockKeyhole size={18} className="text-gray-400" />}
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <div className="text-right -mt-2">
            <button type="button" onClick={() => setFormStep("forgot")} className="text-sm font-medium text-blue-600 hover:underline">
              Forgot Password?
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {["User", "Recruiter"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2
                            ${role === r ? "bg-sky-700 text-white" : "bg-sky-100 text-sky-800"}`}
              >
                {r === "User" ? <User size={18} /> : <Building size={18} />} {r}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700
                        flex items-center justify-center gap-2 transition ${loading ? "opacity-70" : ""}`}
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Signing In...</> : "Sign In"}
          </button>
        </form>
        <p className="text-center mt-8 text-sm">
          Need an account?{" "}
          <button onClick={switchToRegister} className="text-blue-600 hover:underline font-medium">
            Register
          </button>
        </p>
      </>
    ),

    forgot: (
      <>
        <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">Forgot Password</h2>
        <p className="text-center text-gray-600 mb-8">Enter your email to get an OTP.</p>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <InputField
            icon={<Mail size={18} className="text-gray-400" />}
            type="email"
            placeholder="Your registered email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700 flex items-center
                        justify-center gap-2 transition ${loading ? "opacity-70" : ""}`}
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Sending...</> : "Send OTP"}
          </button>
        </form>
        <p className="text-center mt-6">
          <button onClick={() => setFormStep("login")} className="text-gray-600 hover:underline font-medium">
            Back to Login
          </button>
        </p>
      </>
    ),

    verify: (
      <>
        <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">Verify OTP</h2>
        <p className="text-center text-gray-600 mb-8">Enter the OTP sent to <strong>{emailForReset}</strong>.</p>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <InputField icon={<Hash size={18} className="text-gray-400" />} type="text" placeholder="6-Digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required />
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700 flex items-center justify-center gap-2 transition ${loading ? "opacity-70" : ""}`}
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Verifying...</> : "Verify OTP"}
          </button>
        </form>
      </>
    ),

    reset: (
      <>
        <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">Reset Password</h2>
        <p className="text-center text-gray-600 mb-8">Enter your new password.</p>
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <InputField icon={<LockKeyhole size={18} className="text-gray-400" />} type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700 flex items-center justify-center gap-2 transition ${loading ? "opacity-70" : ""}`}
          >
            {loading ? <><Loader2 size={20} className="animate-spin" /> Resetting...</> : "Reset Password"}
          </button>
        </form>
      </>
    ),
  };

  return <div className="w-full">{forms[formStep]}</div>;
};

export default LoginUser;
