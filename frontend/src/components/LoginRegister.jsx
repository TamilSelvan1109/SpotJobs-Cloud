// components/LoginRegister.jsx
import { X } from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import LoginUser from "./LoginUser";
import RegisterUser from "./RegisterUser";

const LoginRegister = ({ onClose }) => {
  const { isLogin } = useContext(AppContext);
  const [showLogin, setShowLogin] = useState(isLogin);

  useEffect(() => {
    setShowLogin(isLogin);
  }, [isLogin]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`bg-white text-black shadow-2xl rounded-2xl p-8 md:p-12 w-full relative transition-all duration-300 ${
          showLogin ? "max-w-md" : "max-w-4xl"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-800 transition"
        >
          <X size={28} />
        </button>

        {showLogin ? (
          <LoginUser onClose={onClose} switchToRegister={() => setShowLogin(false)} />
        ) : (
          <RegisterUser onClose={onClose} switchToLogin={() => setShowLogin(true)} />
        )}
      </div>
    </div>
  );
};

export default LoginRegister;
