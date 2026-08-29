"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { app, db, storage } from "@/lib/firebase";

export default function ProfilePage() {

  const [user, setUser] =
    useState<any>(null);

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [city, setCity] =
    useState("");

  const [photo, setPhoto] =
    useState<any>(null);

  const [photoURL, setPhotoURL] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [profileCompletion, setProfileCompletion] =
    useState(0);

  const auth = getAuth(app);

  const [userId, setUserId] =
  useState("");

  // AUTH + FETCH PROFILE

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        async (currentUser) => {

          if (currentUser) {

            setUser(currentUser);

            const docRef = doc(
              db,
              "users",
              currentUser.uid
            );

            const docSnap =
              await getDoc(docRef);

            if (
              docSnap.exists()
            ) {

              const data =
                docSnap.data();

                setUserId(
  data.userId || ""
);

              setName(
                data.name || ""
              );

              setPhone(
                data.phone || ""
              );

              setCity(
                data.city || ""
              );

             setPhotoURL(
  data.photoURL ||
  data.photo ||
  ""
);

            }

          }

        }

      );

    return () =>
      unsubscribe();

  }, []);

  // PROFILE COMPLETION

  useEffect(() => {

    let completed = 0;

    if (name) completed += 25;

    if (phone)
      completed += 25;

    if (city) completed += 25;

    if (photoURL)
      completed += 25;

    setProfileCompletion(
      completed
    );

  }, [
    name,
    phone,
    city,
    photoURL,
  ]);

  // SAVE PROFILE

  const handleSave =
    async () => {

      if (!user) return;

      let uploadedPhoto =
        photoURL;

      try {

        setLoading(true);

        // IMAGE UPLOAD

        if (photo) {

          const imageRef =
            ref(

              storage,

              `profile-images/${user.uid}`

            );

          await uploadBytes(
            imageRef,
            photo
          );

          uploadedPhoto =
            await getDownloadURL(
              imageRef
            );

          setPhotoURL(
            uploadedPhoto
          );

        }

        // FIRESTORE SAVE

        await setDoc(
  doc(db, "users", user.uid),
  {
    name: name.trim(),
    phone: phone.trim(),
    city: city.trim(),

    photoURL: uploadedPhoto,

    email: user.email || "",

    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  },
  {
    merge: true,
  }
);

       
        // FIREBASE AUTH PROFILE

        await updateProfile(
          user,

          {

            displayName:
              name,

            photoURL:
              uploadedPhoto,

          }

        );

        alert(
          "Profile Updated Successfully"
        );

} catch (error: any) {
  console.error("PROFILE UPDATE ERROR:", error);

  if (error?.code === "permission-denied") {
    alert(
      "Profile update was blocked by Firestore security rules."
    );
  } else {
    alert(
      error?.message ||
        "Error Updating Profile"
    );
  }
} finally {

        setLoading(false);

      }

    };

  // LOGIN CHECK

  if (!user) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <h1 className="text-4xl font-bold">

          Please Login

        </h1>

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-6xl mx-auto">

        {/* TOP PROFILE CARD */}

        <div className="bg-black text-white rounded-3xl shadow-2xl p-10 mb-10">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">

            <div className="flex items-center gap-6">

{photoURL ? (
  <img
    src={photoURL}
    className="w-36 h-36 rounded-full object-cover border-4 border-green-500"
  />
) : (
  <div className="w-36 h-36 rounded-full bg-green-600 border-4 border-green-500 flex items-center justify-center text-white text-5xl font-bold">
    {(name || "User")
      .split(" ")
      .map((word) => word[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()}
  </div>
)}

              <div>

                <h1 className="text-5xl font-bold mb-3">

                  {name ||
                    "Your Profile"}

                </h1>

                <p className="text-gray-300 text-lg">

                  {user.email}

                </p>

                <p className="text-green-400 font-bold mt-2">
  User ID: {userId || "N/A"}
</p>

                <div className="flex flex-wrap gap-3 mt-4">

                  <span className="bg-green-500 px-4 py-2 rounded-xl font-bold">

                    Verified User

                  </span>

                  <span className="bg-blue-500 px-4 py-2 rounded-xl font-bold">

                    {profileCompletion}
                    % Complete

                  </span>

                </div>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex flex-col gap-4">

              <Link
                href="/dashboard"
                className="bg-green-500 text-white px-6 py-4 rounded-2xl font-bold text-center"
              >

                Owner Dashboard

              </Link>

              <Link
                href="/bookings"
                className="bg-white text-black px-6 py-4 rounded-2xl font-bold text-center"
              >

                My Bookings

              </Link>

              <button

                onClick={async () => {

  await signOut(auth);

  window.location.href = "/";

}}

                className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold"

              >

                Logout

              </button>

            </div>

          </div>

        </div>

        {/* MAIN GRID */}

        <div className="grid md:grid-cols-3 gap-8">

          {/* PROFILE FORM */}

          <div className="md:col-span-2 bg-white rounded-3xl shadow-xl p-10">

            <h2 className="text-4xl font-bold mb-8">

              Edit Profile

            </h2>

            {/* PHOTO */}

            <div className="mb-8">

              <label className="block text-xl font-bold mb-4">

                Profile Photo

              </label>

              <input
                type="file"
                onChange={(e) => {

                  if (
                    e.target
                      .files?.[0]
                  ) {

                    setPhoto(
                      e.target
                        .files[0]
                    );

                  }

                }}
                className="w-full border p-4 rounded-2xl"
              />

            </div>

            {/* NAME */}

            <div className="mb-6">

              <label className="block font-bold mb-3">

                Full Name

              </label>

              <input
                type="text"
                placeholder="Enter Name"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target
                      .value
                  )
                }
                className="w-full border p-4 rounded-2xl"
              />

            </div>

            {/* PHONE */}

            <div className="mb-6">

              <label className="block font-bold mb-3">

                Phone Number

              </label>

              <input
                type="text"
                placeholder="Enter Phone"
                value={phone}
                onChange={(e) =>
                  setPhone(
                    e.target
                      .value
                  )
                }
                className="w-full border p-4 rounded-2xl"
              />

            </div>

            {/* CITY */}

            <div className="mb-6">

              <label className="block font-bold mb-3">

                City

              </label>

              <input
                type="text"
                placeholder="Enter City"
                value={city}
                onChange={(e) =>
                  setCity(
                    e.target
                      .value
                  )
                }
                className="w-full border p-4 rounded-2xl"
              />

            </div>

            {/* EMAIL */}

            <div className="mb-8">

              <label className="block font-bold mb-3">

                Email Address

              </label>

              <input
                type="email"
                value={
                  user?.email ||
                  ""
                }
                disabled
                className="w-full border p-4 rounded-2xl bg-gray-100"
              />

            </div>

            {/* SAVE */}

            <button

              onClick={
                handleSave
              }

              disabled={
                loading
              }

              className="w-full bg-green-500 text-white py-5 rounded-2xl font-bold text-2xl disabled:bg-gray-400"

            >

              {loading
                ? "Saving..."
                : "Save Profile"}

            </button>

          </div>

          {/* SIDE PANEL */}

          <div className="space-y-8">

            {/* PROFILE STATUS */}

            <div className="bg-white rounded-3xl shadow-xl p-8">

              <h2 className="text-3xl font-bold mb-6">

                Profile Status

              </h2>

              <div className="w-full bg-gray-200 rounded-full h-5 mb-4">

                <div
                  className="bg-green-500 h-5 rounded-full"
                  style={{
                    width: `${profileCompletion}%`,
                  }}
                ></div>

              </div>

              <p className="text-gray-600 text-lg">

                Complete your profile to improve trust and visibility on the platform.

              </p>

            </div>

            {/* QUICK ACTIONS */}

            <div className="bg-white rounded-3xl shadow-xl p-8">

              <h2 className="text-3xl font-bold mb-6">

                Quick Actions

              </h2>

              <div className="flex flex-col gap-4">

                <Link
                  href="/add-parking"
                  className="bg-black text-white px-6 py-4 rounded-2xl font-bold text-center"
                >

                  Add Parking

                </Link>

                <Link
                  href="/dashboard"
                  className="bg-green-500 text-white px-6 py-4 rounded-2xl font-bold text-center"
                >

                  Owner Dashboard

                </Link>

                <Link
                  href="/bookings"
                  className="bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold text-center"
                >

                  View Bookings

                </Link>

              </div>

            </div>

            {/* ACCOUNT INFO */}

            <div className="bg-white rounded-3xl shadow-xl p-8">

              <h2 className="text-3xl font-bold mb-6">

                Account Info

              </h2>

              <div className="space-y-4">

                <div>

                  <p className="text-gray-500">

                    Account Type

                  </p>

                  <p className="font-bold text-lg">

                    Parking Marketplace User

                  </p>

                </div>

                <div>

                  <p className="text-gray-500">

                    Account Status

                  </p>

                  <p className="font-bold text-green-600 text-lg">

                    Active

                  </p>

                </div>

                <div>

                  <p className="text-gray-500">

                    Platform

                  </p>

                  <p className="font-bold text-lg">

                    CarParking Bangalore

                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}