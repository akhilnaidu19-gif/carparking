import { NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export async function GET() {
  try {
    const now = new Date();

    const snapshot = await db
      .collection("bookings")
      .where("bookingStatus", "==", "Approved")
      .get();

    let completed = 0;

    for (const bookingDoc of snapshot.docs) {
      const booking = bookingDoc.data();

      const expiryDate =
        booking.validTill?.toDate
          ? booking.validTill.toDate()
          : new Date(booking.validTill);

      if (expiryDate <= now) {

        completed++;

        await bookingDoc.ref.update({
          bookingStatus: "Completed",
          paymentStatus: "Ready For Payout",
          ownerPayoutStatus: "Pending",
          completedDate:
            FieldValue.serverTimestamp(),
        });

        const paymentSnapshot =
          await db
            .collection("payments")
            .where(
              "bookingDocumentId",
              "==",
              bookingDoc.id
            )
            .get();

        for (const paymentDoc of paymentSnapshot.docs) {

          await paymentDoc.ref.update({

  bookingStatus: "Completed",

  paymentStatus: "Ready For Payout",

  ownerPayoutStatus: "Not Eligible",

  eligibleForPayout: false,

  payoutEligibleAt: null,

  updatedAt:
    FieldValue.serverTimestamp(),

});
        }

        await db
          .collection("parkings")
          .doc(booking.parkingId)
          .update({

            occupiedSlots:
              FieldValue.increment(-1),

            availableSlots:
              FieldValue.increment(1),

            availability: "Available",

          });

      }
    }

    return NextResponse.json({

      success: true,

      completed,

      message:
        `${completed} booking(s) completed.`,

    });

  } catch (error: any) {

    console.log(error);

    return NextResponse.json(

      {
        success: false,
        message: error.message,
      },

      { status: 500 }

    );

}
}