"use client";

import { useEffect, useState } from "react";

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function WishlistPage() {

  const [items, setItems] =
    useState<any[]>([]);

  useEffect(() => {

    const fetchWishlist =
      async () => {

        const userEmail =
          localStorage.getItem(
            "userEmail"
          );

        if (!userEmail)
          return;

        const q = query(

          collection(
            db,
            "wishlist"
          ),

          where(
            "userEmail",
            "==",
            userEmail
          )

        );

        const snapshot =
          await getDocs(q);

        const data: any[] = [];

        snapshot.forEach(
          (doc) => {

            data.push({

              id: doc.id,

              ...doc.data(),

            });

          }
        );

        setItems(data);

      };

    fetchWishlist();

  }, []);

  return (

    <div className="min-h-screen bg-gray-100 p-10">

      <h1 className="text-5xl font-bold mb-10">

        My Wishlist ❤️

      </h1>

      <div className="grid md:grid-cols-3 gap-6">

        {items.map((item) => (

          <div
            key={item.id}
            className="bg-white rounded-3xl shadow-lg overflow-hidden"
          >

            <img
              src={item.image}
              className="h-56 w-full object-cover"
            />

            <div className="p-6">

              <h2 className="text-2xl font-bold mb-3">

                {item.title}

              </h2>

              <p className="text-gray-500 mb-3">

                {item.location}

              </p>

              <h3 className="text-green-600 font-bold text-xl">

                ₹{item.monthlyPrice}/month

              </h3>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}