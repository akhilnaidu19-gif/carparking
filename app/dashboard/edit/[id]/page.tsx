"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function EditParkingPage() {
    const params = useParams();

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [image, setImage] = useState("");
  useEffect(() => {

  const fetchParking = async () => {

    const docRef = doc(
      db,
      "parkings",
      params.id as string
    );

    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {

      const data = docSnap.data();

      setTitle(data.title);
      setLocation(data.location);
      setMonthlyPrice(data.monthlyPrice);
      setImage(data.image);

    }

  };

  fetchParking();

}, []);

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">

        <h1 className="text-5xl font-bold mb-10">
          Edit Parking Listing
        </h1>

        <div className="grid md:grid-cols-2 gap-6">

          <input
            type="text"
            placeholder="Parking Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-4 rounded-2xl"
          />

          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border p-4 rounded-2xl"
          />

          <input
            type="text"
            placeholder="Monthly Price"
            value={monthlyPrice}
            onChange={(e) => setMonthlyPrice(e.target.value)}
            className="border p-4 rounded-2xl"
          />

          <input
            type="text"
            placeholder="Image URL"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            className="border p-4 rounded-2xl"
          />

        </div>

        <button
  onClick={async () => {

    try {

      const parkingRef = doc(
        db,
        "parkings",
        params.id as string
      );

      await updateDoc(parkingRef, {
        title,
        location,
        monthlyPrice,
        image,
      });

      alert("Parking Updated");

    } catch (error) {
      console.log(error);
    }

  }}
  className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-xl mt-8"
>
  Update Parking
</button>

      </div>

    </div>
  );
}