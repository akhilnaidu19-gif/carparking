"use client";

import { useEffect, useState } from "react";

import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { app, db, storage } from "@/lib/firebase";

export default function ProfilePage() {

  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState("");

  const [phone, setPhone] = useState("");

  const [city, setCity] = useState("");

  const [photo, setPhoto] = useState<any>(null);

  const [photoURL, setPhotoURL] = useState("");

  const auth = getAuth(app);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {

        if (currentUser) {

          setUser(currentUser);

          const docRef = doc(
            db,
            "users",
            currentUser.uid
          );

          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {

            const data = docSnap.data();

            setName(data.name || "");

            setPhone(data.phone || "");

            setCity(data.city || "");

            setPhotoURL(data.photoURL || "");

          }

        }

      }
    );

    return () => unsubscribe();

  }, []);

  const handleSave = async () => {

    if (!user) return;

    let uploadedPhoto = photoURL;

    try {

      if (photo) {

        const imageRef = ref(
          storage,
          `profile-images/${user.uid}`
        );

        await uploadBytes(imageRef, photo);

        uploadedPhoto =
          await getDownloadURL(imageRef);

        setPhotoURL(uploadedPhoto);

      }

      await setDoc(
        doc(db, "users", user.uid),
        {
          name,
          phone,
          city,
          photoURL: uploadedPhoto,
          email: user.email,
        }
      );

      await updateProfile(user, {
        displayName: name,
        photoURL: uploadedPhoto,
      });

      alert("Profile Updated");

    } catch (error) {

      console.log(error);

      alert("Error Updating Profile");

    }

  };

  return (

    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-10">

        <h1 className="text-5xl font-bold mb-10 text-center">
          My Profile
        </h1>

        <div className="flex justify-center mb-8">

          <img
            src={
              photoURL ||
              "https://via.placeholder.com/150"
            }
            className="w-40 h-40 rounded-full object-cover border-4 border-green-500"
          />

        </div>

        <input
          type="file"
          onChange={(e) => {

            if (e.target.files?.[0]) {

              setPhoto(e.target.files[0]);

            }

          }}
          className="w-full border p-4 rounded-2xl mb-6"
        />

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mb-6"
        />

        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mb-6"
        />

        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) =>
            setCity(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mb-6"
        />

        <input
          type="email"
          value={user?.email || ""}
          disabled
          className="w-full border p-4 rounded-2xl mb-6 bg-gray-100"
        />

        <button
          onClick={handleSave}
          className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-xl"
        >
          Save Profile
        </button>

      </div>

    </div>

  );

}