"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { app } from "@/lib/firebase";
import { db } from "@/lib/firebase";
export default function Home() {
  const [parkingSpots, setParkingSpots] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState("");
  const [search, setSearch] = useState("");

const auth = getAuth(app);

useEffect(() => {

  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
  });

  return () => unsubscribe();

}, []);
useEffect(() => {
  const fetchParkings = async () => {
    const querySnapshot = await getDocs(collection(db, "parkings"));

    const parkingData: any[] = [];

    querySnapshot.forEach((doc) => {
      parkingData.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    setParkingSpots(parkingData);
  };

  fetchParkings();
}, []);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 scroll-smooth">
      {/* Header */}
      <header className="bg-black text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <h1 className="text-2xl font-bold">CarParking Bangalore</h1>

<nav className="hidden md:flex gap-6 text-sm">
  <a href="#home" className="hover:text-green-400">
    Home
  </a>

  <a href="#parking" className="hover:text-green-400">
    Search Parking
  </a>

  <a href="#owners" className="hover:text-green-400">
    List Parking
  </a>

  <a href="/contact" className="hover:text-green-400">
  Contact
</a>
</nav>

{user && (
  <p className="text-sm text-green-400">
    {user.email}
  </p>
)}

{user && (
  <button
    onClick={async () => {
      await signOut(auth);
    }}
    className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold"
  >
    Logout
  </button>
)}
        <div className="flex gap-3">

  <a
    href="/login"
    className="bg-white text-black px-4 py-2 rounded-xl font-semibold"
  >
    Login
  </a>

  <a
    href="/signup"
    className="bg-green-500 px-4 py-2 rounded-xl font-semibold"
  >
    Register
  </a>

</div>
      </header>

      {/* Hero Section */}
      <section
  id="home"
  className="relative h-[80vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1600&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 text-center text-white px-4">
          <h2 className="text-5xl font-bold mb-6">
            Book Smart Parking in Bangalore
          </h2>

          <p className="text-xl mb-8">
            Book monthly or yearly parking spaces instantly.
          </p>

          <div className="bg-white rounded-3xl p-5 flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
            <button
  onClick={() => {

    navigator.geolocation.getCurrentPosition((position) => {

      setCurrentLocation(
        `${position.coords.latitude}, ${position.coords.longitude}`
      );

    });

  }}
  className="bg-black text-white px-6 py-4 rounded-2xl font-bold"
>
  Use Current Location
</button>
            <input
  type="text"
  placeholder="Search by location"
  value={search}
  onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-5 py-4 rounded-2xl border text-black"
            />

            <select className="px-5 py-4 rounded-2xl border text-black">
              <option>Monthly</option>
              <option>Yearly</option>
            </select>

            <button className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold">
              Search Parking
            </button>
          </div>
          {currentLocation && (
  <p className="text-white mt-4 text-lg">
    Current Location: {currentLocation}
  </p>
)}
        </div>
      </section>

      {/* Parking Listings */}
      <section id="parking" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold mb-10">
            Available Parking Slots
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {parkingSpots
  .filter((spot) =>
    spot.location
      ?.toLowerCase()
      .includes(search.toLowerCase())
  )
  .map((spot) => (
              <div
                key={spot.id}
                className="bg-white rounded-3xl overflow-hidden shadow-lg"
              >
                <img
  src={spot.image || "https://via.placeholder.com/400"}
                  alt={spot.title}
                  className="h-60 w-full object-cover"
                />

                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {spot.title}
                  </h3>

                  <p className="text-gray-600 mb-4">
                    {spot.location}
                  </p>

                  <span
  className={`inline-block px-4 py-2 rounded-xl text-white font-semibold mb-4 ${
    spot.availability === "Available"
      ? "bg-green-500"
      : "bg-red-500"
  }`}
>
  {spot.availability}
</span>

                  <div className="flex justify-between mb-5">
                    <div>
                      <p className="text-sm text-gray-500">Monthly</p>
                      <p className="font-bold">₹{spot.monthlyPrice}/month</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Yearly</p>
                      <p className="font-bold">₹30000/year</p>
                    </div>
                  </div>

                 <a
  href={`/booking/${spot.id}`}
  className="block text-center w-full bg-green-500 text-white py-3 rounded-2xl font-bold"
>
  Book Now
</a>

<a
  href={`https://www.google.com/maps/search/?api=1&query=${spot.location}`}
  target="_blank"
  className="block text-center w-full bg-black text-white py-3 rounded-2xl font-bold mt-3"
>
  Open in Maps
</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* How It Works */}
<section className="py-20 px-6 bg-white">
  <div className="max-w-7xl mx-auto">
    <h2 className="text-4xl font-bold text-center mb-14">
      How It Works
    </h2>

    <div className="grid md:grid-cols-4 gap-8">
      {[
        "Search Nearby Parking",
        "Choose Your Slot",
        "Pay Securely Online",
        "Park Hassle-Free",
      ].map((item, index) => (
        <div
          key={index}
          className="bg-gray-100 rounded-3xl p-8 text-center shadow-md"
        >
          <div className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-5">
            {index + 1}
          </div>

          <h3 className="text-xl font-semibold">
            {item}
          </h3>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Owner Section */}
      <section
  id="owners"
  className="py-20 px-6 bg-black text-white text-center"
>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6">
            Earn Money From Your Empty Parking Space
          </h2>

          <p className="text-xl text-gray-300 mb-10">
            List your unused parking slots and start earning monthly income.
          </p>

          <a
  href="/add-parking"
  className="inline-block bg-green-500 px-10 py-5 rounded-2xl text-xl font-bold"
>
  List Your Parking
</a>
        </div>
      </section>

{/* Google Map */}
<section className="py-20 px-6 bg-white">

  <div className="max-w-7xl mx-auto">

    <h2 className="text-4xl font-bold text-center mb-10">
      Find Parking Near You
    </h2>

    <div className="rounded-3xl overflow-hidden shadow-2xl">

      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d62230.669928829875!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae1670c9b44ed9%3A0x3d9d4ce001f0d8d!2sBangalore!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin"
        width="100%"
        height="500"
        loading="lazy"
        className="border-0"
      ></iframe>

    </div>

  </div>

</section>

{/* Footer */}
<footer className="bg-black text-white py-12 px-6">
  <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
    
    <div>
      <h3 className="text-2xl font-bold mb-4">
        CarParking Bangalore
      </h3>

      <p className="text-gray-400">
        Smart parking marketplace for customers and parking owners.
      </p>
    </div>

    <div>
      <h4 className="font-bold mb-4">Quick Links</h4>

      <ul className="space-y-2 text-gray-400">
        <li>
  <a href="/">Home</a>
</li>

<li>
  <a href="#parking">Search Parking</a>
</li>

<li>
  <a href="/dashboard">Dashboard</a>
</li>

<li>
  <a href="/bookings">Bookings</a>
</li>
      </ul>
    </div>

    <div>
      <h4 className="font-bold mb-4">For Owners</h4>

     <ul className="space-y-2 text-gray-400">

  <li>
    <a href="/add-parking">
      List Parking
    </a>
  </li>

  <li>
    <a href="/dashboard">
      Owner Dashboard
    </a>
  </li>

  <li>
    <a href="/bookings">
      Earnings
    </a>
  </li>

  <li>
    <a href="/contact">
      Support
    </a>
  </li>

</ul>
    </div>

    <div>
      <h4 className="font-bold mb-4">Contact</h4>

      <ul className="space-y-2 text-gray-400">
        <li>Bangalore, India</li>
        <li>akhilnaidu19@gmail.com</li>
        <li>+91 9206687300</li>
      </ul>
    </div>
  </div>

  <div className="border-t border-gray-800 mt-10 pt-6 text-center text-gray-500">
    © 2026 CarParking Bangalore. All rights reserved.
  </div>
</footer>

    </div>
  );
}