import axios from "axios";
import { ChevronDown, Menu, X } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const {
    setShowLogin,
    setIsLogin,
    userData,
    setUserData,
    backendUrl,
    showLogin,
    fetchUserData,
    setCompanyData,
  } = useContext(AppContext);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const dropdownRef = useRef(null);

  // Logout
  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      const { data } = await axios.get(`${backendUrl}/api/users/logout`);
      if (!data.success) return toast.error(data.message);
      toast.success("Logged out successfully");
      setUserData(null);
      setCompanyData(null);
      setDropdownOpen(false);
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (showLogin) return null;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <h1
            className="text-2xl font-extrabold tracking-tight cursor-pointer select-none"
            onClick={() => navigate("/")}
          >
            <span className="text-blue-900">Spot</span>
            <span className="text-gray-800">Jobs</span>
          </h1>

          {/* Desktop Menu */}
          {userData ? (
            <>
              <div className="hidden md:flex items-center gap-6 text-gray-700 font-medium">
                <NavItem to="/">Jobs</NavItem>

                {userData.role === "User" ? (
                  <>
                    <NavItem to="/user/profile">Dashboard</NavItem>
                    <NavItem to="/user/applications">Applications</NavItem>
                  </>
                ) : (
                  <>
                    <NavItem to="/recruiter/profile">Dashboard</NavItem>
                    <NavItem to="/recruiter/view-applications">
                      Applications
                    </NavItem>
                  </>
                )}

                {/* Click Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex items-center gap-2 hover:text-blue-800 transition cursor-pointer"
                  >
                    <img
                      src={userData.image || "https://via.placeholder.com/40"}
                      alt="avatar"
                      className="w-9 h-9 rounded-full border-2 border-blue-800 object-cover"
                    />
                    <span className="text-lfont-semibold">{userData.name}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-l font-semibold">{userData.name}</p>
                        <p className="text-xs text-gray-500">
                          {userData.email}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenu ? <X /> : <Menu />}
              </button>
            </>
          ) : (
            // Auth Buttons
            <div className="flex gap-3">
              <Button
                label="Sign Up"
                onClick={() => {
                  setShowLogin(true);
                  setIsLogin(false);
                }}
                variant="outline"
              />
              <Button
                label="Sign In"
                onClick={() => {
                  setShowLogin(true);
                  setIsLogin(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {userData && mobileMenu && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-2">
              <NavItem to="/" onClick={() => setMobileMenu(false)}>
                Jobs
              </NavItem>
              {userData.role === "User" ? (
                <>
                  <NavItem to="/user/profile">Dashboard</NavItem>
                  <NavItem to="/user/applications">Applications</NavItem>
                </>
              ) : (
                <>
                  <NavItem to="/recruiter/profile">Dashboard</NavItem>
                  <NavItem to="/recruiter/view-applications">
                    Applications
                  </NavItem>
                </>
              )}
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

/* Reusable Components */
const NavItem = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="px-3 py-2 rounded-md hover:bg-blue-50 hover:text-blue-800 transition text-l"
  >
    {children}
  </Link>
);

const Button = ({ label, onClick, variant = "solid" }) => (
  <button
    onClick={onClick}
    className={`px-5 sm:px-6 py-2.5 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 transform hover:scale-105 shadow-sm ${
      variant === "solid"
        ? "bg-gradient-to-r from-blue-800 to-blue-600 text-white hover:shadow-lg"
        : "border-2 border-blue-800 text-blue-800 hover:bg-blue-800 hover:text-white"
    }`}
  >
    {label}
  </button>
);

export default Navbar;
