import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const isAuthenticated = async (req, res, next) => {
  
  let token;
  
  // Prioritize Authorization header over cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    token = req.cookies.token;
  }

  if (!token) {
    console.log(`❌ No token found for: ${req.method} ${req.originalUrl}`);
    return res.status(401).json({ success: false, message: "Not authorized, Login Again" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token verification failed, Login Again",
      });
    }
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found, Login Again" });
    }
    req.user = user;
    req.id = user._id;
    next();
  } catch (error) {
    console.log('Auth middleware error:', error.message);
    res.status(401).json({ success: false, message:"Token is invalid or expired, Login Again" });
  }
};
