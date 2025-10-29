import axios from "axios";
import {
  BriefcaseIcon,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  FileText,
  LogOut,
  UserCircle,
  UserPen,
} from "lucide-react";
import { useContext, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";

const Dashboard = () => {
  const { setCompanyData, setUserData, backendUrl, fetchUserData } =
    useContext(AppContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const logout = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/users/logout`, {
        withCredentials: true,
      });
      if (!data.success) return toast.error(data.message);

      toast.success("Logged out successfully");
      setUserData(null);
      setCompanyData(null);
      await fetchUserData();
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Layout below navbar */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col justify-between transition-all duration-300 z-40 ${
            sidebarOpen ? "w-64" : "w-20"
          }`}
        >
          <div className="flex-1 overflow-hidden">
            {/* Toggle Button */}
            <div className="flex justify-end border-b p-1 border-gray-100">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
              </button>
            </div>

            {/* Menu Links */}
            <nav className="mt-4 flex flex-col gap-2 px-3">
              <NavItem
                to="/recruiter/profile"
                label="Profile"
                icon={<UserCircle className="w-5 h-5" />}
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                to="/recruiter/edit"
                label="Edit Profile"
                icon={<UserPen className="w-5 h-5" />}
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                to="/recruiter/manage-jobs"
                label="Manage Jobs"
                icon={<BriefcaseIcon className="w-5 h-5" />}
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                to="/recruiter/add-job"
                label="Post Job"
                icon={<FilePlus className="w-5 h-5" />}
                sidebarOpen={sidebarOpen}
              />
              <NavItem
                to="/recruiter/view-applications"
                label="Applications"
                icon={<FileText className="w-5 h-5" />}
                sidebarOpen={sidebarOpen}
              />
            </nav>
          </div>

          {/* Logout at bottom */}
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 h-[calc(100vh-4rem)] overflow-y-auto ${
            sidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          <div className="p-6 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

/* Reusable Sidebar Link Component */
const NavItem = ({ to, label, icon, sidebarOpen }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        isActive
          ? "bg-blue-100 text-blue-900 font-semibold shadow-sm"
          : "text-gray-700 hover:bg-gray-100"
      }`
    }
  >
    {icon}
    {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
  </NavLink>
);

export default Dashboard;
