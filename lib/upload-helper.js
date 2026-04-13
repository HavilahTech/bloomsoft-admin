import { uploadFiles } from "../utils/uploadthing";

/**
 * Uploads a file and returns only the URL string.
 * Includes a safety check to prevent FileSizeMismatch errors.
 * @param {File} file 
 */
export const handleFileUpload = async (file) => {
  if (!file) {
    console.warn("No file provided for upload.");
    return null;
  }

  const MAX_SIZE = 4194304; 
  if (file.size > MAX_SIZE) {
    console.error(`File too large: ${file.size} bytes. Limit is ${MAX_SIZE} bytes.`);
    return null; 
  }

  try {
    const res = await uploadFiles("imageUploader", {
      files: [file],
    });

    if (res?.[0]) {
      return res[0].ufsUrl || res[0].url;
    }
    
    return null;
  } catch (error) {
    console.error("UploadThing Error:", error.message || error);
    return null;
  }
};