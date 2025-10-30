import axios from "axios";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { JobCategories, JobLocations } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const AddJob = () => {
  const { backendUrl, fetchJobs, getAuthHeaders } = useContext(AppContext);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Chennai");
  const [category, setCategory] = useState("Programming");
  const [level, setLevel] = useState("Beginner level");
  const [salary, setSalary] = useState("");
  const [skills, setSkills] = useState("");
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const description = quillRef.current.root.innerHTML;
      if (!title || !description || !location || !category || !level || salary <= 0) {
        toast.error("Please fill all fields correctly");
        setLoading(false);
        return;
      }

      const skillsArray = skills.split(',').map(skill => skill.trim()).filter(skill => skill);
      
      const { data } = await axios.post(
        `${backendUrl}/api/company/post-job`,
        { title, description, location, salary, level, category, skills: skillsArray },
        { headers: getAuthHeaders() }
      );

      if (data.success) {
        toast.success(data.message);
        setTitle("");
        setSalary("");
        setSkills("");
        quillRef.current.root.innerHTML = "";
        await fetchJobs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Write job description here...",
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-200 p-10 transition-all hover:shadow-2xl duration-300">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Post a New Job</h1>
          <p className="text-gray-500 text-sm">
            Fill out all the details carefully before posting.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmitHandler} className="space-y-8">
          {/* Job Title */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. React Developer"
              onChange={(e) => setTitle(e.target.value)}
              value={title}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          {/* Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Category */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Job Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              >
                {JobCategories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Job Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              >
                {JobLocations.map((loc, i) => (
                  <option key={i} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Job Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="Beginner level">Beginner level</option>
                <option value="Intermediate level">Intermediate level</option>
                <option value="Senior level">Senior level</option>
              </select>
            </div>

            {/* Salary */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Salary (₹LPA)
              </label>
              <input
                type="text"
                placeholder="e.g. 6-8 LPA"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                min={0}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Required Skills
            </label>
            <input
              type="text"
              placeholder="e.g. React, Node.js, MongoDB (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-600 outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter skills separated by commas
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Job Description <span className="text-red-500">*</span>
            </label>
            <div
              ref={editorRef}
              className="bg-white border border-gray-300 rounded-lg h-[300px] overflow-auto shadow-sm"
            ></div>
            <p className="text-xs text-gray-500 mt-2">
              Provide a detailed description including responsibilities and required skills.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-all shadow-md ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Job"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJob;
