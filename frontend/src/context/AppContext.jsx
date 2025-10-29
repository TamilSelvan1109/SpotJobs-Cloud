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

  // Fetch logged-in user data (from cookie)
  const fetchUserData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/users/user`, {
        withCredentials: true,
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
        withCredentials: true,
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
        withCredentials: true,
      });

      if (!data.success) {
        toast.error(data.message);
      } else {
        setJobsApplied(data.applications);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };


  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      await fetchJobs();
      await fetchUserData();
      setIsLoading(false);
    };
    initialize();
  }, [backendUrl]);

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
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};
