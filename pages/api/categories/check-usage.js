import { collection, getDocs, query, where } from "firebase/firestore";
import db from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    // Check if any products are using this category
    const productsRef = collection(db, "PRODUCTS");
    const q = query(productsRef, where("category", "==", categoryId));
    const querySnapshot = await getDocs(q);

    const isUsed = !querySnapshot.empty;

    return res.status(200).json({
      isUsed,
      productCount: querySnapshot.size,
    });
  } catch (error) {
    console.error("Error checking category usage:", error);
    return res.status(500).json({ error: "Failed to check category usage" });
  }
}
