"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "@/lib/firebase";



export default function Navbar() {
  const [user, setUser] = useState<any>(null);

const auth = getAuth(app);

useEffect(() => {

  const unsubscribe =
    onAuthStateChanged(auth, (currentUser) => {

      setUser(currentUser);

    });

  return () => unsubscribe();

}, []);
  return (
    <nav className="bg-black text-white px-8 py-5 flex items-center justify-between">

      <Link
        href="/"
        className="text-4xl font-bold"
      >
        CarParking
        <span className="text-green-400">
          Bangalore
        </span>
      </Link>

      <div className="hidden md:flex gap-8 font-medium">

        <Link href="/">
          Home
        </Link>

        <Link href="/#parking">
          Search Parking
        </Link>

        <Link href="/add-parking">
          List Parking
        </Link>

        <Link href="/bookings">
          My Bookings
        </Link>

        <Link href="/wishlist">
          Wishlist ❤️
        </Link>



        <Link href="/contact">
          Contact
        </Link>

       <Link href="/support">
  Support
</Link>

</div>

{user ? (

  <div className="relative group">

    <img
      src={
        user.photoURL ||
        "https://via.placeholder.com/50"
      }
      alt="Profile"
      className="w-12 h-12 rounded-full object-cover border-2 border-green-500 cursor-pointer"
    />

    <div className="absolute right-0 top-14 w-64 bg-white text-black rounded-2xl shadow-2xl p-4 hidden group-hover:block z-50">

      <div className="mb-4">

        <h3 className="font-bold">
          {user.displayName || "User"}
        </h3>

        <p className="text-sm text-gray-500">
          {user.email}
        </p>

      </div>

      <div className="flex flex-col gap-2">

        <Link
          href="/profile"
          className="bg-green-500 text-white text-center py-2 rounded-lg"
        >
          My Profile
        </Link>

        <Link
          href="/bookings"
          className="bg-blue-500 text-white text-center py-2 rounded-lg"
        >
          My Bookings
        </Link>

        <Link
          href="/dashboard"
          className="bg-black text-white text-center py-2 rounded-lg"
        >
          Dashboard
        </Link>

        <button
          onClick={async () => {
            await signOut(auth);
            localStorage.clear();
            window.location.href = "/";
          }}
          className="bg-red-500 text-white py-2 rounded-lg"
        >
          Logout
        </button>

      </div>

    </div>

  </div>

) : (

  <Link
    href="/login"
    className="bg-green-500 px-4 py-2 rounded-xl font-semibold"
  >
    Login
  </Link>

)}

</nav>
);
}