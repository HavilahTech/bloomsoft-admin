"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Layers,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Categories",
      href: "/dashboard/categories",
      icon: Layers,
    },
    {
      name: "Products",
      href: "/dashboard/products",
      icon: Package,
    },
    {
      name: "Orders",
      href: "/dashboard/orders",
      icon: ShoppingCart,
    },
    {
      name: "Customers",
      href: "/dashboard/customers",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {

      await signOut(auth);
      router.push("/");
      
    } catch (error) {
      console.error("Logout Error:", error);
      addToast({
        type: "error",
        title: "Logout Failed",
        message: "An error occurred while signing out. Please try again.",
      });
    }
  };

  const toggleSidebar = () => {
    setIsTransitioning(true);
    setIsSidebarOpen(!isSidebarOpen);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white shadow-xl transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 lg:z-auto ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${isSidebarOpen ? "lg:w-64" : "lg:w-20"}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div
            className={`flex items-center p-4 border-b border-gray-200 ${
              isSidebarOpen ? "justify-between" : "justify-center"
            }`}
          >
            {isSidebarOpen && (
              <h1 className="text-lg lg:text-xl font-bold text-brand whitespace-nowrap">
                Blooms Admin
              </h1>
            )}
            <div
              className={`flex items-center ${
                !isSidebarOpen ? "w-full justify-center" : ""
              }`}
            >
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <ChevronLeft
                  className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${
                    !isSidebarOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              <button
                onClick={toggleMobileSidebar}
                className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                  }}
                  className={`flex items-center w-full px-3 py-3 rounded-lg transition-all duration-200 group ${
                    isActive
                      ? "bg-brand text-white"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  } ${!isSidebarOpen ? "justify-center" : ""}`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? "scale-110" : "group-hover:scale-105"
                    }`}
                  />
                  {isSidebarOpen && (
                    <span
                      className={`ml-3 font-medium transition-opacity duration-200 ${
                        isTransitioning ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      {item.name}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200 group ${
                !isSidebarOpen ? "justify-center" : ""
              }`}
            >
              <LogOut className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
              {isSidebarOpen && (
                <span
                  className={`ml-3 font-medium transition-opacity duration-200 ${
                    isTransitioning ? "opacity-0" : "opacity-100"
                  }`}
                >
                  Logout
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={toggleMobileSidebar}
                className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors duration-200 mr-4"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105 cursor-pointer">
                <span className="text-white text-sm font-medium">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
