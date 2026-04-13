"use client";

import { useState, useEffect } from "react";
import withDashboardLayout from "@/components/withDashboardLayout";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import Loader from "@/components/utility/Loader";
import { useFirebase } from "@/lib/firebaseContext";
import { useRouter } from "next/router";

const AdminDashboard = () => {
  const router = useRouter();
  const { products, orders, customers, loading } = useFirebase();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProducts: 0,
      totalOrders: 0,
      totalCustomers: 0,
      totalRevenue: 0,
      monthlyGrowth: 0,
      conversionRate: 0,
    },
    recentOrders: [],
    recentProducts: [],
    recentCustomers: [],
  });

  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Calculate dashboard data from Firebase collections
  useEffect(() => {
    if (!loading.products && !loading.orders && !loading.customers) {
      // Calculate total revenue from completed orders
      const totalRevenue = orders
        .filter(
          (order) =>
            order.status === "completed" || order.status === "processing"
        )
        .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      // Get recent orders (last 5)
      const recentOrders = orders
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5)
        .map((order) => ({
          id: order.id,
          customer: order.customerInfo?.name || "Unknown Customer",
          amount: order.totalAmount || 0,
          status: order.status || "pending",
          date: new Date(order.orderDate).toLocaleDateString(),
        }));

      // Get recently added products (last 10)
      const recentProducts = products
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.updatedAt) -
            new Date(a.createdAt || a.updatedAt)
        )
        .slice(0, 10)
        .map((product) => ({
          id: product.id,
          name: product.name || "Unnamed Product",
          price: product.price || 0,
          inStock: product.inStock || 0,
          createdAt: product.createdAt,
        }));

      // Get recently added customers (last 10)
      const recentCustomers = customers
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.lastOrder) -
            new Date(a.createdAt || a.lastOrder)
        )
        .slice(0, 10)
        .map((customer) => ({
          id: customer.id,
          name: customer.name || "Unknown Customer",
          email: customer.email || "No email",
          orderCount: customer.orderCount || 0,
          lastOrder: customer.lastOrder
            ? new Date(customer.lastOrder).toLocaleDateString()
            : "No orders",
        }));

      // Calculate stats
      const completedOrders = orders.filter(
        (order) => order.status === "completed"
      ).length;
      const totalOrdersCount = orders.length;
      const conversionRate =
        totalOrdersCount > 0 ? (completedOrders / totalOrdersCount) * 100 : 0;

      setDashboardData({
        stats: {
          totalProducts: products.length,
          totalOrders: totalOrdersCount,
          totalCustomers: customers.length,
          totalRevenue: totalRevenue,
          monthlyGrowth: calculateMonthlyGrowth(orders),
          conversionRate: parseFloat(conversionRate.toFixed(1)),
        },
        recentOrders,
        recentProducts,
        recentCustomers,
      });

      setDashboardLoading(false);
    }
  }, [products, orders, customers, loading]);

  // Helper function to calculate monthly growth
  const calculateMonthlyGrowth = (orders) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      return (
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear
      );
    }).length;

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthOrders = orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      return (
        orderDate.getMonth() === lastMonth &&
        orderDate.getFullYear() === lastMonthYear
      );
    }).length;

    if (lastMonthOrders === 0) return currentMonthOrders > 0 ? 100 : 0;

    const growth =
      ((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100;
    return parseFloat(growth.toFixed(1));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  const generateReport = () => {
    // Create a simple CSV export
    const csvContent = [
      ["Metric", "Value", "Date"],
      [
        "Total Revenue",
        dashboardData.stats.totalRevenue,
        new Date().toDateString(),
      ],
      [
        "Total Orders",
        dashboardData.stats.totalOrders,
        new Date().toDateString(),
      ],
      [
        "Total Customers",
        dashboardData.stats.totalCustomers,
        new Date().toDateString(),
      ],
      [
        "Conversion Rate",
        dashboardData.stats.conversionRate + "%",
        new Date().toDateString(),
      ],
      [
        "Monthly Growth",
        dashboardData.stats.monthlyGrowth + "%",
        new Date().toDateString(),
      ],
      ...dashboardData.recentOrders.map((order) => [
        `Order ${order.id}`,
        order.customer,
        formatCurrency(order.amount),
        order.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-report-${Date.now()}.csv`;
    a.click();

    addToast({
      type: "success",
      title: "Downloaded",
      message: "CSV Report downloaded",
    });
  };

  if (
    dashboardLoading ||
    loading.products ||
    loading.orders ||
    loading.customers
  ) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={generateReport}
            className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors duration-200"
          >
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(dashboardData.stats.totalRevenue)}
              </p>
              <div className="flex items-center mt-2">
                {dashboardData.stats.monthlyGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span
                  className={`text-sm font-medium ${
                    dashboardData.stats.monthlyGrowth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {dashboardData.stats.monthlyGrowth >= 0 ? "+" : ""}
                  {dashboardData.stats.monthlyGrowth}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  from last month
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(dashboardData.stats.totalOrders)}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">
                  +{dashboardData.stats.conversionRate}%
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  conversion rate
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(dashboardData.stats.totalProducts)}
              </p>
              <div className="flex items-center mt-2">
                <Package className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600 font-medium">
                  {dashboardData.recentProducts.length} new
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  recently added
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Customers
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(dashboardData.stats.totalCustomers)}
              </p>
              <div className="flex items-center mt-2">
                <Users className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600 font-medium">
                  {dashboardData.recentCustomers.length} new
                </span>
                <span className="text-sm text-gray-500 ml-1">
                  recently added
                </span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Orders
              </h3>
              <div className="mt-2 sm:mt-0 flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {dashboardData.recentOrders.length} orders
                </span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {dashboardData.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentOrders.map((order, index) => (
                  <div
                    key={order.id}
                    className="group p-4 rounded-lg border border-gray-200 hover:border-brand hover:shadow-md transition-all duration-200 bg-gradient-to-r from-white to-gray-50/50 hover:from-blue-50/50 hover:to-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      {/* Customer & Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`flex-shrink-0 w-3 h-3 mt-2 rounded-full ${
                              order.status === "delivered"
                                ? "bg-green-500"
                                : order.status === "shipped"
                                ? "bg-purple-500"
                                : order.status === "processing"
                                ? "bg-blue-500"
                                : order.status === "confirmed"
                                ? "bg-teal-500"
                                : "bg-yellow-500" // pending
                            }`}
                          ></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                              <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                                {order.customer}
                              </p>
                              <span className="hidden sm:inline text-gray-300">
                                •
                              </span>
                              <p className="text-sm text-gray-600 mt-1 sm:mt-0">
                                #{order.id.slice(-6)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {/* Mobile: Status Icon + Short Text */}
                              <div className="sm:hidden flex items-center space-x-1">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    order.status === "delivered"
                                      ? "bg-green-500"
                                      : order.status === "shipped"
                                      ? "bg-purple-500"
                                      : order.status === "processing"
                                      ? "bg-blue-500"
                                      : order.status === "confirmed"
                                      ? "bg-teal-500"
                                      : "bg-yellow-500"
                                  }`}
                                ></div>
                                <span className="text-xs font-medium text-gray-700">
                                  {order.status === "pending"
                                    ? "Pending"
                                    : order.status === "confirmed"
                                    ? "Confirmed"
                                    : order.status === "processing"
                                    ? "Processing"
                                    : order.status === "shipped"
                                    ? "Shipped"
                                    : "Delivered"}
                                </span>
                              </div>

                              {/* Desktop: Full Status Badge */}
                              <span
                                className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  order.status === "delivered"
                                    ? "bg-green-100 text-green-800"
                                    : order.status === "shipped"
                                    ? "bg-purple-100 text-purple-800"
                                    : order.status === "processing"
                                    ? "bg-blue-100 text-blue-800"
                                    : order.status === "confirmed"
                                    ? "bg-teal-100 text-teal-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {order.status.charAt(0).toUpperCase() +
                                  order.status.slice(1)}
                              </span>

                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {order.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(order.amount)}
                        </p>
                        <div className="flex items-center space-x-2 mt-2 sm:justify-end">
                          <button
                            onClick={() =>
                              router.push(`/dashboard/orders/${order.id}`)
                            }
                            className="text-xs text-brand hover:text-[#0051A5] font-medium transition-colors duration-200"
                          >
                            View Details
                          </button>
                          <span className="text-gray-300 hidden sm:inline">
                            •
                          </span>
                          <button className="text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors duration-200 hidden sm:inline">
                            Quick Actions
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress indicator for orders - Hidden on mobile, shown on desktop */}
                    {(order.status === "pending" ||
                      order.status === "confirmed" ||
                      order.status === "processing" ||
                      order.status === "shipped") && (
                      <div className="mt-3 pt-3 border-t border-gray-100 hidden sm:block">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Order Progress</span>
                          <span className="font-medium">
                            {order.status === "pending"
                              ? "Awaiting Confirmation"
                              : order.status === "confirmed"
                              ? "Order Confirmed"
                              : order.status === "processing"
                              ? "Preparing Order"
                              : order.status === "shipped"
                              ? "In Transit"
                              : "Completed"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              order.status === "pending"
                                ? "bg-yellow-500 w-1/4"
                                : order.status === "confirmed"
                                ? "bg-teal-500 w-2/4"
                                : order.status === "processing"
                                ? "bg-blue-500 w-3/4"
                                : order.status === "shipped"
                                ? "bg-purple-500 w-4/5"
                                : "bg-green-500 w-full"
                            }`}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span
                            className={
                              order.status !== "pending"
                                ? "text-teal-600 font-medium"
                                : ""
                            }
                          >
                            Pending
                          </span>
                          <span
                            className={
                              order.status === "confirmed" ||
                              order.status === "processing" ||
                              order.status === "shipped" ||
                              order.status === "delivered"
                                ? "text-teal-600 font-medium"
                                : ""
                            }
                          >
                            Confirmed
                          </span>
                          <span
                            className={
                              order.status === "processing" ||
                              order.status === "shipped" ||
                              order.status === "delivered"
                                ? "text-teal-600 font-medium"
                                : ""
                            }
                          >
                            Processing
                          </span>
                          <span
                            className={
                              order.status === "shipped" ||
                              order.status === "delivered"
                                ? "text-teal-600 font-medium"
                                : ""
                            }
                          >
                            Shipped
                          </span>
                          <span
                            className={
                              order.status === "delivered"
                                ? "text-teal-600 font-medium"
                                : ""
                            }
                          >
                            Delivered
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Completed order indicator - Hidden on mobile, shown on desktop */}
                    {order.status === "delivered" && (
                      <div className="mt-3 pt-3 border-t border-gray-100 hidden sm:block">
                        <div className="flex items-center space-x-2 text-green-600">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm font-medium">
                            Order Delivered Successfully
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Completed on {order.date}
                        </p>
                      </div>
                    )}

                    {/* Mobile: Simple status indicator */}
                    <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Status</span>
                        <div className="flex items-center space-x-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              order.status === "delivered"
                                ? "bg-green-500"
                                : order.status === "shipped"
                                ? "bg-purple-500"
                                : order.status === "processing"
                                ? "bg-blue-500"
                                : order.status === "confirmed"
                                ? "bg-teal-500"
                                : "bg-yellow-500"
                            }`}
                          ></div>
                          <span className="text-xs font-medium text-gray-700">
                            {order.status === "pending"
                              ? "Pending"
                              : order.status === "confirmed"
                              ? "Confirmed"
                              : order.status === "processing"
                              ? "Processing"
                              : order.status === "shipped"
                              ? "Shipped"
                              : "Delivered"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No Orders Yet
                </h4>
                <p className="text-gray-500 mb-4 max-w-sm mx-auto">
                  When customers place orders, they'll appear here for you to
                  manage.
                </p>
                <button
                  onClick={() => router.push("/dashboard/orders")}
                  className="bg-brand text-white px-6 py-2 rounded-lg font-medium hover:bg-brand/90 transition-colors duration-200"
                >
                  View All Orders
                </button>
              </div>
            )}

            {/* View All Button - Only show if there are orders */}
            {dashboardData.recentOrders.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => router.push("/dashboard/orders")}
                  className="w-full group flex items-center justify-center space-x-2 text-[#001F3F] hover:text-[#0051A5] font-medium py-3 transition-all duration-200 hover:bg-gray-50 rounded-lg"
                >
                  <span>View All Orders</span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Products & Customers Sidebar */}
        <div className="space-y-6">
          {/* Recently Added Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recently Added Products
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recentProducts.length > 0 ? (
                  dashboardData.recentProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <ShoppingBag className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {product.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {product.inStock} in stock
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No products</p>
                )}
              </div>
              <button className="w-full mt-4 text-[#001F3F] hover:text-[#0051A5] font-medium py-2 transition-colors duration-200">
                View all products →
              </button>
            </div>
          </div>

          {/* Recent Customers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Customers
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dashboardData.recentCustomers.length > 0 ? (
                  dashboardData.recentCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customer.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {customer.orderCount} orders
                        </p>
                        <p className="text-xs text-gray-500">
                          {customer.lastOrder}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No customers</p>
                )}
              </div>
              <button className="w-full mt-4 text-[#001F3F] hover:text-[#0051A5] font-medium py-2 transition-colors duration-200">
                View all customers →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(AdminDashboard);
