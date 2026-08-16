import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

type NotificationType =
  | "GENERAL"
  | "BOOKING"
  | "LISTING"
  | "PAYMENT"
  | "REFUND"
  | "PAYOUT"
  | "SUPPORT";

interface NotificationData {
  recipientUid: string;
  recipientRole: "customer" | "owner" | "admin";
  title: string;
  message: string;
  type?: NotificationType;
  relatedId?: string;
}

export async function sendNotification({
  recipientUid,
  recipientRole,
  title,
  message,
  type = "GENERAL",
  relatedId = "",
}: NotificationData) {
  try {
    await addDoc(collection(db, "notifications"), {
      recipientUid,
      recipientRole,
      title,
      message,
      type,
      relatedId,

      read: false,

      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Notification Error:", error);
  }
}