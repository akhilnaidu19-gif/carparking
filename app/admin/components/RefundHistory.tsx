"use client";

type RefundHistoryProps = {
  refundHistory: any[];
  visibleRefundHistory: any[];
  showAllRefundHistory: boolean;
  setShowAllRefundHistory: React.Dispatch<
    React.SetStateAction<boolean>
  >;
};

export default function RefundHistory({
  refundHistory,
  visibleRefundHistory,
  showAllRefundHistory,
  setShowAllRefundHistory,
}: RefundHistoryProps) {
  return (
    <>
       {/* REFUND HISTORY */}

<div className="bg-purple-50 border border-purple-300 rounded-3xl p-8 mb-12">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-3xl font-bold text-purple-700">
      Refund History
    </h2>

    <div className="bg-purple-600 text-white px-5 py-3 rounded-2xl font-bold">
      {refundHistory.length} Refunds
    </div>

  </div>

  {refundHistory.length === 0 ? (

    <p className="text-gray-500">
      No processed refunds found.
    </p>

  ) : (

    <>

      <div className="overflow-x-auto">

        <table className="w-full bg-white rounded-2xl overflow-hidden">

          <thead>

            <tr className="bg-gray-100">

              <th className="p-4 text-left">
                Booking
              </th>

              <th className="p-4 text-left">
                Customer
              </th>

              <th className="p-4 text-left">
                Payment ID
              </th>

              <th className="p-4 text-left">
                Refund ID
              </th>

              <th className="p-4 text-left">
                Amount
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Processed On
              </th>

            </tr>

          </thead>

          <tbody>

            {visibleRefundHistory.map((booking) => (

              <tr
                key={booking.id}
                className="border-b"
              >

                <td className="p-4">

                  <p className="font-bold">
                    {booking.bookingId || "N/A"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {booking.parkingTitle || ""}
                  </p>

                </td>

                <td className="p-4">

                  <p className="font-bold">
                    {booking.customerName || "N/A"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {booking.customerPhone || ""}
                  </p>

                </td>

                <td className="p-4 break-all text-sm">

                  {booking.razorpayPaymentId ||
                    booking.refundPaymentId ||
                    "Not Available"}

                </td>

                <td className="p-4 break-all text-sm">

                  {booking.razorpayRefundId ||
                    booking.refundReference ||
                    "Not Available"}

                </td>

                <td className="p-4 font-bold text-red-600">

                  ₹{booking.refundAmount ||
                    booking.parkingAmount ||
                    0}

                </td>

                <td className="p-4">

                  <span
                    className={`px-3 py-1 rounded-full font-bold ${
                      booking.refundStatus === "Completed"
                        ? "bg-green-100 text-green-700"
                        : booking.refundStatus === "Failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >

                    {booking.refundStatus ||
                      booking.paymentStatus ||
                      "Unknown"}

                  </span>

                </td>

                <td className="p-4">

                  {booking.refundProcessedAt?.seconds
                    ? new Date(
                        booking.refundProcessedAt.seconds *
                          1000
                      ).toLocaleString()
                    : booking.refundCompletedAt?.seconds
                    ? new Date(
                        booking.refundCompletedAt.seconds *
                          1000
                      ).toLocaleString()
                    : booking.refundProcessedAt
                    ? new Date(
                        booking.refundProcessedAt
                      ).toLocaleString()
                    : booking.refundCompletedAt
                    ? new Date(
                        booking.refundCompletedAt
                      ).toLocaleString()
                    : booking.refundRequestedAt?.seconds
                    ? new Date(
                        booking.refundRequestedAt.seconds *
                          1000
                      ).toLocaleString()
                    : "N/A"}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {refundHistory.length > 5 && (

        <button
          onClick={() =>
            setShowAllRefundHistory(
              !showAllRefundHistory
            )
          }
          className="mt-6 bg-black text-white px-6 py-3 rounded-2xl font-bold"
        >

          {showAllRefundHistory
            ? "Show Less"
            : "View All Refund History"}

        </button>

      )}

    </>

  )}

</div>
    </>
  );
}