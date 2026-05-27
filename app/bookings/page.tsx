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

      const userEmail =
        localStorage.getItem("userEmail");

      const querySnapshot = await getDocs(
        collection(db, "bookings")
      );

      const bookingData: any[] = [];

      querySnapshot.forEach((doc) => {

        const data = doc.data();

        if (data.email === userEmail) {

          bookingData.push({
            id: doc.id,
            ...data,
          });

        }

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

          {bookings.map((booking) => (<div
  key={booking.id}
  className="bg-white rounded-3xl shadow-xl overflow-hidden"
>

  <img
    src={booking.image}
    alt={booking.title}
    className="w-full h-72 object-cover"
  />

  <div className="p-8">

    <div className="flex justify-between items-start mb-6">

      <div>

        <h2 className="text-4xl font-bold mb-2">
          {booking.title}
        </h2>

        <p className="text-gray-500 text-lg">
          {booking.location}
        </p>

      </div>

      <span
        className={`px-5 py-3 rounded-2xl text-white font-bold ${
          booking.paymentStatus === "Paid"
            ? "bg-green-500"
            : "bg-red-500"
        }`}
      >
        {booking.paymentStatus}
      </span>

    </div>

    {/* OWNER */}

    <div className="bg-gray-100 rounded-3xl p-5 flex items-center gap-5 mb-8">

      <img
        src={
          booking.ownerPhoto ||
          "https://via.placeholder.com/100"
        }
        className="w-20 h-20 rounded-full object-cover"
      />

      <div>

        <h3 className="text-2xl font-bold">
          {booking.owner || "Owner"}
        </h3>

        <p className="text-gray-500">
          Parking Owner
        </p>

      </div>

    </div>

    {/* DETAILS */}

    <div className="grid md:grid-cols-2 gap-5 mb-8">

      <div className="bg-gray-100 p-5 rounded-2xl">

        <p className="text-gray-500 mb-1">
          Booking ID
        </p>

        <p className="font-bold">
          {booking.id}
        </p>

      </div>

      <div className="bg-gray-100 p-5 rounded-2xl">

        <p className="text-gray-500 mb-1">
          Plan
        </p>

        <p className="font-bold">
          {booking.plan}
        </p>

      </div>

      <div className="bg-gray-100 p-5 rounded-2xl">

        <p className="text-gray-500 mb-1">
          Booking Date
        </p>

        <p className="font-bold">
          {booking.bookingDate}
        </p>

      </div>

      <div className="bg-gray-100 p-5 rounded-2xl">

        <p className="text-gray-500 mb-1">
          Valid Till
        </p>

        <p className="font-bold">
          {booking.validTill}
        </p>

      </div>

    </div>

    {/* ACTIONS */}

    <div className="flex flex-col md:flex-row gap-4">

      <a
        href={
          booking.latitude &&
          booking.longitude
            ? `https://www.google.com/maps?q=${booking.latitude},${booking.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                booking.location
              )}`
        }
        target="_blank"
        className="flex-1 bg-black text-white py-4 rounded-2xl font-bold text-center"
      >
        Open Location
      </a>

      <button

        onClick={async () => {

          try {

            if (
              booking.parkingId &&
              booking.parkingId !== ""
            ) {

              await updateDoc(
                doc(
                  db,
                  "parkings",
                  booking.parkingId
                ),
                {
                  availability: "Available",
                }
              );

            }

            await deleteDoc(
              doc(db, "bookings", booking.id)
            );

            setBookings(
              bookings.filter(
                (item) =>
                  item.id !== booking.id
              )
            );

            alert("Booking Cancelled");

          } catch (error) {

            console.log(error);

          }

        }}

        className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-bold"
      >
        Cancel Booking
      </button>

    </div>

  </div>

</div>

          ))}

        </div>

      </div>

    </div>

  );

}