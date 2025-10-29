import { useNavigate } from "react-router-dom";

const JobCard = ({ job }) => {
  const navigate = useNavigate();

  return (
    <div
      className="w-full h-[320px] border border-gray-200 rounded-2xl p-6 bg-white 
                 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
    >
      {/* Company Info */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <img
            src={job.companyId.image}
            alt={job.companyId.name}
            className="h-10 w-10 rounded-lg object-cover border border-gray-200"
          />
          <div>
            <h3 className="font-semibold text-gray-900 text-base">
              {job.companyId.name}
            </h3>
            <p className="text-xs text-gray-500">{job.location}</p>
          </div>
        </div>

        {/* Job Title */}
        <h4 className="text-lg font-bold text-gray-900 mt-2 line-clamp-1">
          {job.title}
        </h4>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-xs font-medium">
            {job.location}
          </span>
          <span className="bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full text-xs font-medium">
            {job.level}
          </span>
          {job.jobType && (
            <span className="bg-green-50 text-green-700 border border-green-100 px-3 py-1 rounded-full text-xs font-medium">
              {job.jobType}
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className="text-gray-600 text-sm mt-4 line-clamp-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: job.description.slice(0, 150) }}
        ></p>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => {
            navigate(`/apply-job/${job._id}`);
            scrollTo(0, 0);
          }}
          className="flex-1 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2.5 
                     rounded-lg text-sm font-medium transition-all duration-300"
        >
          Apply Now
        </button>
        <button
          onClick={() => {
            navigate(`/apply-job/${job._id}`);
            scrollTo(0, 0);
          }}
          className="flex-1 text-gray-700 hover:text-blue-700 border border-gray-300 
                     hover:border-blue-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300"
        >
          Learn More
        </button>
      </div>
    </div>
  );
};

export default JobCard;
