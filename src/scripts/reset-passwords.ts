import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database.config,";
import UserModel from "../models/user.model";

const resetPasswords = async () => {
   const newPassword = process.argv.find(arg => arg.startsWith("--password="))?.split("=")[1] || "12345678";

   console.log(`Connecting to database to reset all passwords to "${newPassword}"...`);
   await connectDatabase();

   const users = await UserModel.find({});
   console.log(`Found ${users.length} users in the database.`);

   for (const user of users) {
      user.password = newPassword;
      await user.save();
      console.log(`✅ Reset password for user: ${user.username} (${user.name})`);
   }

   console.log("🎉 All passwords reset successfully!");
};

resetPasswords()
   .catch((error) => {
      console.error("❌ Reset passwords script failed:", error);
      process.exitCode = 1;
   })
   .finally(async () => {
      await mongoose.disconnect();
   });
