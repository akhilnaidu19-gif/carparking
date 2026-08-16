"use client";

type PaidHistoryProps = {
  paidPayouts: any[];
};

export default function PaidHistory({
  paidPayouts,
}: PaidHistoryProps) {
  return (
    <>
      {/* PAID PAYOUT HISTORY */}

      <div className="bg-blue-50 border border-blue-300 rounded-3xl p-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h2 className="text-3xl font-bold text-blue-700">
              Paid Payout History
            </h2>

            <p className="text-gray-600 mt-2">
              Completed owner payouts and transaction references.
            </p>
          </div>

          <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold">
            {paidPayouts.length} Paid
          </div>

        </div>

        {paidPayouts.length === 0 ? (

          <p className="text-gray-500">
            No completed owner payouts found.
          </p>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full bg-white rounded-2xl overflow-hidden">

              <thead>
                <tr className="bg-gray-100">
                  <th className="p-4 text-left">Booking</th>
                  <th className="p-4 text-left">Owner</th>
                  <th className="p-4 text-left">Amount</th>
                  <th className="p-4 text-left">Reference</th>
                  <th className="p-4 text-left">Paid On</th>
                  <th className="p-4 text-left">Settlement ID</th>
                </tr>
              </thead>

              <tbody>

                {paidPayouts.map((payment) => (

                  <tr
                    key={payment.id}
                    className="border-b"
                  >

                    <td className="p-4">
                      <p className="font-bold">
                        {payment.bookingId || "N/A"}
                      </p>

                      <p className="text-sm text-gray-500">
                        {payment.parkingTitle || ""}
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

                    <td className="p-4 font-bold text-blue-700">
                      ₹
                      {Number(
                        payment.ownerReceivableAmount || 0
                      )}
                    </td>

                    <td className="p-4 font-mono text-sm">
                      {payment.ownerPayoutReference ||
                        payment.paymentReference ||
                        "-"}
                    </td>

                    <td className="p-4">
                      {payment.ownerPaidAt?.seconds
                        ? new Date(
                            payment.ownerPaidAt.seconds * 1000
                          ).toLocaleString()
                        : payment.ownerPaidAt
                        ? new Date(
                            payment.ownerPaidAt
                          ).toLocaleString()
                        : payment.ownerPaidDate
                        ? new Date(
                            payment.ownerPaidDate?.seconds
                              ? payment.ownerPaidDate.seconds * 1000
                              : payment.ownerPaidDate
                          ).toLocaleString()
                        : "N/A"}
                    </td>

                    <td className="p-4 break-all text-sm">
                      {payment.settlementId || "N/A"}
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