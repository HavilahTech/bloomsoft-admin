import { doc, getDoc, updateDoc } from "firebase/firestore";
import db from "@/lib/firebaseConfig";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        error: "Missing required fields: orderId and status are required",
      });
    }

    // Validate status
    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "paid",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Invalid status value",
      });
    }

    // Get the order document reference
    const orderRef = doc(db, "ORDERS", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const orderData = orderDoc.data();

    // Update the order status
    // Handle both old nested structure and new flat structure
    let updateData = {};

    if (orderData.originalOrder && orderData.originalOrder.orders) {
      // Old nested structure - update the nested order status
      const updatedOrders = orderData.originalOrder.orders.map((order) => ({
        ...order,
        status: status,
        updatedAt: new Date().toISOString(),
      }));

      updateData = {
        "originalOrder.orders": updatedOrders,
        status: status,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // New flat structure - update directly
      updateData = {
        status: status,
        updatedAt: new Date().toISOString(),
      };

      // Also update nested status if it exists
      if (orderData.nestedOrder) {
        updateData["nestedOrder.status"] = status;
        updateData["nestedOrder.updatedAt"] = new Date().toISOString();
      }
    }

    // Perform the update
    await updateDoc(orderRef, updateData);

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      orderId: orderId,
      newStatus: status,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}
