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
  orderBy,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { app, db } from "@/lib/firebase";

export default function DashboardPage() {

  const [parkings, setParkings] =
    useState<any[]>([]);

  const [bookings, setBookings] =
    useState<any[]>([]);

    const [notifications, setNotifications] =
  useState<any[]>([]);

  const [earnings, setEarnings] =
    useState(0);

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const auth = getAuth(app);

  // AUTH

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        (currentUser) => {

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
        "ownerEmail",
        "==",
        user.email
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

          const bookingsSnapshot =
            await getDocs(
              collection(
                db,
                "bookings"
              )
            );

          const bookingData: any[] =
            [];

          let total = 0;

          bookingsSnapshot.forEach(
            (doc) => {

              const data =
                doc.data();

              const ownerEmails =
  parkingData.map(
    (item) =>
      item.ownerEmail
  );

if (
  ownerEmails.includes(
    data.ownerEmail
  )
) {

                bookingData.push({

                  id: doc.id,

                  ...data,

                });

                total +=
                  Number(
                    data.amount || 0
                  );

              }

            }
          );

          setBookings(
            bookingData
          );

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

    collection(
      db,
      "notifications"
    ),

    where(
      "ownerEmail",
      "==",
      user.email
    )

  );

  const unsubscribe =
    onSnapshot(

      q,

      (snapshot) => {

        const data: any[] = [];

        snapshot.forEach((doc) => {

          data.push({

            id: doc.id,

            ...doc.data(),

          });

        });

        setNotifications(
          data.reverse()
        );

      }

    );

  return () => unsubscribe();

}, [user]);

  // STATS

  const totalSlots =
    parkings.length;

  const occupiedSlots =
    parkings.filter(
      (item) =>
        item.availability ===
        "Occupied"
    ).length;

  const availableSlots =
    parkings.filter(
      (item) =>
        item.availability ===
        "Available"
    ).length;

  const activeBookings =
    bookings.filter(
      (item) =>
        item.paymentStatus ===
        "Paid"
    ).length;

  const featuredListings =
    parkings.filter(
      (item) =>
        item.featured === true
    ).length;

    const totalCustomers =
  new Set(
    bookings.map(
      (item) =>
        item.email
    )
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
    Customers
  </p>

  <h2 className="text-5xl font-bold">
    {totalCustomers}
  </h2>

</div>

</div>

{/* BUSINESS ANALYTICS */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-12">

  <h2 className="text-3xl font-bold mb-8">
    Business Analytics
  </h2>

  <div className="grid md:grid-cols-2 gap-6">

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

              {booking.name}

            </h3>

            <p className="text-gray-600">

              {booking.title}

            </p>

            <p className="text-orange-600 font-bold mt-2">

              Expires On:
              {" "}
              {booking.validTill}

            </p>

            <div className="flex gap-3 mt-4">

              <a
                href={`tel:${booking.phone}`}
                className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold"
              >
                📞 Call
              </a>

              <a
                href={`https://wa.me/91${booking.phone}`}
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

                    <div className="flex flex-wrap gap-3 mb-5">

                      {parking.featured && (

                        <span className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold">

                          Featured

                        </span>

                      )}

                      {parking.verified && (

                        <span className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold">

                          Verified

                        </span>

                      )}

                      <span
                        className={`px-4 py-2 rounded-xl text-white font-bold ${
                          parking.availability ===
                          "Available"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >

                        {
                          parking.availability
                        }

                      </span>

                    </div>

                    <h3 className="text-3xl font-bold mb-3">

                      {parking.title}

                    </h3>

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
                        className="bg-black text-white px-6 py-4 rounded-2xl font-bold"
                      >

                        View Map

                      </a>

                      <button
                        onClick={async () => {

                          const confirmDelete =
                            confirm(
                              "Delete parking?"
                            );

                          if (
                            !confirmDelete
                          )
                            return;

                          try {

                            await deleteDoc(
                              doc(
                                db,
                                "parkings",
                                parking.id
                              )
                            );

                            alert(
                              "Parking Deleted"
                            );

                          } catch (error) {

                            console.log(error);

                          }

                        }}
                        className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold"
                      >

                        Delete Listing

                      </button>

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

            <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold">

              {bookings.length} Bookings

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

              {bookings.map((booking) => (

                <div
                  key={booking.id}
                  className="border rounded-3xl p-6 flex flex-col lg:flex-row gap-8 bg-gray-50"
                >

                  {/* IMAGE */}

                  <img
                    src={booking.image}
                    className="w-full lg:w-52 h-52 rounded-3xl object-cover"
                  />

                  {/* CONTENT */}

                  <div className="flex-1">

                    {/* STATUS */}

                    <div className="flex flex-wrap gap-3 mb-5">

                      <span className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold">

                        {booking.paymentStatus}

                      </span>

                      <span className="bg-black text-white px-4 py-2 rounded-xl font-bold">

                        {booking.plan}

                      </span>

                    </div>

                    <h3 className="text-3xl font-bold mb-3">

                      {booking.title}

                    </h3>

                    <p className="text-gray-500 text-lg mb-5">

                      {booking.location}

                    </p>

                    {/* CUSTOMER */}

                    <div className="grid md:grid-cols-2 gap-5 mb-6">

                      <div className="bg-white p-5 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Customer Name

                        </p>

                        <h3 className="text-xl font-bold">

                          {booking.name}

                        </h3>

                      </div>

                      <div className="bg-white p-5 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Customer Email

                        </p>

                        <h3 className="text-lg font-bold break-all">

                          {booking.email}

                        </h3>

                      </div>

                      <div className="bg-white p-5 rounded-2xl">

  <p className="text-gray-500 mb-2">

    Customer Phone

  </p>

  <h3 className="text-lg font-bold">

    {booking.phone || "Not Available"}

  </h3>

</div>

                    </div>

                    {/* BOOKING DETAILS */}

                    <div className="grid md:grid-cols-3 gap-5">

                      <div className="bg-white p-5 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Booking Date

                        </p>

                        <h3 className="font-bold">

                          {booking.bookingDate}

                        </h3>

                      </div>

                      <div className="bg-white p-5 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Valid Till

                        </p>

                        <h3 className="font-bold">

                          {booking.validTill}

                        </h3>

                      </div>

                      <div className="bg-white p-5 rounded-2xl">

                        <p className="text-gray-500 mb-2">

                          Revenue

                        </p>

                        <h3 className="text-2xl font-bold text-green-600">

                          ₹{booking.amount}

                        </h3>

                      </div>

                    </div>
                    <div className="flex flex-wrap gap-4 mt-6">

  <a
    href={`tel:${booking.phone}`}
    className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold"
  >
    📞 Call Customer
  </a>

  <a
    href={`https://wa.me/91${booking.phone}`}
    target="_blank"
    rel="noopener noreferrer"
    className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold"
  >
    💬 WhatsApp Customer
  </a>

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