"use client";

import { useState } from "react";

import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";

type EligiblePayoutsProps = {
  eligiblePayouts: any[];
};

export default function EligiblePayouts({
  eligiblePayouts,
}: EligiblePayoutsProps) {
  const [payoutReferences, setPayoutReferences] =
    useState<Record<string, string>>({});

  const [processingPayoutId, setProcessingPayoutId] =
    useState<string | null>(null);

  const formatAmount = (amount: unknown) => {
    return Number(amount || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  const processOwnerPayout = async (
    payment: any
  ) => {
    if (
      processingPayoutId === payment.id
    ) {
      return;
    }

    const payoutReference =
      payoutReferences[payment.id]?.trim();

    if (!payoutReference) {
      alert(
        "Enter the bank UTR or transaction reference number."
      );

      return;
    }

    if (
      payment.ownerPayoutStatus !==
        "Eligible" ||
      payment.eligibleForPayout !== true ||
      payment.settlementStatus !==
        "Settled"
    ) {
      alert(
        "This payout is no longer eligible for processing."
      );

      return;
    }

    const bookingDocumentId =
      payment.bookingDocumentId ||
      payment.bookingDocId ||
      payment.bookingFirestoreId ||
      "";

    if (!bookingDocumentId) {
      alert(
        "The linked booking document ID is missing."
      );

      return;
    }

    const payoutAmount = Number(
      payment.ownerReceivableAmount || 0
    );

    if (
      !Number.isFinite(payoutAmount) ||
      payoutAmount <= 0
    ) {
      alert(
        "The owner payout amount is invalid."
      );

      return;
    }

    const confirmPayment = confirm(
      `Release ₹${formatAmount(
        payoutAmount
      )} to ${
        payment.ownerName || "the owner"
      }?\n\nReference: ${payoutReference}`
    );

    if (!confirmPayment) {
      return;
    }

    try {
      setProcessingPayoutId(payment.id);

      const auth = getAuth();
      const currentAdmin =
        auth.currentUser;

      if (!currentAdmin) {
        alert(
          "Admin session not found. Please log in again."
        );

        return;
      }

      const batch = writeBatch(db);

      const paymentReference = doc(
        db,
        "payments",
        payment.id
      );

      const bookingReference = doc(
        db,
        "bookings",
        bookingDocumentId
      );

      const payoutHistoryReference = doc(
        collection(db, "ownerPayouts")
      );

      /*
       * UPDATE PAYMENT DOCUMENT
       */

      batch.update(paymentReference, {
        ownerPayoutStatus: "Paid",
        eligibleForPayout: false,

        ownerPayoutReference:
          payoutReference,

        paymentReference:
          payoutReference,

        ownerPaidAt: serverTimestamp(),
        ownerPaidDate: serverTimestamp(),

        payoutProcessedBy:
          currentAdmin.uid,

        payoutProcessedByEmail:
          currentAdmin.email || "",

        updatedAt: serverTimestamp(),
      });

      /*
       * UPDATE BOOKING DOCUMENT
       */

      batch.update(bookingReference, {
        ownerPayoutStatus: "Paid",
        eligibleForPayout: false,

        ownerPayoutReference:
          payoutReference,

        paymentReference:
          payoutReference,

        ownerPaidAt: serverTimestamp(),
        ownerPaidDate: serverTimestamp(),

        payoutProcessedBy:
          currentAdmin.uid,

        payoutProcessedByEmail:
          currentAdmin.email || "",

        updatedAt: serverTimestamp(),
      });

      /*
       * CREATE PERMANENT PAYOUT HISTORY
       */

      batch.set(
        payoutHistoryReference,
        {
          payoutId:
            payoutHistoryReference.id,

          paymentDocumentId:
            payment.id,

          bookingDocumentId,

          bookingId:
            payment.bookingId || "",

          customerUid:
            payment.customerUid || "",

          customerId:
            payment.customerId || "",

          customerName:
            payment.customerName || "",

          ownerUid:
            payment.ownerUid || "",

          ownerId:
            payment.ownerId || "",

          ownerName:
            payment.ownerName || "",

          ownerEmail:
            payment.ownerEmail || "",

          ownerPhone:
            payment.ownerPhone || "",

          parkingId:
            payment.parkingId || "",

          parkingTitle:
            payment.parkingTitle || "",

          parkingLocation:
            payment.parkingLocation || "",

          ownerPayoutAmount:
            payoutAmount,

          payoutReference,

          paymentReference:
            payoutReference,

          payoutStatus: "Paid",

          settlementStatus:
            payment.settlementStatus ||
            "Settled",

          settlementId:
            payment.settlementId || "",

          settlementUtr:
            payment.settlementUtr || "",

          razorpayPaymentId:
            payment.razorpayPaymentId ||
            "",

          razorpayOrderId:
            payment.razorpayOrderId || "",

          payoutProcessedBy:
            currentAdmin.uid,

          payoutProcessedByEmail:
            currentAdmin.email || "",

          paidAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      /*
       * EXECUTE ALL OPERATIONS TOGETHER
       */

      await batch.commit();

      setPayoutReferences(
        (current) => {
          const updated = {
            ...current,
          };

          delete updated[payment.id];

          return updated;
        }
      );

      alert(
        "Owner payout marked as paid successfully."
      );
    } catch (error: any) {
      console.error(
        "Owner payout processing error:",
        error
      );

      alert(
        error?.message ||
          "Unable to complete the owner payout."
      );
    } finally {
      setProcessingPayoutId(null);
    }
  };

  return (
    <div className="bg-green-50 border border-green-300 rounded-3xl p-8">
      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-green-700">
            Eligible For Payout
          </h2>

          <p className="text-gray-600 mt-2">
            Settlement received and owner
            payment can now be released.
          </p>
        </div>

        <div className="bg-green-600 text-white px-5 py-3 rounded-2xl font-bold">
          {eligiblePayouts.length} Eligible
        </div>
      </div>

      {/* EMPTY STATE */}

      {eligiblePayouts.length === 0 ? (
        <div className="bg-white border border-green-200 rounded-2xl p-8 text-center">
          <p className="text-gray-500 font-medium">
            No owner payouts are currently
            eligible.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] bg-white rounded-2xl overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-4 text-left">
                  Booking
                </th>

                <th className="p-4 text-left">
                  Owner
                </th>

                <th className="p-4 text-left">
                  Parking
                </th>

                <th className="p-4 text-left">
                  Owner Receives
                </th>

                <th className="p-4 text-left">
                  Settlement
                </th>

                <th className="p-4 text-left">
                  Payout Reference
                </th>

                <th className="p-4 text-left">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {eligiblePayouts.map(
                (payment) => {
                  const isProcessing =
                    processingPayoutId ===
                    payment.id;

                  const payoutReference =
                    payoutReferences[
                      payment.id
                    ] || "";

                  return (
                    <tr
                      key={payment.id}
                      className="border-b align-top"
                    >
                      {/* BOOKING */}

                      <td className="p-4">
                        <p className="font-bold">
                          {payment.bookingId ||
                            "N/A"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {payment.customerName ||
                            ""}
                        </p>

                        <p className="text-xs text-gray-400 break-all mt-1">
                          {payment.bookingDocumentId ||
                            payment.bookingDocId ||
                            ""}
                        </p>
                      </td>

                      {/* OWNER */}

                      <td className="p-4">
                        <p className="font-bold">
                          {payment.ownerName ||
                            "N/A"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {payment.ownerPhone ||
                            ""}
                        </p>

                        <p className="text-sm text-gray-500 break-all">
                          {payment.ownerEmail ||
                            ""}
                        </p>
                      </td>

                      {/* PARKING */}

                      <td className="p-4">
                        <p className="font-bold">
                          {payment.parkingTitle ||
                            "N/A"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {payment.parkingId ||
                            ""}
                        </p>

                        <p className="text-sm text-gray-500">
                          {payment.parkingLocation ||
                            ""}
                        </p>
                      </td>

                      {/* AMOUNT */}

                      <td className="p-4">
                        <p className="font-bold text-green-700 text-lg">
                          ₹
                          {formatAmount(
                            payment.ownerReceivableAmount
                          )}
                        </p>
                      </td>

                      {/* SETTLEMENT */}

                      <td className="p-4">
                        <p className="font-bold text-green-700">
                          Settled
                        </p>

                        <p className="text-xs text-gray-500 break-all mt-1">
                          Settlement ID:
                          <br />
                          {payment.settlementId ||
                            "Unavailable"}
                        </p>

                        {payment.settlementUtr && (
                          <p className="text-xs text-gray-500 break-all mt-2">
                            Settlement UTR:
                            <br />
                            {
                              payment.settlementUtr
                            }
                          </p>
                        )}
                      </td>

                      {/* REFERENCE INPUT */}

                      <td className="p-4">
                        <input
                          type="text"
                          value={
                            payoutReference
                          }
                          disabled={
                            isProcessing
                          }
                          onChange={(event) =>
                            setPayoutReferences(
                              (current) => ({
                                ...current,

                                [payment.id]:
                                  event.target
                                    .value,
                              })
                            )
                          }
                          placeholder="Enter bank UTR / reference"
                          className="w-64 border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                        />

                        <p className="text-xs text-gray-500 mt-2">
                          Enter the reference
                          received after transferring
                          money to the owner.
                        </p>
                      </td>

                      {/* ACTION */}

                      <td className="p-4">
                        <button
                          type="button"
                          disabled={
                            isProcessing ||
                            !payoutReference.trim()
                          }
                          onClick={() =>
                            processOwnerPayout(
                              payment
                            )
                          }
                          className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Release Payment"}
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}