"use client";

import { useState, useRef } from "react";
import withDashboardLayout from "@/components/withDashboardLayout";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  FileText,
  Upload,
  X,
  Save,
} from "lucide-react";
import { useToast } from "@/toast/ToastProvider";
import { useFirebase } from "@/lib/firebaseContext";
import { handleFileUpload } from "@/lib/upload-helper";

const CategoriesPage = () => {
  const { addToast } = useToast();
  const { categories, products } = useFirebase();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    status: "active",
    image: null,
    imageFile: null,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: "",
  });

  // Calculate product counts for each category
  const getProductCount = (categoryId) => {
    return (products || []).filter((product) => product.category === categoryId)
      .length;
  };

  // Filter categories based on search and status
  const filteredCategories = (categories || [])
    .map((category) => ({
      ...category,
      productCount: getProductCount(category.id),
    }))
    .filter((category) => {
      const matchesSearch =
        category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || category.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

  // API: Create new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      let imageUrl = null;

      // Upload image to Appwrite if exists
      if (newCategory.imageFile) {
        imageUrl = await handleFileUpload(newCategory.imageFile);
        if (!imageUrl) {
          throw new Error("Failed to upload image to server");
        }
      }

      const categoryData = {
        name: newCategory.name,
        description: newCategory.description,
        status: "active", // Always set to active
        image: imageUrl?.toString() || null,
      };

      const response = await fetch("/api/categories/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }

      const result = await response.json();

      addToast({
        type: "success",
        title: "Success",
        message: "Category created successfully!",
      });

      // Reset form and close modal
      setNewCategory({
        name: "",
        description: "",
        status: "active",
        image: null,
        imageFile: null,
      });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating category:", error);
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to create category",
      });
    } finally {
      setModalLoading(false);
    }
  };

  // API: Update category
  const handleEditCategory = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      let imageUrl = selectedCategory.image;

      // Upload new image if changed
      if (selectedCategory.imageFile) {
        imageUrl = await handleFileUpload(selectedCategory.imageFile);
        if (!imageUrl) {
          throw new Error("Failed to upload new image");
        }
      }

      const categoryData = {
        name: selectedCategory.name,
        description: selectedCategory.description,
        status: selectedCategory.status,
        image: imageUrl?.toString() || null,
      };

      const response = await fetch("/api/categories/edit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedCategory.id,
          ...categoryData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update category");
      }

      addToast({
        type: "success",
        title: "Success",
        message: "Category updated successfully!",
      });

      // Close modal
      setShowViewModal(false);
      setSelectedCategory(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating category:", error);
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to update category",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const openDeleteModal = (categoryId, categoryName) => {
    setDeleteModal({
      isOpen: true,
      categoryId,
      categoryName,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      categoryId: null,
      categoryName: "",
    });
  };

  // API: Delete category with product usage check
  const handleDeleteCategory = async () => {
    if (!deleteModal.categoryId) return;

    try {
      // First check if category is being used by any products
      const checkResponse = await fetch(
        `/api/categories/check-usage?categoryId=${deleteModal.categoryId}`
      );

      if (!checkResponse.ok) {
        throw new Error("Failed to check category usage");
      }

      const checkResult = await checkResponse.json();

      if (checkResult.isUsed) {
        addToast({
          type: "error",
          title: "Cannot Delete",
          message: "Category is in use by some products, can't delete!",
        });
        closeDeleteModal();
        return;
      }

      // If not used, proceed with deletion
      const response = await fetch("/api/categories/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: deleteModal.categoryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete category");
      }

      addToast({
        type: "success",
        title: "Success",
        message: "Category deleted successfully!",
      });

      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting category:", error);
      addToast({
        type: "error",
        title: "Error",
        message: error.message || "Failed to delete category",
      });
    }
  };

  // Handle view category details
  const handleViewCategory = (category) => {
    setSelectedCategory({
      ...category,
      imageFile: null, // Reset image file when viewing
    });
    setShowViewModal(true);
    setIsEditing(false);
  };

  // Validate file before setting it
  const validateFile = (file) => {
    const maxSize = 4 * 1024 * 1024; // Updated to 4MB to match dashboard standard
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    
    if (file.size > maxSize) {
      addToast({
        type: "error",
        title: "File too large",
        message: "Image must be smaller than 4MB",
      });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      addToast({
        type: "error",
        title: "Invalid file type",
        message: "Only JPG, PNG, WebP, and SVG files are allowed",
      });
      return false;
    }

    return true;
  };

  // Handle image upload for create modal
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file before proceeding
      if (!validateFile(file)) {
        // Reset the file input
        e.target.value = "";
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setNewCategory((prev) => ({
        ...prev,
        image: imageUrl,
        imageFile: file,
      }));
    }
  };

  // Handle image upload for edit modal
  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && selectedCategory) {
      // Validate file before proceeding
      if (!validateFile(file)) {
        // Reset the file input
        e.target.value = "";
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setSelectedCategory((prev) => ({
        ...prev,
        image: imageUrl,
        imageFile: file,
      }));
    }
  };

  // Remove image
  const removeImage = () => {
    setNewCategory((prev) => ({
      ...prev,
      image: null,
      imageFile: null,
    }));
  };

  // Remove edit image
  const removeEditImage = () => {
    setSelectedCategory((prev) => ({
      ...prev,
      image: null,
      imageFile: null,
    }));
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      active: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Active",
      },
      draft: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Draft",
      },
      archived: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Archived",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Categories
          </h1>
          <p className="text-gray-600 mt-1">Manage your product categories</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Category
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCategories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            {/* Category Image */}
            <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                  <FileText className="w-12 h-12 text-gray-500" />
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {category.name}
                  </h3>
                  <StatusBadge status={category.status} />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSelectedCategory({
                        ...category,
                        imageFile: null,
                      });
                      setShowViewModal(true);
                      setIsEditing(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <Edit className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(category.id, category.name)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {category.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span>{category.productCount} products</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(category.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* View Category Button */}
            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => handleViewCategory(category)}
                className="w-full py-2 text-center text-brand hover:text-brand/90 font-medium text-sm transition-colors"
              >
                View Category
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No categories found
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by creating your first category"}
          </p>
          {searchTerm || statusFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear filters
            </button>
          ) : (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
            >
              Create Category
            </button>
          )}
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Create New Category
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateCategory}>
              <div className="p-6 space-y-4">
                {/* Category Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image
                  </label>
                  <div className="space-y-4">
                    {newCategory.image ? (
                      <div className="relative">
                        <img
                          src={newCategory.image}
                          alt="Category preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG, SVG (Max 4MB)
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.svg"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="e.g., Summer Collection 2024"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Brief description of this category..."
                  />
                </div>

                {/* Status - Hidden but default to active */}
                <input type="hidden" value="active" />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !newCategory.name.trim()}
                  className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalLoading ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Category Modal */}
      {showViewModal && selectedCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Fixed Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? "Edit Category" : "Category Details"}
              </h2>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedCategory(null);
                    setIsEditing(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto">
              {isEditing ? (
                <form onSubmit={handleEditCategory}>
                  <div className="p-6 space-y-4">
                    {/* Category Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Image
                      </label>
                      <div className="space-y-4">
                        {selectedCategory.image ? (
                          <div className="relative">
                            <img
                              src={selectedCategory.image}
                              alt="Category preview"
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={removeEditImage}
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-brand transition-colors cursor-pointer"
                            onClick={() =>
                              document
                                .getElementById("edit-image-input")
                                ?.click()
                            }
                          >
                            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              Click to upload image
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              JPG, PNG, SVG (Max 4MB)
                            </p>
                          </div>
                        )}
                        <input
                          id="edit-image-input"
                          type="file"
                          accept=".jpg,.jpeg,.png,.svg"
                          onChange={handleEditImageUpload}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {/* Category Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={selectedCategory.name}
                        onChange={(e) =>
                          setSelectedCategory((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={selectedCategory.description}
                        onChange={(e) =>
                          setSelectedCategory((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                        Active
                      </div>
                      <input
                        type="hidden"
                        value="active"
                        onChange={(e) =>
                          setSelectedCategory((prev) => ({
                            ...prev,
                            status: "active",
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Fixed Modal Footer for Edit Mode */}
                  <div className="flex gap-3 justify-end p-6 border-t border-gray-200 bg-white sticky bottom-0">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {modalLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Category Image */}
                  <div>
                    {selectedCategory.image ? (
                      <img
                        src={selectedCategory.image}
                        alt={selectedCategory.name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <FileText className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Category Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Category Name
                      </h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedCategory.name}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Status
                      </h3>
                      <StatusBadge status={selectedCategory.status} />
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Products
                      </h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {getProductCount(selectedCategory.id)} items
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Last Updated
                      </h3>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(
                          selectedCategory.updatedAt
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="text-sm font-medium text-gray-500 mb-1">
                        Description
                      </h3>
                      <p className="text-gray-900">
                        {selectedCategory.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Category
              </h2>
              <button
                onClick={closeDeleteModal}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  &quot;{deleteModal.categoryName}&quot;
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withDashboardLayout(CategoriesPage);
