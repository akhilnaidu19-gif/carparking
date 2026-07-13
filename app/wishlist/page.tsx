"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase";

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export default function WishlistPage() {

  const router = useRouter();

const auth = getAuth(app);

const [loading, setLoading] = useState(true);

const [user, setUser] = useState<any>(null);

  const [items, setItems] =
    useState<any[]>([]);

    useEffect(() => {

  const unsubscribe = onAuthStateChanged(auth, (user) => {

    if (!user) {

      router.replace("/login");

      return;

    }

setUser(user);
setLoading(false);

  });

  return () => unsubscribe();

}, [auth, router]);

  useEffect(() => {

    const fetchWishlist =
      async () => {

if (!user) return;

        const q = query(

          collection(
            db,
            "wishlist"
          ),

where(
  "userUid",
  "==",
  user.uid
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

}, [user]);

  const removeWishlist =
  async (id: string) => {

    try {

      await deleteDoc(

        doc(
          db,
          "wishlist",
          id
        )

      );

      setItems(

        items.filter(

          (item) =>
            item.id !== id

        )

      );

      alert(
        "Removed From Wishlist"
      );

    } catch (error) {

      console.log(error);

    }

  };

  if (loading) {

  return (

    <div className="min-h-screen flex items-center justify-center">

      <h1 className="text-3xl font-bold">
        Loading...
      </h1>

    </div>

  );

}

return (

<>
  <div className="min-h-screen bg-gray-100 p-10 pt-10">

      <div className="flex justify-between items-center mb-10">

  <div>

    <h1 className="text-6xl font-extrabold tracking-tight">
      My Wishlist ❤️
    </h1>

    <p className="text-gray-500 mt-2 text-lg">
      Your saved parking spaces
    </p>

  </div>

  <div className="bg-black text-white px-6 py-3 rounded-2xl font-bold">
    {items.length} Saved
  </div>

</div>

      {items.length === 0 ? (

  <div className="text-center py-20">

    <h2 className="text-3xl font-bold mb-4">

      No Wishlist Items ❤️

    </h2>

    <p className="text-gray-500">

      Save your favourite parking spaces here.

    </p>

  </div>

) : (

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

    {items.map((item) => (

      <div
  key={item.id}
  className="w-[330px] bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-3
hover:shadow-2xl transition-all duration-300 overflow-hidden"
>

        <div className="relative">

  <img
    src={item.image}
    className="h-56 w-full object-cover"
  />

  <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
    Available
  </div>
<button className="absolute top-3 right-3 z-10 bg-white w-10 h-10 rounded-full shadow-lg text-red-500 font-bold">
  ❤️
</button>
</div>

        <div className="p-6">

          <h2 className="text-2xl font-bold mb-3 min-h-[70px]">

            {item.title}

          </h2>

          <p className="text-gray-500 mb-3">

            {item.location}

          </p>

          <div className="bg-gray-100 rounded-2xl p-4 mt-3">

  <p className="text-gray-500 text-sm">
    Monthly Price
  </p>

  <h3 className="text-green-600 font-bold text-2xl">
    ₹{item.monthlyPrice}
  </h3>

</div>

          <div className="flex gap-3 mt-5">

  <a

    href={`/parking/${item.parkingId}`}

    className="flex-1 bg-black text-white text-center py-3 rounded-2xl font-bold"

  >

    View Parking

  </a>

  <button

    onClick={() =>
      removeWishlist(
        item.id
      )
    }

    className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-bold"

  >

    Remove

  </button>

</div>



        </div>

      </div>

    ))}

  </div>

)}

    </div>

  </>

  );

}