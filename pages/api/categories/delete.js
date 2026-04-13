import { doc, getDoc, deleteDoc } from "firebase/firestore";
import db from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Category ID is required" });
    }

    const categoryRef = doc(db, "CATEGORIES", id);
    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
      return res.status(404).json({ error: "Category not found" });
    }

    await deleteDoc(categoryRef);

    return res.status(200).json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ error: "Failed to delete category" });
  }
}
