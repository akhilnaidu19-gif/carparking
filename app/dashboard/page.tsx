"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  getDoc,
  orderBy,
updateDoc,
runTransaction,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { app, db } from "@/lib/firebase";

import { sendNotification } from "@/lib/notifications";

import { useRouter } from "next/navigation";

export default function DashboardPage() {

  const [parkings, setParkings] =
    useState<any[]>([]);

  const [bookings, setBookings] =
    useState<any[]>([]);

    const [
  bookingFilter,
  setBookingFilter
] = useState("Pending Approval");

const [
  bookingSearch,
  setBookingSearch
] = useState("");

    const [notifications, setNotifications] =
  useState<any[]>([]);

  const [earnings, setEarnings] =
    useState(0);

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

    const [
  processingBookingId,
  setProcessingBookingId,
] = useState<string | null>(null);

  const auth = getAuth(app);
  const router = useRouter();

  // AUTH

  useEffect(() => {

  const unsubscribe = onAuthStateChanged(

    auth,

    async (currentUser) => {

      if (!currentUser) {

        router.replace("/login");
        return;

      }

      const q = query(
  collection(db, "ownerApplications"),
where("userUid", "==", currentUser.uid),
  where("status", "==", "Approved")
);

const snapshot = await getDocs(q);

if (snapshot.empty) {

  alert("You are not registered as a Parking Owner.");

  router.replace("/");

  return;

}

      setUser(currentUser);

    }

  );

  return () => unsubscribe();

}, []);

  // FETCH OWNER PARKINGS

  useEffect(() => {

    if (!user) return;

    setLoading(true);

    const q = query(

      collection(db, "parkings"),


where(
  "ownerUid",
  "==",
  user.uid
)

    );

    const unsubscribe =
      onSnapshot(

        q,

        async (snapshot) => {

          const parkingData: any[] =
            [];

          snapshot.forEach((doc) => {

            parkingData.push({

              id: doc.id,

              ...doc.data(),

            });

          });

          setParkings(
            parkingData
          );

          // FETCH BOOKINGS

          const bookingsQuery = query(
  collection(db, "bookings"),
where(
  "ownerUid",
  "==",
  user.uid
)
);

const bookingsSnapshot = await getDocs(bookingsQuery);

const bookingData: any[] = [];
let total = 0;

bookingsSnapshot.forEach((bookingDoc) => {

  const data = bookingDoc.data();

    bookingData.push({
      id: bookingDoc.id,
      ...data,
    });

    if (data.bookingStatus === "Completed") {
      total += Number(
        data.ownerReceivableAmount || 0
      );
    }

  

});

setBookings(bookingData);
setEarnings(total);

          setLoading(false);

        },

        (error) => {

          console.log(error);

          setLoading(false);

        }

      );

    return () => unsubscribe();

  }, [user]);

  useEffect(() => {

  if (!user) return;

  const q = query(
  collection(db, "notifications"),
  where("recipientUid", "==", user.uid),
  orderBy("createdAt", "desc")
);

  const unsubscribe =
    onSnapshot(

      q,

      (snapshot) => {

        const data = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

setNotifications(data);

      }

    );

  return () => unsubscribe();

}, [user]);

  // STATS

const totalSlots =
  parkings
    .filter(
      (parking) =>
        parking.status === "Approved" ||
        parking.availability === "Occupied"
    )
    .reduce(
      (total, parking) =>
        total + Number(parking.totalSlots || 0),
      0
    );

const occupiedSlots =
  parkings.reduce(

    (total, parking) =>

      total +
      Number(
        parking.occupiedSlots || 0
      ),

    0

  );

const availableSlots =
  parkings
    .filter(
      (parking) =>
        parking.status === "Approved" &&
        parking.availability === "Available"
    )
    .reduce(
      (total, parking) =>
        total + Number(parking.availableSlots || 0),
      0
    );

  const activeBookings =
    bookings.filter(
      (item) =>
        item.paymentStatus ===
        "Paid"
    ).length;

    const totalValidBookings = bookings.filter(
  (booking) =>
    booking.bookingStatus === "Pending Approval" ||
    booking.bookingStatus === "Approved" ||
    booking.bookingStatus === "Completed"
).length;

  const featuredListings =
    parkings.filter(
      (item) =>
        item.featured === true
    ).length;

const totalCustomers = new Set(
  bookings
    .filter(
      (booking) =>
        booking.bookingStatus === "Pending Approval" ||
        booking.bookingStatus === "Approved" ||
        booking.bookingStatus === "Completed"
    )
    .map(
      (booking) =>
        booking.customerUid ||
        booking.customerId
    )
    .filter(Boolean)
).size;

  const occupancyRate =
  totalSlots > 0
    ? Math.round(
        (occupiedSlots /
          totalSlots) *
          100
      )
    : 0;

    const expiringBookings =
  bookings.filter(
    (booking) => {

      if (
        !booking.validTill
      )
        return false;

      const expiryDate =
        new Date(
          booking.validTill
        );

      const today =
        new Date();

      const diffTime =
        expiryDate.getTime() -
        today.getTime();

      const daysLeft =
        Math.ceil(
          diffTime /
          (1000 *
            60 *
            60 *
            24)
        );

      return (
        daysLeft >= 0 &&
        daysLeft <= 7
      );

    }
  );

  const pendingBookings =
  bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      "Pending Approval"
  );

const approvedBookings =
  bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      "Approved"
  );

const rejectedBookings =
  bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      "Rejected"
  );

  const pendingPayout = bookings.reduce(
  (total, booking) => {
    const eligibleBookingStatus =
      booking.bookingStatus === "Completed" ||
      booking.bookingStatus === "Cancelled After Approval";

    const eligibleForPayout =
      eligibleBookingStatus &&
      booking.ownerPayoutStatus === "Pending";

    if (eligibleForPayout) {
      return (
        total +
        Number(booking.ownerReceivableAmount || 0)
      );
    }

    return total;
  },
  0
);

const paidPayout = bookings.reduce(
  (total, booking) => {

    if (
      booking.ownerPayoutStatus === "Paid"
    ) {
      return (
        total +
        Number(
          booking.ownerReceivableAmount || 0
        )
      );
    }

    return total;

  },
  0
);

const visibleBookings =
  bookings.filter(
    (booking) =>
      booking.bookingStatus ===
      bookingFilter
  )
  .filter((booking) => {

    const search =
      bookingSearch.toLowerCase();

    return (

      booking.customerId
  ?.toLowerCase()
  .includes(search)

||

      booking.customerName
        ?.toLowerCase()
        .includes(search)

      ||

      booking.customerEmail
        ?.toLowerCase()
        .includes(search)

      ||

      booking.vehicleNumber
        ?.toLowerCase()
        .includes(search)

      ||

      booking.bookingId
        ?.toLowerCase()
        .includes(search)

    );

  });

  if (loading) {

  return (

    <div className="min-h-screen flex items-center justify-center">

      <h1 className="text-3xl font-bold">

        Loading...

      </h1>

    </div>

  );

}

  if (!user) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <h1 className="text-4xl font-bold">

          Please Login

        </h1>

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}

      <div className="bg-black text-white px-8 py-10">

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">

          <div>

            <h1 className="text-5xl font-bold mb-3">

              Owner Dashboard

            </h1>

            <p className="text-gray-400 text-lg">

              Manage your parking business professionally

            </p>

          </div>

          <div className="bg-green-500 px-8 py-4 rounded-3xl font-bold text-2xl shadow-xl">

            ₹{earnings}

          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* STATS */}

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-12">

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Total Slots

            </p>

            <h2 className="text-5xl font-bold">

              {totalSlots}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Occupied

            </p>

            <h2 className="text-5xl font-bold">

              {occupiedSlots}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Available

            </p>

            <h2 className="text-5xl font-bold">

              {availableSlots}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Active Bookings

            </p>

            <h2 className="text-5xl font-bold">

              {activeBookings}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-8 rounded-3xl shadow-xl">

<p className="text-lg mb-3">
  Total Bookings
</p>

<h2 className="text-5xl font-bold">
  {totalValidBookings}
</h2>

</div>

</div>

{/* BUSINESS ANALYTICS */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-12">

  <h2 className="text-3xl font-bold mb-8">
    Business Analytics
  </h2>

<div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

    <div className="bg-green-100 p-6 rounded-3xl">

      <p className="text-gray-600 mb-2">
        Occupancy Rate
      </p>

      <h2 className="text-5xl font-bold text-green-600">
        {occupancyRate}%
      </h2>

    </div>

    <div className="bg-purple-100 p-6 rounded-3xl">

      <p className="text-gray-600 mb-2">
        Featured Listings
      </p>

      <h2 className="text-5xl font-bold text-purple-600">
        {featuredListings}
      </h2>

    </div>

  </div>

  <div className="bg-yellow-100 p-6 rounded-3xl">

  <p className="text-gray-600 mb-2">
    Pending Payout
  </p>

  <h2 className="text-5xl font-bold text-yellow-600">
    ₹{pendingPayout}
  </h2>

</div>

<div className="bg-blue-100 p-6 rounded-3xl">

  <p className="text-gray-600 mb-2">
    Total Paid
  </p>

  <h2 className="text-5xl font-bold text-blue-600">
    ₹{paidPayout}
  </h2>

</div>

</div>

{/* NOTIFICATIONS */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-3xl font-bold">

      🔔 Notifications

    </h2>

    <div className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold">

      {notifications.length}

    </div>

  </div>

  {notifications.length === 0 ? (

    <p className="text-gray-500">

      No notifications yet

    </p>

  ) : (

    <div className="grid gap-4">

      {notifications
        .slice(0, 10)
        .map(
          (notification) => (

            <div
              key={notification.id}
              className="border rounded-2xl p-4"
            >

              <h3 className="font-bold text-lg">

                {notification.title}

              </h3>

              <p className="text-gray-600">

                {notification.message}

              </p>

            </div>

          )
        )}

    </div>

  )}

</div>

{/* EXPIRING BOOKINGS */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-3xl font-bold">

      ⚠ Expiring Soon

    </h2>

    <div className="bg-orange-500 text-white px-4 py-2 rounded-xl font-bold">

      {expiringBookings.length}

    </div>

  </div>

  {expiringBookings.length === 0 ? (

    <p className="text-gray-500">

      No bookings expiring soon

    </p>

  ) : (

    <div className="grid gap-4">

      {expiringBookings.map(
        (booking) => (

          <div
            key={booking.id}
            className="border rounded-2xl p-4"
          >

            <h3 className="text-xl font-bold">

              {booking.customerName}

            </h3>

            <p className="text-gray-600">

              {booking.parkingTitle || "Parking Booking"}

            </p>

            <p className="text-orange-600 font-bold mt-2">

              Expires On:
              {" "}
              {new Date(
  booking.validTill
).toLocaleDateString()}

            </p>

            <div className="flex gap-3 mt-4">

              <a
                href={`tel:${booking.customerPhone}`}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold"
              >
                📞 Call
              </a>

              <a
                href={`https://wa.me/91${booking.customerPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold"
              >
                💬 WhatsApp
              </a>

            </div>

          </div>

        )
      )}

    </div>

  )}

</div>

{/* PARKINGS */}

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12">

          <div className="flex items-center justify-between mb-10">

            <h2 className="text-4xl font-bold">

              Your Parking Listings

            </h2>

            <div className="bg-black text-white px-6 py-3 rounded-2xl font-bold">

              {parkings.length} Listings

            </div>

          </div>

          {loading ? (

            <div className="text-3xl font-bold">

              Loading...

            </div>

          ) : parkings.length === 0 ? (

            <div className="text-center py-20">

              <h2 className="text-4xl font-bold text-red-500 mb-4">

                No Listings Found

              </h2>

              <p className="text-gray-500 text-lg">

                Add your first parking listing

              </p>

            </div>

          ) : (

            <div className="grid gap-8">

              {parkings.map((parking) => (

                <div
                  key={parking.id}
                  className="border rounded-3xl p-6 flex flex-col lg:flex-row gap-8 bg-gray-50"
                >

                  {/* IMAGE */}

                  <img
                    src={parking.image}
                    alt={parking.title}
                    className="w-full lg:w-72 h-52 object-cover rounded-3xl"
                  />

                  {/* CONTENT */}

                  <div className="flex-1">

                    {/* BADGES */}

                    {/* ADMIN APPROVAL STATUS */}

<span
  className={`px-4 py-2 rounded-xl text-white font-bold ${
    parking.status === "Approved"
      ? "bg-green-500"
      : parking.status === "Rejected"
      ? "bg-red-600"
      : "bg-yellow-500"
  }`}
>
  Admin: {parking.status}
</span>

{/* PARKING AVAILABILITY */}

<span
  className={`px-4 py-2 rounded-xl text-white font-bold ${
    parking.availability === "Available"
      ? "bg-green-500"
      : parking.availability === "Occupied"
      ? "bg-red-500"
      : parking.availability === "Booking Pending"
      ? "bg-orange-500"
      : "bg-gray-500"
  }`}
>
  {parking.availability}
</span>



                    <h3 className="text-3xl font-bold mt-3 mb-5">
  {parking.title}
</h3>

{parking.status === "Rejected" &&
 parking.adminRemarks && (

  <div className="bg-red-50 border border-red-300 rounded-2xl p-4 mt-4 mb-4">

    <h4 className="font-bold text-red-700 mb-2">
      ❌ Rejected By Admin
    </h4>

    <p className="text-gray-700">
      {parking.adminRemarks}
    </p>

  </div>

)}

                    <p className="text-gray-500 text-lg mb-4">

                      {parking.location}

                    </p>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">

                      <div className="bg-white p-4 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Monthly Price

                        </p>

                        <h3 className="text-2xl font-bold text-green-600">

                          ₹{parking.monthlyPrice}

                        </h3>

                      </div>

                      <div className="bg-white p-4 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Parking Type

                        </p>

                        <h3 className="text-xl font-bold">

                          {parking.parkingType}

                        </h3>

                      </div>

                      <div className="bg-white p-4 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          CCTV

                        </p>

                        <h3 className="text-xl font-bold">

                          {parking.cctv}

                        </h3>

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-4">

{(
  parking.status === "Pending" ||
  parking.status === "Rejected"
) ? (
  <a
    href={`/edit-parking/${parking.id}`}
    className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition"
  >
    ✏️ Edit Listing
  </a>
) : (
  <button
    disabled
    className="bg-gray-400 text-white px-6 py-4 rounded-2xl font-bold cursor-not-allowed opacity-70"
  >
    🔒 Edit Locked
  </button>
)}

  <a
    href={`/parking/${parking.id}`}
    className="bg-green-600 text-white px-6 py-4 rounded-2xl font-bold"
  >
    👁 Preview
  </a>

  <a
    href={
      parking.latitude && parking.longitude
        ? `https://www.google.com/maps?q=${parking.latitude},${parking.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            parking.location
          )}`
    }
    target="_blank"
    className="bg-black text-white px-6 py-4 rounded-2xl font-bold"
  >
    🗺 View Map
  </a>

{(
  parking.status === "Pending" ||
  parking.status === "Rejected"
) ? (
  <button
    onClick={async () => {
      const confirmDelete = confirm(
        "Are you sure you want to delete this parking listing?"
      );

      if (!confirmDelete) return;

      try {
        await deleteDoc(
          doc(db, "parkings", parking.id)
        );

        alert("Parking listing deleted successfully.");
      } catch (error) {
        console.error(error);
        alert("Unable to delete parking listing.");
      }
    }}
    className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-bold transition"
  >
    🗑 Delete
  </button>
) : (
  <button
    disabled
    className="bg-gray-400 text-white px-6 py-4 rounded-2xl font-bold cursor-not-allowed opacity-70"
  >
    🔒 Delete Locked
  </button>
)}

</div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* BOOKINGS */}

        <div className="bg-white rounded-3xl shadow-xl p-8">

          <div className="flex items-center justify-between mb-10">

            <h2 className="text-4xl font-bold">

              Customer Bookings

            </h2>

            <div className="flex flex-wrap gap-4 mt-6">

              <input
  type="text"
  placeholder="Search Booking ID, Vehicle Number, Customer..."
  value={bookingSearch}
  onChange={(e) =>
    setBookingSearch(
      e.target.value
    )
  }
  className="w-full border p-4 rounded-2xl mb-5"
/>

  <button
    onClick={() =>
      setBookingFilter(
        "Pending Approval"
      )
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      bookingFilter ===
      "Pending Approval"
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
      setBookingFilter(
        "Approved"
      )
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      bookingFilter ===
      "Approved"
        ? "bg-green-600 text-white"
        : "bg-gray-200"
    }`}
  >
    🟢 Approved (
    {approvedBookings.length}
    )
  </button>

  <button
    onClick={() =>
      setBookingFilter(
        "Rejected"
      )
    }
    className={`px-5 py-3 rounded-2xl font-bold ${
      bookingFilter ===
      "Rejected"
        ? "bg-red-600 text-white"
        : "bg-gray-200"
    }`}
  >
    🔴 Rejected (
    {rejectedBookings.length}
    )
  </button>

</div>

            <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold">

              {visibleBookings.length} Bookings

            </div>

          </div>

          {bookings.length === 0 ? (

            <div className="text-center py-20">

              <h2 className="text-4xl font-bold text-red-500 mb-4">

                No Bookings Found

              </h2>

              <p className="text-gray-500 text-lg">

                Your bookings will appear here

              </p>

            </div>

          ) : (

            <div className="grid gap-8">

              {visibleBookings.map((booking) => (

                <div
                  key={booking.id}
                  className="border rounded-3xl p-6 flex flex-col lg:flex-row gap-8 bg-gray-50"
                >

                  {/* IMAGE */}

                 {booking.vehicleImage ? (

  <img
    src={booking.vehicleImage}
    className="w-full lg:w-52 h-52 rounded-3xl object-cover"
  />

) : (

  <div className="w-full lg:w-52 h-52 rounded-3xl bg-gray-200 flex items-center justify-center text-gray-500 font-bold">

    No Vehicle Image

  </div>

)}

                  {/* CONTENT */}

                  <div className="flex-1">

                    {/* STATUS */}

                    <div className="flex flex-wrap gap-3 mb-8">

  <span className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold">
    {booking.paymentStatus}
  </span>

<span
  className={`text-white px-4 py-2 rounded-xl font-bold ${
    booking.bookingStatus === "Approved"
      ? "bg-green-600"
      : booking.bookingStatus === "Rejected"
      ? "bg-red-600"
      : "bg-yellow-500"
  }`}
>
  {booking.bookingStatus || "Pending Approval"}
</span>

  <span className="bg-black text-white px-4 py-2 rounded-xl font-bold">
    {booking.plan}
  </span>

                    </div>

                    <h3 className="text-3xl font-bold mb-3">

                      {booking.parkingTitle || "Parking Booking"}

                    </h3>

                    <p className="text-gray-500 text-lg mb-5">

                      {booking.parkingLocation || "Location Not Available"}

                    </p>

                    {/* PARKING INFORMATION */}

<div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6">

  <h3 className="text-xl font-bold text-blue-700 mb-4">
    🅿️ Parking Information
  </h3>

  <div className="grid md:grid-cols-2 gap-4">

    <div>
      <p className="text-gray-500 text-sm">
        Parking Name
      </p>

      <p className="font-semibold">
        {booking.parkingTitle || booking.parkingName || booking.title || "Not Available"}
      </p>
    </div>

    <div>
      <p className="text-gray-500 text-sm">
        Parking ID
      </p>

      <p className="font-semibold">
        {booking.parkingId}
      </p>
    </div>

    <div>
      <p className="text-gray-500 text-sm">
        Parking Type
      </p>

      <p className="font-semibold">
        {booking.parkingType || "Not Available"}
      </p>
    </div>

    <div>
      <p className="text-gray-500 text-sm">
        Slot Number
      </p>

      <p className="font-semibold">
        {booking.slotNumber || "Not Assigned"}
      </p>
    </div>

  </div>

</div>

                  {/* CUSTOMER & VEHICLE */}

<div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 mb-6">

  {/* CUSTOMER */}

  <div className="bg-white rounded-2xl p-5">

    <h3 className="font-bold text-xl mb-5">
      Customer Information
    </h3>

    <div className="flex gap-6">

      {booking.customerPhoto ? (
  <img
    src={booking.customerPhoto}
    alt="Customer"
    className="w-36 h-36 rounded-3xl object-cover flex-shrink-0"
  />
) : (
  <div className="w-36 h-36 rounded-3xl bg-green-600 text-white flex items-center justify-center text-4xl font-bold flex-shrink-0">
    {(booking.customerName || "C")
      .split(" ")
      .map((word: string) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()}
  </div>
)}

      <div className="flex flex-col justify-center space-y-4">

        <p>
  <b>Customer ID:</b> {booking.customerId || "N/A"}
</p>

        <p>
          <b>Name:</b> {booking.customerName}
        </p>

        <p>
          <b>Email:</b> {booking.customerEmail}
        </p>

        <p>
          <b>Phone:</b>{" "}
          {booking.customerPhone || "Not Available"}
        </p>

      </div>

    </div>

  </div>

  {/* VEHICLE */}

  <div className="bg-white rounded-2xl p-5">

    <h3 className="font-bold text-xl mb-5">
      Vehicle Information
    </h3>

    <p><b>Brand:</b> {booking.vehicleBrand}</p>

    <p className="mt-3">
      <b>Model:</b> {booking.vehicleModel}
    </p>

    <p className="mt-3">
      <b>Number:</b> {booking.vehicleNumber}
    </p>

    <p className="mt-3">
      <b>Type:</b> {booking.vehicleType}
    </p>

    <p className="mt-3">
      <b>Color:</b> {booking.vehicleColor}
    </p>

  </div>

</div>

                    {/* BOOKING DETAILS */}

                    <div className="grid md:grid-cols-3 gap-5">

                      <div className="bg-white p-5 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Booking Date

                        </p>

                        <h3 className="font-bold">

                          {new Date(
  booking.bookingDate?.seconds
    ? booking.bookingDate.seconds * 1000
    : booking.bookingDate
).toLocaleString()}

                        </h3>

                      </div>

                      <div className="bg-white p-5 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Valid Till

                        </p>

                        <h3 className="font-bold">

                          {new Date(
  booking.validTill
).toLocaleDateString()}

                        </h3>

                      </div>

                      <div className="bg-white p-5 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Revenue

                        </p>

<h3 className="text-2xl font-bold text-green-600">

  ₹{booking.ownerReceivableAmount || 0}

</h3>

                      </div>

                    </div>
                    <div className="flex flex-wrap gap-4 mt-6">

  <a
    href={`tel:${booking.customerPhone}`}
    className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold"
  >
    📞 Call Customer
  </a>

  <a
    href={`https://wa.me/91${booking.customerPhone}`}
    target="_blank"
    rel="noopener noreferrer"
    className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold"
  >
    💬 WhatsApp Customer
  </a>

  {booking.bookingStatus ===
"Pending Approval" && (

  <>

    <button
      onClick={async () => {

  try {

  const parkingRef = doc(
    db,
    "parkings",
    booking.parkingId
  );

  const parkingSnap = await getDoc(parkingRef);

  if (!parkingSnap.exists()) {
    alert("Parking not found");
    return;
  }

  const parking = parkingSnap.data();



// Update Booking

await updateDoc(
  doc(db, "bookings", booking.id),
  {
    bookingStatus: "Approved",
    ownerApprovalStatus: "Approved",
    approvedDate: new Date(),
  }
);

// Update Payment

const paymentSnapshot = await getDocs(
  query(
    collection(db, "payments"),
    where("bookingDocumentId", "==", booking.id)
  )
);

if (!paymentSnapshot.empty) {

  const paymentDoc =
    paymentSnapshot.docs[0];

  await updateDoc(
    paymentDoc.ref,
    {
      bookingStatus: "Approved",
      ownerApprovalStatus: "Approved",
      approvedDate: new Date(),
      updatedAt: new Date(),
    }
  );

}

alert("Booking Approved");

try {
  await sendNotification({
    recipientUid: booking.customerUid,
    recipientRole: "customer",
    title: "Booking Approved",
    message: `Your booking for "${booking.parkingTitle || "the parking"}" has been approved by the parking owner.`,
    type: "BOOKING",
    relatedId: booking.id,
  });
} catch (notificationError) {
  console.error(
    "Unable to send booking approval notification:",
    notificationError
  );
}

} catch (error) {

  console.log(error);

  alert("Failed to approve booking");

}

}}
      className="bg-green-700 text-white px-6 py-3 rounded-2xl font-bold"
    >
      ✅ Approve Booking
    </button>

<button
  disabled={
    processingBookingId === booking.id
  }
  onClick={async () => {
    if (
      processingBookingId === booking.id
    ) {
      return;
    }

    setProcessingBookingId(
      booking.id
    );

    try {
      const bookingRef = doc(
        db,
        "bookings",
        booking.id
      );

      const parkingRef = doc(
        db,
        "parkings",
        booking.parkingId
      );

      const latestBookingSnap =
        await getDoc(bookingRef);

      if (!latestBookingSnap.exists()) {
        alert("Booking not found.");
        return;
      }

      const latestBookingData =
        latestBookingSnap.data();

      if (
        latestBookingData.bookingStatus ===
        "Rejected"
      ) {
        alert(
          "This booking has already been rejected."
        );
        return;
      }

      if (
        latestBookingData.bookingStatus !==
        "Pending Approval"
      ) {
        alert(
          "Only pending bookings can be rejected."
        );
        return;
      }

      const rejectedAt = new Date();

      await runTransaction(
        db,
        async (transaction) => {
          const bookingSnapshot =
            await transaction.get(
              bookingRef
            );

          const parkingSnapshot =
            await transaction.get(
              parkingRef
            );

          if (!bookingSnapshot.exists()) {
            throw new Error(
              "Booking document not found."
            );
          }

          if (!parkingSnapshot.exists()) {
            throw new Error(
              "Parking document not found."
            );
          }

          const bookingData =
            bookingSnapshot.data();


if (
  bookingData.bookingStatus ===
    "Rejected" ||
  bookingData.slotReleased === true
) {
  throw new Error(
    "This booking has already been rejected and the parking slot has already been released."
  );
}

if (
  bookingData.bookingStatus !==
  "Pending Approval"
) {
  throw new Error(
    "Only pending bookings can be rejected."
  );
}

          

          transaction.update(
            bookingRef,
            {
              bookingStatus:
                "Rejected",

              ownerApprovalStatus:
                "Rejected",

              paymentStatus:
                "Refund Pending",

              refundStatus:
                "Pending",

              refundAmount:
                Number(
                  bookingData.refundAmount ||
                    bookingData.parkingAmount ||
                    0
                ),

              cancelledAt:
                rejectedAt,

              refundRequestedAt:
                rejectedAt,

              cancellationType:
                "Owner Rejected",

              cancellationRemarks:
                "Booking rejected by parking owner.",

              ownerPayoutStatus:
                "Not Eligible",

              slotReleased:
                true,

              slotReleasedAt:
                rejectedAt,

              updatedAt:
                rejectedAt,
            }
          );

          transaction.update(
  parkingRef,
  {
    totalSlots: 1,
    occupiedSlots: 0,
    availableSlots: 1,
    availability: "Available",
    updatedAt: rejectedAt,
  }
);
        }
      );

      const paymentSnapshot =
        await getDocs(
          query(
            collection(
              db,
              "payments"
            ),
            where(
              "bookingDocumentId",
              "==",
              booking.id
            )
          )
        );

      if (!paymentSnapshot.empty) {
        const paymentDoc =
          paymentSnapshot.docs[0];

        await updateDoc(
          paymentDoc.ref,
          {
            bookingStatus:
              "Rejected",

            ownerApprovalStatus:
              "Rejected",

            paymentStatus:
              "Refund Pending",

            refundStatus:
              "Pending",

            refundAmount:
              Number(
                latestBookingData
                  .refundAmount ||
                  latestBookingData
                    .parkingAmount ||
                  0
              ),

            cancelledAt:
              rejectedAt,

            refundRequestedAt:
              rejectedAt,

            cancellationType:
              "Owner Rejected",

            cancellationRemarks:
              "Booking rejected by parking owner.",

            ownerPayoutStatus:
              "Not Eligible",

            updatedAt:
              rejectedAt,
          }
        );
      }

      try {
  await sendNotification({
    recipientUid: booking.customerUid,
    recipientRole: "customer",
    title: "Booking Rejected",
    message: `Your booking for "${booking.parkingTitle || "the parking"}" was rejected by the parking owner. Your refund request has been created.`,
    type: "BOOKING",
    relatedId: booking.id,
  });
} catch (notificationError) {
  console.error(
    "Unable to send booking rejection notification:",
    notificationError
  );
}

      alert(
        "Booking rejected. Parking slot released and refund request created."
      );

      setBookings((currentBookings) =>
  currentBookings.map((item) =>
    item.id === booking.id
      ? {
          ...item,
          bookingStatus: "Rejected",
          ownerApprovalStatus:
            "Rejected",
          paymentStatus:
            "Refund Pending",
          refundStatus: "Pending",
          slotReleased: true,
        }
      : item
  )
);
    } catch (error: any) {
  console.error(
    "Reject booking error:",
    error
  );

  alert(
    error?.message ||
      "Unable to reject booking."
  );
} finally {
  setProcessingBookingId(null);
}
  }}
className={`text-white px-6 py-3 rounded-2xl font-bold ${
  processingBookingId === booking.id
    ? "bg-gray-400 cursor-not-allowed"
    : "bg-red-600 hover:bg-red-700"
}`}
>
  {processingBookingId === booking.id
    ? "Rejecting..."
    : "❌ Reject Booking"}
</button>

  </>

)}



</div>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

    </div>

  );

}