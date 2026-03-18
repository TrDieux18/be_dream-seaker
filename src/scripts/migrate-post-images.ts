import "dotenv/config";
import mongoose from "mongoose";
import connectDatabase from "../config/database.config,";
import cloudinary from "../config/cloudinary.config";
import PostModel from "../models/post.model";
import { isBase64ImageDataUrl } from "../utils/cloudinary-image";

type MigrateStats = {
   scannedPosts: number;
   updatedPosts: number;
   wouldUploadImages: number;
   uploadedImages: number;
   skippedImages: number;
   failedPosts: string[];
};

const getArgValue = (prefix: string): string | undefined => {
   const rawArg = process.argv.find((arg) => arg.startsWith(prefix));
   if (!rawArg) {
      return undefined;
   }

   return rawArg.slice(prefix.length);
};

const parsePositiveInt = (value: string | undefined): number | undefined => {
   if (!value) {
      return undefined;
   }

   const parsed = Number.parseInt(value, 10);
   return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const migratePostImages = async () => {
   const dryRun = process.argv.includes("--dry-run");
   const limit = parsePositiveInt(getArgValue("--limit="));
   const postId = getArgValue("--postId=");

   const stats: MigrateStats = {
      scannedPosts: 0,
      updatedPosts: 0,
      wouldUploadImages: 0,
      uploadedImages: 0,
      skippedImages: 0,
      failedPosts: []
   };

   await connectDatabase();

   const query: Record<string, unknown> = {
      images: {
         $elemMatch: {
            $regex: /^data:image\/[\w.+-]+;base64,/
         }
      }
   };

   if (postId) {
      if (!mongoose.isValidObjectId(postId)) {
         throw new Error("Invalid --postId value. Expected a valid MongoDB ObjectId");
      }
      query._id = postId;
   }

   let scannedForLimit = 0;

   console.log("Starting post image migration with options:", {
      dryRun,
      limit: limit ?? null,
      postId: postId ?? null
   });

   const cursor = PostModel.find(query).select("_id images").lean().cursor();

   for await (const rawPost of cursor) {
      if (limit && scannedForLimit >= limit) {
         break;
      }

      scannedForLimit += 1;
      stats.scannedPosts += 1;

      const post = rawPost as { _id: mongoose.Types.ObjectId; images?: string[] };
      const originalImages = Array.isArray(post.images) ? post.images : [];
      let didChange = false;
      const migratedImages: string[] = [];

      try {
         for (const image of originalImages) {
            if (!isBase64ImageDataUrl(image)) {
               migratedImages.push(image);
               stats.skippedImages += 1;
               continue;
            }

            if (dryRun) {
               migratedImages.push(image);
               stats.wouldUploadImages += 1;
               didChange = true;
               continue;
            }

            const uploadRes = await cloudinary.uploader.upload(image, {
               folder: "post-images",
               resource_type: "image",
               transformation: [{ quality: "auto" }]
            });

            migratedImages.push(uploadRes.secure_url);
            stats.uploadedImages += 1;
            didChange = true;
         }

         if (didChange) {
            stats.updatedPosts += 1;
            if (!dryRun) {
               await PostModel.updateOne({ _id: post._id }, { $set: { images: migratedImages } });
            }
         }

         console.log(`Processed post ${post._id.toString()} | changed=${didChange} | images=${originalImages.length}`);
      } catch (error) {
         stats.failedPosts.push(post._id.toString());
         console.error(`Failed migrating post ${post._id.toString()}:`, error);
      }
   }

   console.log("Migration finished", {
      ...stats,
      mode: dryRun ? "dry-run" : "write"
   });

   if (stats.failedPosts.length > 0) {
      process.exitCode = 1;
   }
};

migratePostImages()
   .catch((error) => {
      console.error("Post image migration failed:", error);
      process.exitCode = 1;
   })
   .finally(async () => {
      await mongoose.disconnect();
   });
