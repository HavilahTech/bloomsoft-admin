import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import db from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const productData = req.body;

    const requiredFields = [
      "name",
      "description",
      "shortDescription",
      "sku",
      "price",
      "quantity",
      "category", // Added category to required fields
    ];
    const missingFields = requiredFields.filter((field) => !productData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check if product with same name already exists
    const productsRef = collection(db, "PRODUCTS");
    const q = query(productsRef, where("name", "==", productData.name));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return res.status(409).json({
        error: "A product with this name already exists",
      });
    }

    // Prepare product document
    const productDocument = {
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: productData.tags || [],
      colors: productData.colors || [],
      images: productData.images || [],
      rating: productData.rating || 0,
      reviewCount: productData.reviewCount || 0,
      status: productData.status || "draft",
      size: productData.size || "",
      category: productData.category, // Ensure category is included
      isFeatured: productData.isFeatured || false,
      isActive: true,
      slug: productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, ""),
    };

    // Add document to Firestore
    const docRef = await addDoc(collection(db, "PRODUCTS"), productDocument);

    return res.status(200).json({
      success: true,
      productId: docRef.id,
      message: "Product created successfully",
    });
  } catch (error) {
    console.error("Product creation error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
