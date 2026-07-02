"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { collection, addDoc,doc,
getDoc } from "firebase/firestore";
import {
  db,
  storage,
} from "@/lib/firebase";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function BookingPage() {

  const params = useParams();
  const searchParams =
  useSearchParams();

const plan =
  searchParams.get("plan") ||
  "Monthly";

const [date, setDate] = useState("");
const [time, setTime] = useState("");

const [vehicleType, setVehicleType] =
  useState("Car");

const [vehicleNumber, setVehicleNumber] =
  useState("");

const [vehicleBrand, setVehicleBrand] =
  useState("");

const [vehicleModel, setVehicleModel] =
  useState("");

const [vehicleColor, setVehicleColor] =
  useState("");

  const [vehicleImage, setVehicleImage] =
  useState<File | null>(null);

const [uploading, setUploading] =
  useState(false);

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

        <div className="bg-green-100 border border-green-400 p-4 rounded-2xl mb-8">

  <h2 className="text-2xl font-bold text-green-700">

    Selected Plan: {plan}

  </h2>

  <p className="text-gray-600">

    {
      plan === "Monthly"
        ? "₹3000 / Month"
        : "₹30000 / Year"
    }

  </p>

</div>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-green-100 p-4 rounded-2xl mb-6">

  <h2 className="text-2xl font-bold">

    Selected Plan:
    {plan}

  </h2>

</div>

        

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

<select
  value={vehicleType}
  onChange={(e) =>
    setVehicleType(e.target.value)
  }
  className="border p-4 rounded-2xl"
>
  <option>Car</option>
  <option>Bike</option>
  <option>SUV</option>
  <option>Van</option>
</select>

<input
  type="text"
  placeholder="Vehicle Number"
  value={vehicleNumber}
  onChange={(e) =>
    setVehicleNumber(
      e.target.value
    )
  }
  className="border p-4 rounded-2xl"
/>

<input
  type="text"
  placeholder="Vehicle Brand"
  value={vehicleBrand}
  onChange={(e) =>
    setVehicleBrand(
      e.target.value
    )
  }
  className="border p-4 rounded-2xl"
/>

<input
  type="text"
  placeholder="Vehicle Model"
  value={vehicleModel}
  onChange={(e) =>
    setVehicleModel(
      e.target.value
    )
  }
  className="border p-4 rounded-2xl"
/>

<input
  type="text"
  placeholder="Vehicle Color"
  value={vehicleColor}
  onChange={(e) =>
    setVehicleColor(
      e.target.value
    )
  }
  className="border p-4 rounded-2xl"
/>

<div className="md:col-span-2">

  <label className="block mb-2 font-semibold">
    Vehicle Image (Optional)
  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      if (e.target.files?.[0]) {
        setVehicleImage(
          e.target.files[0]
        );
      }
    }}
    className="w-full border rounded-2xl p-4"
  />

</div>

        </div>

        <button
  onClick={async () => {

    const parkingDoc = await getDoc(
  doc(
    db,
    "parkings",
    params.id as string
  )
);

const parkingData =
  parkingDoc.data();

  // CHECK SLOT AVAILABILITY

if (
  Number(parkingData?.availableSlots) <= 0
) {

  alert(
    "This parking is fully occupied."
  );

  return;

}

  const validTill =
  new Date();

if (plan === "Monthly") {

  validTill.setDate(
    validTill.getDate() + 30
  );

} else {

  validTill.setDate(
    validTill.getDate() + 365
  );

}

let vehicleImageUrl = "";

if (vehicleImage) {

  setUploading(true);

  const imageRef = ref(
    storage,
    `vehicle-images/${Date.now()}-${vehicleImage.name}`
  );

  await uploadBytes(
    imageRef,
    vehicleImage
  );

  vehicleImageUrl =
    await getDownloadURL(imageRef);

  setUploading(false);
}

// RECHECK BEFORE CREATING BOOKING

const latestParkingDoc =
  await getDoc(

    doc(
      db,
      "parkings",
      parkingDoc.id
    )

  );

const latestParking =
  latestParkingDoc.data();

if (
  Number(
    latestParking?.availableSlots
  ) <= 0
) {

  alert(
    "Parking became full. Please try another parking."
  );

  return;

}

const bookingData = {

bookingId:
  "BK" +
  Math.floor(
    1000 +
    Math.random() * 9000
  ),



  customerUid:
    localStorage.getItem(
      "userUid"
    ),



customerName:
  localStorage.getItem(
    "userName"
  ),

customerEmail:
  localStorage.getItem(
    "userEmail"
  ),

customerPhone:
  localStorage.getItem(
    "userPhone"
  ),

 ownerUid:
  parkingData?.ownerUid,

ownerName:
  parkingData?.ownerName,

ownerEmail:
  parkingData?.ownerEmail,

ownerPhone:
  parkingData?.ownerPhone,

ownerPhoto:
  parkingData?.ownerPhoto,



parkingTitle:
  parkingData?.title,

  parkingId: parkingDoc.id,

  

parkingImage:
  parkingData?.image,

parkingLocation:
  parkingData?.location,

parkingType:
  parkingData?.parkingType,

monthlyPrice:
  Number(parkingData?.monthlyPrice),

yearlyPrice:
  Number(parkingData?.yearlyPrice),

  plan,

  amount:
  plan === "Monthly"
    ? 3000
    : 30000,

    validTill:
  validTill.toISOString(),

  vehicleType,

  vehicleNumber:
    vehicleNumber
      .toUpperCase()
      .trim(),

  vehicleBrand,

  vehicleModel,

  vehicleColor,
  vehicleImage:
  vehicleImageUrl,

  bookingStatus:
    "Pending Approval",

  paymentStatus:
    "Paid",

  bookingDate:
    new Date(),

  date,
  time,
};

    try {



      const options = {
  key: "rzp_test_Su5POE7a3UsqZv",
amount:
  (plan === "Monthly"
    ? Number(parkingData?.monthlyPrice)
    : Number(parkingData?.yearlyPrice)) * 100,
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