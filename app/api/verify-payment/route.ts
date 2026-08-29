import crypto from "crypto";
import Razorpay from "razorpay";
import { NextResponse } from "next/server";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/* -------------------------------------------------------
   Firebase Admin
------------------------------------------------------- */

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .trim();

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

/* -------------------------------------------------------
   Verify Firebase ID token
------------------------------------------------------- */

async function getAuthenticatedUid(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const idToken = authorization.substring(7).trim();

  if (!idToken) {
    return null;
  }

  try {
    const { getAuth } = await import("firebase-admin/auth");

    const decodedToken =
      await getAuth().verifyIdToken(idToken);

    return decodedToken.uid;
  } catch (error) {
    console.error(
      "Firebase ID token verification failed:",
      error
    );

    return null;
  }
}

/* -------------------------------------------------------
   POST
------------------------------------------------------- */

export async function POST(request: Request) {
  try {
    /*
      IMPORTANT:
      The UID now comes from the verified Firebase ID token.
      We do NOT trust customerUid sent by the browser.
    */

    const authenticatedUid =
      await getAuthenticatedUid(request);

    if (!authenticatedUid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Authentication required. Please login again.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const orderId = String(
      body.razorpayOrderId || ""
    ).trim();

    const paymentId = String(
      body.razorpayPaymentId || ""
    ).trim();

    const signature = String(
      body.razorpaySignature || ""
    ).trim();

    const expectedAmount = Number(
      body.expectedAmount || 0
    );

    /*
      bookingData is the same booking object that your
      existing booking page already creates.
    */
    const bookingData = body.bookingData;

    if (
      !orderId ||
      !paymentId ||
      !signature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing Razorpay payment verification details.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isFinite(expectedAmount) ||
      expectedAmount <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid expected payment amount.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !bookingData ||
      typeof bookingData !== "object"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Booking information is missing.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      Never trust the customer UID supplied by the browser.
      Force it to the authenticated Firebase UID.
    */
    bookingData.customerUid =
      authenticatedUid;

    const secret =
      process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay secret is not configured.",
        },
        {
          status: 500,
        }
      );
    }

    /* ---------------------------------------------------
       Razorpay signature verification
    --------------------------------------------------- */

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          secret
        )
        .update(
          `${orderId}|${paymentId}`
        )
        .digest("hex");

    /*
      Avoid timingSafeEqual length errors.
    */
    if (
      generatedSignature.length !==
      signature.length
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment signature verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    const signatureIsValid =
      crypto.timingSafeEqual(
        Buffer.from(
          generatedSignature
        ),
        Buffer.from(
          signature
        )
      );

    if (!signatureIsValid) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment signature verification failed.",
        },
        {
          status: 400,
        }
      );
    }

    /* ---------------------------------------------------
       Fetch Razorpay payment
    --------------------------------------------------- */

    const payment =
      await razorpay.payments.fetch(
        paymentId
      );

    if (
      payment.order_id !== orderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Payment does not belong to this Razorpay order.",
        },
        {
          status: 400,
        }
      );
    }

    const expectedAmountInPaise =
      Math.round(
        expectedAmount * 100
      );

    if (
      Number(payment.amount) !==
      expectedAmountInPaise
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid amount does not match the booking amount.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      payment.status !== "captured"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Payment is currently ${payment.status}. The payment must be captured before the booking is created.`,
          paymentStatus:
            payment.status,
        },
        {
          status: 400,
        }
      );
    }

    /* ---------------------------------------------------
       Validate required booking fields
    --------------------------------------------------- */

    const parkingId = String(
      bookingData.parkingId || ""
    ).trim();

    const plan = String(
      bookingData.plan || ""
    ).trim();

    if (!parkingId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Parking information is missing.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      plan !== "Monthly" &&
      plan !== "Yearly"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid booking plan.",
        },
        {
          status: 400,
        }
      );
    }

    /* ---------------------------------------------------
       Create booking + payment + reserve slot
       atomically
    --------------------------------------------------- */

    const result =
      await adminDb.runTransaction(
        async (transaction) => {
          const parkingRef =
            adminDb.collection(
              "parkings"
            ).doc(parkingId);

          const parkingSnap =
            await transaction.get(
              parkingRef
            );

          if (!parkingSnap.exists) {
            throw new Error(
              "Parking listing no longer exists."
            );
          }

          const parking =
            parkingSnap.data()!;

          /*
            Re-check availability on the SERVER.
            This prevents two customers from booking
            the final available slot at the same time.
          */

          const availableSlots =
            Number(
              parking.availableSlots || 0
            );

          if (availableSlots <= 0) {
            throw new Error(
              "This parking is no longer available."
            );
          }

          /*
            Do not allow booking an unapproved listing.
          */
          if (
            parking.status !==
            "Approved"
          ) {
            throw new Error(
              "This parking is not available for booking."
            );
          }

          /*
            Keep the existing owner information from
            the actual parking document.
          */
          bookingData.ownerUid =
            parking.ownerUid;

          bookingData.parkingTitle =
            parking.title ||
            bookingData.parkingTitle ||
            "";

          bookingData.parkingLocation =
            parking.location ||
            bookingData.parkingLocation ||
            "";

          /*
            Create booking ID using Firestore's ID.
          */
          const bookingRef =
            adminDb.collection(
              "bookings"
            ).doc();
            

          /*
            Preserve the existing booking fields,
            but ensure the server-controlled fields
            cannot be spoofed.
          */
          const finalBookingData = {
            ...bookingData,

            bookingId:
              bookingData.bookingId ||
              `BK${Math.floor(
                1000 +
                  Math.random() *
                    9000
              )}`,

            customerUid:
              authenticatedUid,

            ownerUid:
              parking.ownerUid,

            parkingId,

            parkingTitle:
              parking.title ||
              bookingData.parkingTitle ||
              "",

           bookingStatus: "Pending Approval",

ownerApprovalStatus: "Pending",

paymentStatus: "Captured",

paymentVerificationStatus: "Verified",

paymentCaptured: true,

ownerPayoutStatus: "Not Eligible",

settlementStatus: "Pending",

createdAt:
  bookingData.createdAt ||
  FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp(),

            razorpayOrderId:
              orderId,

            razorpayPaymentId:
              paymentId,
          };

          transaction.set(
            bookingRef,
            finalBookingData
          );

          /*
            Create payment record.
          */
          const paymentRef =
            adminDb.collection(
              "payments"
            ).doc();

          transaction.set(
            paymentRef,
            {
            bookingId: finalBookingData.bookingId,

              customerUid:
                authenticatedUid,

              ownerUid:
                parking.ownerUid,

              parkingId,

              razorpayOrderId:
                orderId,

              razorpayPaymentId:
                paymentId,

              amount:
                Number(payment.amount) /
                100,

              currency:
                payment.currency ||
                "INR",

status: "Captured",

paymentStatus: "Captured",

paymentVerificationStatus: "Verified",

paymentCaptured: true,

settlementStatus: "Pending",

ownerPayoutStatus: "Not Eligible",

refundStatus: "Not Applicable",

              method:
                payment.method ||
                "",

              customerEmail:
                payment.email ||
                "",

              customerPhone:
                payment.contact ||
                "",

              createdAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp(),
            }
          );

          /*
            Reserve one parking slot.
          */
          const newAvailableSlots =
            availableSlots - 1;

          const currentOccupiedSlots =
            Number(
              parking.occupiedSlots || 0
            );

          transaction.update(
            parkingRef,
            {
              availableSlots:
                newAvailableSlots,

              occupiedSlots:
                currentOccupiedSlots + 1,

              availability:
                newAvailableSlots <= 0
                  ? "Occupied"
                  : "Available",

              updatedAt:
                FieldValue.serverTimestamp(),
            }
          );

          /*
            Create owner notification from the
            trusted server.
          */
          const notificationRef =
            adminDb.collection(
              "notifications"
            ).doc();

          transaction.set(
            notificationRef,
            {
              recipientUid:
                parking.ownerUid,

              recipientRole:
                "owner",

              title:
                "New Booking Request",

              message:
                `${bookingData.customerName || "A customer"} has booked your parking "${parking.title || ""}".`,

              type:
                "BOOKING",

              relatedId:
                bookingRef.id,

              read: false,

              createdAt:
                FieldValue.serverTimestamp(),
            }
          );

          return {
            bookingId:
              bookingRef.id,

            paymentRecordId:
              paymentRef.id,
          };
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          "Payment verified and booking created successfully.",

        bookingId:
          result.bookingId,

        paymentRecordId:
          result.paymentRecordId,

        payment: {
          id:
            payment.id,

          orderId:
            payment.order_id,

          status:
            payment.status,

          amount:
            Number(payment.amount) /
            100,

          currency:
            payment.currency,

          method:
            payment.method || "",

          captured:
            payment.captured,

          email:
            payment.email || "",

          contact:
            payment.contact || "",
        },
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error(
      "Payment verification / booking error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          error?.error?.description ||
          "Unable to verify payment and create booking.",
      },
      {
        status:
          error?.statusCode || 500,
      }
    );
  }
}