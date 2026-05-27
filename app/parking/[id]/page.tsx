"use client";

import Script from "next/script";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function ParkingDetailsPage() {

  const params = useParams();

  const [parking, setParking] = useState<any>(null);

  useEffect(() => {

    const fetchParking = async () => {

      const docRef = doc(
        db,
        "parkings",
        params.id as string
      );

      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {

        setParking({
          id: docSnap.id,
          ...docSnap.data(),
        });

      }

    };

    fetchParking();

  }, []);

  if (!parking) {
    return <h1 className="p-10">Loading...</h1>;
  }

  const handleBooking = async (plan: string) => {

    try {

      await addDoc(collection(db, "bookings"), {

  parkingId: parking.id,

  title: parking.title,

  image: parking.image,

  owner: parking.owner || "Parking Owner",
  ownerPhoto: parking.ownerPhoto,

  latitude: parking.latitude,

  longitude: parking.longitude,

  location: parking.location,

  paymentStatus: "Paid",

  plan: plan,

  email: localStorage.getItem("userEmail"),

  name: localStorage.getItem("userName"),

  bookingDate: new Date().toLocaleDateString(),

  bookingTime: new Date().toLocaleTimeString(),

  validTill:
    plan === "Monthly"
      ? new Date(
          Date.now() +
            30 * 24 * 60 * 60 * 1000
        ).toLocaleDateString()
      : new Date(
          Date.now() +
            365 * 24 * 60 * 60 * 1000
        ).toLocaleDateString(),

});

      await updateDoc(
        doc(db, "parkings", parking.id),
        {
          availability: "Occupied",
        }
      );

      setParking({
        ...parking,
        availability: "Occupied",
      });

      alert(`${plan} Parking Booked`);

    } catch (error) {

      console.log(error);

    }

  };

  return (

    <>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <div className="min-h-screen bg-gray-100">

        <div
          className="h-[400px] bg-cover bg-center"
          style={{
            backgroundImage: `url(${parking.image})`,
          }}
        ></div>

        <div className="max-w-6xl mx-auto px-6 py-12">

          <h1 className="text-5xl font-bold mb-4">
            {parking.title}
          </h1>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 flex items-center gap-5">

  <img
    src={
      parking.ownerPhoto ||
      "https://via.placeholder.com/100"
    }
    className="w-20 h-20 rounded-full object-cover"
  />

  <div>

    <h2 className="text-2xl font-bold">

      {parking.ownerName}

    </h2>

    <p className="text-gray-600">

      {parking.ownerCity}

    </p>

    <p className="text-green-600 font-bold">

      {parking.ownerPhone}

    </p>

  </div>

</div>

          <p className="text-gray-600 text-xl mb-6">
  {parking.location}
</p>

<div className="flex flex-col md:flex-row gap-4 mb-8">

  <span
    className={`inline-block px-6 py-3 rounded-2xl text-white font-semibold ${
      parking.availability === "Available"
        ? "bg-green-500"
        : "bg-red-500"
    }`}
  >

    {parking.availability}

  </span>

  <a
    href={
      parking.latitude &&
      parking.longitude
        ? `https://www.google.com/maps?q=${parking.latitude},${parking.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            parking.location
          )}`
    }
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block bg-black text-white px-6 py-3 rounded-2xl font-bold text-center"
  >

    Open Exact Location

  </a>

</div>
            <div className="bg-white p-8 rounded-3xl shadow-lg mb-8">

  <h2 className="text-3xl font-bold mb-4">

    Parking Details

  </h2>

  <p className="text-gray-700 text-lg mb-4">

    {parking.description}

  </p>

  <div className="grid md:grid-cols-2 gap-4">

    <div className="bg-gray-100 p-4 rounded-2xl">

      <p className="font-bold">
        Parking Type
      </p>

      <p>
        {parking.parkingType}
      </p>

    </div>

    <div className="bg-gray-100 p-4 rounded-2xl">

      <p className="font-bold">
        CCTV
      </p>

      <p>
        {parking.cctv}
      </p>

    </div>

  </div>

</div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-10">

            {/* Monthly Plan */}

            <div className="bg-white p-8 rounded-3xl shadow-lg">

              <h2 className="text-2xl font-bold mb-4">
                Monthly Plan
              </h2>

              <p className="text-4xl font-bold text-green-600 mb-4">
                ₹{parking.monthlyPrice}/month
              </p>

              <button

  onClick={async () => {

    try {

      const response = await fetch(
        "/api/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            amount:
              Number(
                parking.monthlyPrice
              ),
          }),
        }
      );

      const order =
        await response.json();

      const options = {

        key:
          process.env
            .NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount: order.amount,

        currency: order.currency,

        order_id: order.id,

        name:
          "CarParking Bangalore",

        description:
          "Monthly Parking Booking",

        handler:
          async function (
            response: any
          ) {

            console.log(
              "PAYMENT SUCCESS",
              response
            );

            await handleBooking(
              "Monthly"
            );

          },

        prefill: {

          name:
            localStorage.getItem(
              "userName"
            ) || "",

          email:
            localStorage.getItem(
              "userEmail"
            ) || "",

        },

        theme: {

          color: "#22c55e",

        },

      };

      const razorpay =
        new (window as any).Razorpay(
          options
        );

      razorpay.open();

    } catch (error) {

      console.log(error);

      alert(
        "Payment Failed"
      );

    }

  }}

  disabled={
    parking.availability === "Occupied"
  }

  className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold disabled:bg-gray-400"
>
                {parking.availability === "Occupied"
                  ? "Already Occupied"
                  : "Book Monthly"}
              </button>

            </div>

            {/* Yearly Plan */}

            <div className="bg-white p-8 rounded-3xl shadow-lg">

              <h2 className="text-2xl font-bold mb-4">
                Yearly Plan
              </h2>

              <p className="text-4xl font-bold text-black mb-4">
                ₹30000/year
              </p>

              <button

  onClick={async () => {

    try {

      const response = await fetch(
        "/api/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            amount: 30000,
          }),
        }
      );

      const order =
        await response.json();

      const options = {

        key:
          process.env
            .NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount: order.amount,

        currency: order.currency,

        order_id: order.id,

        name:
          "CarParking Bangalore",

        description:
          "Yearly Parking Booking",

        handler:
          async function (
            response: any
          ) {

            console.log(
              "PAYMENT SUCCESS",
              response
            );

            await handleBooking(
              "Yearly"
            );

          },

        prefill: {

          name:
            localStorage.getItem(
              "userName"
            ) || "",

          email:
            localStorage.getItem(
              "userEmail"
            ) || "",

        },

        theme: {

          color: "#000000",

        },

      };

      const razorpay =
        new (window as any).Razorpay(
          options
        );

      razorpay.open();

    } catch (error) {

      console.log(error);

      alert(
        "Payment Failed"
      );

    }

  }}

  disabled={
    parking.availability === "Occupied"
  }

  className="bg-black text-white px-6 py-3 rounded-2xl font-bold disabled:bg-gray-400"
>
                {parking.availability === "Occupied"
                  ? "Already Occupied"
                  : "Book Yearly"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </>

  );

}