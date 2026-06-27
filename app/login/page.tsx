"use client";

import { useState } from "react";

import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

import { app, db } from "@/lib/firebase";

export default function LoginPage() {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const auth = getAuth(app);

  const router = useRouter();

  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">

      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">

        {/* LOGO */}

        <div className="flex justify-center mb-6">

          <div className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-xl">

            CarParking Bangalore

          </div>

        </div>

        {/* TITLE */}

        <h1 className="text-4xl font-bold text-center mb-3">

          Welcome Back

        </h1>

        <p className="text-center text-gray-500 mb-8">

          Login to continue your parking journey

        </p>

        {/* FORM */}

        <form

          onSubmit={async (e) => {

            e.preventDefault();

            try {

              setLoading(true);

              // LOGIN

              const userCredential =

                await signInWithEmailAndPassword(

                  auth,

                  email,

                  password

                );

              const user =
                userCredential.user;

              // FETCH USER PROFILE

              const userDoc =
                await getDoc(

                  doc(
                    db,
                    "users",
                    user.uid
                  )

                );

              const userData =
                userDoc.data();

                // BLOCKED USER CHECK

if (
  userData?.status ===
  "Blocked"
) {

  alert(
    "Your account has been blocked by Admin."
  );

  await auth.signOut();

  return;

}

              // LOCAL STORAGE

              localStorage.setItem(

                "userEmail",

                user.email || ""

              );

              localStorage.setItem(

                "userUid",

                user.uid

              );

              localStorage.setItem(

                "userName",

                userData?.name ||

                  user.displayName ||

                  "User"

              );

              localStorage.setItem(

                "userPhoto",

                userData?.photoURL ||

                  user.photoURL ||

                  ""

              );

              localStorage.setItem(

                "userPhone",

                userData?.phone ||

                  ""

              );

              localStorage.setItem(

                "userCity",

                userData?.city ||

                  ""

              );

              // ADMIN CHECK

              if (
  userData?.role ===
  "admin"
){

                localStorage.setItem(

                  "isAdmin",

                  "true"

                );

              } else {

                localStorage.removeItem(

                  "isAdmin"

                );

              }

              // LOGIN TRACKING

              await addDoc(

                collection(
                  db,
                  "logins"
                ),

                {

                  uid: user.uid,

                  email:
                    user.email,

                  name:
                    userData?.name ||

                    "User",

                  photo:
                    userData?.photoURL ||

                    "",

                  loginTime:
                    new Date().toLocaleString(),

                  device:
                    navigator.platform,

                  browser:
                    navigator.userAgent,

                  online: true,

                }

              );

              alert(
                "Login Successful"
              );

              // REDIRECT

              if (
  userData?.role ===
  "admin"
) {

  localStorage.setItem(
    "isAdmin",
    "true"
  );

  router.push("/admin");

} else {

  localStorage.removeItem(
    "isAdmin"
  );

  router.push("/");

}

            } catch (error: any) {

              console.log(error);

              alert(
                error.message
              );

            } finally {

              setLoading(false);

            }

          }}

        >

          {/* EMAIL */}

          <div className="mb-5">

            <label className="block font-semibold mb-2">

              Email Address

            </label>

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              className="w-full border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
              required
            />

          </div>

          {/* PASSWORD */}

          <div className="mb-6">

            <label className="block font-semibold mb-2">

              Password

            </label>

            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              className="w-full border border-gray-300 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black"
              required
            />

          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-xl hover:bg-gray-800 transition disabled:bg-gray-400"
          >

            {loading
              ? "Logging In..."
              : "Login"}

          </button>

        </form>

        {/* EXTRA */}

<div className="mt-8 text-center">

  <p className="text-gray-500 mb-4">

    Secure Login Powered By Firebase

  </p>

  <p className="text-gray-600">

    Don't have an account?{" "}

    <button
      onClick={() =>
        router.push("/signup")
      }
      className="text-green-600 font-bold hover:underline"
    >
      Sign Up Here
    </button>

  </p>

</div>

      </div>

    </div>

  );

}