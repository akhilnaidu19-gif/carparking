import crypto from "crypto";
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

if (!getApps().length) {
  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

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

function signaturesMatch(
  rawBody: string,
  receivedSignature: string,
  webhookSecret: string
) {
  const expectedSignature = crypto
    .createHmac(
      "sha256",
      webhookSecret
    )
    .update(rawBody)
    .digest("hex");

  const expectedBuffer =
    Buffer.from(expectedSignature);

  const receivedBuffer =
    Buffer.from(receivedSignature);

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

async function updateLinkedBooking(
  bookingDocumentId: string | undefined,
  data: Record<string, unknown>
) {
  if (!bookingDocumentId) return;

  await adminDb
    .collection("bookings")
    .doc(bookingDocumentId)
    .set(data, {
      merge: true,
    });
}

export async function POST(
  request: Request
) {
  try {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Webhook secret is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      Important:
      Verify the signature against the exact raw body.
      Do not call request.json() before verification.
    */
    const rawBody =
      await request.text();

    const receivedSignature =
      request.headers.get(
        "x-razorpay-signature"
      ) || "";

    if (!receivedSignature) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay signature is missing.",
        },
        {
          status: 401,
        }
      );
    }

    const validSignature =
      signaturesMatch(
        rawBody,
        receivedSignature,
        webhookSecret
      );

    if (!validSignature) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid webhook signature.",
        },
        {
          status: 401,
        }
      );
    }

    const event = JSON.parse(rawBody);

    const eventType =
      String(event.event || "");

    const eventId =
      request.headers.get(
        "x-razorpay-event-id"
      ) || "";

    /*
      Basic duplicate-event protection.
    */
    if (eventId) {
      const eventReference =
        adminDb
          .collection(
            "razorpayWebhookEvents"
          )
          .doc(eventId);

      const existingEvent =
        await eventReference.get();

      if (existingEvent.exists) {
        return NextResponse.json({
          success: true,
          duplicate: true,
        });
      }

      await eventReference.set({
        eventType,
        receivedAt:
          FieldValue.serverTimestamp(),
      });
    }

    /*
      PAYMENT CAPTURED
    */
    if (
      eventType ===
      "payment.captured"
    ) {
      const paymentEntity =
        event.payload?.payment?.entity;

      const razorpayPaymentId =
        paymentEntity?.id || "";

      if (razorpayPaymentId) {
        const paymentSnapshot =
          await adminDb
            .collection("payments")
            .where(
              "razorpayPaymentId",
              "==",
              razorpayPaymentId
            )
            .limit(1)
            .get();

        if (!paymentSnapshot.empty) {
          const paymentDoc =
            paymentSnapshot.docs[0];

          const paymentData =
            paymentDoc.data();

          const updateData = {
            paymentStatus:
              "Captured",

            paymentVerificationStatus:
              "Verified",

            paymentCaptured:
              true,

            paymentMethod:
              paymentEntity.method ||
              paymentData.paymentMethod ||
              "Razorpay",

            paymentCurrency:
              paymentEntity.currency ||
              "INR",

            verifiedPaymentAmount:
              Number(
                paymentEntity.amount || 0
              ) / 100,

            paymentCapturedAt:
              paymentEntity.created_at
                ? new Date(
                    paymentEntity
                      .created_at * 1000
                  )
                : FieldValue
                    .serverTimestamp(),

            settlementStatus:
              paymentData
                .settlementStatus ||
              "Pending",

            updatedAt:
              FieldValue
                .serverTimestamp(),
          };

          await paymentDoc.ref.set(
            updateData,
            {
              merge: true,
            }
          );

          await updateLinkedBooking(
            paymentData.bookingDocumentId,
            updateData
          );
        }
      }
    }

    /*
      REFUND PROCESSED
    */
    if (
      eventType ===
      "refund.processed"
    ) {
      const refundEntity =
        event.payload?.refund?.entity;

      const razorpayPaymentId =
        refundEntity?.payment_id || "";

      const razorpayRefundId =
        refundEntity?.id || "";

      if (razorpayPaymentId) {
        const paymentSnapshot =
          await adminDb
            .collection("payments")
            .where(
              "razorpayPaymentId",
              "==",
              razorpayPaymentId
            )
            .limit(1)
            .get();

        if (!paymentSnapshot.empty) {
          const paymentDoc =
            paymentSnapshot.docs[0];

          const paymentData =
            paymentDoc.data();

          const updateData = {
            refundStatus:
              "Completed",

            paymentStatus:
              "Refunded",

            razorpayRefundId,

            refundPaymentId:
              razorpayPaymentId,

            refundReference:
              razorpayRefundId,

            refundAmount:
              Number(
                refundEntity.amount || 0
              ) / 100,

            refundProcessedAt:
              FieldValue
                .serverTimestamp(),

            platformFeeRefunded:
              false,

            updatedAt:
              FieldValue
                .serverTimestamp(),
          };

          await paymentDoc.ref.set(
            updateData,
            {
              merge: true,
            }
          );

          await updateLinkedBooking(
            paymentData.bookingDocumentId,
            updateData
          );
        }
      }
    }

    /*
      REFUND FAILED
    */
    if (
      eventType ===
      "refund.failed"
    ) {
      const refundEntity =
        event.payload?.refund?.entity;

      const razorpayPaymentId =
        refundEntity?.payment_id || "";

      if (razorpayPaymentId) {
        const paymentSnapshot =
          await adminDb
            .collection("payments")
            .where(
              "razorpayPaymentId",
              "==",
              razorpayPaymentId
            )
            .limit(1)
            .get();

        if (!paymentSnapshot.empty) {
          const paymentDoc =
            paymentSnapshot.docs[0];

          const paymentData =
            paymentDoc.data();

          const updateData = {
            refundStatus: "Failed",

            paymentStatus:
              "Refund Failed",

            razorpayRefundId:
              refundEntity?.id || "",

            refundFailureReason:
              refundEntity
                ?.error_description ||
              refundEntity
                ?.error_reason ||
              "Refund failed at Razorpay.",

            refundFailedAt:
              FieldValue
                .serverTimestamp(),

            updatedAt:
              FieldValue
                .serverTimestamp(),
          };

          await paymentDoc.ref.set(
            updateData,
            {
              merge: true,
            }
          );

          await updateLinkedBooking(
            paymentData.bookingDocumentId,
            updateData
          );
        }
      }
    }

    /*
      SETTLEMENT PROCESSED

      A settlement webhook represents the full
      Razorpay settlement, not one individual
      parking payment. Store it separately.
    */
    if (
      eventType ===
      "settlement.processed"
    ) {
      const settlement =
        event.payload
          ?.settlement?.entity;

      if (settlement?.id) {
        await adminDb
          .collection("settlements")
          .doc(settlement.id)
          .set(
            {
              settlementId:
                settlement.id,

              settlementStatus:
                settlement.status ||
                "processed",

              settlementAmount:
                Number(
                  settlement.amount || 0
                ) / 100,

              settlementFee:
                Number(
                  settlement.fees || 0
                ) / 100,

              settlementTax:
                Number(
                  settlement.tax || 0
                ) / 100,

              settlementUtr:
                settlement.utr || "",

              razorpayCreatedAt:
                settlement.created_at
                  ? new Date(
                      settlement
                        .created_at *
                        1000
                    )
                  : null,

              webhookReceivedAt:
                FieldValue
                  .serverTimestamp(),

              rawEventType:
                eventType,
            },
            {
              merge: true,
            }
          );
      }
    }

    return NextResponse.json({
      success: true,
      event: eventType,
    });
  } catch (error: any) {
    console.error(
      "Razorpay webhook error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
}