import mongoose from "mongoose";

// Function to connect to the MongoDB database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database Connected!");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
