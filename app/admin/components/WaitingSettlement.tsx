"use client";

type WaitingSettlementProps = {
  waitingForSettlementPayouts: any[];
};

export default function WaitingSettlement({
  waitingForSettlementPayouts,
}: WaitingSettlementProps) {
  return (
    <>
      {/* WAITING FOR SETTLEMENT */}

      <div className="bg-yellow-50 border border-yellow-300 rounded-3xl p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h2 className="text-3xl font-bold text-yellow-700">
              Waiting For Settlement
            </h2>

            <p className="text-gray-600 mt-2">
              Completed bookings where Razorpay has not yet settled the payment.
            </p>
          </div>

          <div className="bg-yellow-500 text-white px-5 py-3 rounded-2xl font-bold">
            {waitingForSettlementPayouts.length} Waiting
          </div>

        </div>

        {waitingForSettlementPayouts.length === 0 ? (

          <p className="text-gray-500">
            No payouts are waiting for settlement.
          </p>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full bg-white rounded-2xl overflow-hidden">

              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left">Booking</th>
                  <th className="p-4 text-left">Owner</th>
                  <th className="p-4 text-left">Parking</th>
                  <th className="p-4 text-left">Amount</th>
                  <th className="p-4 text-left">Settlement</th>
                  <th className="p-4 text-left">Payout Status</th>
                </tr>
              </thead>

              <tbody>

                {waitingForSettlementPayouts.map((payment) => (

                  <tr
                    key={payment.id}
                    className="border-b"
                  >

                    <td className="p-4">
                      <p className="font-bold">
                        {payment.bookingId || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {payment.customerName || ""}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold">
                        {payment.ownerName || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {payment.ownerPhone || ""}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="font-bold">
                        {payment.parkingTitle || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {payment.parkingId || ""}
                      </p>
                    </td>

                    <td className="p-4 font-bold text-blue-700">
                      ₹
                      {Number(
                        payment.ownerReceivableAmount || 0
                      )}
                    </td>

                    <td className="p-4">
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold">
                        {payment.settlementStatus || "Pending"}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-bold">
                        ⏳ Waiting
                      </span>
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>
    </>
  );
}