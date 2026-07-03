const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");

admin.initializeApp();

const db = admin.firestore();

exports.autoCompleteBookings = onSchedule(
  "every 1 hours",
  async () => {

    console.log("Checking expired bookings...");

    const now = new Date();

    const snapshot = await db
      .collection("bookings")
      .where("bookingStatus", "==", "Approved")
      .get();

    if (snapshot.empty) {
      console.log("No approved bookings found.");
      return;
    }

    for (const bookingDoc of snapshot.docs) {

      const booking = bookingDoc.data();

      const expiryDate = new Date(booking.validTill);

      if (expiryDate <= now) {

        console.log(
          "Completing booking:",
          booking.bookingId
        );

        // Complete booking
        await bookingDoc.ref.update({

          bookingStatus: "Completed",

          paymentStatus: "Ready For Payout",

          completedDate:
            admin.firestore.FieldValue.serverTimestamp(),

        });

        // Free parking slot
        const parkingRef = db
          .collection("parkings")
          .doc(booking.parkingId);

        await parkingRef.update({

          occupiedSlots:
            admin.firestore.FieldValue.increment(-1),

          availableSlots:
            admin.firestore.FieldValue.increment(1),

          availability: "Available",

        });

        console.log(
          booking.bookingId,
          "completed successfully."
        );

      }

    }

  }
);