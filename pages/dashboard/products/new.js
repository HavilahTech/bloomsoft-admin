"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
} from "lucide-react";
import Loader from "@/components/utility/Loader";
import { useToast } from "@/toast/ToastProvider";
import { useFirebase } from "@/lib/firebaseContext";
import { handleFileUpload } from "@/lib/upload-helper";

const CreateProductPage = () => {
  const router = useRouter();
  const { addToast } = useToast();
  const { categories } = useFirebase();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    sku: "",
    status: "draft",
    price: "",
    quantity: "",
    size: "",
    rating: 0,
    reviewCount: "",
    images: [],
    colors: [],
    tags: [],
    isFeatured: false,
    category: "", // Added category field
  });
  const [newTag, setNewTag] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "publish", label: "Published" },
  ];

  const colors = [
    { name: "Assorted", value: "assorted" },
    { name: "Traditional Aso Oke Weave", value: "traditional" },
    { name: "Neutral (White)", value: "neutral-white" },
    { name: "Neutral (Wood Based)", value: "neutral-wood" },
    { name: "Neutral (Patterns)", value: "neutral-patterns" },
  ];

  const predefinedTags = [
    "Best Selling",
    "New Arrival",
    "Featured",
    "Limited Edition",
    "Eco-Friendly",
    "Premium",
    "Handmade",
    "Traditional",
    "Modern",
    "Luxury",
  ];

  // Constants
  const MAX_FILE_SIZE = 4 * 1024 * 1024; 

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;

    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        [name]: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: Number(value),
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const addPredefinedTag = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
    setShowTagDropdown(false);
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const toggleColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }));
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

  const validateFile = (file) => {
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "File must be an image" };
    }

    // Check file size (4MB limit)
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
        addToast({
          type: "error",
          title: "Invalid File",
          message: `${file.name}: ${error}`,
        });
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

          setFormData((prev) => ({
            ...prev,
            images: [...prev.images, fileUrl.toString()],
          }));
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
            title: "Upload Failed",
            message: `Failed to upload ${fileObj.name}: ${error.message}`,
          });
      }
    }
  };

  const removeFile = async (fileId) => {
    const fileToRemove = uploadedFiles.find((f) => f.id === fileId);

    if (!fileToRemove) return;

    // Clean up preview URL
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }

    // Update UI state
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));

    // Remove from form data using the stored URL
    if (fileToRemove && fileToRemove.url) {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img !== fileToRemove.url),
      }));
    }
  };

  const handleRatingChange = (rating) => {
    setFormData((prev) => ({
      ...prev,
      rating,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Check if all images are uploaded
      const pendingUploads = uploadedFiles.some(
        (file) => file.status === "uploading" || file.status === "pending"
      );
      if (pendingUploads) {
        addToast({
          type: "error",
          title: "Uploads in Progress",
          message:
            "Please wait for all images to finish uploading before submitting",
        });
        setSubmitting(false);
        return;
      }

      if (
        !formData.name ||
        !formData.description ||
        !formData.shortDescription ||
        !formData.sku ||
        !formData.price ||
        !formData.quantity ||
        !formData.category // Added category validation
      ) {
        addToast({
          type: "error",
          title: "Missing Fields",
          message: "Please fill in all required fields including category",
        });
        setSubmitting(false);
        return;
      }

      if (formData.images.length === 0) {
        addToast({
          type: "error",
          title: "Images Required",
          message: "Please upload at least one product image",
        });
        setSubmitting(false);
        return;
      }

      // Prepare product data for submission
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        rating: parseFloat(formData.rating),
        reviewCount: formData.reviewCount ? parseInt(formData.reviewCount) : 0,
        // images array is already populated with Appwrite URLs
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log("Submitting product data:", productData);

      const response = await fetch("/api/products/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok) {
        addToast({
          type: "success",
          title: "Product Created",
          message: "Product has been created successfully!",
        });

        setTimeout(() => {
          router.push("/dashboard/products");
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      addToast({
        type: "error",
        title: "Creation Failed",
        message: error.message || "Failed to create product. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRatingInput = () => {
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
                star <= formData.rating
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {formData.rating}.0 / 5.0
        </span>
      </div>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Add New Product
          </h1>
          <p className="text-gray-600 mt-1 lg:mt-2">
            Create a new fabric product
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
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Premium Cotton Fabric"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="FAB-001"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size/Dimension
              </label>
              <input
                type="text"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="44 inches"
              />
            </div>

            {/* Featured Product Checkbox */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand border-gray-300 rounded focus:ring-brand focus:ring-2"
                />
                <label
                  htmlFor="isFeatured"
                  className="text-sm font-medium text-gray-700"
                >
                  Feature this product
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Featured products will be highlighted on the homepage and in
                featured sections
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                required
                maxLength={240}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Brief description (max 240 characters)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.shortDescription.length}/240 characters
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₦) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
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
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleNumberChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="100"
              />
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {colors.map((color) => (
                <div key={color.value} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => toggleColor(color.value)}
                    className={`w-full py-3 px-4 rounded-lg border-2 transition-all duration-200 ${
                      formData.colors.includes(color.value)
                        ? "border-brand bg-brand/10 text-brand font-medium"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {color.name}
                  </button>
                </div>
              ))}
            </div>
            {formData.colors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Colors:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.colors.map((colorValue) => {
                    const color = colors.find((c) => c.value === colorValue);
                    return (
                      <span
                        key={colorValue}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
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
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Predefined Tags
              </label>
              <button
                type="button"
                onClick={() => setShowTagDropdown(!showTagDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <span className="text-gray-700">Select from popular tags</span>
                {showTagDropdown ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {showTagDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {predefinedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addPredefinedTag(tag)}
                      disabled={formData.tags.includes(tag)}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                        formData.tags.includes(tag)
                          ? "bg-blue-50 text-blue-700 cursor-not-allowed"
                          : "text-gray-700"
                      }`}
                    >
                      {tag}
                      {formData.tags.includes(tag) && (
                        <span className="ml-2 text-xs text-blue-600">
                          ✓ Added
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Custom Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Enter custom tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {formData.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Tags:
                </p>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
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
            )}
          </div>
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
                value={formData.reviewCount}
                onChange={handleNumberChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="24"
              />
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
                Uploaded Images ({uploadedFiles.length})
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
                        className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
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
                        {formatFileSize(file.size)}
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

        <div className="flex gap-2 lg:gap-4 justify-between lg:justify-end">
          <button
            type="button"
            onClick={() => router.push("/dashboard/products")}
            disabled={submitting}
            className="w-full lg:w-auto px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              submitting ||
              uploadedFiles.some(
                (file) =>
                  file.status === "uploading" || file.status === "pending"
              )
            }
            className="w-full lg:w-auto px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              "Create Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default withDashboardLayout(CreateProductPage);
