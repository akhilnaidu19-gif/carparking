"use client";

import {
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type RefundRequestsProps = {
  pendingRefunds: any[];
  visibleRefunds: any[];
  showAllRefunds: boolean;
  setShowAllRefunds: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

export default function RefundRequests({
  pendingRefunds,
  visibleRefunds,
  showAllRefunds,
  setShowAllRefunds,
}: RefundRequestsProps) {
  return (
    <>
       {/* REFUND REQUESTS */}

    <div className="bg-red-50 border border-red-300 rounded-3xl p-8 mb-12">

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-red-700">
          Refund Requests
        </h2>

        <div className="bg-red-600 text-white px-5 py-3 rounded-2xl font-bold">
          {pendingRefunds.length} Pending
        </div>
      </div>

      {pendingRefunds.length === 0 ? (
        <p className="text-gray-500">
          No refund requests pending.
        </p>
      ) : (
        <>
          <div className="grid gap-6">
            {visibleRefunds.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border rounded-3xl p-6"
              >
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-2xl font-bold">
                      Booking: {booking.bookingId}
                    </h3>
                    <p className="text-gray-500">
                      Cancelled On:{" "}
                      {booking.cancelledAt?.seconds
                        ? new Date(booking.cancelledAt.seconds * 1000).toLocaleString()
                        : booking.cancelledAt
                        ? new Date(booking.cancelledAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>

                  <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl font-bold">
                    {booking.refundStatus || "Pending"}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-6">

                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-bold text-blue-700 mb-3">
                      👤 Customer Details
                    </h4>
                    <p><b>Name:</b> {booking.customerName || "N/A"}</p>
                    <p><b>Phone:</b> {booking.customerPhone || "N/A"}</p>
                    <p><b>Email:</b> {booking.customerEmail || "N/A"}</p>
                    <p><b>Customer ID:</b> {booking.customerId || "N/A"}</p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-bold text-purple-700 mb-3">
                      🅿️ Parking Details
                    </h4>
                    <p><b>Parking:</b> {booking.parkingTitle || "N/A"}</p>
                    <p><b>Parking ID:</b> {booking.parkingId || "N/A"}</p>
                    <p><b>Owner:</b> {booking.ownerName || "N/A"}</p>
                    <p><b>Plan:</b> {booking.plan || "N/A"}</p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-bold text-green-700 mb-3">
                      💰 Refund Details
                    </h4>
                    <p>
  <b>Customer Paid:</b>{" "}
  ₹{Number(
    booking.customerPaidAmount ??
    booking.amount ??
    0
  ).toLocaleString("en-IN")}
</p>

<p>
  <b>Parking Amount:</b>{" "}
  ₹{Number(
    booking.parkingAmount ??
    booking.ownerReceivableAmount ??
    0
  ).toLocaleString("en-IN")}
</p>

<p>
  <b>Platform Fee:</b>{" "}
  ₹{Number(
    booking.platformFeeAmount ??
    (
      Number(booking.amount ?? 0) -
      Number(booking.ownerReceivableAmount ?? 0)
    )
  ).toLocaleString("en-IN")}
</p>
                    <p className="break-all mt-2">
  <b>Payment ID:</b>{" "}
  {booking.razorpayPaymentId ||
    "Not Available"}
</p>

<p className="break-all">
  <b>Refund ID:</b>{" "}
  {booking.razorpayRefundId ||
    "Not Generated"}
</p>



<p className="break-all">
  <b>Order ID:</b>{" "}
  {booking.razorpayOrderId || "Not Available"}
</p>
                 <p className="text-red-600 font-bold">
  Refund Amount: ₹{Number(
    booking.refundAmount ??
    booking.parkingAmount ??
    booking.ownerReceivableAmount ??
    0
  ).toLocaleString("en-IN")}
</p>
                    <p className="text-gray-500 text-sm">
                      Platform fee is non-refundable.
                    </p>
                  </div>

                </div>

                <button
  onClick={async () => {
    const paymentId =
      booking.razorpayPaymentId || "";

const refundAmount = Number(
  booking.refundAmount ??
  booking.parkingAmount ??
  booking.ownerReceivableAmount ??
  0
);

    const bookingDocumentId =
      booking.bookingDocumentId || "";

    if (!paymentId) {
      alert(
        "Razorpay Payment ID is not available. Automatic refund cannot be processed."
      );
      return;
    }

    if (!bookingDocumentId) {
      alert(
        "Linked booking document ID is not available. Refund cannot be synchronized."
      );
      return;
    }

    if (refundAmount <= 0) {
      alert("Invalid refund amount.");
      return;
    }

    const confirmRefund = confirm(
      `Process refund of ₹${refundAmount}?\n\nPlatform fee will not be refunded.`
    );

    if (!confirmRefund) return;

    try {
      // Mark payment transaction as processing
      await updateDoc(
        doc(db, "payments", booking.id),
        {
          refundStatus: "Processing",
          paymentStatus: "Refund Processing",
          refundRequestedAt: new Date(),
          updatedAt: new Date(),
        }
      );

      // Keep booking document synchronized
      await updateDoc(
        doc(db, "bookings", bookingDocumentId),
        {
          refundStatus: "Processing",
          paymentStatus: "Refund Processing",
          refundRequestedAt: new Date(),
        }
      );

      const response = await fetch(
        "/api/refund",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            paymentId,
            amount: refundAmount,
            bookingId:
              booking.bookingId ||
              bookingDocumentId,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        const failureData = {
          refundStatus: "Failed",
          paymentStatus: "Refund Failed",
          refundFailedAt: new Date(),
          refundFailureReason:
            result.message ||
            "Refund failed",
          updatedAt: new Date(),
        };

        await updateDoc(
          doc(db, "payments", booking.id),
          failureData
        );

        await updateDoc(
          doc(db, "bookings", bookingDocumentId),
          {
            refundStatus: "Failed",
            paymentStatus: "Refund Failed",
            refundFailedAt: new Date(),
            refundFailureReason:
              result.message ||
              "Refund failed",
          }
        );

        alert(
          result.message ||
          "Unable to process refund."
        );

        return;
      }

      const refund = result.refund;

      const finalRefundStatus =
        refund.status === "processed"
          ? "Completed"
          : "Processing";

      const finalPaymentStatus =
        refund.status === "processed"
          ? "Refunded"
          : "Refund Processing";

      const paymentRefundData = {
        refundStatus:
          finalRefundStatus,

        paymentStatus:
          finalPaymentStatus,

        refundAmount,

        razorpayRefundId:
          refund.id || "",

        refundPaymentId:
          refund.payment_id ||
          paymentId,

        refundSpeed:
          refund.speed_processed ||
          refund.speed_requested ||
          "normal",

        refundReference:
          refund.id || "",

        refundRequestedAt:
          new Date(),

        refundProcessedAt:
          refund.status === "processed"
            ? new Date()
            : null,

        platformFeeRefunded:
          false,

        refundRemarks:
          "Parking amount refunded through Razorpay. Platform fee was not refunded.",

        updatedAt:
          new Date(),
      };

      // Update payments collection
      await updateDoc(
        doc(db, "payments", booking.id),
        paymentRefundData
      );

      // Update linked booking document
      await updateDoc(
        doc(db, "bookings", bookingDocumentId),
        {
          refundStatus:
            finalRefundStatus,

          paymentStatus:
            finalPaymentStatus,

          refundAmount,

          razorpayRefundId:
            refund.id || "",

          refundPaymentId:
            refund.payment_id ||
            paymentId,

          refundSpeed:
            refund.speed_processed ||
            refund.speed_requested ||
            "normal",

          refundReference:
            refund.id || "",

          refundRequestedAt:
            new Date(),

          refundProcessedAt:
            refund.status === "processed"
              ? new Date()
              : null,

          platformFeeRefunded:
            false,

          refundRemarks:
            "Parking amount refunded through Razorpay. Platform fee was not refunded.",
        }
      );

      alert(
        refund.status === "processed"
          ? `Refund completed successfully.\nRefund ID: ${refund.id}`
          : `Refund initiated successfully.\nRefund ID: ${refund.id}\nCurrent status: ${refund.status}`
      );
    } catch (error: any) {
      console.error(
        "Refund processing error:",
        error
      );

      const errorMessage =
        error?.message ||
        "Unknown refund error";

      await updateDoc(
        doc(db, "payments", booking.id),
        {
          refundStatus: "Failed",
          paymentStatus: "Refund Failed",
          refundFailedAt: new Date(),
          refundFailureReason:
            errorMessage,
          updatedAt: new Date(),
        }
      );

      if (bookingDocumentId) {
        await updateDoc(
          doc(
            db,
            "bookings",
            bookingDocumentId
          ),
          {
            refundStatus: "Failed",
            paymentStatus: "Refund Failed",
            refundFailedAt:
              new Date(),
            refundFailureReason:
              errorMessage,
          }
        );
      }

      alert(errorMessage);
    }
  }}
  disabled={
    booking.refundStatus ===
      "Processing" ||
    booking.refundStatus ===
      "Completed"
  }
  className={`mt-6 px-6 py-3 rounded-2xl font-bold text-white ${
    booking.refundStatus ===
      "Processing" ||
    booking.refundStatus ===
      "Completed"
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
>
  {booking.refundStatus ===
  "Processing"
    ? "Refund Processing..."
    : booking.refundStatus ===
      "Completed"
    ? "Refund Completed"
    : "Process Refund"}
</button>

              </div>
            ))}
          </div>

          {pendingRefunds.length > 3 && (
            <button
              onClick={() => setShowAllRefunds(!showAllRefunds)}
              className="mt-6 bg-black text-white px-6 py-3 rounded-2xl font-bold"
            >
              {showAllRefunds ? "Show Less" : "View All Refund Requests"}
            </button>
          )}
        </>
      )}

    </div>
    </>
  );
}