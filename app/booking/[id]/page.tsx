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
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function BookingPage() {

  

  const params = useParams();
  const router = useRouter();


const [currentUser, setCurrentUser] = useState<any>(null);
const [currentUserData, setCurrentUserData] = useState<any>(null);

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
    ? Number(parkingData.monthlyPrice)
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

useEffect(() => {
  const auth = getAuth(app);

  const unsubscribe = onAuthStateChanged(auth, async (loggedUser) => {
    if (!loggedUser) {
      alert("Please login to book parking.");
      router.push("/login");
      return;
    }

    setCurrentUser(loggedUser);

    const userDoc = await getDoc(
      doc(db, "users", loggedUser.uid)
    );

    if (userDoc.exists()) {
      setCurrentUserData(userDoc.data());
    } else {
      alert("User profile not found.");
      router.push("/profile");
    }
  });

  return () => unsubscribe();
}, [router]);

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
      ₹{parkingData?.monthlyPrice || 0}
    </span>
  </div>

  <div className="flex justify-between mb-2">
    <span>Platform Fee (10%)</span>
    <span>
  ₹{platformFeeAmount}
</span>
  </div>

<hr className="my-4 border-green-300" />

<div className="flex justify-between text-2xl font-bold text-green-700">
  <span>Total Payable</span>

  <span>
    ₹{customerPaidAmount}
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

    const parkingRef = doc(
  db,
  "parkings",
  params.id as string
);

const parkingDoc = await getDoc(parkingRef);

if (!parkingDoc.exists()) {
  alert("Parking not found.");
  return;
}

const parkingData = parkingDoc.data();

  if (!parkingData) {
  alert("Parking not found");
  return;
}

  // CUSTOMER ALREADY HAS ACTIVE BOOKING?

const existingBookingQuery = query(
  collection(db, "bookings"),
where(
  "customerUid",
  "==",
  currentUser.uid
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

validTill.setMonth(
  validTill.getMonth() + 1
);

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
  await getDoc(parkingRef);

const latestParking = latestParkingDoc.data();

if (!latestParking) {
  alert("Parking data not found");
  return;
}

// Get Customer Details
const customerDoc = await getDoc(
doc(
  db,
  "users",
  currentUser.uid
)
);

const customerData = customerDoc.exists()
  ? customerDoc.data()
  : null;

  // Get Owner Details
const ownerDoc = await getDoc(
doc(
  db,
  "users",
  parkingData?.ownerUid || ""
)
);

const ownerData = ownerDoc.exists()
  ? ownerDoc.data()
  : null;

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



customerUid: currentUser.uid,
customerId: currentUserData?.userId || "",
customerName: currentUserData?.name || "",
customerEmail: currentUser.email || currentUserData?.email || "",
customerPhone: currentUserData?.phone || "",
customerPhoto:
  currentUserData?.photoURL ||
  currentUserData?.photo ||
  "",

  
ownerUid:
  parkingData?.ownerUid,

ownerId:
  parkingData?.ownerId,

ownerName:
  parkingData?.ownerName,

ownerEmail:
  parkingData?.ownerEmail,

ownerPhone:
  parkingData?.ownerPhone,

ownerPhoto:
  ownerData?.photo || "",



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


 plan: "Monthly",

parkingAmount,

platformFeePercent,

platformFeeAmount,

customerPaidAmount,

ownerReceivableAmount,

ownerPayoutStatus:
  "Not Eligible",

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
  "Pending Verification",

 bookingDate: bookingStart,

bookingStartDate:
  bookingStart.toISOString(),


};

try {
  if (!currentUser || !currentUserData) {
    alert("User data is still loading. Please try again.");
    return;
  }

  const orderResponse = await fetch(
    "/api/create-order",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: customerPaidAmount,
      }),
    }
  );

  const orderResult = await orderResponse.json();

  if (!orderResponse.ok || !orderResult.success) {
    alert(
      orderResult.message ||
      "Unable to create payment order."
    );
    return;
  }

const razorpayOrder =
  orderResult.order;

if (!razorpayOrder?.id) {
  alert(
    "Razorpay Order ID was not generated."
  );
  return;
}

const options = {
key:
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
amount:
  customerPaidAmount * 100,
currency: "INR",

order_id: razorpayOrder.id,

name: "CarParking Bangalore",
  description: "Parking Booking Payment",

  prefill: {
  name:
    currentUserData?.name || "",

  email:
    currentUserData?.email ||
    currentUser?.email ||
    "",

  contact:
    currentUserData?.phone || "",
},

handler: async function (
  response: any
) {
  console.log(
    "PAYMENT SUCCESS HANDLER CALLED"
  );

  console.log(
    "Razorpay Response:",
    response
  );

  try {
    const verificationResponse =
      await fetch(
        "/api/verify-payment",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            razorpayOrderId:
              response
                .razorpay_order_id,

            razorpayPaymentId:
              response
                .razorpay_payment_id,

            razorpaySignature:
              response
                .razorpay_signature,

            expectedAmount:
              customerPaidAmount,
          }),
        }
      );

    const verificationResult =
      await verificationResponse.json();

    if (
      !verificationResponse.ok ||
      !verificationResult.success
    ) {
      alert(
        verificationResult.message ||
        "Payment verification failed. Booking was not created."
      );

      return;
    }

    const verifiedPayment =
      verificationResult.payment;

    const bookingReference = await addDoc(
  collection(
    db,
    "bookings"
  ),
  {
    ...bookingData,

    razorpayPaymentId:
      response.razorpay_payment_id,

    razorpayOrderId:
      response.razorpay_order_id,

    razorpaySignature:
      response.razorpay_signature,

    paymentStatus:
      "Captured",

    paymentVerificationStatus:
      "Verified",

    paymentMethod:
      verifiedPayment.method ||
      "Razorpay",

    paymentCurrency:
      verifiedPayment.currency ||
      "INR",

    verifiedPaymentAmount:
      Number(
        verifiedPayment.amount || 0
      ),

    paymentCaptured:
      verifiedPayment.captured === true,

    paymentCapturedAt:
      new Date(),

    paymentVerifiedAt:
      new Date(),

    paymentCreatedAt:
      new Date(),

    settlementStatus:
      "Pending",

    settlementId:
      "",

    settlementUtr:
      "",

    ownerPayoutStatus:
      "Not Eligible",
  }
);

/* CREATE PAYMENT TRANSACTION */

await addDoc(
  collection(
    db,
    "payments"
  ),
  {
    bookingDocumentId:
      bookingReference.id,

    bookingId:
      bookingData.bookingId,

    customerUid:
      currentUser.uid,

    customerId:
      currentUserData?.userId || "",

    customerName:
      currentUserData?.name || "",

    customerEmail:
      currentUserData?.email ||
      currentUser.email ||
      "",

    customerPhone:
      currentUserData?.phone || "",

    ownerUid:
      parkingData?.ownerUid || "",

    ownerId:
      parkingData?.ownerId || "",

    ownerName:
      parkingData?.ownerName || "",

    ownerEmail:
      parkingData?.ownerEmail || "",

    ownerPhone:
      parkingData?.ownerPhone || "",

    parkingId:
      parkingDoc.id,

    parkingTitle:
      parkingData?.title || "",

    razorpayPaymentId:
      response.razorpay_payment_id,

    razorpayOrderId:
      response.razorpay_order_id,

    razorpaySignature:
      response.razorpay_signature,

    customerPaidAmount:
      Number(customerPaidAmount),

    parkingAmount:
      Number(parkingAmount),

    platformFeePercent:
      Number(platformFeePercent),

    platformFeeAmount:
      Number(platformFeeAmount),

    ownerReceivableAmount:
      Number(ownerReceivableAmount),

    paymentMethod:
      verifiedPayment.method ||
      "Razorpay",

    paymentCurrency:
      verifiedPayment.currency ||
      "INR",

    paymentStatus:
      "Captured",

    paymentVerificationStatus:
      "Verified",

    paymentCaptured:
      verifiedPayment.captured === true,

    paymentCapturedAt:
      new Date(),

    paymentVerifiedAt:
      new Date(),

    settlementStatus:
      "Pending",

    settlementId:
      "",

    settlementAmount:
      0,

    settlementFee:
      0,

    settlementTax:
      0,

    settlementUtr:
      "",

    settledAt:
      null,

    refundStatus:
      "Not Applicable",

    refundAmount:
      0,

    razorpayRefundId:
      "",

    refundRequestedAt:
      null,

    refundProcessedAt:
      null,

    ownerPayoutStatus:
      "Not Eligible",

    ownerPayoutReference:
      "",

    ownerPaidAt:
      null,

    transactionType:
      "Parking Booking",

    createdAt:
      new Date(),

    updatedAt:
      new Date(),
  }
);

await updateDoc(
  parkingRef,
  {
    availableSlots: increment(-1),
    occupiedSlots: increment(1),
    availability:
      Number(latestParking.availableSlots) === 1
        ? "Occupied"
        : "Available",
  }
);

alert(
  "Payment verified successfully. Your booking has been created."
);

    router.push("/bookings");

} catch (error: any) {
  console.error(
    "Payment verification or booking error:",
    error
  );

  alert(
    error?.message ||
    "Payment could not be verified or the booking could not be created."
  );
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