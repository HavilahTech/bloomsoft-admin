import { generateReactHelpers } from "@uploadthing/react";

/**
 * generateReactHelpers creates the tools needed to interact with 
 * your UploadThing API backend from the client side.
 * * - useUploadThing: A hook for managing upload state in components.
 * - uploadFiles: A standalone async function for manual uploads (used in your helper).
 */
export const { useUploadThing, uploadFiles } = generateReactHelpers();