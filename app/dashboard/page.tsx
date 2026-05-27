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
        "owner",
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
                    item.owner
                );

              if (
                ownerEmails.includes(
                  data.owner
                )
              ) {

                bookingData.push({

                  id: doc.id,

                  ...data,

                });

                if (
                  data.plan ===
                  "Monthly"
                ) {

                  total += Number(
                    data.monthlyPrice ||
                      0
                  );

                } else {

                  total += 30000;

                }

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

  if (!user) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <h1 className="text-3xl font-bold">

          Please Login

        </h1>

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-5xl font-bold mb-10">

          Owner Dashboard

        </h1>

        {/* STATS */}

        <div className="grid md:grid-cols-4 gap-8 mb-12">

          <div className="bg-white p-8 rounded-3xl shadow-lg">

            <h2 className="text-2xl font-bold mb-3">

              Total Parking Slots

            </h2>

            <p className="text-5xl font-bold text-green-500">

              {totalSlots}

            </p>

          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg">

            <h2 className="text-2xl font-bold mb-3">

              Occupied Slots

            </h2>

            <p className="text-5xl font-bold text-red-500">

              {occupiedSlots}

            </p>

          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg">

            <h2 className="text-2xl font-bold mb-3">

              Available Slots

            </h2>

            <p className="text-5xl font-bold text-blue-500">

              {availableSlots}

            </p>

          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg">

            <h2 className="text-2xl font-bold mb-3">

              Total Earnings

            </h2>

            <p className="text-5xl font-bold text-black">

              ₹{earnings}

            </p>

          </div>

        </div>

        {/* PARKINGS */}

        <div className="bg-white rounded-3xl shadow-lg p-8 mb-10">

          <h2 className="text-3xl font-bold mb-8">

            Your Parking Listings

          </h2>

          {loading ? (

            <div className="text-2xl font-bold">

              Loading...

            </div>

          ) : parkings.length === 0 ? (

            <div className="text-2xl font-bold text-red-500">

              No Listings Found

            </div>

          ) : (

            <div className="grid gap-6">

              {parkings.map((parking) => (

                <div
                  key={parking.id}
                  className="border rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                >

                  <div className="flex gap-6 items-center">

                    <img
                      src={parking.image}
                      alt={parking.title}
                      className="w-40 h-32 object-cover rounded-2xl"
                    />

                    <div>

                      <h3 className="text-2xl font-bold mb-2">

                        {parking.title}

                      </h3>

                      <p className="text-gray-600 mb-2">

                        {parking.location}

                      </p>

                      <p className="font-bold mb-2">

                        ₹{parking.monthlyPrice}/month

                      </p>

                      <span
                        className={`inline-block px-4 py-2 rounded-xl text-white font-semibold ${
                          parking.availability ===
                          "Available"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >

                        {parking.availability}

                      </span>

                    </div>

                  </div>

                  <div className="flex gap-4">

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
                      className="bg-black text-white px-6 py-3 rounded-2xl font-bold"
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
                      className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold"
                    >

                      Delete

                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* CUSTOMER BOOKINGS */}

        <div className="bg-white rounded-3xl shadow-lg p-8">

          <h2 className="text-3xl font-bold mb-8">

            Customer Bookings

          </h2>

          {bookings.length === 0 ? (

            <div className="text-2xl font-bold text-red-500">

              No Bookings Found

            </div>

          ) : (

            <div className="grid gap-6">

              {bookings.map((booking) => (

                <div
                  key={booking.id}
                  className="border rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6"
                >

                  <div className="flex gap-5">

                    <img
                      src={booking.image}
                      className="w-32 h-32 rounded-2xl object-cover"
                    />

                    <div>

                      <h3 className="text-2xl font-bold mb-2">

                        {booking.title}

                      </h3>

                      <p className="text-gray-600">

                        {booking.location}

                      </p>

                      <p className="text-green-600 font-bold mt-2">

                        {booking.plan}

                      </p>

                    </div>

                  </div>

                  <div>

                    <p className="font-bold">

                      Customer:

                    </p>

                    <p className="text-gray-600 mb-3">

                      {booking.name}

                    </p>

                    <p className="font-bold">

                      Email:

                    </p>

                    <p className="text-gray-600">

                      {booking.email}

                    </p>

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