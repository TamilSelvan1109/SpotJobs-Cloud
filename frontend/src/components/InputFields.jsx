// components/InputField.jsx
const InputField = ({ icon, ...props }) => (
  <div className="relative w-full">
    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
      {icon}
    </div>
    <input
      {...props}
      className="bg-sky-50 border-2 border-sky-200 rounded-lg pl-12 pr-4 py-3 w-full
                 text-gray-800 placeholder-gray-500 focus:outline-none
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
  </div>
);

export default InputField;
