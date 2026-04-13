import { doc, getDoc, updateDoc } from "firebase/firestore";
import db from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id, name, description, status, image } = req.body;

    // Validate required fields
    if (!id) {
      return res.status(400).json({ error: "Category ID is required" });
    }
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const categoryRef = doc(db, "CATEGORIES", id);
    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
      return res.status(404).json({ error: "Category not found" });
    }

    const updatedData = {
      name,
      description: description || "",
      status: status || "active",
      image: image || null,
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(categoryRef, updatedData);

    const updatedCategory = {
      id,
      ...categorySnap.data(),
      ...updatedData,
    };

    return res.status(200).json({
      category: updatedCategory,
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return res.status(500).json({ error: "Failed to update category" });
  }
}
