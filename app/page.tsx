"use client";

import Link from "next/link";
import Image from "next/image";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { app, db } from "@/lib/firebase";

export default function Home() {

  const [parkingSpots, setParkingSpots] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

    const [parkingTypeFilter,
  setParkingTypeFilter] =
  useState("All");

const [availableOnly,
  setAvailableOnly] =
  useState(false);

  const [maxPrice,
  setMaxPrice] =
  useState("All");

  const [userLatitude, setUserLatitude] =
    useState<any>(null);

  const [userLongitude, setUserLongitude] =
    useState<any>(null);

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const auth = getAuth(app);

  // DISTANCE CALCULATION

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {

    const R = 6371;

    const dLat =
      ((lat2 - lat1) * Math.PI) /
      180;

    const dLon =
      ((lon2 - lon1) * Math.PI) /
      180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(
        (lat1 * Math.PI) / 180
      ) *
        Math.cos(
          (lat2 * Math.PI) / 180
        ) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;

  };

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

  // FETCH PARKINGS

  useEffect(() => {

    setLoading(true);

    const unsubscribe =
      onSnapshot(

        collection(
          db,
          "parkings"
        ),

        (snapshot) => {

          const parkingData: any[] =
            [];

          snapshot.forEach((doc) => {

            parkingData.push({

              id: doc.id,

              ...doc.data(),

            });

          });

          setParkingSpots(
            parkingData
          );

          setLoading(false);

        },

        (error) => {

          console.log(error);

          setLoading(false);

        }

      );

    return () => unsubscribe();

  }, []);

  return (

    <div className="min-h-screen bg-gray-100 text-gray-900">

      {/* HEADER */}

      <header className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-xl">

        <h1 className="text-4xl font-bold">

  <span className="text-white">
    CarParking
  </span>

  <span className="text-green-400">
    Bangalore
  </span>

</h1>

        <nav className="hidden md:flex gap-8 font-medium">

          <a href="#home">
            Home
          </a>

          <a href="#parking">
            Search Parking
          </a>

          <a href="#owners">
            List Parking
          </a>

          <Link href="/contact">
            Contact
          </Link>

        </nav>

        <div className="flex items-center gap-4">

          {user ? (

            <div className="relative group">

              <img
                src={
                  user.photoURL ||
                  "https://via.placeholder.com/50"
                }
                className="w-12 h-12 rounded-full object-cover border-2 border-green-500 cursor-pointer"
              />

              <div className="absolute right-0 mt-3 w-72 bg-white text-black rounded-3xl shadow-2xl p-6 hidden group-hover:block z-50">

                <div className="flex items-center gap-4 mb-5">

                  <img
                    src={
                      user.photoURL ||
                      "https://via.placeholder.com/50"
                    }
                    className="w-16 h-16 rounded-full object-cover"
                  />

                  <div>

                    <h3 className="font-bold text-xl">

                      {user.displayName ||
                        "User"}

                    </h3>

                    <p className="text-sm text-gray-500">

                      {user.email}

                    </p>

                  </div>

                </div>

                <div className="flex flex-col gap-3">

                  <Link
                    href="/profile"
                    className="bg-green-500 text-white text-center py-3 rounded-2xl font-bold"
                  >

                    My Profile

                  </Link>

                  <Link
                    href="/bookings"
                    className="bg-black text-white text-center py-3 rounded-2xl font-bold"
                  >

                    My Bookings

                  </Link>

                  <Link
                    href="/dashboard"
                    className="bg-blue-500 text-white text-center py-3 rounded-2xl font-bold"
                  >

                    Dashboard

                  </Link>

                  <button

                    onClick={async () => {

                      await signOut(
                        auth
                      );

                      localStorage.clear();

                      window.location.href =
                        "/";

                    }}

                    className="w-full bg-red-500 text-white py-3 rounded-2xl font-bold"

                  >

                    Logout

                  </button>

                </div>

              </div>

            </div>

          ) : (

            <>

              <Link
                href="/login"
                className="bg-white text-black px-5 py-2 rounded-xl font-semibold"
              >

                Login

              </Link>

              <Link
                href="/signup"
                className="bg-green-500 px-5 py-2 rounded-xl font-semibold"
              >

                Register

              </Link>

            </>

          )}

        </div>

      </header>

      {/* HERO */}

<section
  id="home"
  className="relative min-h-[85vh] bg-cover bg-center"
  style={{
   backgroundImage:
  "url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=1920&auto=format&fit=crop')"
  }}
>

  <div className="absolute inset-0 bg-black/35"></div>

  <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16">

    <div className="grid lg:grid-cols-2 gap-12 items-center">

      {/* LEFT CONTENT */}

      <div>

        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">

  Find Smart Parking
  In <span className="text-green-400">Bangalore</span>

</h1>

        <p className="text-xl text-gray-300 mb-8">

          Book monthly or yearly parking spaces instantly and hassle-free.

        </p>

      </div>

      {/* RIGHT FEATURES */}

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-white/10 backdrop-blur-lg border border-gray-700 rounded-2xl p-4">

          <h3 className="text-green-400 font-bold text-1g mb-2">
            Secure Parking
          </h3>

          <p className="text-gray-300">
            Safe & monitored spaces
          </p>

        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-gray-700 rounded-2xl p-4">

          <h3 className="text-green-400 font-bold text-lg mb-2">
            Best Prices
          </h3>

          <p className="text-gray-300">
            Affordable & transparent
          </p>

        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-gray-700 rounded-2xl p-4">

          <h3 className="text-green-400 font-bold text-lg mb-2">
            Easy Booking
          </h3>

          <p className="text-gray-300">
            Monthly & yearly plans
          </p>

        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-gray-700 rounded-2xl p-4">

          <h3 className="text-green-400 font-bold text-lg mb-2">
            Prime Locations
          </h3>

          <p className="text-gray-300">
            Across Bangalore
          </p>

        </div>

      </div>

    </div>

    {/* SEARCH BAR */}

    <div className="bg-white rounded-3xl shadow-2xl p-4 mt-12">

      <div className="grid lg:grid-cols-5 gap-4">

        <input
          type="text"
          placeholder="Search location or parking name"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="border py-3 px-4 rounded-2xl"
        />

        <select
          value={parkingTypeFilter}
          onChange={(e) =>
            setParkingTypeFilter(
              e.target.value
            )
          }
          className="border py-3 px-4 rounded-2xl"
        >

          <option value="All">
            All Types
          </option>

          <option value="Covered Parking">
            Covered Parking
          </option>

          <option value="Open Parking">
            Open Parking
          </option>

        </select>

        <select
          value={maxPrice}
          onChange={(e) =>
            setMaxPrice(
              e.target.value
            )
          }
          className="border py-3 px-4 rounded-2xl"
        >

          <option value="All">
            Any Price
          </option>

          <option value="1000">
            Under ₹1000
          </option>

          <option value="2000">
            Under ₹2000
          </option>

          <option value="3000">
            Under ₹3000
          </option>

          <option value="5000">
            Under ₹5000
          </option>

        </select>

        <label className="flex items-center justify-center gap-3 border rounded-2xl px-4">

          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) =>
              setAvailableOnly(
                e.target.checked
              )
            }
          />

          Available Only

        </label>

        <button

          onClick={() => {

            navigator.geolocation.getCurrentPosition(

              (position) => {

                setUserLatitude(
                  position.coords.latitude
                );

                setUserLongitude(
                  position.coords.longitude
                );

              }

            );

          }}

          className="bg-black text-white rounded-2xl font-bold"

        >

          Use My Location

        </button>

      </div>

    </div>

    {/* TRUST BAR */}

    <div className="grid md:grid-cols-4 gap-6 mt-10">

      <div className="bg-white rounded-2xl p-6 text-center">

        <h3 className="font-bold text-lg">
          📍 Wide Coverage
        </h3>

        <p className="text-gray-500">
          Across Bangalore
        </p>

      </div>

      <div className="bg-white rounded-2xl p-6 text-center">

        <h3 className="font-bold text-lg">
          ✅ Verified Owners
        </h3>

        <p className="text-gray-500">
          Trusted Listings
        </p>

      </div>

      <div className="bg-white rounded-2xl p-6 text-center">

        <h3 className="font-bold text-lg">
          🎧 24/7 Support
        </h3>

        <p className="text-gray-500">
          We're Here To Help
        </p>

      </div>

      <div className="bg-white rounded-2xl p-6 text-center">

        <h3 className="font-bold text-lg">
          💰 No Hidden Charges
        </h3>

        <p className="text-gray-500">
          Transparent Pricing
        </p>

      </div>

    </div>

  </div>

</section>

      <section
        id="parking"
        className="py-20 px-6"
      >

        <div className="max-w-7xl mx-auto">

          <div className="flex items-center justify-between mb-12">

           <div>

  <h2 className="text-4xl font-bold">

    Available Parking Slots

  </h2>

  <p className="text-gray-500 mt-2">

    Find verified parking spaces across Bangalore

  </p>

</div>

            <div className="bg-black text-white px-6 py-3 rounded-2xl font-bold">

              {
                parkingSpots.filter(
                  (spot) =>
                    spot.status ===
                    "Approved"
                ).length
              } Listings

            </div>

          </div>

          {loading ? (

            <div className="text-center text-xl font-bold py-20">

              Loading Parking Slots...

            </div>

          ) : (

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

              {parkingSpots

                // ONLY APPROVED

                .filter(

                  (spot) =>
                    spot.status ===
                    "Approved"

                )

                // SEARCH

                .filter((spot) =>

  spot.location
    ?.toLowerCase()
    .includes(
      search.toLowerCase()
    )

  ||

  spot.title
    ?.toLowerCase()
    .includes(
      search.toLowerCase()
    )

)

.filter((spot) =>

  parkingTypeFilter ===
    "All"

    ? true

    : spot.parkingType ===
      parkingTypeFilter

)

.filter((spot) =>

  availableOnly

    ? spot.availability ===
      "Available"

    : true

)

.filter((spot) =>

  maxPrice === "All"

    ? true

    : Number(
        spot.monthlyPrice
      ) <=
      Number(maxPrice)

)

                // FEATURED FIRST

                .sort((a, b) => {

                  if (
                    a.featured &&
                    !b.featured
                  ) {

                    return -1;

                  }

                  if (
                    !a.featured &&
                    b.featured
                  ) {

                    return 1;

                  }

                  return 0;

                })

                // DISTANCE SORT

                .sort((a, b) => {

                  if (
                    !userLatitude ||
                    !userLongitude
                  ) {

                    return 0;

                  }

                  const distanceA =
                    calculateDistance(

                      Number(
                        userLatitude
                      ),

                      Number(
                        userLongitude
                      ),

                      Number(
                        a.latitude
                      ),

                      Number(
                        a.longitude
                      )

                    );

                  const distanceB =
                    calculateDistance(

                      Number(
                        userLatitude
                      ),

                      Number(
                        userLongitude
                      ),

                      Number(
                        b.latitude
                      ),

                      Number(
                        b.longitude
                      )

                    );

                  return (
                    distanceA -
                    distanceB
                  );

                })

                .map((spot) => (

                  <div
  key={spot.id}
  className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
>

                    <div className="relative">

  <Image
    src={
      spot.image ||
      "https://via.placeholder.com/400"
    }
    alt={spot.title}
    width={500}
    height={300}
    className="h-52 w-full object-cover transition duration-500 hover:scale-105"
  />

  <div className="absolute top-3 right-3">

  <button className="bg-white w-10 h-10 rounded-full shadow-lg hover:scale-110 transition">

    ❤️

  </button>

</div>

  {/* BADGES ON IMAGE */}

  <div className="absolute top-3 left-3 flex gap-2">

  {spot.featured && (
    <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
      Featured
    </span>
  )}

  {spot.verified && (
    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
      Verified
    </span>
  )}

  <span
    className={`text-xs px-3 py-1 rounded-full text-white font-semibold ${
      spot.availability === "Available"
        ? "bg-green-500"
        : "bg-red-500"
    }`}
  >
    {spot.availability}
  </span>

</div>

</div>

                    <div className="p-5">

                      

                      <h3 className="text-lg font-bold mb-2 line-clamp-2">

                        {spot.title}

                      </h3>

                      <p className="text-gray-600 mb-4">

                        {spot.location}

                      </p>

                      {/* DISTANCE */}

                      {userLatitude &&
                        userLongitude &&
                        spot.latitude &&
                        spot.longitude && (

                          <p className="text-green-600 font-bold mb-4">

                            {calculateDistance(

                              Number(
                                userLatitude
                              ),

                              Number(
                                userLongitude
                              ),

                              Number(
                                spot.latitude
                              ),

                              Number(
                                spot.longitude
                              )

                            ).toFixed(1)}
                            km away

                          </p>

                        )}

                      {/* STATUS */}

                      

                      {/* OWNER */}

                      <div className="flex items-center gap-3 mb-4">

                        <img
                          src={
  spot.ownerPhoto &&
  spot.ownerPhoto.trim() !== ""
    ? spot.ownerPhoto
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        spot.ownerName || "Owner"
      )}&background=16a34a&color=fff`
}
                          className="w-10 h-10 rounded-full object-cover"
                        />

                        <div>

                          <h4 className="font-semibold text-sm">

                            {
                              spot.ownerName
                            }

                          </h4>

                          <p className="text-xs text-gray-500">

                            {
                              spot.ownerCity
                            }

                          </p>

                        </div>

                      </div>

                      {/* PRICE */}

<div className="bg-gray-50 rounded-2xl p-3 mb-4">

  <div className="flex justify-between">

    <div>

      <p className="text-xs text-gray-500">
        Monthly
      </p>

      <p className="font-bold text-green-600">

        ₹{spot.monthlyPrice}/mo

      </p>

    </div>

    <div>

      <p className="text-xs text-gray-500">
        Yearly
      </p>

      <p className="font-bold">

        ₹30000/yr

      </p>

    </div>

  </div>

</div>

                      {/* BUTTONS */}

                      <div className="flex gap-3">

                        <Link
                          href={`/parking/${spot.id}`}
                          className="flex-1 text-center bg-green-500 text-white py-3 rounded-2xl font-bold"
                        >

                          Book Now

                        </Link>

                        <a
                          href={
                            spot.latitude &&
                            spot.longitude
                              ? `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  spot.location
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center bg-black text-white py-3 rounded-2xl font-bold"
                        >

                          View Map

                        </a>

                      </div>

                    </div>

                  </div>

                ))}

            </div>

          )}

        </div>

      </section>

      {/* OWNER SECTION */}

      <section
        id="owners"
        className="bg-black text-white py-20 px-6 text-center"
      >

        <div className="max-w-4xl mx-auto">

          <h2 className="text-5xl font-bold mb-6">

            Earn From Your Parking Space

          </h2>

          <p className="text-xl text-gray-300 mb-10">

            List your empty parking slots and start earning.

          </p>

          <Link
            href="/add-parking"
            className="inline-block bg-green-500 px-10 py-5 rounded-2xl text-xl font-bold"
          >

            List Your Parking

          </Link>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="bg-black text-white py-12 px-6">

        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">

          <div>

            <h3 className="text-2xl font-bold mb-4">

              CarParking Bangalore

            </h3>

            <p className="text-gray-400">

              Smart parking marketplace for customers and owners.

            </p>

          </div>

          <div>

            <h4 className="font-bold mb-4">

              Quick Links

            </h4>

            <ul className="space-y-2 text-gray-400">

              <li>
                <Link href="/">
                  Home
                </Link>
              </li>

              <li>
                <Link href="/bookings">
                  Bookings
                </Link>
              </li>

              <li>
                <Link href="/dashboard">
                  Dashboard
                </Link>
              </li>

            </ul>

          </div>

          <div>

            <h4 className="font-bold mb-4">

              Contact

            </h4>

            <ul className="space-y-2 text-gray-400">

              <li>
                Bangalore, India
              </li>

              <li>
                akhilnaidu19@gmail.com
              </li>

              <li>
                +91 9206687300
              </li>

            </ul>

          </div>

        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500">

          © 2026 CarParking Bangalore

        </div>

      </footer>

    </div>

  );

}