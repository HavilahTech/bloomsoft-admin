"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Toast } from "./Toast";
import { nanoid } from "nanoid";

const ToastContext = createContext({
  addToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = nanoid();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: "16px", // Tailwind top-4
          right: "16px", // Tailwind right-4
          zIndex: 50, // Tailwind z-50
          display: "flex",
          flexDirection: "column",
          gap: "12px", // Tailwind space-y-3
          maxWidth: "24rem", // Tailwind max-w-sm
          width: "90%", // Tailwind w-[90%]
          boxSizing: "border-box",
        }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
