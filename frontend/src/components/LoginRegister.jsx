import axios from "axios";
import {
  Building,
  Camera,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  User,
  X,
  KeyRound, // Icon for "Forgot Password?"
  Hash,     // Icon for OTP
} from "lucide-react";
import { useContext, useState } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

// Redesigned InputField to accept an icon
const InputField = ({ icon, ...props }) => (
  <div className="relative w-full">
    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
      {icon}
    </div>
    <input
      {...props}
      className="bg-sky-50 border-2 border-sky-200 rounded-lg pl-12 pr-4 py-3 w-full text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
  </div>
);

const LoginRegister = ({ onClose }) => {
  // UI State
  const [loading, setLoading] = useState(false);
  
  // 'login', 'register', 'forgot', 'verify', 'reset'
  const [formMode, setFormMode] = useState("login"); 

  // Form Data State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  
  // Password Reset State
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [emailForReset, setEmailForReset] = useState(""); // Store email during reset flow

  const { backendUrl, setUserData, setShowLogin, isLogin, setIsLogin } =
    useContext(AppContext);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Check which form is active
  const isRegisterForm = formMode === "register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formMode === "login") {
        // --- LOGIN LOGIC ---
        const loginPayload = { email, password, role };
        const { data } = await axios.post(
          `${backendUrl}/api/Users/login`,
          loginPayload,
          {
            withCredentials: true,
          }
        );
        if (data.success) {
          setUserData(data.user);
          console.log(data.user);
          toast.success(data.message);
          onClose();
        } else {
          toast.error(data.message || "Login failed. Please try again.");
        }
      } else if (formMode === "register") {
        // --- REGISTER LOGIC ---
        if (!name || !email || !phone || !password || !role || !image) {
          toast.error("Please fill all the fields and upload an image!");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("password", password);
        formData.append("role", role);
        formData.append("image", image);

        await axios.post(`${backendUrl}/api/Users/register`, formData, {
          withCredentials: true,
        });

        toast.success("Registration successful! Please log in.");
        setFormMode("login"); // Switch to login after successful register
      
      } else if (formMode === "forgot") {
        // --- FORGOT PASSWORD LOGIC ---
        const { data } = await axios.post(
          `${backendUrl}/api/Users/forgot-password`,
          { email }
        );
        if (data.success) {
          toast.success(data.message);
          setEmailForReset(email); // Store the email
          setFormMode("verify"); // Move to OTP verification
        } else {
          toast.error(data.message || "Failed to send OTP.");
        }
      
      } else if (formMode === "verify") {
        // --- VERIFY OTP LOGIC ---
        const { data } = await axios.post(
          `${backendUrl}/api/Users/verify-otp`,
          { email: emailForReset, otp }
        );
        if (data.success) {
          toast.success(data.message);
          setFormMode("reset"); // Move to password reset
        } else {
          toast.error(data.message || "Invalid or expired OTP.");
        }
      
      } else if (formMode === "reset") {
        // --- RESET PASSWORD LOGIC ---
        if (newPassword.length < 6) {
           toast.error("Password must be at least 6 characters.");
           setLoading(false);
           return;
        }
        const { data } = await axios.post(
          `${backendUrl}/api/Users/reset-password`,
          { email: emailForReset, otp, newPassword }
        );
        if (data.success) {
          toast.success(data.message);
          setFormMode("login"); // Back to login
        } else {
          toast.error(data.message || "Failed to reset password.");
        }
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearAllFields = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setRole("User");
    setImage(null);
    setImagePreview("");
    setOtp("");
    setNewPassword("");
    setEmailForReset("");
  }

  // Toggles between Login and Register
  const toggleForm = () => {
    if (formMode === "login") {
      setFormMode("register");
    } else {
      setFormMode("login");
    }
    clearAllFields();
  };
  
  // Button to go back to login from password reset flow
  const handleBackToLogin = () => {
    setFormMode("login");
    clearAllFields();
  };

  // ---
  // FORM COMPONENTS
  // ---

  const loginForm = (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">
        Welcome Back
      </h2>
      <p className="text-center text-gray-600 mb-8">Sign in to continue.</p>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <InputField
          icon={<Mail size={18} className="text-gray-400" />}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <InputField
          icon={<LockKeyhole size={18} className="text-gray-400" />}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="text-right -mt-2">
          <button
            type="button"
            onClick={() => {
              setFormMode("forgot");
              setEmailForReset(email); // Pre-fill email if they already typed it
            }}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Forgot Password?
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setRole("User")}
            className={`py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              role === "User"
                ? "bg-sky-700 text-white"
                : "bg-sky-100 text-sky-800"
            }`}
          >
            <User size={18} /> User
          </button>
          <button
            type="button"
            onClick={() => setRole("Recruiter")}
            className={`py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              role === "Recruiter"
                ? "bg-sky-700 text-white"
                : "bg-sky-100 text-sky-800"
            }`}
          >
            <Building size={18} /> Recruiter
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700 flex items-center justify-center gap-2 transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );

  const registerForm = (
    <div className="w-full grid md:grid-cols-2 gap-10 items-center">
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl font-bold text-sky-800 mb-2">
          Create an Account
        </h2>
        <p className="text-gray-600 mb-6">
          Join our community of professionals.
        </p>
        <label htmlFor="profileImage" className="cursor-pointer mb-6">
          <div className="w-32 h-32 rounded-full border-2 border-dashed border-sky-300 flex items-center justify-center bg-sky-50 text-sky-600 hover:bg-sky-100 transition relative overflow-hidden">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Camera size={40} className="text-gray-400" />
            )}
          </div>
        </label>
        <input
          type="file"
          id="profileImage"
          className="hidden"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        <div className="w-full max-w-xs grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("User")}
            className={`py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              role === "User"
                ? "bg-sky-700 text-white"
                : "bg-sky-100 text-sky-800"
            }`}
          >
            <User size={18} /> User
          </button>
          <button
            type="button"
            onClick={() => setRole("Recruiter")}
            className={`py-3 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              role === "Recruiter"
                ? "bg-sky-700 text-white"
                : "bg-sky-100 text-sky-800"
            }`}
          >
            <Building size={18} /> Recruiter
          </button>
        </div>
      </div>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <InputField
          icon={
            role === "Recruiter" ? (
              <Building size={18} className="text-gray-400" />
            ) : (
              <User size={18} className="text-gray-400" />
            )
          }
          type="text"
          placeholder={role === "Recruiter" ? "Company Name" : "Full Name"}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <InputField
          icon={<Mail size={18} className="text-gray-400" />}
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <InputField
          icon={<Phone size={18} className="text-gray-400" />}
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <InputField
          icon={<LockKeyhole size={18} className="text-gray-400" />}
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700 flex items-center justify-center gap-2 transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </div>
  );

  const forgotPasswordForm = (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">
        Forgot Password
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Enter your email to get an OTP.
      </p>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <InputField
          icon={<Mail size={18} className="text-gray-400" />}
          type="email"
          placeholder="Your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700 flex items-center justify-center gap-2 transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Sending...
            </>
          ) : (
            "Send OTP"
          )}
        </button>
      </form>
    </div>
  );

  const verifyOtpForm = (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">
        Verify OTP
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Enter the OTP sent to <strong>{emailForReset}</strong>.
      </p>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <InputField
          icon={<Hash size={18} className="text-gray-400" />}
          type="text"
          placeholder="6-Digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700 flex items-center justify-center gap-2 transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </button>
      </form>
    </div>
  );

  const resetPasswordForm = (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-sky-800 mb-2">
        Reset Password
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Enter your new password.
      </p>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <InputField
          icon={<LockKeyhole size={18} className="text-gray-400" />}
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white font-bold rounded-lg py-3 mt-4 hover:bg-blue-700 flex items-center justify-center gap-2 transition ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );

  // ---
  // DYNAMIC RENDER LOGIC
  // ---

  const renderForm = () => {
    switch (formMode) {
      case "login":
        return loginForm;
      case "register":
        return registerForm;
      case "forgot":
        return forgotPasswordForm;
      case "verify":
        return verifyOtpForm;
      case "reset":
        return resetPasswordForm;
      default:
        return loginForm;
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white text-black shadow-2xl rounded-2xl p-8 md:p-12 transition-all duration-300 w-full relative ${
          isRegisterForm ? "max-w-4xl" : "max-w-md"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition-colors"
        >
          <X size={28} />
        </button>

        {renderForm()}

        <div className="text-center mt-8">
          {/* Main toggle between Login and Register */}
          {(formMode === 'login' || formMode === 'register') && (
            <button
              type="button"
              onClick={toggleForm}
              className="text-blue-600 hover:underline font-medium text-sm"
            >
              {formMode === 'login'
                ? "Need an account? Register"
                : "Already have an account? Sign In"}
            </button>
          )}

          {/* "Back to Login" link for password reset flow */}
          {(formMode === 'forgot' || formMode === 'verify' || formMode === 'reset') && (
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-gray-600 hover:underline font-medium text-sm"
            >
              Back to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;