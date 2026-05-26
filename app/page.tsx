"use client";

import Link from "next/link";
import Image from "next/image";

import { useEffect, useState } from "react";

import { collection, getDocs } from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { app, db } from "@/lib/firebase";

export default function Home() {

  const [parkingSpots, setParkingSpots] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);

  // AUTH STATE
  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {

        setUser(currentUser);

      }
    );

    return () => unsubscribe();

  }, []);

  // FETCH PARKINGS
  useEffect(() => {

    const fetchParkings = async () => {

      try {

        setLoading(true);

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

        setParkingSpots(parkingData);

      } catch (error) {

        console.log(error);

      } finally {

        setLoading(false);

      }

    };

    fetchParkings();

  }, []);

  return (

    <div className="min-h-screen bg-gray-100 text-gray-900">

      {/* HEADER */}

      <header className="bg-black text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">

        <h1 className="text-3xl font-bold">
          CarParking Bangalore
        </h1>

        <nav className="hidden md:flex gap-8 font-medium">

          <a href="#home">Home</a>

          <a href="#parking">Search Parking</a>

          <a href="#owners">List Parking</a>

          <Link href="/contact">
            Contact
          </Link>

        </nav>

        <div className="flex items-center gap-4">

          {user ? (

            <>
              <p className="text-green-400 text-sm">
                {user.email}
              </p>

              <button
                onClick={async () => {

                  await signOut(auth);

                  localStorage.removeItem("userEmail");

                  localStorage.removeItem("userName");

                  window.location.href = "/";

                }}
                className="bg-red-500 px-5 py-2 rounded-xl font-semibold"
              >
                Logout
              </button>
            </>

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

      {/* HERO SECTION */}

      <section
        id="home"
        className="relative h-[70vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1600&auto=format&fit=crop')",
        }}
      >

        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 text-center text-white w-full px-6">

          <h2 className="text-5xl font-bold mb-6">
            Book Smart Parking in Bangalore
          </h2>

          <p className="text-xl mb-10">
            Book monthly or yearly parking spaces instantly.
          </p>

          <div className="bg-white rounded-3xl p-5 flex flex-col md:flex-row gap-4 max-w-5xl mx-auto">

            <input
              type="text"
              placeholder="Search by location"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="flex-1 border p-4 rounded-2xl text-black"
            />

            <button className="bg-green-500 text-white px-10 py-4 rounded-2xl font-bold">
              Search Parking
            </button>

          </div>

        </div>

      </section>

      {/* PARKING LIST */}

      <section
        id="parking"
        className="py-20 px-6"
      >

        <div className="max-w-7xl mx-auto">

          <h2 className="text-5xl font-bold mb-12">
            Available Parking Slots
          </h2>

          {loading ? (

            <div className="text-center text-3xl font-bold py-20">
              Loading Parking Slots...
            </div>

          ) : parkingSpots.length === 0 ? (

            <div className="text-center text-3xl font-bold text-red-500 py-20">
              No Parking Slots Found
            </div>

          ) : (

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
                    className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition"
                  >

                    <Image
                      src={
                        spot.image ||
                        "https://via.placeholder.com/400"
                      }
                      alt={spot.title}
                      width={500}
                      height={300}
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

                      <div className="flex justify-between mb-6">

                        <div>

                          <p className="text-sm text-gray-500">
                            Monthly
                          </p>

                          <p className="font-bold">
                            ₹{spot.monthlyPrice}/month
                          </p>

                        </div>

                        <div>

                          <p className="text-sm text-gray-500">
                            Yearly
                          </p>

                          <p className="font-bold">
                            ₹30000/year
                          </p>

                        </div>

                      </div>

                      <Link
                        href={`/parking/${spot.id}`}
                        className="block text-center bg-green-500 text-white py-3 rounded-2xl font-bold"
                      >
                        Book Now
                      </Link>

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
                <Link href="/">Home</Link>
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

              <li>Bangalore, India</li>

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