"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import withDashboardLayout from "@/components/withDashboardLayout";
import { Plus, Edit, Trash2, Package, Search, X } from "lucide-react";
import Loader from "@/components/utility/Loader";
import Link from "next/link";
import { useToast } from "@/toast/ToastProvider";
import { useFirebase } from "@/lib/firebaseContext";

const ProductsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    productId: null,
    productName: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { products, categories, loading } = useFirebase();
  const router = useRouter();
  const { addToast } = useToast();

  // Get unique categories from products and combine with available categories
  const productCategories = [
    "all",
    ...new Set(
      products
        .map((product) => product.category)
        .filter(Boolean)
        .concat(categories?.map((cat) => cat.name) || [])
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.shortDescription?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (productId) => {
    router.push(`/dashboard/products/${productId}`);
  };

  const openDeleteModal = (productId, productName) => {
    setDeleteModal({
      isOpen: true,
      productId,
      productName,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      productId: null,
      productName: "",
    });
  };

  const handleDelete = async () => {
    if (!deleteModal.productId) return;

    setDeleteLoading(true);

    try {
      const response = await fetch("/api/products/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: deleteModal.productId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        addToast({
          type: "success",
          title: "Product Deleted",
          message: `"${deleteModal.productName}" has been deleted successfully`,
        });

        closeDeleteModal();
      } else {
        throw new Error(result.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      addToast({
        type: "error",
        title: "Delete Failed",
        message: error.message || "Failed to delete product. Please try again.",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  if (loading.products) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Products
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your fabric products inventory
          </p>
        </div>
        <Link
          href={"/dashboard/products/new"}
          className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors duration-200 mt-4 sm:mt-0"
        >
          <Plus className="w-5 h-5" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              {productCategories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredProducts.length} of {products.length} products
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-semibold text-gray-900">
                Product
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Category
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Price
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Stock
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Rating
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Status
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr
                key={product.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <td className="p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.shortDescription || product.smallText}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {product.category || "Uncategorized"}
                  </span>
                </td>
                <td className="p-4">
                  <p className="font-semibold text-gray-900">
                    ₦{product.price?.toLocaleString()}
                  </p>
                  {product.originalPrice && (
                    <p className="text-sm text-gray-500 line-through">
                      ₦{product.originalPrice?.toLocaleString()}
                    </p>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.quantity > 50
                        ? "bg-green-100 text-green-800"
                        : product.quantity > 10
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.quantity || product.inStock || 0} in stock
                  </span>
                </td>
                <td className="p-4">
                  <StarRating rating={product.rating || 0} />
                  <p className="text-sm text-gray-500 mt-1">
                    {product.reviewCount || 0} reviews
                  </p>
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.status === "publish" || product.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.status === "publish" || product.isActive
                      ? "Published"
                      : "Draft"}
                  </span>
                  {product.isFeatured && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Featured
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(product.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(product.id, product.name)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {product.shortDescription || product.smallText}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(product.id)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openDeleteModal(product.id, product.name)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Category</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                  {product.category || "Uncategorized"}
                </span>
              </div>
              <div>
                <p className="text-gray-600">Price</p>
                <p className="font-semibold text-gray-900 mt-1">
                  ₦{product.price?.toLocaleString()}
                </p>
                {product.originalPrice && (
                  <p className="text-xs text-gray-500 line-through">
                    ₦{product.originalPrice?.toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <p className="text-gray-600">Stock</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    product.quantity > 50
                      ? "bg-green-100 text-green-800"
                      : product.quantity > 10
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.quantity || product.inStock || 0}
                </span>
              </div>
              <div>
                <p className="text-gray-600">Rating</p>
                <div className="mt-1">
                  <StarRating rating={product.rating || 0} />
                  <p className="text-xs text-gray-500">
                    {product.reviewCount || 0} reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Status and Featured for Mobile */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  product.status === "publish" || product.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {product.status === "publish" || product.isActive
                  ? "Published"
                  : "Draft"}
              </span>
              {product.isFeatured && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Featured
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {products.length === 0
              ? "No products available"
              : "No products found matching your criteria"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Delete Product
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
                  "{deleteModal.productName}"
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Product"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default withDashboardLayout(ProductsPage);