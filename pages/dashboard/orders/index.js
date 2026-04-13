"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import withDashboardLayout from "@/components/withDashboardLayout";
import {
  Search,
  Eye,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Printer,
  Package,
  Copy,
  Check,
} from "lucide-react";
import Loader from "@/components/utility/Loader";
import { useFirebase } from "@/lib/firebaseContext";

const OrdersPage = () => {
  const router = useRouter();
  const { orders, products, customers } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  const statusOptions = [
    { value: "all", label: "All Orders", color: "gray" },
    { value: "pending", label: "Pending", color: "yellow" },
    { value: "confirmed", label: "Confirmed", color: "blue" },
    { value: "processing", label: "Processing", color: "purple" },
    { value: "shipped", label: "Shipped", color: "indigo" },
    { value: "delivered", label: "Delivered", color: "green" },
    { value: "cancelled", label: "Cancelled", color: "red" },
    { value: "paid", label: "Paid", color: "green" },
  ];

  useEffect(() => {
    if (orders !== undefined) {
      setLoading(false);
    }
  }, [orders]);

  // Format order ID for display (first 4 chars ... last 4 chars)
  const formatOrderId = (orderId) => {
    if (!orderId) return "N/A";
    if (orderId.length <= 12) return orderId;

    const firstPart = orderId.substring(0, 4);
    const lastPart = orderId.substring(orderId.length - 4);
    return `${firstPart}...${lastPart}`;
  };

  // Copy order ID to clipboard
  const copyOrderId = async (orderId) => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(orderId);

      // Reset after 2 seconds
      setTimeout(() => {
        setCopiedOrderId(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy order ID:", err);
    }
  };

  // Simple date formatter
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Process orders based on the actual nested data structure
  const processedOrders = (orders || []).map((order) => {
    // Extract customer info from the nested structure
    const originalOrder = order.originalOrder;
    const nestedOrder = originalOrder?.orders?.[0];
    const customerInfo = nestedOrder?.customerInfo || order.customerInfo || {};

    // Extract items from nested structure or use top-level
    const orderItems = nestedOrder?.items || order.items || [];

    // Extract total amount from nested structure or use top-level
    const totalAmount =
      nestedOrder?.totalAmount || order.totalAmount || order.total || 0;

    // Extract status from nested structure or use top-level
    const orderStatus = nestedOrder?.status || order.status || "pending";

    // Extract order date from nested structure or use top-level
    const orderDate =
      nestedOrder?.orderDate ||
      nestedOrder?.createdAt ||
      order.orderDate ||
      order.createdAt;

    // Build customer data
    const customerData = {
      firstName: customerInfo.firstName || "Unknown",
      lastName: customerInfo.lastName || "Customer",
      email: customerInfo.email || "No email",
      phone: customerInfo.phone || "No phone",
      address: customerInfo.address || "No address",
      city: customerInfo.city || "",
      state: customerInfo.state || "",
      zipCode: customerInfo.zipCode || "",
    };

    return {
      id:
        order.id ||
        nestedOrder?.id ||
        `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      customer: customerData,
      items: orderItems,
      total: totalAmount,
      status: orderStatus,
      paymentMethod: order.paymentMethod || "unknown",
      orderDate: orderDate,
      estimatedDelivery: order.estimatedDelivery || "",
      trackingNumber: order.trackingNumber || "",
      notes: order.notes || "",
      originalOrder: order,
      nestedOrder: nestedOrder,
    };
  });


  const filteredOrders = processedOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.firstName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.customer.lastName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "shipped":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const handlePrintOrder = (order) => {
    window.print();
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Orders
          </h1>
          <p className="text-gray-600 mt-2">
            {processedOrders.length} order
            {processedOrders.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            <Printer className="w-4 h-4" />
            Print Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
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
                placeholder="Search orders by ID, customer name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredOrders.length} of {processedOrders.length} orders
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-4 font-semibold text-gray-900">
                Order ID
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Customer
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Date
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Items
              </th>
              <th className="text-left p-4 font-semibold text-gray-900">
                Total
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
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2 group">
                    <p className="font-mono font-medium text-gray-900">
                      {formatOrderId(order.id)}
                    </p>
                    <button
                      onClick={() => copyOrderId(order.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy Order ID"
                    >
                      {copiedOrderId === order.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.customer.email}
                    </p>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-gray-900">{formatDate(order.orderDate)}</p>
                </td>
                <td className="p-4">
                  <p className="text-gray-900">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </p>
                  {order.items.length > 0 && (
                    <p className="text-sm text-gray-500">
                      {order.items[0]?.name}
                      {order.items.length > 1 &&
                        ` +${order.items.length - 1} more`}
                    </p>
                  )}
                </td>
                <td className="p-4">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        router.push(`/dashboard/orders/${order.id}`)
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View Order"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePrintOrder(order)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Print Order"
                    >
                      <Printer className="w-4 h-4" />
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
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="font-mono font-medium text-gray-900">
                  {formatOrderId(order.id)}
                </p>
                <button
                  onClick={() => copyOrderId(order.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy Order ID"
                >
                  {copiedOrderId === order.id ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="View Order"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">
                  {order.customer.firstName} {order.customer.lastName}
                </p>
                <p className="text-sm text-gray-500">{order.customer.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Items</p>
                  <p className="font-medium text-gray-900">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() +
                      order.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {processedOrders.length === 0 ? "No orders yet" : "No orders found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Orders will appear here once customers place orders"}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default withDashboardLayout(OrdersPage);
