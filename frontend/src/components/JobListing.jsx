import { useContext, useEffect, useState } from "react";
import { assets, JobCategories, JobLocations } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import JobCard from "./JobCard";

const JobListing = () => {
  const { isSearched, searchFilter, setSearchFilter, jobs } =
    useContext(AppContext);

  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState(jobs);

  // Handle Category Filter
  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Handle Location Filter
  const handleLocationChange = (location) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((c) => c !== location)
        : [...prev, location]
    );
  };

  // Filtering Logic
  useEffect(() => {
    const matchesCategory = (job) =>
      selectedCategories.length === 0 ||
      selectedCategories.includes(job.category);
    const matchesLocation = (job) =>
      selectedLocations.length === 0 ||
      selectedLocations.includes(job.location);
    const matchesTitle = (job) =>
      searchFilter.title === "" ||
      job.title.toLowerCase().includes(searchFilter.title.toLowerCase());
    const matchesSearchLocation = (job) =>
      searchFilter.location === "" ||
      job.location.toLowerCase().includes(searchFilter.location.toLowerCase());

    const newFilteredJobs = jobs
      .slice()
      .reverse()
      .filter(
        (job) =>
          matchesCategory(job) &&
          matchesLocation(job) &&
          matchesTitle(job) &&
          matchesSearchLocation(job)
      );

    setFilteredJobs(newFilteredJobs);
    setCurrentPage(1);
  }, [jobs, selectedCategories, selectedLocations, searchFilter]);

  // Pagination logic
  const jobsPerPage = 6;
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const displayedJobs = filteredJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  return (
    <div className="container 2xl:px-20 mx-auto flex flex-col lg:flex-row gap-10 py-10">
      {/* Sidebar Filters */}
      <aside
        className="w-full lg:w-1/4 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 
                   lg:sticky lg:top-24 h-fit"
      >
        {/* Current Search */}
        {isSearched &&
          (searchFilter.title !== "" || searchFilter.location !== "") && (
            <>
              <h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center justify-between">
                Current Search
                <button
                  onClick={() => setSearchFilter({ title: "", location: "" })}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Clear All
                </button>
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {searchFilter.title && (
                  <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                    {searchFilter.title}
                    <img
                      onClick={() =>
                        setSearchFilter((prev) => ({ ...prev, title: "" }))
                      }
                      src={assets.cross_icon}
                      alt="remove"
                      className="w-3 h-3 cursor-pointer"
                    />
                  </span>
                )}
                {searchFilter.location && (
                  <span className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-full text-sm font-medium">
                    {searchFilter.location}
                    <img
                      onClick={() =>
                        setSearchFilter((prev) => ({ ...prev, location: "" }))
                      }
                      src={assets.cross_icon}
                      alt="remove"
                      className="w-3 h-3 cursor-pointer"
                    />
                  </span>
                )}
              </div>
            </>
          )}

        {/* Filter Toggle for Mobile */}
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="w-full lg:hidden mb-4 bg-blue-600 text-white py-2 rounded-lg font-medium transition-all duration-200"
        >
          {showFilter ? "Hide Filters" : "Show Filters"}
        </button>

        {/* Filter Content */}
        <div className={showFilter ? "block" : "max-lg:hidden"}>
          {/* Category Filter */}
          <div className="mb-8">
            <h4 className="font-semibold text-gray-800 text-lg mb-4">
              Filter by Category
            </h4>
            <ul className="space-y-3 text-gray-700">
              {JobCategories.map((category, index) => (
                <li key={index} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="accent-blue-600 scale-110"
                    onChange={() => handleCategoryChange(category)}
                    checked={selectedCategories.includes(category)}
                  />
                  <label className="cursor-pointer text-sm">{category}</label>
                </li>
              ))}
            </ul>
          </div>

          {/* Location Filter */}
          <div>
            <h4 className="font-semibold text-gray-800 text-lg mb-4">
              Filter by Location
            </h4>
            <ul className="space-y-3 text-gray-700">
              {JobLocations.map((location, index) => (
                <li key={index} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="accent-blue-600 scale-110"
                    onChange={() => handleLocationChange(location)}
                    checked={selectedLocations.includes(location)}
                  />
                  <label className="cursor-pointer text-sm">{location}</label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Job Listings */}
      <section className="w-full lg:w-3/4 text-gray-800 flex flex-col">
        <h3 className="font-bold text-3xl mb-2">Latest Jobs</h3>
        <p className="text-gray-500 mb-8">
          Explore the newest opportunities from top companies
        </p>

        {/* Job Cards Section (No separate scroll, flexible height) */}
        <div id="job-list" className="flex-grow">
          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedJobs.map((job, index) => (
                <JobCard key={index} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl text-gray-500">
              No jobs found matching your criteria.
            </div>
          )}
        </div>

        {/* Pagination — stays at bottom */}
        {filteredJobs.length > 0 && (
          <div className="flex items-center justify-center space-x-2 mt-10">
            <button
              onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100"
            >
              <img src={assets.left_arrow_icon} alt="previous" className="w-4" />
            </button>

            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-9 h-9 flex items-center justify-center rounded-md border text-sm ${
                  currentPage === index + 1
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                } transition-all duration-200`}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage(Math.min(currentPage + 1, totalPages))
              }
              className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-md border border-gray-300 hover:bg-gray-100"
            >
              <img src={assets.right_arrow_icon} alt="next" className="w-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default JobListing;
