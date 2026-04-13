import { collection, addDoc } from "firebase/firestore";
import db from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, description, status, image } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const categoryData = {
      name,
      description: description || "",
      status: status || "active",
      image: image || null,
      productCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(db, "CATEGORIES"), categoryData);

    const newCategory = {
      id: docRef.id,
      ...categoryData,
    };

    return res.status(201).json({
      category: newCategory,
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("Error creating category:", error);
    return res.status(500).json({ error: "Failed to create category" });
  }
}
