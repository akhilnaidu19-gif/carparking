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

        console.log(
  "Recon Items:",
  JSON.stringify(items, null, 2)
);

    let processed = 0;
    let matched = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      processed++;

      /*
        Only payment transactions should update
        parking payment documents.
      */

      if (
        item.type !== "payment" ||
        item.settled !== true ||
        !item.entity_id
      ) {
        skipped++;
        continue;
      }

      const paymentSnapshot =
        await adminDb
          .collection("payments")
          .where(
            "razorpayPaymentId",
            "==",
            item.entity_id
          )
          .limit(1)
          .get();

      if (paymentSnapshot.empty) {
        skipped++;
        continue;
      }

      matched++;

      const paymentDoc =
        paymentSnapshot.docs[0];

      const paymentData =
        paymentDoc.data();

      const settledAt =
        item.settled_at
          ? new Date(
              item.settled_at * 1000
            )
          : FieldValue
              .serverTimestamp();

      const settlementData = {
        settlementStatus:
          "Settled",

        settlementId:
          item.settlement_id || "",

        settlementUtr:
          item.settlement_utr || "",

        settlementAmount:
          toRupees(
            item.credit ||
            item.amount
          ),

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

        updatedAt:
          FieldValue
            .serverTimestamp(),
      };

      await paymentDoc.ref.set(
        settlementData,
        {
          merge: true,
        }
      );

      if (
        paymentData.bookingDocumentId
      ) {
        await adminDb
          .collection("bookings")
          .doc(
            paymentData
              .bookingDocumentId
          )
          .set(
            settlementData,
            {
              merge: true,
            }
          );
      }

      updated++;
    }

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