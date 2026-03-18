const CLOUDINARY_HOST_FRAGMENT = "res.cloudinary.com";

export const isBase64ImageDataUrl = (value: string) => /^data:image\/[\w.+-]+;base64,/.test(value);

export const isWebUrl = (value: string) => /^https?:\/\//i.test(value);

export const extractCloudinaryPublicIdFromUrl = (imageUrl: string): string | null => {
   if (!isWebUrl(imageUrl)) {
      return null;
   }

   let url: URL;

   try {
      url = new URL(imageUrl);
   } catch {
      return null;
   }

   if (url.hostname !== CLOUDINARY_HOST_FRAGMENT) {
      return null;
   }

   const pathParts = url.pathname.split("/").filter(Boolean);
   const uploadIndex = pathParts.indexOf("upload");

   if (uploadIndex === -1) {
      return null;
   }

   const afterUpload = pathParts.slice(uploadIndex + 1);
   const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
   const publicIdParts = versionIndex >= 0 ? afterUpload.slice(versionIndex + 1) : afterUpload;

   if (publicIdParts.length === 0) {
      return null;
   }

   const publicId = publicIdParts.join("/").replace(/\.[^/.]+$/, "");
   return publicId || null;
};
