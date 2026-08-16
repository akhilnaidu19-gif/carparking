"use client";

import { useState } from "react";
import {
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type BookingsProps = {
  bookings: any[];
};

export default function Bookings({
  bookings,
}: BookingsProps) {
  const [bookingSearch, setBookingSearch] =
    useState("");

  const [bookingPage, setBookingPage] =
    useState(1);

  const bookingsPerPage = 5;

  const filteredBookings =
    bookings.filter((booking) => {
      const searchValue =
        bookingSearch
          .trim()
          .toLowerCase();

      return (
        (booking.bookingId || "")
          .toLowerCase()
          .includes(searchValue) ||
        (booking.customerId || "")
          .toLowerCase()
          .includes(searchValue) ||
        (
          booking.customerName ||
          booking.name ||
          ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        (
          booking.customerEmail ||
          booking.email ||
          ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        (booking.customerPhone || "")
          .toLowerCase()
          .includes(searchValue) ||
        (
          booking.parkingTitle ||
          booking.title ||
          ""
        )
          .toLowerCase()
          .includes(searchValue) ||
        (
          booking.parkingLocation ||
          booking.location ||
          ""
        )
          .toLowerCase()
          .includes(searchValue)
      );
    });

  const totalBookingPages =
    Math.ceil(
      filteredBookings.length /
        bookingsPerPage
    );

  const paginatedBookings =
    filteredBookings.slice(
      (bookingPage - 1) *
        bookingsPerPage,
      bookingPage *
        bookingsPerPage
    );

  const formatDate = (
    dateValue: any
  ) => {
    if (!dateValue) {
      return "N/A";
    }

    if (dateValue?.seconds) {
      return new Date(
        dateValue.seconds * 1000
      ).toLocaleString();
    }

    const convertedDate =
      new Date(dateValue);

    if (
      Number.isNaN(
        convertedDate.getTime()
      )
    ) {
      return String(dateValue);
    }

    return convertedDate.toLocaleString();
  };

  const handleCancelBooking =
    async (booking: any) => {
      const confirmCancel =
        confirm(
          `Cancel booking ${
            booking.bookingId || ""
          }?`
        );

      if (!confirmCancel) {
        return;
      }

      try {
        /*
         * First release the parking slot.
         * This follows the same behaviour
         * currently present in page.tsx.
         */
        if (booking.parkingId) {
          await updateDoc(
            doc(
              db,
              "parkings",
              booking.parkingId
            ),
            {
              availability:
                "Available",

              occupiedSlots: 0,

              availableSlots: 1,

              updatedAt:
                new Date(),
            }
          );
        }

        /*
         * The current admin code deletes
         * the booking document completely.
         */
        await deleteDoc(
          doc(
            db,
            "bookings",
            booking.id
          )
        );

        alert(
          "Booking Cancelled Successfully"
        );

        /*
         * Move to the previous page when
         * the last item on the current page
         * was removed.
         */
        if (
          paginatedBookings.length === 1 &&
          bookingPage > 1
        ) {
          setBookingPage(
            bookingPage - 1
          );
        }
      } catch (error) {
        console.error(
          "Unable to cancel booking:",
          error
        );

        alert(
          "Unable to cancel booking"
        );
      }
    };

  return (
    <>
      {/* BOOKINGS MANAGEMENT */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

        <div className="mb-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

            <h2 className="text-4xl font-bold">
              Booking Management
            </h2>

            <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold">
              {filteredBookings.length}{" "}
              Bookings
            </div>

          </div>

          <input
            type="text"
            placeholder="Search Booking ID, Customer ID, Name, Email, Phone, Parking..."
            value={bookingSearch}
            onChange={(event) => {
              setBookingSearch(
                event.target.value
              );

              setBookingPage(1);
            }}
            className="border p-4 rounded-2xl w-full"
          />

        </div>

        {paginatedBookings.length ===
        0 ? (

          <div className="bg-gray-50 border rounded-3xl p-10 text-center">

            <h3 className="text-2xl font-bold text-gray-600">
              No bookings found
            </h3>

            <p className="text-gray-500 mt-2">
              Try changing the booking
              search value.
            </p>

          </div>

        ) : (

          <div className="grid gap-6">

            {paginatedBookings.map(
              (booking) => (

                <div
                  key={booking.id}
                  className="bg-gray-50 border rounded-3xl p-6"
                >

                  <div className="flex flex-wrap gap-3 mb-6">

                    <span className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold">
                      Booking ID:{" "}
                      {booking.bookingId ||
                        "N/A"}
                    </span>

                    <span
                      className={`px-4 py-2 rounded-xl font-bold text-white ${
                        booking.bookingStatus ===
                        "Approved"
                          ? "bg-green-600"
                          : booking.bookingStatus ===
                              "Rejected" ||
                            booking.bookingStatus ===
                              "Cancelled"
                          ? "bg-red-600"
                          : booking.bookingStatus ===
                            "Completed"
                          ? "bg-blue-600"
                          : "bg-orange-500"
                      }`}
                    >
                      {booking.bookingStatus ||
                        "Pending Approval"}
                    </span>

                    <span
                      className={`px-4 py-2 rounded-xl font-bold text-white ${
                        booking.paymentStatus ===
                          "Paid" ||
                        booking.paymentStatus ===
                          "Completed"
                          ? "bg-green-600"
                          : booking.paymentStatus ===
                            "Refunded"
                          ? "bg-purple-600"
                          : "bg-orange-500"
                      }`}
                    >
                      Payment:{" "}
                      {booking.paymentStatus ||
                        "N/A"}
                    </span>

                  </div>

                  <div className="grid md:grid-cols-4 gap-8">

                    <div>

                      <p className="text-gray-500">
                        Customer
                      </p>

                      <h3 className="font-bold text-xl">
                        {booking.customerName ||
                          "Customer Name Not Available"}
                      </h3>

                      <p className="text-gray-600">
                        Customer ID:{" "}
                        {booking.customerId ||
                          "N/A"}
                      </p>

                      <p className="break-words text-gray-600 max-w-xs">
                        {booking.customerEmail ||
                          "Email Not Available"}
                      </p>

                      <p className="text-gray-600">
                        {booking.customerPhone ||
                          "Phone Not Available"}
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500">
                        Parking
                      </p>

                      <h3 className="font-bold">
                        {booking.parkingTitle ||
                          "Parking Name Not Available"}
                      </h3>

                      <p>
                        {booking.parkingLocation ||
                          "Location Not Available"}
                      </p>

                      <p className="text-gray-600 mt-2">
                        Parking ID:{" "}
                        {booking.parkingId ||
                          "N/A"}
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500">
                        Plan
                      </p>

                      <h3 className="font-bold">
                        {booking.plan ||
                          "N/A"}
                      </h3>

                      <p>
                        Valid From:{" "}
                        {formatDate(
                          booking.validFrom
                        )}
                      </p>

                      <p>
                        Valid Till:{" "}
                        {formatDate(
                          booking.validTill
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500">
                        Payment
                      </p>

                      <h3 className="font-bold text-green-600">
                        {booking.paymentStatus ||
                          "N/A"}
                      </h3>

                      <p className="font-bold">
                        ₹
                        {Number(
                          booking.customerPaidAmount ||
                            booking.parkingAmount ||
                            0
                        )}
                      </p>

                      <p className="text-gray-600">
                        Booked On:{" "}
                        {formatDate(
                          booking.bookingDate ||
                            booking.createdAt
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="mt-6 flex flex-wrap gap-4">

                    <button
                      onClick={() =>
                        handleCancelBooking(
                          booking
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold"
                    >
                      Cancel Booking
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

        {filteredBookings.length >
          0 && (

          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-8">

            <button
              disabled={
                bookingPage === 1
              }
              onClick={() =>
                setBookingPage(
                  (currentPage) =>
                    currentPage - 1
                )
              }
              className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
            >
              Previous
            </button>

            <span className="font-bold">

              Showing{" "}

              {(bookingPage - 1) *
                bookingsPerPage +
                1}

              {" - "}

              {Math.min(
                bookingPage *
                  bookingsPerPage,
                filteredBookings.length
              )}

              {" of "}

              {filteredBookings.length}

            </span>

            <button
              disabled={
                bookingPage >=
                totalBookingPages
              }
              onClick={() =>
                setBookingPage(
                  (currentPage) =>
                    currentPage + 1
                )
              }
              className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
            >
              Next
            </button>

          </div>

        )}

      </div>
    </>
  );
}