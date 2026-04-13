"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import withDashboardLayout from "@/components/withDashboardLayout";
import { Search, Calendar, User, Phone, MapPin } from "lucide-react";
import Loader from "@/components/utility/Loader";
import { useFirebase } from "@/lib/firebaseContext";
import formatDate from "@/utils/formatDate";

const CustomersPage = () => {
  const router = useRouter();
  const { customers, orders } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Set loading to false once data is available
    if (customers !== undefined) {
      setLoading(false);
    }
  }, [customers]);

  // Calculate order statistics for each customer
  const getCustomerStats = (customerId) => {
    const customerOrders = (orders || []).filter(
      (order) => order.customerId === customerId
    );

    const totalOrders = customerOrders.length;
    const lastOrder =
      customerOrders.length > 0
        ? customerOrders.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          )[0]
        : null;

    return {
      totalOrders,
      lastOrderDate: lastOrder ? lastOrder.createdAt : null,
    };
  };

  // Process customers with their order stats
  const processedCustomers = (customers || []).map((customer) => {
    const stats = getCustomerStats(customer.id);
    return {
      ...customer,
      totalOrders: stats.totalOrders,
      lastOrder: stats.lastOrderDate || customer.lastOrder || null,
      // Ensure we have all required fields with fallbacks
      name: customer.name || customer.displayName || "Unknown Customer",
      email: customer.email || "No email",
      phone: customer.phoneNumber || customer.phone || "No phone",
      address: customer.address || "No address",
      city: customer.city || "Unknown",
      state: customer.state || "Unknown",
      signupDate:
        customer.createdAt ||
        customer.metadata?.creationTime ||
        new Date().toISOString(),
    };
  });

  // Filter customers based on search
  const filteredCustomers = processedCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone &&
        customer.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Customers
          </h1>
          <p className="text-gray-600 mt-1">
            {processedCustomers.length} customer
            {processedCustomers.length !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Customers List - Table for desktop, Cards for mobile */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  Customer
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  Contact
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  Orders
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  Signed Up
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-900">
                  Last Order
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customer.address || "Not available"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <p className="text-gray-900">{customer.email}</p>
                      <p className="text-sm text-gray-500">{customer.phone}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                        customer.totalOrders > 0
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {customer.orderCount} order
                      {customer.orderCount !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {formatDate(customer.lastOrder)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center font-semibold text-lg">
                    {customer?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {customer?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {customer?.address || "Not available"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 truncate">
                    {customer?.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{customer?.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {customer?.orderCount} order
                    {customer?.orderCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {formatDate(customer.createdAt)}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Last order:</span>
                  <span className="text-gray-900">
                    {formatDate(customer.lastOrder)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {customers && customers.length === 0
              ? "No customers yet"
              : "No customers found"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Customers will appear here once they create accounts"}
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

export default withDashboardLayout(CustomersPage);
