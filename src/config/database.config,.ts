import mongoose from "mongoose"
import { Env } from "./env.config"

export const connectDatabase = async () => {
   try {
      await mongoose.connect(Env.DATABASE_URL);
      console.log("Connected to MongoDB database");
   } catch (error) {
      console.error("Failed to connect to MongoDB database", error);
      process.exit(1);
   }
}

export default connectDatabase;