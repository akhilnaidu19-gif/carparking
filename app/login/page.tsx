"use client";

import { useState } from "react";

import {
  getAuth,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import { app } from "@/lib/firebase";

export default function LoginPage() {

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const auth = getAuth(app);

  const router = useRouter();

  return (

    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">

      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">

        <h1 className="text-4xl font-bold text-center mb-8">
          Login
        </h1>

        <form

          onSubmit={async (e) => {

            e.preventDefault();

            try {

              const userCredential =
                await signInWithEmailAndPassword(
                  auth,
                  email,
                  password
                );

              localStorage.setItem(
                "userEmail",
                email
              );

              localStorage.setItem(
                "userName",
                userCredential.user.email || "User"
              );

              alert("Login Successful");

              router.push("/");

            } catch (error) {

              console.log(error);

            }

          }}

        >

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-4 rounded-2xl mb-5"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-4 rounded-2xl mb-6"
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-xl"
          >
            Login
          </button>

        </form>

      </div>

    </div>

  );

}