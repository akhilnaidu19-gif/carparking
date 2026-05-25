"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {

  const [parkings, setParkings] = useState<any[]>([]);

  useEffect(() => {

    const fetchParkings = async () => {

      const querySnapshot = await getDocs(
        collection(db, "parkings")
      );

      const parkingData: any[] = [];

      querySnapshot.forEach((doc) => {
        parkingData.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setParkings(parkingData);

    };

    fetchParkings();

  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-7xl mx-auto">

        <h1 className="text-5xl font-bold mb-10">
          Owner Dashboard
        </h1>

        <div className="grid md:grid-cols-3 gap-8 mb-12">

          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-3">
              Total Parking Slots
            </h2>

            <p className="text-5xl font-bold text-green-500">
              {parkings.length}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-3">
              Active Bookings
            </h2>

            <p className="text-5xl font-bold text-blue-500">
              8
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-3">
              Monthly Earnings
            </h2>

            <p className="text-5xl font-bold text-black">
              ₹45K
            </p>
          </div>

        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8">

          <h2 className="text-3xl font-bold mb-8">
            Your Parking Listings
          </h2>

          <div className="grid gap-6">

            {parkings.map((parking) => (

              <div
                key={parking.id}
                className="border rounded-3xl p-6 flex items-center justify-between"
              >

                <div>
                  <h3 className="text-2xl font-bold">
                    {parking.title}
                  </h3>

                  <p className="text-gray-600">
                    {parking.location}
                  </p>
                </div>

                <button
  onClick={async () => {

    try {

      await deleteDoc(doc(db, "parkings", parking.id));

      setParkings(
        parkings.filter((item) => item.id !== parking.id)
      );

      alert("Parking Deleted");

    } catch (error) {
      console.log(error);
    }

  }}
  className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold"
>
  Delete
</button>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}