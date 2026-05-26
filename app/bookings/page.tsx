"use client";

import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function BookingsPage() {

  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {

    const fetchBookings = async () => {

      const querySnapshot = await getDocs(
        collection(db, "bookings")
      );

      const bookingData: any[] = [];

      querySnapshot.forEach((doc) => {

        bookingData.push({
          id: doc.id,
          ...doc.data(),
        });

      });

      setBookings(bookingData);

    };

    fetchBookings();

  }, []);

  return (

    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-bold mb-10">
          My Bookings
        </h1>

        <div className="grid gap-6">

          {bookings.map((booking) => (

            <div
              key={booking.id}
              className="bg-white p-8 rounded-3xl shadow-lg"
            >

              <h2 className="text-2xl font-bold mb-3">
                Parking Booking
              </h2>

              <p className="text-gray-600 mb-2">
                Booking ID: {booking.id}
              </p>

              <p className="text-gray-600 mb-2">
                Name: {booking.name}
              </p>

              <p className="text-gray-600 mb-2">
                Email: {booking.email}
              </p>

              <p className="text-gray-600 mb-2">
                Date: {booking.date}
              </p>

              <p className="text-gray-600 mb-4">
                Time: {booking.time}
              </p>

              <span className="bg-green-500 text-white px-4 py-2 rounded-xl">
                {booking.paymentStatus}
              </span>

              <button

                onClick={async () => {

                  try {

                    await updateDoc(
                      doc(db, "parkings", booking.parkingId),
                      {
                        availability: "Available",
                      }
                    );

                    await deleteDoc(
                      doc(db, "bookings", booking.id)
                    );

                    setBookings(
                      bookings.filter(
                        (item) => item.id !== booking.id
                      )
                    );

                    alert("Booking Cancelled");

                  } catch (error) {

                    console.log(error);

                  }

                }}

                className="bg-red-500 text-white px-4 py-2 rounded-xl ml-4"
              >
                Cancel Booking
              </button>

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}