"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import withDashboardLayout from "@/components/withDashboardLayout";
import {
  ArrowLeft,
  Package,
  User,
  Phone,
  MapPin,
  Calendar,
  Printer,
  Download,
  Mail,
  Truck,
  ChevronDown,
} from "lucide-react";
import Loader from "@/components/utility/Loader";
import { useFirebase } from "@/lib/firebaseContext";
import { useToast } from "@/toast/ToastProvider";

const OrderDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { orders } = useFirebase();
  const [orderId, setOrderId] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const { addToast } = useToast();

  const statusOptions = [
    { value: "pending", label: "Pending", color: "yellow" },
    { value: "confirmed", label: "Confirmed", color: "blue" },
    { value: "processing", label: "Processing", color: "purple" },
    { value: "shipped", label: "Shipped", color: "indigo" },
    { value: "delivered", label: "Delivered", color: "green" },
    { value: "cancelled", label: "Cancelled", color: "red" },
    { value: "paid", label: "Paid", color: "green" },
  ];

  useEffect(() => {
    // Wait for params to be available
    if (params?.id) {
      setOrderId(params.id);
    }
  }, [params]);

  useEffect(() => {
    if (!orderId || !orders) return;

    // Find the order in the orders collection
    const foundOrder = orders.find((order) => order.id === orderId);

    if (foundOrder) {
      // Process the order data to match the expected structure
      const processedOrder = processOrderData(foundOrder);
      setOrder(processedOrder);
      setSelectedStatus(processedOrder.status);
    }

    setLoading(false);
  }, [orderId, orders]);

  // Process order data from Firestore to match the component structure
  const processOrderData = (orderData) => {
    // Extract customer info from the nested structure
    const originalOrder = orderData.originalOrder;
    const nestedOrder = originalOrder?.orders?.[0];
    const customerInfo =
      nestedOrder?.customerInfo || orderData.customerInfo || {};

    // Extract items from nested structure or use top-level
    const orderItems = nestedOrder?.items || orderData.items || [];

    // Extract total amount from nested structure or use top-level
    const totalAmount =
      nestedOrder?.totalAmount || orderData.totalAmount || orderData.total || 0;

    // Extract status from nested structure or use top-level
    const orderStatus = nestedOrder?.status || orderData.status || "pending";

    // Extract order date from nested structure or use top-level
    const orderDate =
      nestedOrder?.orderDate ||
      nestedOrder?.createdAt ||
      orderData.orderDate ||
      orderData.createdAt;

    // Build customer data
    const customerData = {
      name:
        `${customerInfo.firstName || ""} ${
          customerInfo.lastName || ""
        }`.trim() || "Unknown Customer",
      firstName: customerInfo.firstName || "Unknown",
      lastName: customerInfo.lastName || "Customer",
      email: customerInfo.email || "No email",
      phone: customerInfo.phone || "No phone",
      address: customerInfo.address || "No address",
      city: customerInfo.city || "",
      state: customerInfo.state || "",
      zipCode: customerInfo.zipCode || "",
    };

    // Process items for display
    const processedItems = orderItems.map((item, index) => ({
      id: index + 1,
      name: item.name || "Unknown Product",
      quantity: item.quantity || 1,
      price: item.price || 0,
      total: (item.price || 0) * (item.quantity || 1),
      image: item.image || "",
      sku: item.productId || `SKU-${index + 1}`,
    }));

    return {
      id:
        orderData.id ||
        nestedOrder?.id ||
        `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      customer: customerData,
      items: processedItems,
      total: totalAmount,
      subtotal: totalAmount,
      shipping: 0,
      discount: 0,
      status: orderStatus,
      orderDate: orderDate,
      estimatedDelivery: orderData.estimatedDelivery || "",
      shippedDate: orderData.shippedDate || null,
      deliveredDate: orderData.deliveredDate || null,
      trackingNumber: orderData.trackingNumber || "",
      shippingMethod: orderData.shippingMethod || "standard",
      notes: orderData.notes || "",
      customerNotes: customerInfo.notes || "",
      originalOrder: orderData,
      nestedOrder: nestedOrder,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-indigo-100 text-indigo-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "paid":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (statusValue) => {
    const status = statusOptions.find((opt) => opt.value === statusValue);
    return status ? status.label : statusValue;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      return new Date(dateString).toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === order.status) {
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          status: selectedStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update order status");
      }

      // Update local state
      setOrder((prev) => ({ ...prev, status: selectedStatus }));
      setShowStatusDropdown(false);
      addToast({
        type: "success",
        title: "Status Updated",
        message: `Order status updated to ${selectedStatus}`,
      });
      // console.log(`Order status updated to ${selectedStatus}`);
    } catch (error) {
      // console.error("Error updating order status:", error);
      addToast({
        type: "error",
        title: "Error",
        message: "Failed to update order status. Please try again.",
      });
      // Revert the selected status if update fails
      setSelectedStatus(order.status);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader />;
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Order Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          The order you're looking for doesn't exist.
        </p>
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base lg:text-3xl font-medium lg:font-bold text-gray-900">
              Order #{order.id}
            </h1>
            <p className="text-gray-600 mt-1">
              Placed on {formatDate(order.orderDate)}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Order Status Card */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 lg:mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Order Status
              </h2>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {getStatusLabel(order.status)}
              </span>
            </div>

            {/* Status Update */}
            <div className="space-y-3 lg:space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Update Status
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                      className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                    >
                      <span className="text-sm lg:text-base">
                        {getStatusLabel(selectedStatus)}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>

                    {showStatusDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                        {statusOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSelectedStatus(option.value);
                              setShowStatusDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors text-sm lg:text-base ${
                              selectedStatus === option.value
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={updating || selectedStatus === order.status}
                    className="w-full lg:w-auto px-6 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Status"
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center lg:text-left">
                  Select a new status and click "Update Status" to save changes
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items ({order.items.length})
            </h2>
            <div className="space-y-3 lg:space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 lg:p-4 border border-gray-200 rounded-lg"
                >
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="w-5 h-5 lg:w-8 lg:h-8 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                      {item.name}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right sm:text-left sm:min-w-[100px]">
                    <p className="font-semibold text-gray-900 text-sm lg:text-base">
                      {formatCurrency(item.price)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total: {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="mt-4 lg:mt-6 pt-4 border-t border-gray-200">
              <div className="space-y-2 text-sm lg:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600">
                      -{formatCurrency(order.discount)}
                    </span>
                  </div>
                )}
                {order.shipping > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      {formatCurrency(order.shipping)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 text-base lg:text-lg">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(order.notes || order.customerNotes) && (
            <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Notes
              </h2>
              <div className="space-y-3 lg:space-y-4">
                {order.customerNotes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">
                      Customer Notes
                    </h3>
                    <p className="text-gray-600 bg-yellow-50 p-3 rounded-lg text-sm lg:text-base">
                      {order.customerNotes}
                    </p>
                  </div>
                )}
                {order.notes && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">
                      Internal Notes
                    </h3>
                    <p className="text-gray-600 bg-blue-50 p-3 rounded-lg text-sm lg:text-base">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="space-y-4 lg:space-y-6">
          {/* Customer Information */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Customer Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                    {order.customer.name}
                  </p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                    {order.customer.email}
                  </p>
                  <p className="text-xs text-gray-500">Email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm lg:text-base">
                    {order.customer.phone}
                  </p>
                  <p className="text-xs text-gray-500">Phone</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm lg:text-base break-words">
                    {order.customer.address}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.customer.city}, {order.customer.state}{" "}
                    {order.customer.zipCode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="bg-white p-4 lg:p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Shipping Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm lg:text-base capitalize">
                    {order.shippingMethod}
                  </p>
                  <p className="text-xs text-gray-500">Shipping Method</p>
                </div>
              </div>
              {order.trackingNumber && (
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 lg:w-5 lg:h-5 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm lg:text-base break-all">
                      {order.trackingNumber}
                    </p>
                    <p className="text-xs text-gray-500">Tracking Number</p>
                  </div>
                </div>
              )}
              {order.estimatedDelivery && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm lg:text-base">
                      {formatDate(order.estimatedDelivery)}
                    </p>
                    <p className="text-xs text-gray-500">Estimated Delivery</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(OrderDetailPage);
