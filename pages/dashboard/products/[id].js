"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import withDashboardLayout from "@/components/withDashboardLayout";
import {
  ArrowLeft,
  Star,
  Plus,
  X,
  Upload,
  ChevronDown,
  ChevronUp,
  FileText,
  Save,
} from "lucide-react";
import Loader from "@/components/utility/Loader";
import { useFirebase } from "@/lib/firebaseContext";
import { useToast } from "@/toast/ToastProvider";
import { handleFileUpload } from "@/lib/upload-helper";

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const { products, collections } = useFirebase();
  const [productId, setProductId] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const { addToast } = useToast();

  // Image upload states
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const MAX_FILE_SIZE = 4 * 1024 * 1024;

  const categories = ["Cotton", "Silk", "Wool", "Linen", "Polyester", "Other"];
  const patterns = ["Solid", "Floral", "Geometric", "Stripe", "Other"];
  const colors = [
    { name: "Red", value: "#FF0000" },
    { name: "Blue", value: "#0000FF" },
    { name: "Green", value: "#00FF00" },
    { name: "Yellow", value: "#FFFF00" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#FFFFFF" },
    { name: "Gray", value: "#808080" },
    { name: "Brown", value: "#A52A2A" },
  ];

  useEffect(() => {
    if (params?.id) {
      setProductId(params.id);
    }
  }, [params]);

  useEffect(() => {
    if (!productId || !products) return;

    // Find the product from Firebase products
    const foundProduct = products.find((p) => p.id === productId);

    if (foundProduct) {
      setProduct({
        ...foundProduct,
        // Ensure all fields have proper defaults
        tags: foundProduct.tags || [],
        colors: foundProduct.colors || [],
        images: foundProduct.images || [],
        collectionId: foundProduct.collectionId || "",
        collectionName: foundProduct.collectionName || "",
      });

      // Initialize uploaded files from existing images
      const existingFiles = (foundProduct.images || []).map(
        (imageUrl, index) => ({
          id: `existing-${index}`,
          url: imageUrl,
          name: `product-image-${index + 1}`,
          status: "uploaded",
          preview: imageUrl,
        })
      );
      setUploadedFiles(existingFiles);
    }
    setLoading(false);
  }, [productId, products]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value === "" ? "" : Number(value),
    }));
  };

  // Tag handlers
  const addTag = () => {
    if (newTag.trim() && !product.tags.includes(newTag.trim())) {
      setProduct((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setProduct((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Color handlers
  const toggleColor = (colorValue) => {
    setProduct((prev) => ({
      ...prev,
      colors: prev.colors.includes(colorValue)
        ? prev.colors.filter((c) => c !== colorValue)
        : [...prev.colors, colorValue],
    }));
  };

  // Collection handlers
  const handleCollectionSelect = (collection) => {
    setProduct((prev) => ({
      ...prev,
      collectionId: collection.id,
      collectionName: collection.name,
    }));
    setShowCollectionDropdown(false);
  };

  const removeCollection = () => {
    setProduct((prev) => ({
      ...prev,
      collectionId: "",
      collectionName: "",
    }));
  };

  // Image handlers
  const validateFile = (file) => {
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "File must be an image" };
    }
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size must be less than 4MB. Your file is ${formatFileSize(file.size)}`,
      };
    }
    return { valid: true };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    processFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const processFiles = async (files) => {
    const validFiles = [];
    const invalidFiles = [];

    // Validate files first
    files.forEach((file) => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({ file, error: validation.error });
      }
    });

    // Show errors for invalid files
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, error }) => {
        alert(`Invalid File: ${file.name}: ${error}`);
      });
    }

    // Process only valid files
    const imageFiles = validFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    const newFiles = imageFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: URL.createObjectURL(file),
      status: "pending",
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Upload files sequentially
    for (const fileObj of newFiles) {
      try {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id ? { ...f, status: "uploading" } : f
          )
        );

        // Call the UploadThing utility
        const fileUrl = await handleFileUpload(fileObj.file);

        if (fileUrl) {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id
                ? {
                    ...f,
                    status: "uploaded",
                    fileId: fileObj.id,
                    url: fileUrl.toString(),
                  }
                : f
            )
          );
        } else {
          throw new Error("Upload failed - no URL returned");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileObj.id
              ? { ...f, status: "error", error: error.message }
              : f
          )
        );
        addToast({
          type: "error",
          title: "Image upload failed",
          message: error.message || "Error uploading image",
        });
      }
    }
  };

  const removeFile = async (fileId) => {
    const fileToRemove = uploadedFiles.find((f) => f.id === fileId);

    if (!fileToRemove) return;

    // Clean up preview URL for new files
    if (fileToRemove.preview && fileToRemove.id.startsWith("new-")) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Check if all images are uploaded
      const pendingUploads = uploadedFiles.some(
        (file) => file.status === "uploading" || file.status === "pending"
      );
      if (pendingUploads) {
        addToast({
          type: "warning",
          title: "Processing images",
          message:
            "Please wait for all images to finish uploading before submitting",
        });
        setSaving(false);
        return;
      }

      // Validate required fields
      if (
        !product.name ||
        !product.smallText ||
        !product.description ||
        !product.price ||
        !product.inStock ||
        !product.category ||
        !product.material
      ) {
        addToast({
          type: "warning",
          title: "Missing fields",
          message: "Please fill in all required fields",
        });
        setSaving(false);
        return;
      }

      if (uploadedFiles.length === 0) {
        addToast({
          type: "warning",
          title: "Missing Image field",
          message: "Please upload at least one product image",
        });
        setSaving(false);
        return;
      }

      // Prepare images array from uploaded files
      const imageUrls = uploadedFiles
        .filter((file) => file.status === "uploaded")
        .map((file) => file.url);

      // Prepare product data for submission
      const productData = {
        ...product,
        images: imageUrls,
        price: parseFloat(product.price),
        originalPrice: product.originalPrice
          ? parseFloat(product.originalPrice)
          : null,
        inStock: parseInt(product.inStock),
        width: product.width ? parseFloat(product.width) : null,
        rating: parseFloat(product.rating),
        reviewCount: product.reviewCount ? parseInt(product.reviewCount) : 0,
        updatedAt: new Date().toISOString(),
      };

      // console.log("Updating product data:", productData);

      const response = await fetch("/api/products/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok) {
        addToast({
          type: "success",
          title: "Success",
          message: "Product updated successfully!",
        });
        router.push("/dashboard/products");
      } else {
        throw new Error(result.error || "Failed to update product");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to update product. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const StarRatingInput = () => {
    const handleRatingChange = (rating) => {
      setProduct((prev) => ({
        ...prev,
        rating,
      }));
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= product.rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {product.rating}.0 / 5.0
        </span>
      </div>
    );
  };

  if (loading) {
    return <Loader />;
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Product Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <button
          onClick={() => router.push("/dashboard/products")}
          className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors"
        >
          Back to Products
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.push("/dashboard/products")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl lg:text-3xl font-bold text-gray-900">
            Edit Product
          </h1>
          <p className="text-gray-600 mt-1 lg:mt-2">
            Update product information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={product?.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Premium Cotton Fabric"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Small Text *
              </label>
              <input
                type="text"
                name="smallText"
                value={product?.smallText}
                onChange={handleChange}
                required
                maxLength={20}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Organic & Breathable"
              />
              <p className="text-xs text-gray-500 mt-1">
                {product?.smallText?.length}/20 characters
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                name="description"
                value={product.description}
                onChange={handleChange}
                required
                maxLength={240}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Brief description (max 240 characters)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {product?.description?.length}/240 characters
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description
              </label>
              <textarea
                name="detailedDescription"
                value={product?.detailedDescription}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Detailed product description..."
              />
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
            Pricing & Inventory
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₦) *
              </label>
              <input
                type="number"
                name="price"
                value={product.price}
                onChange={handleNumberChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="18500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Original Price (₦)
              </label>
              <input
                type="number"
                name="originalPrice"
                value={product.originalPrice}
                onChange={handleNumberChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="22000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                name="inStock"
                value={product.inStock}
                onChange={handleNumberChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="100"
              />
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
            Product Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={product.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Material *
              </label>
              <input
                type="text"
                name="material"
                value={product.material}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="100% Organic Cotton"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pattern
              </label>
              <select
                name="pattern"
                value={product.pattern}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select Pattern</option>
                {patterns.map((pattern) => (
                  <option key={pattern} value={pattern}>
                    {pattern}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width (inches)
              </label>
              <input
                type="number"
                name="width"
                value={product.width}
                onChange={handleNumberChange}
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="44"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight
              </label>
              <input
                type="text"
                name="weight"
                value={product.weight}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="180 GSM"
              />
            </div>

            {/* Collections Dropdown */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection
              </label>
              <div className="relative">
                {product.collectionId ? (
                  <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-gray-700">
                      {product.collectionName}
                    </span>
                    <button
                      type="button"
                      onClick={removeCollection}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setShowCollectionDropdown(!showCollectionDropdown)
                      }
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    >
                      <span className="text-gray-700">Select a collection</span>
                      {showCollectionDropdown ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {showCollectionDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {collections && collections.length > 0 ? (
                          collections.map((collection) => (
                            <button
                              key={collection.id}
                              type="button"
                              onClick={() => handleCollectionSelect(collection)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors text-gray-700"
                            >
                              {collection.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-gray-500 text-sm">
                            No collections found
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional: Assign this product to a collection
              </p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
            Colors
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Select available colors for this fabric
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
              {colors.map((color) => (
                <div key={color.value} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => toggleColor(color.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      product.colors.includes(color.value)
                        ? "border-blue-500 scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                  <span className="text-xs text-gray-600 mt-1">
                    {color.name}
                  </span>
                </div>
              ))}
            </div>
            {product.colors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Colors:
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((colorValue) => {
                    const color = colors.find((c) => c.value === colorValue);
                    return (
                      <span
                        key={colorValue}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colorValue }}
                        />
                        {color?.name}
                        <button
                          type="button"
                          onClick={() => toggleColor(colorValue)}
                          className="hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
            Tags
          </h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Add a tag (e.g., Organic, Sustainable)"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
            Product Images
          </h2>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
              isDragging
                ? "border-brand bg-brand/5"
                : "border-gray-300 hover:border-brand hover:bg-gray-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop your images here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports JPG, PNG, WebP • Max 4MB per file
              </p>
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors"
              >
                Select Files
              </label>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Product Images ({uploadedFiles.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}

                      <div
                        className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 transition-opacity ${
                          file.status === "pending" ||
                          file.status === "uploading"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      >
                        <div className="text-white text-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                          <p className="text-xs">
                            {file.status === "uploading"
                              ? "Uploading..."
                              : "Pending..."}
                          </p>
                        </div>
                      </div>

                      {file.status === "uploaded" && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-green-500 text-white rounded-full p-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      {file.status === "error" && (
                        <div className="absolute top-2 left-2">
                          <div className="bg-red-500 text-white rounded-full p-1">
                            <X className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size
                          ? formatFileSize(file.size)
                          : "Existing image"}
                      </p>
                      <p
                        className={`text-xs ${
                          file.status === "error"
                            ? "text-red-500"
                            : file.status === "uploaded"
                            ? "text-green-500"
                            : "text-blue-500"
                        }`}
                      >
                        {file.status}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Ratings & Reviews */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
            Ratings & Reviews
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating (0-5)
              </label>
              <StarRatingInput />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Count
              </label>
              <input
                type="number"
                name="reviewCount"
                value={product.reviewCount}
                onChange={handleNumberChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="24"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.push("/dashboard/products")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              saving ||
              uploadedFiles.some(
                (file) =>
                  file.status === "uploading" || file.status === "pending"
              )
            }
            className="flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default withDashboardLayout(EditProductPage);
