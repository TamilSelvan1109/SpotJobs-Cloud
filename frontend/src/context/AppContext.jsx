import axios, { Axios } from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [searchFilter, setSearchFilter] = useState({
    title: "",
    location: "",
  });
  const [isSearched, setIsSearched] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  const [companyData, setCompanyData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userApplications, setUserApplications] = useState([]);
  const [jobsApplied, setJobsApplied] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get auth headers with token from localStorage
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  // Fetch all jobs
  const fetchJobs = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs`);
      if (data.success) {
        setJobs(data.jobs);
        console.log("Fetched Jobs: ", data.jobs);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch logged-in user data (from localStorage token)
  const fetchUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/users/user`, {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setUserData(data.user);

        if (data.user.role === "Recruiter") {
          await fetchCompanyData();
        }

        console.log("Fetched user:", data.user);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setUserData(null);
        setCompanyData(null);
        console.log("User not authorized");
      } else {
        toast.error(error.message);
      }
    }
  };

  // Fetch company data (for recruiters)
  const fetchCompanyData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/company`, {
        headers: getAuthHeaders(),
      });

      if (data.success) {
        setCompanyData(data.company);
        console.log("Fetched company:", data.company);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchAppliedJobs = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/users/applications`, {
        headers: getAuthHeaders(),
      });

      if (!data.success) {
        console.log(data.message);
      } else {
        setJobsApplied(data.applications);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  // Update individual application score
  const updateApplicationScore = (applicationId, score) => {
    setJobsApplied(prev => 
      prev.map(job => 
        job._id === applicationId ? { ...job, score } : job
      )
    );
  };

  // Fetch recruiter applications
  const fetchRecruiterApplications = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/applicants`, {
        headers: getAuthHeaders(),
      });
      return data.success ? data.applications : [];
    } catch (error) {
      console.error('Error fetching recruiter applications:', error);
      return [];
    }
  };

  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        await fetchJobs();
        // Only fetch user data if token exists
        if (localStorage.getItem("token")) {
          await fetchUserData();
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const initialize = async () => {
      if (userData && userData.role === "User") {
        await fetchAppliedJobs();
      }
    };
    initialize();
  }, [userData]);

  // Context values
  const value = {
    backendUrl,
    searchFilter,
    setSearchFilter,
    isSearched,
    setIsSearched,
    jobs,
    setJobs,
    showLogin,
    setShowLogin,
    isLogin,
    setIsLogin,
    isLoading,

    // user & recruiter info
    userData,
    setUserData,
    companyData,
    setCompanyData,
    userApplications,
    setUserApplications,
    jobsApplied,
    setJobsApplied,

    // fetchers
    fetchUserData,
    fetchCompanyData,
    fetchJobs,
    fetchAppliedJobs,
    fetchRecruiterApplications,
    updateApplicationScore,
    getAuthHeaders,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
