"use client";

type PaymentsProps = {
  paymentsCount: number;
  totalCustomerPayments: number;
  totalPlatformRevenue: number;
  pendingRefundCount: number;
  refundHistoryCount: number;
  pendingOwnerPayments: number;
};

export default function Payments({
  paymentsCount,
  totalCustomerPayments,
  totalPlatformRevenue,
  pendingRefundCount,
  refundHistoryCount,
  pendingOwnerPayments,
}: PaymentsProps) {
  return (
    <>
      <p className="text-gray-500 mb-4">
        Payments collection records: {paymentsCount}
      </p>

      {/* PAYMENT SUMMARY */}

      <div className="grid md:grid-cols-4 gap-6 mb-10">

        <div className="bg-green-100 p-6 rounded-3xl">
          <p className="text-gray-600">
            Customer Payments
          </p>

          <h2 className="text-3xl font-bold text-green-700">
            ₹{totalCustomerPayments}
          </h2>
        </div>

        <div className="bg-blue-100 p-6 rounded-3xl">
          <p className="text-gray-600">
            Platform Revenue
          </p>

          <h2 className="text-3xl font-bold text-blue-700">
            ₹{totalPlatformRevenue}
          </h2>
        </div>

        <div className="bg-red-100 p-6 rounded-3xl">
          <p className="text-gray-600">
            Pending Refunds
          </p>

          <h2 className="text-3xl font-bold text-red-700">
            {pendingRefundCount}
          </h2>
        </div>

        <div className="bg-purple-100 p-6 rounded-3xl">
          <p className="text-gray-600">
            Refund History
          </p>

          <h2 className="text-3xl font-bold text-purple-700">
            {refundHistoryCount}
          </h2>
        </div>

        <div className="bg-yellow-100 p-6 rounded-3xl">
          <p className="text-gray-600">
            Pending Owner Payout
          </p>

          <h2 className="text-3xl font-bold text-yellow-700">
            ₹{pendingOwnerPayments}
          </h2>
        </div>

      </div>
    </>
  );
}