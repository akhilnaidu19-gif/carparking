"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app, db } from "@/lib/firebase";

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";



export default function Navbar() {
const [user, setUser] = useState<any>(null);

const [userPhoto, setUserPhoto] = useState("");

const [ownerStatus, setOwnerStatus] =
useState("");

const auth = getAuth(app);

useEffect(() => {

  const unsubscribe =
    onAuthStateChanged(auth, (currentUser) => {setUser(currentUser);

setUserPhoto(
  localStorage.getItem("userPhoto") || ""
);

const loadOwnerStatus = async () => {

  if (!currentUser) {
    setOwnerStatus("");
    return;
  }

  const q = query(
    collection(db, "ownerApplications"),
    where("userEmail", "==", currentUser.email)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {

    setOwnerStatus("");

  } else {

    const data = snapshot.docs[0].data();

    setOwnerStatus(data.status);

  }

};

loadOwnerStatus();

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

{user && ownerStatus === "" && (

  <Link href="/become-owner">
    Become Owner
  </Link>

)}

{user && ownerStatus === "Pending" && (

  <span className="text-yellow-400 cursor-default">
    Application Pending
  </span>

)}

{user && ownerStatus === "Approved" && (

  <Link
    href="/dashboard"
    className="text-green-400 font-semibold"
  >
    Owner Dashboard
  </Link>

)}

{user && ownerStatus === "Rejected" && (

  <Link
    href="/become-owner"
    className="text-red-400"
  >
    Reapply
  </Link>

)}

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
    userPhoto ||
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

        {localStorage.getItem(
  "isAdmin"
) === "true" && (

  <Link
    href="/admin"
    className="bg-black text-white text-center py-2 rounded-lg"
  >
    Admin Panel
  </Link>

)}

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