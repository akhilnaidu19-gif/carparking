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

        <p className="text-gray-600 text-xl mb-4">
          {parking.location}
        </p>

        <span
          className={`inline-block px-4 py-2 rounded-xl text-white font-semibold mb-8 ${
            parking.availability === "Available"
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        >
          {parking.availability}
        </span>

        <div className="grid md:grid-cols-2 gap-6 mb-10">

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

        const options = {
          key: "rzp_test_StbVrnH5ksikrS",
          amount: 30000 * 100,
          currency: "INR",
          name: "CarParking Bangalore",
          description: "Yearly Parking Booking",

          handler: async function () {

            await addDoc(collection(db, "bookings"), {
              parkingId: parking.id,
              title: parking.title,
              location: parking.location,
              paymentStatus: "Paid",
              plan: "Yearly",
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

            alert("Yearly Parking Booked");

          },
        };

        const razor = new (window as any).Razorpay(options);

        razor.open();

      } catch (error) {
        console.log(error);
      }

    }}
    disabled={parking.availability === "Occupied"}
    className="bg-black text-white px-6 py-3 rounded-2xl font-bold disabled:bg-gray-400"
  >
    {parking.availability === "Occupied"
      ? "Already Occupied"
      : "Book Yearly"}
  </button>

</div>

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

    const options = {

      key: "YOUR_RAZORPAY_KEY",

      amount: Number(parking.monthlyPrice) * 100,

      currency: "INR",

      name: "CarParking Bangalore",

      description: "Monthly Parking Booking",

      handler: async function () {

        await addDoc(collection(db, "bookings"), {
          parkingId: parking.id,
          title: parking.title,
          location: parking.location,
          paymentStatus: "Paid",
          plan: "Monthly",
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

        alert("Monthly Parking Booked");

      },

    };

    const razor = new (window as any).Razorpay(options);

    razor.open();

  } catch (error) {

    console.log(error);

  }

}}
              disabled={parking.availability === "Occupied"}
              className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold disabled:bg-gray-400"
            >
              {parking.availability === "Occupied"
                ? "Already Occupied"
                : "Book Monthly"}
            </button>

          </div>

        </div>

      </div>

    </div>
 </>
  );
}