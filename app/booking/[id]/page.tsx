"use client";

import {
  useParams,
  useRouter,
} from "next/navigation";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  increment,
} from "firebase/firestore";
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
  const router = useRouter();
  const searchParams =
  useSearchParams();

const plan =
  searchParams.get("plan") ||
  "Monthly";



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

  const [parkingData, setParkingData] =
  useState<any>(null);

  const parkingAmount =
  parkingData
    ? plan === "Monthly"
      ? Number(parkingData.monthlyPrice)
      : Number(parkingData.yearlyPrice)
    : 0;

const platformFeePercent = 10;

const platformFeeAmount = Math.round(
  parkingAmount * (platformFeePercent / 100)
);

const customerPaidAmount =
  parkingAmount + platformFeeAmount;

const ownerReceivableAmount =
  parkingAmount;

  useEffect(() => {

  const loadParking = async () => {

    const parkingDoc = await getDoc(
      doc(
        db,
        "parkings",
        params.id as string
      )
    );

    if (parkingDoc.exists()) {
      setParkingData(parkingDoc.data());
    }

  };

  loadParking();

}, [params.id]);

  return (
    <>
  <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">

        <h1 className="text-5xl font-bold mb-8">
          Book Parking Slot
        </h1>

<div className="mb-8">

  <h2 className="text-3xl font-bold">
    {parkingData?.title}
  </h2>

  <p className="text-gray-500 text-lg mt-2">
    📍 {parkingData?.location}
  </p>

</div>

       <div className="bg-white border border-green-300 rounded-2xl shadow-sm p-6 mb-8">


  <h2 className="text-xl font-bold text-green-700 mb-5">
    Payment Summary
  </h2>

  <div className="flex justify-between mb-2">
    <span>Parking Charges</span>
    <span>
      ₹{
        plan === "Monthly"
          ? parkingData?.monthlyPrice || 0
          : parkingData?.yearlyPrice || 0
      }
    </span>
  </div>

  <div className="flex justify-between mb-2">
    <span>Platform Fee (10%)</span>
    <span>
      ₹{
        Math.round(
          ((plan === "Monthly"
            ? Number(parkingData?.monthlyPrice || 0)
            : Number(parkingData?.yearlyPrice || 0)) * 10) / 100
        )
      }
    </span>
  </div>

<hr className="my-4 border-green-300" />

<div className="flex justify-between text-2xl font-bold text-green-700">
    <span>Total Payable</span>
    <span>
      ₹{
        (plan === "Monthly"
          ? Number(parkingData?.monthlyPrice || 0)
          : Number(parkingData?.yearlyPrice || 0)) +
        Math.round(
          ((plan === "Monthly"
            ? Number(parkingData?.monthlyPrice || 0)
            : Number(parkingData?.yearlyPrice || 0)) * 10) / 100
        )
      }
    </span>
  </div>



  

</div>

<h2 className="text-2xl font-bold mb-6">
  🚘 Vehicle Details
</h2>

<div className="grid md:grid-cols-2 gap-6">

   

        



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

  // CUSTOMER ALREADY HAS ACTIVE BOOKING?

const existingBookingQuery = query(
  collection(db, "bookings"),
  where(
    "customerUid",
    "==",
    localStorage.getItem("userUid")
  ),
  where(
    "parkingId",
    "==",
    parkingDoc.id
  )
);

const existingBooking =
  await getDocs(existingBookingQuery);

const alreadyBooked =
  existingBooking.docs.find((doc) => {

    const data = doc.data();

    return (
      data.bookingStatus === "Pending Approval" ||
      data.bookingStatus === "Approved"
    );

  });

if (alreadyBooked) {

  alert(
    "You already have an active booking for this parking."
  );

  return;

}





// CHECK WHETHER SOMEONE ELSE HAS ALREADY BOOKED THIS SLOT

const occupiedQuery = query(
  collection(db, "bookings"),
  where(
    "parkingId",
    "==",
    parkingDoc.id
  )
);

const occupiedBooking =
  await getDocs(occupiedQuery);

const activeBooking =
  occupiedBooking.docs.find((doc) => {

    const data = doc.data();

    return (
      data.bookingStatus === "Pending Approval" ||
      data.bookingStatus === "Approved"
    );

  });

if (activeBooking) {

  alert(
    "This parking is already booked."
  );

  return;

}





  // CHECK SLOT AVAILABILITY

if (
  Number(parkingData?.availableSlots) <= 0
) {

  alert(
    "This parking is fully occupied."
  );

  return;

}

  const bookingStart = new Date();

const validTill = new Date(bookingStart);

if (plan === "Monthly") {

  validTill.setMonth(
    validTill.getMonth() + 1
  );

} else {

  validTill.setFullYear(
    validTill.getFullYear() + 1
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

const latestParking = latestParkingDoc.data();

if (!latestParking) {
  alert("Parking data not found");
  return;
}

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

parkingAmount,

platformFeePercent,

platformFeeAmount,

customerPaidAmount,

ownerReceivableAmount,

ownerPayoutStatus:
  "Pending",

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

ownerApprovalStatus:
  "Pending",

paymentStatus:
  "Paid",

 bookingDate: bookingStart,

bookingStartDate:
  bookingStart.toISOString(),


};

    try {



      const options = {
  key: "rzp_test_Su5POE7a3UsqZv",
amount:
  customerPaidAmount * 100,
  currency: "INR",
  name: "CarParking Bangalore",
  description: "Parking Booking Payment",

  handler: async function () {

    console.log("PAYMENT SUCCESS HANDLER CALLED");

  try {
    

    await addDoc(
      collection(db, "bookings"),
      bookingData
    );

    await updateDoc(
  doc(db, "parkings", parkingDoc.id),
  {
    availableSlots: increment(-1),
    occupiedSlots: increment(1),
    availability:
      Number(latestParking.availableSlots) === 1
        ? "Occupied"
        : "Available",
  }
);

    alert("Payment Successful");

    router.push("/bookings");

  } catch (error) {

    console.log(error);

    alert("Booking could not be saved.");

  }

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
  {`🔒 Pay ₹${customerPaidAmount} Securely`}
</button>

      </div>

    </div>
</>
  );
}