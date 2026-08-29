import { NextResponse } from "next/server";

import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";

/*
  Firebase Admin initialization
*/

if (!getApps().length) {
  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/^["']|["']$/g, "")
      .replace(/\\n/g, "\n")
      .trim();

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
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

type RazorpayReconItem = {
  entity_id?: string;
  type?: string;
  debit?: number;
  credit?: number;
  amount?: number;
  fee?: number;
  tax?: number;
  settled?: boolean;
  settled_at?: number;
  settlement_id?: string;
  settlement_utr?: string;
  order_id?: string;
  currency?: string;
};

/*
  Convert Razorpay amount from paise to rupees.
*/

function toRupees(
  value: number | undefined
) {
  return Number(value || 0) / 100;
}

export async function POST(
  request: Request
) {
  try {
    /*
      Protect this internal endpoint.
    */

    const providedSecret =
      request.headers.get(
        "x-recon-secret"
      );

    const expectedSecret =
      process.env
        .SETTLEMENT_RECON_SECRET;

    if (
      !expectedSecret ||
      providedSecret !==
        expectedSecret
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const razorpayKeyId =
      process.env
        .NEXT_PUBLIC_RAZORPAY_KEY_ID;

    const razorpayKeySecret =
      process.env
        .RAZORPAY_KEY_SECRET;

    if (
      !razorpayKeyId ||
      !razorpayKeySecret
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay credentials are missing.",
        },
        {
          status: 500,
        }
      );
    }

    const body = await request.json();

    const year = Number(body.year);
    const month = Number(body.month);
    const day = body.day
      ? Number(body.day)
      : undefined;

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Valid year and month are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      day !== undefined &&
      (
        !Number.isInteger(day) ||
        day < 1 ||
        day > 31
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Day must be between 1 and 31.",
        },
        {
          status: 400,
        }
      );
    }

    const params =
      new URLSearchParams({
        year: String(year),
        month: String(month),
      });

    if (day !== undefined) {
      params.set(
        "day",
        String(day)
      );
    }

    const authentication =
      Buffer.from(
        `${razorpayKeyId}:${razorpayKeySecret}`
      ).toString("base64");

    const response = await fetch(
      `https://api.razorpay.com/v1/settlements/recon/combined?${params.toString()}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Basic ${authentication}`,

          Accept:
            "application/json",
        },

        cache: "no-store",
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      console.error(
        "Razorpay settlement recon error:",
        result
      );

      return NextResponse.json(
        {
          success: false,

          message:
            result?.error
              ?.description ||
            "Unable to fetch settlement reconciliation data.",

          razorpayError:
            result?.error || null,
        },
        {
          status: response.status,
        }
      );
    }

    const items: RazorpayReconItem[] =
      Array.isArray(result.items)
        ? result.items
        : [];

    let processed = 0;
    let matched = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      processed++;

      /*
        Only settled payment transactions should
        update parking payment documents.
      */

      if (
        item.type !== "payment" ||
        item.settled !== true ||
        !item.entity_id
      ) {
        skipped++;
        continue;
      }

      let paymentDoc: any = null;

      /*
        First try matching with Razorpay Payment ID.
      */

      const paymentIdSnapshot =
        await adminDb
          .collection("payments")
          .where(
            "razorpayPaymentId",
            "==",
            item.entity_id
          )
          .limit(1)
          .get();

      if (!paymentIdSnapshot.empty) {
        paymentDoc =
          paymentIdSnapshot.docs[0];
      }

      /*
        If Payment ID is not found, try Razorpay Order ID.
      */

      if (
        !paymentDoc &&
        item.order_id
      ) {
        const orderIdSnapshot =
          await adminDb
            .collection("payments")
            .where(
              "razorpayOrderId",
              "==",
              item.order_id
            )
            .limit(1)
            .get();

        if (!orderIdSnapshot.empty) {
          paymentDoc =
            orderIdSnapshot.docs[0];
        }
      }

      /*
        Log unmatched Razorpay transaction.
      */

      if (!paymentDoc) {
        console.log(
          "Settlement payment not matched:",
          {
            razorpayPaymentId:
              item.entity_id,

            razorpayOrderId:
              item.order_id || "",

            settlementId:
              item.settlement_id || "",
          }
        );

        skipped++;
        continue;
      }

      matched++;

      const paymentData =
        paymentDoc.data();

        let refundPending = false;

if (paymentData.bookingDocumentId) {
  const bookingSnapshot = await adminDb
    .collection("bookings")
    .doc(paymentData.bookingDocumentId)
    .get();

  if (bookingSnapshot.exists) {
    const bookingData =
      bookingSnapshot.data();

    if (
      bookingData?.bookingStatus === "Rejected" &&
      bookingData?.refundStatus === "Pending"
    ) {
      refundPending = true;
    }
  }
}

      /*
        ------------------------------------------------
        FIND LINKED BOOKING
        ------------------------------------------------

        Existing records may have:
        1. bookingDocumentId
        2. payment.bookingId containing Firestore
           booking document ID
        3. payment.bookingId containing business
           booking ID such as BK1691
      */

      let bookingDoc: any = null;

      /*
        1. Existing bookingDocumentId
      */

      if (
        paymentData.bookingDocumentId
      ) {
        const bookingSnapshot =
          await adminDb
            .collection("bookings")
            .doc(
              paymentData.bookingDocumentId
            )
            .get();

        if (bookingSnapshot.exists) {
          bookingDoc =
            bookingSnapshot;
        }
      }

      /*
        2. Try payment.bookingId as Firestore
           document ID.
      */

      if (
        !bookingDoc &&
        paymentData.bookingId
      ) {
        const bookingSnapshot =
          await adminDb
            .collection("bookings")
            .doc(
              paymentData.bookingId
            )
            .get();

        if (bookingSnapshot.exists) {
          bookingDoc =
            bookingSnapshot;
        }
      }

      /*
        3. Finally try payment.bookingId as the
           business bookingId field.
      */

      if (
        !bookingDoc &&
        paymentData.bookingId
      ) {
        const bookingQuery =
          await adminDb
            .collection("bookings")
            .where(
              "bookingId",
              "==",
              paymentData.bookingId
            )
            .limit(1)
            .get();

        if (!bookingQuery.empty) {
          bookingDoc =
            bookingQuery.docs[0];
        }
      }

      /*
        If booking cannot be found, update only the
        payment settlement information and do not
        mark it eligible.
      */

      const bookingData =
        bookingDoc?.data() || null;

      /*
        ------------------------------------------------
        PAYOUT ELIGIBILITY
        ------------------------------------------------

        Owner payout is eligible ONLY when the
        booking itself is Completed.

        Settlement alone is NOT enough.
      */

      const bookingCompleted =
  bookingData?.bookingStatus === "Completed";

const alreadyPaid =
  paymentData.ownerPayoutStatus === "Paid" ||
  bookingData?.ownerPayoutStatus === "Paid";

const ownerPayoutStatus =
  alreadyPaid
    ? "Paid"
    : refundPending
      ? "Not Eligible"
      : bookingCompleted
        ? "Eligible"
        : "Not Eligible";

const eligibleForPayout =
  !alreadyPaid &&
  !refundPending &&
  bookingCompleted;

const payoutEligibleAt =
  alreadyPaid
    ? paymentData.payoutEligibleAt || null
    : eligibleForPayout
      ? (
          paymentData.eligibleForPayout === true
            ? paymentData.payoutEligibleAt || null
            : FieldValue.serverTimestamp()
        )
      : null;

      const settledAt =
        item.settled_at
          ? new Date(
              item.settled_at * 1000
            )
          : FieldValue
              .serverTimestamp();

      /*
        ------------------------------------------------
        SETTLEMENT DATA
        ------------------------------------------------
      */

      const settlementData = {
        settlementStatus:
          "Settled",

        ownerPayoutStatus,

        eligibleForPayout,

        payoutEligibleAt,

        settlementPaymentId:
          item.entity_id || "",

        settlementId:
          item.settlement_id || "",

        settlementUtr:
          item.settlement_utr || "",

        settlementGrossAmount:
          toRupees(item.amount),

        settlementAmount:
          toRupees(item.credit),

        settlementFee:
          toRupees(item.fee),

        settlementTax:
          toRupees(item.tax),

        settlementCurrency:
          item.currency || "INR",

        settlementOrderId:
          item.order_id || "",

        settledAt,

        settlementReconciled:
          true,

        settlementReconciledAt:
          FieldValue
            .serverTimestamp(),

            ...(refundPending
  ? {
      refundStatus: "Pending",
      paymentStatus: "Refund Pending",
    }
  : {}),

        updatedAt:
          FieldValue
            .serverTimestamp(),
      };

      /*
        ------------------------------------------------
        PAYMENT DATA
        ------------------------------------------------

        Copy the required booking information into
        the payment document so the Admin payout
        screen has all required information.
      */

      const paymentBookingData =
        bookingDoc
          ? {
              bookingDocumentId:
                bookingDoc.id,

              bookingId:
                bookingData.bookingId ||
                paymentData.bookingId ||
                "",

              customerUid:
                bookingData.customerUid ||
                paymentData.customerUid ||
                "",

              customerId:
                bookingData.customerId ||
                paymentData.customerId ||
                "",

              customerName:
                bookingData.customerName ||
                paymentData.customerName ||
                "",

              customerEmail:
                bookingData.customerEmail ||
                paymentData.customerEmail ||
                "",

              customerPhone:
                bookingData.customerPhone ||
                paymentData.customerPhone ||
                "",

              ownerUid:
                bookingData.ownerUid ||
                paymentData.ownerUid ||
                "",

              ownerId:
                bookingData.ownerId ||
                paymentData.ownerId ||
                "",

              ownerName:
                bookingData.ownerName ||
                "",

              ownerEmail:
                bookingData.ownerEmail ||
                "",

              ownerPhone:
                bookingData.ownerPhone ||
                "",

              ownerPhoto:
                bookingData.ownerPhoto ||
                "",

              ownerReceivableAmount:
                Number(
                  bookingData.ownerReceivableAmount ||
                  0
                ),

              parkingId:
                bookingData.parkingId ||
                paymentData.parkingId ||
                "",

              parkingTitle:
                bookingData.parkingTitle ||
                "",

              parkingLocation:
                bookingData.parkingLocation ||
                "",

              parkingImage:
                bookingData.parkingImage ||
                "",

              plan:
                bookingData.plan ||
                "",

              ownerPayoutStatus,

              eligibleForPayout,

              payoutEligibleAt,
            }
          : {
              /*
                Booking not found:
                preserve settlement but do NOT
                make owner payout eligible.
              */

              ownerPayoutStatus:
                "Not Eligible",

              eligibleForPayout:
                false,

              payoutEligibleAt:
                null,
            };

      /*
        Update PAYMENT document.
      */

      await paymentDoc.ref.set(
        {
          ...paymentBookingData,
          ...settlementData,
        },
        {
          merge: true,
        }
      );

      /*
        ------------------------------------------------
        UPDATE BOOKING
        ------------------------------------------------
      */

      if (bookingDoc) {
        await bookingDoc.ref.set(
          {
            settlementStatus:
              "Settled",

            settlementPaymentId:
              item.entity_id || "",

            settlementId:
              item.settlement_id || "",

            settlementUtr:
              item.settlement_utr || "",

            settlementGrossAmount:
              toRupees(item.amount),

            settlementAmount:
              toRupees(item.credit),

            settlementFee:
              toRupees(item.fee),

            settlementTax:
              toRupees(item.tax),

            settlementCurrency:
              item.currency || "INR",

            settlementOrderId:
              item.order_id || "",

            settledAt,

            settlementReconciled:
              true,

            settlementReconciledAt:
              FieldValue
                .serverTimestamp(),

            ownerPayoutStatus,

            eligibleForPayout,

            payoutEligibleAt,

            updatedAt:
              FieldValue
                .serverTimestamp(),
          },
          {
            merge: true,
          }
        );
      }

      updated++;
    }

    /*
      Store reconciliation run history.
    */

    await adminDb
      .collection(
        "settlementReconciliationRuns"
      )
      .add({
        year,
        month,
        day: day || null,

        totalItems:
          items.length,

        processed,
        matched,
        updated,
        skipped,

        executedAt:
          FieldValue
            .serverTimestamp(),
      });

    return NextResponse.json({
      success: true,

      period: {
        year,
        month,
        day: day || null,
      },

      totalItems:
        items.length,

      processed,
      matched,
      updated,
      skipped,
    });
  } catch (error: any) {
    console.error(
      "Settlement reconciliation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Settlement reconciliation failed.",
      },
      {
        status: 500,
      }
    );
  }
}