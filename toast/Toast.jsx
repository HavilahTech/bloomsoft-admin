import { CheckCircle, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

const icons = {
  success: (
    <CheckCircle
      className="w-5 h-5"
      style={{ color: "#22c55e", marginRight: "12px" }}
    />
  ), // green-500
  error: (
    <XCircle
      className="w-5 h-5"
      style={{ color: "#ef4444", marginRight: "12px" }}
    />
  ), // red-500
  info: (
    <Info
      className="w-5 h-5"
      style={{ color: "#3b82f6", marginRight: "12px" }}
    />
  ), // blue-500
  warning: (
    <AlertTriangle
      className="w-5 h-5"
      style={{ color: "#eab308", marginRight: "12px" }}
    />
  ), // yellow-500
};

const bg = {
  success: "#f0fdf4", // green-50
  error: "#fef2f2", // red-50
  info: "#eff6ff", // blue-50
  warning: "#fefce8", // yellow-50
};

const barColors = {
  success: "#22c55e", // green-500
  error: "#ef4444", // red-500
  info: "#3b82f6", // blue-500
  warning: "#eab308", // yellow-500
};

export function Toast({ type, title, message }) {
  const [width, setWidth] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setWidth((w) => (w > 0 ? w - 2.5 : 0));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{ backgroundColor: bg[type] || "#fff" }}
      className="relative p-4 rounded-lg shadow-md animate-fade-in transition-all duration-300"
    >
      <div className="flex items-start">
        {icons[type]}
        <div className="flex-1">
          <p className="font-semibold">{title}</p>
          {message && <p className="text-sm mt-1">{message}</p>}
        </div>
        <X className="w-4 h-4 text-gray-500 cursor-pointer mt-1" />
      </div>
      <div
        style={{
          width: `${width}%`,
          backgroundColor: barColors[type] || "#999",
        }}
        className="absolute bottom-0 right-0 h-1 transition-all duration-100 origin-right"
      />
    </div>
  );
}
