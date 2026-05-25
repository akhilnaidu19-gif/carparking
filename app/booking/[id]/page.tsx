"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Script from "next/script";

export default function BookingPage() {

  const params = useParams();
  const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [date, setDate] = useState("");
const [time, setTime] = useState("");

  return (
    <>
  <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">

        <h1 className="text-5xl font-bold mb-8">
          Book Parking Slot
        </h1>

        <p className="text-xl text-gray-600 mb-10">
          Booking Parking ID: {params.id}
        </p>

        <div className="grid md:grid-cols-2 gap-6">

          <input
  type="text"
  placeholder="Your Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  className="border p-4 rounded-2xl"
/>

         <input
  type="email"
  placeholder="Your Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="border p-4 rounded-2xl"
/>

         <input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
  className="border p-4 rounded-2xl"
/>

          <input
  type="time"
  value={time}
  onChange={(e) => setTime(e.target.value)}
  className="border p-4 rounded-2xl"
/>

        </div>

        <button
  onClick={async () => {

   const bookingData = {
  parkingId: params.id,
  name,
  email,
  date,
  time,
  paymentStatus: "Paid",
};

    try {

      await addDoc(
        collection(db, "bookings"),
        bookingData
      );

      const options = {
  key: "rzp_test_StbVrnH5ksikrS",
  amount: 50000,
  currency: "INR",
  name: "CarParking Bangalore",
  description: "Parking Booking Payment",

  handler: async function () {

    alert("Payment Successful");

    await addDoc(
      collection(db, "bookings"),
      bookingData
    );

  },

  theme: {
    color: "#22c55e",
  },
};

const razorpay = new (window as any).Razorpay(options);

razorpay.open();

    } catch (error) {
      console.log(error);
    }

  }}
  className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-xl mt-8"
>
  Pay & Confirm Booking
</button>

      </div>

    </div>
</>
  );
}