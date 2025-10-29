import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <div className="container px-4 2xl:px-20 mx-auto flex items-center justify-between gap-4 py-3 mt-20">
      <h1 className="text-3xl font-extrabold">
        <span className="text-blue-900">Spot</span>
        <span className="text-black">Jobs</span>
      </h1>
      <p className="flex-1 border-l border-gray-400 pl-4 text-sm text-gray-500 max-sm:hidden">
        copyright @TamilSelvan | All rights reserved.
      </p>
      <div className="flex gap-2.5">
        <img width={38} src={assets.twitter_icon} alt="" />
        <img width={38} src={assets.facebook_icon} alt="" />
        <img width={38} src={assets.instagram_icon} alt="" />
      </div>
    </div>
  );
};

export default Footer;
