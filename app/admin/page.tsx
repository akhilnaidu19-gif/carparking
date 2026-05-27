"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function AdminPage() {

  const [parkings, setParkings] =
    useState<any[]>([]);

  const [bookings, setBookings] =
    useState<any[]>([]);

  // FETCH PARKINGS

  useEffect(() => {

    const unsubscribe =
      onSnapshot(

        collection(db, "parkings"),

        (snapshot) => {

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

        }

      );

    return () => unsubscribe();

  }, []);

  // FETCH BOOKINGS

  useEffect(() => {

    const unsubscribe =
      onSnapshot(

        collection(db, "bookings"),

        (snapshot) => {

          const bookingData: any[] =
            [];

          snapshot.forEach((doc) => {

            bookingData.push({

              id: doc.id,

              ...doc.data(),

            });

          });

          setBookings(
            bookingData
          );

        }

      );

    return () => unsubscribe();

  }, []);

  return (

    <div className="min-h-screen bg-gray-100 p-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-5xl font-bold mb-10">

          Admin Panel

        </h1>

        {/* STATS */}

        <div className="grid md:grid-cols-3 gap-8 mb-12">

          <div className="bg-white p-8 rounded-3xl shadow-lg">

            <h2 className="text-2xl font-bold mb-3">

              Total Listings

            </h2>

            <p className="text-5xl font-bold text-green-500">

              {parkings.length}

            </p>

          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg">

            <h2 className="text-2xl font-bold mb-3">

              Total Bookings

            </h2>

            <p className="text-5xl font-bold text-blue-500">

              {bookings.length}

            </p>

          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg">

            <h2 className="text-2xl font-bold mb-3">

              Platform Revenue

            </h2>

            <p className="text-5xl font-bold">

              ₹
              {bookings.length * 100}

            </p>

          </div>

        </div>

        {/* PARKINGS */}

        <div className="bg-white rounded-3xl shadow-lg p-8">

          <h2 className="text-3xl font-bold mb-8">

            All Parking Listings

          </h2>

          <div className="grid gap-6">

            {parkings.map((parking) => (

              <div
                key={parking.id}
                className="border rounded-3xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
              >

                <div className="flex gap-6 items-center">

                  <img
                    src={parking.image}
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

                      Owner:
                      {" "}
                      {parking.owner}

                    </p>

                  </div>

                </div>

                <button
                  onClick={async () => {

                    const confirmDelete =
                      confirm(
                        "Delete Listing?"
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
                        "Listing Deleted"
                      );

                    } catch (error) {

                      console.log(error);

                    }

                  }}
                  className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold"
                >

                  Remove Listing

                </button>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  );

}