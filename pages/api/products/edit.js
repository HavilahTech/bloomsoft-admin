import { doc, updateDoc, getDoc } from "firebase/firestore";
import db from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const productData = req.body;

    // Check if product ID is provided
    if (!productData.id) {
      return res.status(400).json({
        error: "Product ID is required",
      });
    }

    const requiredFields = [
      "name",
      "smallText",
      "description",
      "price",
      "inStock",
      "category",
      "material",
    ];
    const missingFields = requiredFields.filter((field) => !productData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    // Check if product exists
    const productRef = doc(db, "PRODUCTS", productData.id);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    // Prepare update data
    const updateData = {
      name: productData.name,
      smallText: productData.smallText,
      description: productData.description,
      detailedDescription: productData.detailedDescription || "",
      price: parseFloat(productData.price),
      originalPrice: productData.originalPrice
        ? parseFloat(productData.originalPrice)
        : null,
      category: productData.category,
      material: productData.material,
      weight: productData.weight || "",
      width: productData.width ? parseFloat(productData.width) : null,
      inStock: parseInt(productData.inStock),
      rating: parseFloat(productData.rating) || 0,
      reviewCount: productData.reviewCount
        ? parseInt(productData.reviewCount)
        : 0,
      tags: productData.tags || [],
      colors: productData.colors || [],
      pattern: productData.pattern || "",
      collectionId: productData.collectionId || "",
      collectionName: productData.collectionName || "",
      updatedAt: new Date().toISOString(),
      // Keep existing images if not provided in update
      images: productData.images || productDoc.data().images || [],
    };

    // Update the product document
    await updateDoc(productRef, updateData);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Product update error:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
