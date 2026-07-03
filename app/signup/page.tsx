"use client";

import { useState } from "react";

import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  app,
  db,
  storage,
} from "@/lib/firebase";

export default function SignupPage() {

  const [name, setName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [city, setCity] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [image, setImage] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const auth = getAuth(app);

  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6 py-10">

      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-2xl">

        <h1 className="text-4xl font-bold text-center mb-10">

          Create Account

        </h1>

        <div className="grid md:grid-cols-2 gap-5">

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="border p-4 rounded-2xl"
          />

          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value)
            }
            className="border p-4 rounded-2xl"
          />

          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) =>
              setCity(e.target.value)
            }
            className="border p-4 rounded-2xl"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="border p-4 rounded-2xl"
          />

        </div>

        <textarea
          placeholder="Short Bio"
          value={bio}
          onChange={(e) =>
            setBio(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mt-5 h-32"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-4 rounded-2xl mt-5"
        />

        <input
          type="file"
          onChange={(e) => {

            if (
              e.target.files?.[0]
            ) {

              setImage(
                e.target.files[0]
              );

            }

          }}
          className="w-full border p-4 rounded-2xl mt-5"
        />

        <button
          onClick={async () => {

            try {

              setLoading(true);

              // CREATE AUTH USER

              const userCredential =
                await createUserWithEmailAndPassword(

                  auth,

                  email,

                  password

                );

              const user =
                userCredential.user;

              let imageURL = "";

              // UPLOAD PROFILE IMAGE

              if (image) {

                const imageRef =
                  ref(

                    storage,

                    `profile-images/${Date.now()}-${image.name}`

                  );

                await uploadBytes(
                  imageRef,
                  image
                );

                imageURL =
                  await getDownloadURL(
                    imageRef
                  );

              }

              // SAVE USER PROFILE

              await setDoc(

                doc(
                  db,
                  "users",
                  user.uid
                ),

                {
                  uid: user.uid,

                  name,

                  phone,

                  city,

                  bio,

                  email,

                  photo: imageURL,

                  role: "customer",

                  createdAt:
                    new Date(),
                    

                }

              );

              // LOCAL STORAGE

              localStorage.setItem(
                "userEmail",
                email
              );

              localStorage.setItem(
                "userName",
                name
              );

              localStorage.setItem(
                "userPhoto",
                imageURL
              );

              localStorage.setItem(
                "userPhone",
                phone
              );

              alert(
                "Account Created Successfully"
              );

              window.location.href =
                "/";

            } catch (error) {

              console.log(error);

              alert(
                "Signup Failed"
              );

            } finally {

              setLoading(false);

            }

          }}
          disabled={loading}
          className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-xl mt-8 disabled:bg-gray-400"
        >

          {loading
            ? "Creating Account..."
            : "Sign Up"}

        </button>

      </div>

    </div>

  );

}