import { NextResponse } from "next/server";
import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin environment variables are missing."
    );
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const adminDb = getFirestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentId = String(
      body.paymentId || ""
    ).trim();

    const bookingDocumentId = String(
      body.bookingDocumentId || ""
    ).trim();

    const utr = String(
      body.utr || ""
    ).trim();

    if (!paymentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment ID is required.",
        },
        { status: 400 }
      );
    }

    if (!bookingDocumentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Booking document ID is required.",
        },
        { status: 400 }
      );
    }

    if (!utr) {
      return NextResponse.json(
        {
          success: false,
          message:
            "UTR / transaction reference is required.",
        },
        { status: 400 }
      );
    }

    const paymentRef = adminDb
      .collection("payments")
      .doc(paymentId);

    const bookingRef = adminDb
      .collection("bookings")
      .doc(bookingDocumentId);

    const payoutRef = adminDb
      .collection("ownerPayouts")
      .doc(paymentId);

    const result =
      await adminDb.runTransaction(
        async (transaction) => {

          const paymentSnap =
            await transaction.get(
              paymentRef
            );

          const bookingSnap =
            await transaction.get(
              bookingRef
            );

          const payoutSnap =
            await transaction.get(
              payoutRef
            );

          if (!paymentSnap.exists) {
            throw new Error(
              "Payment record not found."
            );
          }

          if (!bookingSnap.exists) {
            throw new Error(
              "Booking record not found."
            );
          }

          const payment =
            paymentSnap.data() || {};

          const booking =
            bookingSnap.data() || {};

          // Prevent duplicate payout
          if (
            payment.ownerPayoutStatus ===
              "Paid" ||
            payment.eligibleForPayout ===
              false &&
            payment.ownerPaidAt
          ) {
            throw new Error(
              "This owner payout has already been processed."
            );
          }

          // Settlement must be completed
          if (
            payment.settlementStatus !==
            "Settled"
          ) {
            throw new Error(
              "Owner payout cannot be released because the payment is not settled."
            );
          }

          // Booking must be completed
          if (
            booking.bookingStatus !==
            "Completed"
          ) {
            throw new Error(
              "Owner payout cannot be released because the booking is not completed."
            );
          }

          // Payment must be explicitly eligible
          if (
            payment.eligibleForPayout !==
            true ||
            payment.ownerPayoutStatus !==
            "Eligible"
          ) {
            throw new Error(
              "This payment is not currently eligible for owner payout."
            );
          }

          const ownerAmount =
            Number(
              payment.ownerReceivableAmount ||
                0
            );

          if (
            !Number.isFinite(
              ownerAmount
            ) ||
            ownerAmount <= 0
          ) {
            throw new Error(
              "Invalid owner payout amount."
            );
          }

          const paidAt =
            Timestamp.now();

          transaction.update(
            paymentRef,
            {
              ownerPayoutStatus:
                "Paid",

              eligibleForPayout:
                false,

              ownerPaidAt:
                paidAt,

              ownerPaidDate:
                paidAt,

              ownerPayoutReference:
                utr,

              paymentReference:
                utr,

              updatedAt:
                paidAt,
            }
          );

          transaction.update(
            bookingRef,
            {
              ownerPayoutStatus:
                "Paid",

              eligibleForPayout:
                false,

              ownerPaidAt:
                paidAt,

              ownerPaidDate:
                paidAt,

              ownerPayoutReference:
                utr,

              paymentReference:
                utr,

              updatedAt:
                paidAt,
            }
          );

          const payoutData = {
            paymentDocumentId:
              paymentId,

            bookingDocumentId,

            bookingId:
              payment.bookingId ||
              booking.bookingId ||
              "",

            ownerUid:
              payment.ownerUid ||
              "",

            ownerId:
              payment.ownerId ||
              "",

            ownerName:
              payment.ownerName ||
              "",

            ownerEmail:
              payment.ownerEmail ||
              "",

            ownerPhone:
              payment.ownerPhone ||
              "",

            parkingId:
              payment.parkingId ||
              "",

            parkingTitle:
              payment.parkingTitle ||
              "",

            ownerPayoutAmount:
              ownerAmount,

            payoutReference:
              utr,

            payoutStatus:
              "Paid",

            settlementId:
              payment.settlementId ||
              "",

            settlementUtr:
              payment.settlementUtr ||
              "",

            paidAt,

            createdAt:
              paidAt,
          };

          if (!payoutSnap.exists) {
            transaction.set(
              payoutRef,
              payoutData
            );
          }

          return {
            ownerAmount,
          };
        }
      );

    return NextResponse.json({
      success: true,
      message:
        "Owner payout marked as paid successfully.",
      ownerPayoutAmount:
        result.ownerAmount,
    });

  } catch (error: any) {

    console.error(
      "OWNER PAYOUT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to complete owner payout.",
      },
      {
        status: 400,
      }
    );
  }
}