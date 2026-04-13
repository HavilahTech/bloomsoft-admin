import { createUploadthing } from "uploadthing/next-legacy";
import { createRouteHandler } from "uploadthing/next-legacy";

const f = createUploadthing();

export const ourFileRouter = {
  // Define your endpoint configuration
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ file }) => {
      // Logic runs on server after upload
      console.log("Upload complete:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),
};

// Export the API handler
export default createRouteHandler({
  router: ourFileRouter,
});