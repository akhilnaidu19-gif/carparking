"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { app } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { storage } from "@/lib/firebase";

export default function AddParkingPage() {

  const [title, setTitle] = useState("");
const [location, setLocation] = useState("");
const [monthlyPrice, setMonthlyPrice] = useState("");
const [parkings, setParkings] = useState<any[]>([]);
const [image, setImage] = useState<any>(null);
const [availability, setAvailability] = useState("Available");

const [user, setUser] = useState<any>(null);

const auth = getAuth(app);

useEffect(() => {

  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return unsubscribe;

}, []);
  

  if (!user) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        Please login to add parking
      </h1>
    </div>
  );
}


  return (
    <div className="min-h-screen bg-gray-100 py-16 px-6">
      
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">
        
        <h1 className="text-5xl font-bold mb-10 text-center">
          List Your Parking Space
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
            placeholder="Yearly Price"
            className="border p-4 rounded-2xl"
          />

          <select className="border p-4 rounded-2xl">
            <option>Covered Parking</option>
            <option>Open Parking</option>
            <option>Basement Parking</option>
          </select>

          <select className="border p-4 rounded-2xl">
            <option>CCTV Available</option>
            <option>No CCTV</option>
          </select>

          <select
  value={availability}
  onChange={(e) => setAvailability(e.target.value)}
  className="border p-4 rounded-2xl"
>
  <option>Available</option>
  <option>Occupied</option>
</select>

        </div>

<input
  type="file"
  onChange={(e) => {
    if (e.target.files?.[0]) {
      setImage(e.target.files[0]);
    }
  }}
  className="border p-4 rounded-2xl w-full mt-6"
/>
        <textarea
          placeholder="Parking Description"
          className="border p-4 rounded-2xl w-full mt-6 h-40"
        ></textarea>

        <button
  onClick={async () => {
  const imageRef = ref(
  storage,
  `parking-images/${image.name}`
);

await uploadBytes(imageRef, image);

const imageURL = await getDownloadURL(imageRef);

const newParking = {
  title,
  location,
  monthlyPrice,
  image: imageURL,
  availability,
};

try {
  await addDoc(collection(db, "parkings"), newParking);

  setParkings([...parkings, newParking]);

  console.log("Parking Added");
} catch (error) {
  console.log(error);
}
  }}
  className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-xl mt-8"
>
  Submit Parking
</button>
      </div>
      <div className="max-w-4xl mx-auto mt-10">

  <h2 className="text-3xl font-bold mb-6">
    Submitted Parking Listings
  </h2>

  <div className="grid gap-6">
    {parkings.map((parking, index) => (
      <div
        key={index}
        className="bg-white p-6 rounded-3xl shadow-lg"
      >
        <img
  src={parking.image}
  alt={parking.title}
  className="w-full h-60 object-cover rounded-2xl mb-4"
/>
        <h3 className="text-2xl font-bold mb-2">
          {parking.title}
        </h3>

        <p className="text-gray-600 mb-2">
          {parking.location}
        </p>

        <p className="text-green-600 font-bold">
          ₹{parking.monthlyPrice}/month
        </p>
      </div>
    ))}
  </div>
</div>
    </div>
    
  );
}