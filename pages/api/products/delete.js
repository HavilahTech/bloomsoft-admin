import { doc, deleteDoc } from "firebase/firestore";
import db from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Reference to the product document
    const productRef = doc(db, "PRODUCTS", productId);

    // Delete the product document
    await deleteDoc(productRef);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);

    // Handle specific Firestore errors
    if (error.code === "not-found") {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
