const admin = require("firebase-admin");
const {
  onSchedule,
} = require(
  "firebase-functions/v2/scheduler"
);

admin.initializeApp();

const db = admin.firestore();

exports.autoCompleteBookings =
  onSchedule(
    "every 1 hours",
    async () => {
      console.log(
        "Checking expired bookings..."
      );

      const now = new Date();

      const snapshot = await db
        .collection("bookings")
        .where(
          "bookingStatus",
          "==",
          "Approved"
        )
        .get();

      if (snapshot.empty) {
        console.log(
          "No approved bookings found."
        );
        return;
      }

      for (
        const bookingDoc of snapshot.docs
      ) {
        const booking =
          bookingDoc.data();

        if (!booking.validTill) {
          console.log(
            "Skipping booking without validTill:",
            booking.bookingId ||
              bookingDoc.id
          );
          continue;
        }

        const expiryDate =
          booking.validTill.toDate
            ? booking.validTill.toDate()
            : new Date(
                booking.validTill
              );

        if (
          Number.isNaN(
            expiryDate.getTime()
          )
        ) {
          console.log(
            "Invalid validTill for booking:",
            booking.bookingId ||
              bookingDoc.id
          );
          continue;
        }

        if (expiryDate <= now) {
          console.log(
            "Completing booking:",
            booking.bookingId ||
              bookingDoc.id
          );

          const completedAt =
            admin.firestore.FieldValue
              .serverTimestamp();

          // 1. Update booking document
          await bookingDoc.ref.update({
            bookingStatus:
              "Completed",

            paymentStatus:
              "Ready For Payout",

            ownerPayoutStatus:
              "Pending",

            completedDate:
              completedAt,

            updatedAt:
              completedAt,
          });

          // 2. Update linked payment document
          const paymentSnapshot =
            await db
              .collection("payments")
              .where(
                "bookingDocumentId",
                "==",
                bookingDoc.id
              )
              .get();

          if (
            paymentSnapshot.empty
          ) {
            console.log(
              "No linked payment found for booking:",
              booking.bookingId ||
                bookingDoc.id
            );
          } else {
            const paymentUpdates =
              paymentSnapshot.docs.map(
                (paymentDoc) =>
                  paymentDoc.ref.update({
                    bookingStatus:
                      "Completed",

                    paymentStatus:
                      "Ready For Payout",

                    ownerPayoutStatus:
                      "Pending",

                    eligibleForPayout:
                      true,

                    payoutEligibleAt:
                      completedAt,

                    completedDate:
                      completedAt,

                    updatedAt:
                      completedAt,
                  })
              );

            await Promise.all(
              paymentUpdates
            );
          }

          // 3. Free parking slot safely
          if (
            booking.parkingId
          ) {
            const parkingRef = db
              .collection(
                "parkings"
              )
              .doc(
                booking.parkingId
              );

            await db.runTransaction(
              async (
                transaction
              ) => {
                const parkingSnap =
                  await transaction.get(
                    parkingRef
                  );

                if (
                  !parkingSnap.exists
                ) {
                  console.log(
                    "Parking not found:",
                    booking.parkingId
                  );
                  return;
                }

                const parking =
                  parkingSnap.data();

                const occupiedSlots =
                  Math.max(
                    0,
                    Number(
                      parking
                        .occupiedSlots ||
                        0
                    ) - 1
                  );

                const availableSlots =
                  Number(
                    parking
                      .availableSlots ||
                      0
                  ) + 1;

                transaction.update(
                  parkingRef,
                  {
                    occupiedSlots,
                    availableSlots,
                    availability:
                      "Available",

                    updatedAt:
                      completedAt,
                  }
                );
              }
            );
          }

          console.log(
            booking.bookingId ||
              bookingDoc.id,
            "completed successfully."
          );
        }
      }
    }
  );