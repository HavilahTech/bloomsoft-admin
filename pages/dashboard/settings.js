"use client";

import { useState, useEffect } from "react";
import withDashboardLayout from "@/components/withDashboardLayout";
import { Save, Eye, EyeOff, Building, Mail, Phone, Lock } from "lucide-react";
import { useFirebase } from "@/lib/firebaseContext";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useToast } from "@/toast/ToastProvider";

const SettingsPage = () => {
  const { user, userData } = useFirebase();
  const [companyInfo, setCompanyInfo] = useState({
    name: "Foladel Fabrics",
    email: "folakeomopo@gmail.com",
    phone: "08138842139",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const { addToast } = useToast();

  // Update company info with user data if available
  useEffect(() => {
    if (userData?.email) {
      setCompanyInfo((prev) => ({
        ...prev,
        email: userData.email || prev.email,
      }));
    }
  }, [userData]);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (success) setSuccess("");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast({
        type: "error",
        title: "Error",
        message: "New passwords do not match!",
      });
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addToast({
        type: "error",
        title: "Error",
        message: "New password must be at least 6 characters long!",
      });
      setLoading(false);
      return;
    }

    if (!passwordData.currentPassword) {
      addToast({
        type: "error",
        title: "Error",
        message: "Current password is required!",
      });
      setLoading(false);
      return;
    }

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        userData?.email,
        passwordData.currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);

      // Reset form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      addToast({
        type: "success",
        title: "Success",
        message: "Password changed successfully!",
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess("");
      }, 5000);
    } catch (error) {
      console.error("Password change error:", error);

      // Handle specific Firebase auth errors
      switch (error.code) {
        case "auth/wrong-password":
          addToast({
            type: "error",
            title: "Error",
            message: "Current password is incorrect.",
          });
          break;
        case "auth/weak-password":
          addToast({
            type: "error",
            title: "Error",
            message:
              "New password is too weak. Please choose a stronger password.",
          });
          break;
        case "auth/requires-recent-login":
          addToast({
            type: "error",
            title: "Error",
            message:
              "For security reasons, please log in again before changing your password.",
          });
          break;
        case "auth/network-request-failed":
          addToast({
            type: "error",
            title: "Error",
            message:
              "Network error. Please check your internet connection and try again.",
          });
          break;
        default:
          addToast({
            type: "error",
            title: "Error",
            message: "Failed to change password. Please try again.",
          });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your company profile and account settings
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Company Profile */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Company Profile
            </h2>
          </div>

          <div className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyInfo.name}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-not-allowed"
                />
                <Building className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={companyInfo.email}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-not-allowed"
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={companyInfo.phone}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-not-allowed"
                />
                <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                Contact technical support to update company information.
              </p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Lock className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Change Password
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Password Requirements
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      passwordData.newPassword.length >= 6
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  At least 6 characters long
                </li>
                <li className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      passwordData.newPassword ===
                        passwordData.confirmPassword &&
                      passwordData.newPassword.length > 0
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  New passwords must match
                </li>
                <li className="flex items-center gap-2">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      passwordData.currentPassword.length > 0
                        ? "bg-green-500"
                        : "bg-gray-300"
                    }`}
                  />
                  Current password is required
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Changing Password...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default withDashboardLayout(SettingsPage);
