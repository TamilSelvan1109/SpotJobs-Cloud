import { useContext, useEffect } from "react";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import JobListing from "../components/JobListing";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";

const Home = () => {
  const { fetchUserData } = useContext(AppContext);
  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <div>
      <Navbar />
      <Hero />
      <JobListing />
      <Footer />
    </div>
  );
};

export default Home;
