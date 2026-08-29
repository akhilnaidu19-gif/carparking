import { NextResponse } from "next/server";

import {
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  getFirestore,
  FieldValue,
} from "firebase-admin/firestore";

import {
  getAuth,
} from "firebase-admin/auth";


/* -------------------------------------------------------
   Firebase Admin
------------------------------------------------------- */

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


/* -------------------------------------------------------
   Verify Firebase ID Token
------------------------------------------------------- */

async function getAuthenticatedUid(
  request: Request
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  const idToken =
    authorization
      .substring(7)
      .trim();

  if (!idToken) {
    return null;
  }

  try {
    const decodedToken =
      await getAuth().verifyIdToken(
        idToken
      );

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
   POST - Cancel Booking
------------------------------------------------------- */

export async function POST(
  request: Request
) {

  try {

    /* ---------------------------------------------------
       1. Authenticate customer
    --------------------------------------------------- */

    const authenticatedUid =
      await getAuthenticatedUid(
        request
      );

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


    /* ---------------------------------------------------
       2. Read request
    --------------------------------------------------- */

    const body =
      await request.json();

    const bookingDocumentId =
      String(
        body.bookingDocumentId || ""
      ).trim();

    if (!bookingDocumentId) {

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


    /* ---------------------------------------------------
       3. References
    --------------------------------------------------- */

    const bookingRef =
      adminDb
        .collection("bookings")
        .doc(bookingDocumentId);


    /* ---------------------------------------------------
       4. Transaction
    --------------------------------------------------- */

    const result =
      await adminDb.runTransaction(
        async (transaction) => {

          /*
             Read booking first.
          */

          const bookingSnap =
            await transaction.get(
              bookingRef
            );

          if (!bookingSnap.exists) {

            throw new Error(
              "Booking not found."
            );
          }

          const booking =
            bookingSnap.data()!;


          /* ------------------------------------------------
             5. Verify customer ownership
          ------------------------------------------------ */

          if (
            booking.customerUid !==
            authenticatedUid
          ) {

            throw new Error(
              "You are not authorized to cancel this booking."
            );
          }


          /* ------------------------------------------------
             6. Check booking status
          ------------------------------------------------ */

          const currentStatus =
            String(
              booking.bookingStatus || ""
            );


          if (
            currentStatus !==
              "Pending Approval" &&
            currentStatus !==
              "Approved"
          ) {

            throw new Error(
              "This booking cannot be cancelled in its current status."
            );
          }


          /* ------------------------------------------------
             7. Existing parkingId
             NO NEW FIELD
          ------------------------------------------------ */

          const parkingId =
            String(
              booking.parkingId || ""
            ).trim();

          if (!parkingId) {

            throw new Error(
              "Parking information is missing from this booking."
            );
          }


          const parkingRef =
            adminDb
              .collection("parkings")
              .doc(parkingId);


          const parkingSnap =
            await transaction.get(
              parkingRef
            );


          if (!parkingSnap.exists) {

            throw new Error(
              "Parking listing not found."
            );
          }


          /* ------------------------------------------------
             8. BEFORE OWNER APPROVAL
          ------------------------------------------------ */

          if (
            currentStatus ===
            "Pending Approval"
          ) {

            const parkingAmount =
              Number(
                booking.parkingAmount || 0
              );

            const platformFeeAmount =
              Number(
                booking.platformFeeAmount || 0
              );


            transaction.update(
              bookingRef,
              {

                bookingStatus:
                  "Cancelled Before Approval",

                ownerApprovalStatus:
                  "Cancelled",

                paymentStatus:
                  "Refund Pending",

                cancellationType:
                  "Before Owner Approval",

                cancelledBy:
                  "Customer",

                cancelledAt:
                  FieldValue.serverTimestamp(),

                refundAmount:
                  parkingAmount,

                refundStatus:
                  "Pending",

                platformFeeAmount,

                platformFeeRefunded:
                  false,

                ownerPayoutStatus:
                  "Not Applicable",

                refundRemarks:
                  "Customer cancelled before owner approval. Parking amount refund pending. Platform fee is non-refundable.",

                updatedAt:
                  FieldValue.serverTimestamp(),
              }
            );


            /*
              Release the parking slot.
            */

            transaction.update(
              parkingRef,
              {

                availableSlots:
                  FieldValue.increment(1),

                occupiedSlots:
                  FieldValue.increment(-1),

                availability:
                  "Available",

                updatedAt:
                  FieldValue.serverTimestamp(),
              }
            );


            return {
              cancellationType:
                "Before Owner Approval",

              bookingStatus:
                "Cancelled Before Approval",

              refundAmount:
                parkingAmount,

              platformFeeAmount,
            };
          }


          /* ------------------------------------------------
             9. AFTER OWNER APPROVAL
          ------------------------------------------------ */

          if (
            currentStatus ===
            "Approved"
          ) {

            const ownerReceivableAmount =
              Number(
                booking.ownerReceivableAmount ||
                booking.parkingAmount ||
                0
              );


            transaction.update(
              bookingRef,
              {

                bookingStatus:
                  "Cancelled After Approval",

                ownerApprovalStatus:
                  "Approved",

                paymentStatus:
                  "Paid",

                cancellationType:
                  "After Owner Approval",

                cancelledBy:
                  "Customer",

                cancelledAt:
                  FieldValue.serverTimestamp(),

                refundAmount:
                  0,

                refundStatus:
                  "Not Applicable",

                ownerPayoutStatus:
                  "Pending",

                updatedAt:
                  FieldValue.serverTimestamp(),
              }
            );


            /*
              Release parking slot.
            */

            transaction.update(
              parkingRef,
              {

                availableSlots:
                  FieldValue.increment(1),

                occupiedSlots:
                  FieldValue.increment(-1),

                availability:
                  "Available",

                updatedAt:
                  FieldValue.serverTimestamp(),
              }
            );


            return {
              cancellationType:
                "After Owner Approval",

              bookingStatus:
                "Cancelled After Approval",

              refundAmount:
                0,

              ownerReceivableAmount,
            };
          }


          throw new Error(
            "Unsupported booking status."
          );
        }
      );


    /* ---------------------------------------------------
       10. Success
    --------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,
        ...result,
      },
      {
        status: 200,
      }
    );


  } catch (error: any) {

    console.error(
      "Booking cancellation error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ||
          "Unable to cancel booking.",
      },
      {
        status: 400,
      }
    );
  }
}