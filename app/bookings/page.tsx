"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";

import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";



export default function BookingsPage() {

  const isExpired = (
  validTill: string
) => {

  const expiryDate =
    new Date(validTill);

  const today =
    new Date();

  return (
    expiryDate < today
  );

};

  const [bookings, setBookings] = useState<any[]>([]);

  const [
  bookingFilter,
  setBookingFilter
] = useState("Active");
  const getBookingStatus = (
  validTill: string
) => {

  

  const expiryDate =
    new Date(validTill);

  const today =
    new Date();

  const diffTime =
    expiryDate.getTime() -
    today.getTime();

  const daysLeft =
    Math.ceil(
      diffTime /
        (1000 * 60 * 60 * 24)
    );

  if (daysLeft < 0)
    return {
      text: "Expired",
      color: "bg-red-500",
    };

  if (daysLeft <= 7)
    return {
      text: `Expires in ${daysLeft} days`,
      color: "bg-orange-500",
    };

  return {
    text: "Active",
    color: "bg-green-500",
  };

};
const getDaysRemaining = (
  validTill: string
) => {

  

  const expiryDate =
    new Date(validTill);

  const today =
    new Date();

  const diffTime =
    expiryDate.getTime() -
    today.getTime();

  const daysLeft =
    Math.ceil(
      diffTime /
      (1000 * 60 * 60 * 24)
    );

  return daysLeft;

};

const activeBookings =
  bookings.filter(
    (booking) =>
      booking.bookingStatus ===
        "Approved" &&
      !isExpired(
        booking.validTill
      )
  );

const pendingBookings =
  bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      "Pending Approval"
  );

const rejectedBookings =
  bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      "Rejected"
  );

const expiredBookings =
  bookings.filter(
    (booking) =>
      isExpired(
        booking.validTill
      )
  );

  const visibleBookings =
  bookingFilter === "Active"
    ? activeBookings
    : bookingFilter ===
      "Pending"
    ? pendingBookings
    : bookingFilter ===
      "Rejected"
    ? rejectedBookings
    : expiredBookings;


  const qrRefs = useRef<any>({});

  useEffect(() => {

    const fetchBookings = async () => {

      const userUid =
  localStorage.getItem(
    "userUid"
  );

      const querySnapshot = await getDocs(
        collection(db, "bookings")
      );

      const bookingData: any[] = [];

      querySnapshot.forEach((docSnapshot) => {

  const data =
    docSnapshot.data();

  if (
  data.customerUid ===
  userUid
) {

    if (
      isExpired(
        data.validTill
      )
    ) {

      updateDoc(

        doc(
          db,
          "parkings",
          data.parkingId
        ),

        {
          availability:
            "Available",
        }

      ).catch(
        console.error
      );

    }

    bookingData.push({

      id:
        docSnapshot.id,

      ...data,

    });

  }

});

 

      setBookings(bookingData);

    };

    fetchBookings();

  }, []);

 return (

  <>

    <Script src="https://checkout.razorpay.com/v1/checkout.js" />

    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-bold mb-10">
          My Bookings
        </h1>

        <div className="flex flex-wrap gap-4 mb-10">

  <button
    onClick={() =>
      setBookingFilter("Active")
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      bookingFilter === "Active"
        ? "bg-green-600 text-white"
        : "bg-gray-200"
    }`}
  >
    🟢 Active (
    {activeBookings.length}
    )
  </button>

  <button
    onClick={() =>
      setBookingFilter("Pending")
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      bookingFilter === "Pending"
        ? "bg-yellow-500 text-white"
        : "bg-gray-200"
    }`}
  >
    🟡 Pending (
    {pendingBookings.length}
    )
  </button>

  <button
    onClick={() =>
      setBookingFilter("Rejected")
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      bookingFilter === "Rejected"
        ? "bg-red-600 text-white"
        : "bg-gray-200"
    }`}
  >
    🔴 Rejected (
    {rejectedBookings.length}
    )
  </button>

  <button
    onClick={() =>
      setBookingFilter("Expired")
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      bookingFilter === "Expired"
        ? "bg-black text-white"
        : "bg-gray-200"
    }`}
  >
    ⚫ Expired (
    {expiredBookings.length}
    )
  </button>

</div>

        <div className="grid gap-6">

          {visibleBookings.map((booking) => (<div
  key={booking.bookingId}
  className="bg-white rounded-3xl shadow-xl overflow-hidden"
>

<div className="relative">


    {booking.parkingImage ? (

  <img
    src={booking.parkingImage}
alt={booking.parkingTitle}
    className="w-full h-48 object-cover"
  />

) : (

  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">

    No Parking Image

  </div>

)}

  <div className="absolute top-4 right-4 flex gap-2">

    <span
      className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold"
    >
      {booking.paymentStatus}
    </span>

    <span
      className={`px-4 py-2 rounded-xl text-white font-bold ${
        booking.bookingStatus === "Approved"
          ? "bg-green-600"
          : booking.bookingStatus === "Rejected"
          ? "bg-red-600"
          : "bg-yellow-500"
      }`}
    >
      {booking.bookingStatus}
    </span>

  </div>

</div>

  <div className="p-8">

    <div className="flex justify-between items-start mb-6">

      <div>

        <h2 className="text-4xl font-bold mb-2">
          {booking.parkingTitle}
        </h2>

        <p className="text-gray-500 text-lg">
          {booking.parkingLocation}
        </p>

      </div>

      

    </div>

  {/* OWNER */}

<div className="bg-gray-100 rounded-3xl p-5 flex items-center gap-5 mb-8">

  <img
    src={
  booking.ownerPhoto ||
  "/default-user.png"
}
    className="w-20 h-20 rounded-full object-cover"
  />

  <div>

    <h3 className="text-2xl font-bold">
      {booking.ownerName || "Owner"}
    </h3>

    {booking.vehicleImage && (

  <img
    src={booking.vehicleImage}
    alt="Vehicle"
    className="w-full h-40 object-cover rounded-xl mb-4"
  />

)}

    <p className="text-gray-500">
      Parking Owner
    </p>

    <p className="text-green-600 font-bold">
      📞 {booking.ownerPhone || "Phone Not Available"}
    </p>

    <p className="text-blue-600">
      ✉️ {booking.ownerEmail || "Email Not Available"}
    </p>

  </div>

</div>

    {/* DETAILS */}

    <div className="grid md:grid-cols-5 gap-3 mb-8">

      <div className="bg-gray-100 p-3 rounded-2xl">

        <p className="text-gray-500 mb-1">
          Booking ID
        </p>

        <p className="font-semibold text-sm">
          {booking.bookingId}
        </p>

      </div>

      <div className="bg-gray-100 p-3 rounded-2xl">

        <p className="text-gray-500 mb-1">
          Plan
        </p>

        <p className="font-semibold text-sm">
          {booking.plan}
        </p>

      </div>

      <div className="bg-gray-100 p-3 rounded-2xl">

        <p className="text-gray-500 mb-1">
          Booking Date
        </p>

        <p className="font-semibold text-sm">
          {booking.bookingDate?.seconds
  ? new Date(
      booking.bookingDate.seconds * 1000
    ).toLocaleString()
  : "N/A"}
        </p>

      </div>

      <div className="bg-gray-100 p-3 rounded-2xl">

  <p className="font-semibold text-green-600 text-sm">
    Amount Paid
  </p>

  <p className="font-bold text-green-600">
    ₹{booking.amount || 0}
  </p>

</div>

      <div className="bg-gray-100 p-3 rounded-2xl">

        <p className="text-gray-500 mb-1">
          Valid Till
        </p>

        <div>

<p className="font-semibold text-sm">
  {new Date(
    booking.validTill
  ).toLocaleDateString()}
</p>

  <p className="text-blue-600 font-bold mt-2">

  Days Remaining:

  {getDaysRemaining(
    booking.validTill
  )}

</p>

  <div
    className={`mt-3 inline-block px-4 py-2 rounded-xl text-white font-bold ${
      getBookingStatus(
        booking.validTill
      ).color
    }`}
  >

    {
      getBookingStatus(
        booking.validTill
      ).text
    }

  </div>

</div>

      </div>

    </div>

    {/* ACTIONS */}

    {/* BOOKING QR */}

<details className="bg-gray-100 rounded-3xl p-6 mb-8">

  <summary className="text-2xl font-bold cursor-pointer">

    Booking QR Pass

  </summary>



  <div className="flex flex-col items-center">

    <QRCodeCanvas
  ref={(el) => {
    qrRefs.current[booking.id] = el;
  }}
value={JSON.stringify({
  bookingId: booking.id,
  parking:
  booking.parkingTitle,
  customer: booking.customerName,
  validTill: booking.validTill,
})}
  size={180}
/>

    <p className="mt-4 text-gray-600 text-center">

      Show this QR code to the parking owner

    </p>

  </div>

</details>

    <div className="flex flex-col md:flex-row gap-4">

      <a
  href={
    booking.latitude &&
    booking.longitude
      ? `https://www.google.com/maps?q=${booking.latitude},${booking.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          booking.parkingLocation
        )}`
  }
  target="_blank"
  className="flex-1 bg-black text-white py-4 rounded-2xl font-bold text-center"
>
  Open Location
</a>

<a
  href={`https://wa.me/91${booking.ownerPhone}?text=${encodeURIComponent(
    `Hello ${booking.ownerName},

I booked your parking space:

${booking.parkingTitle}

Booking ID: ${booking.bookingId}

Please share further details.`
  )}`}
  target="_blank"
  className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold text-center"
>
  WhatsApp Owner
</a>

<button

  onClick={() => {

    const canvas =
      qrRefs.current[
        booking.id
      ];

    if (!canvas) return;

    const url =
      canvas.toDataURL(
        "image/png"
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `booking-${booking.bookingId}.png`;

    link.click();

  }}

  className="flex-1 bg-blue-500 text-white py-4 rounded-2xl font-bold"

>

  Download Pass

</button>

<button

  onClick={async () => {

    try {

      const amount =
        Number(
          booking.amount || 0
        );

      const options = {

        key: process.env
          .NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount:
          amount * 100,

        currency: "INR",

        name:
          "CarParking Bangalore",

        description:
          "Booking Renewal",

        handler:
          async function (
            response: any
          ) {

            try {

              const currentExpiry =
                new Date(
                  booking.validTill
                );

              const newExpiry =
                new Date(
                  currentExpiry
                );

              if (
                booking.plan ===
                "Monthly"
              ) {

                newExpiry.setDate(
                  newExpiry.getDate() +
                    30
                );

              } else {

                newExpiry.setDate(
                  newExpiry.getDate() +
                    365
                );

              }

              await updateDoc(

                doc(
                  db,
                  "bookings",
                  booking.id
                ),

                {

                  validTill:
                    newExpiry.toLocaleDateString(),

                }

              );

              await addDoc(

                collection(
                  db,
                  "notifications"
                ),

                {

                  ownerEmail:
                    booking.ownerEmail || "",

                  title:
                    "Booking Renewed",

                  message:
  `${booking.customerName} renewed ${booking.parkingTitle}`,

                  createdAt:
                    new Date(),

                  read: false,

                }

              );

              alert(
                "Renewal Successful"
              );

              window.location.reload();

            } catch (error) {

              console.log(error);

              alert(
                "Renewal Update Failed"
              );

            }

          },

        prefill: {
  name: booking.customerName || "",
  email: booking.customerEmail || "",
},

        theme: {

          color: "#16a34a",

        },

      };

      const razorpay =
        new (window as any)
          .Razorpay(
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

  className="flex-1 bg-yellow-500 text-white py-4 rounded-2xl font-bold"

>

  Renew Booking

</button>

{isExpired(
  booking.validTill
) && (

  <button

    onClick={async () => {

      try {

        await updateDoc(

          doc(
            db,
            "parkings",
            booking.parkingId
          ),

          {

            availability:
              "Available",

          }

        );

        alert(
          "Parking Released"
        );

        window.location.reload();

      } catch (error) {

        console.log(error);

      }

    }}

    className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold"

  >

    Release Parking

  </button>

)}

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

  </>

  );

}