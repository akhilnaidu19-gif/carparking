"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { app, db } from "@/lib/firebase";

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function WishlistPage() {
  const router = useRouter();

  const auth = getAuth(app);

  const [loading, setLoading] =
    useState(true);

  const [user, setUser] =
    useState<any>(null);

  const [items, setItems] =
    useState<any[]>([]);

  /*
   * AUTHENTICATION
   */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {
          if (!currentUser) {
            router.replace("/login");
            return;
          }

          setUser(currentUser);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [auth, router]);

  /*
   * FETCH WISHLIST
   *
   * We also fetch the latest parking
   * document using parkingId.
   */

  useEffect(() => {
    const fetchWishlist =
      async () => {
        if (!user) return;

        try {
          const q = query(
            collection(db, "wishlist"),
            where(
              "userUid",
              "==",
              user.uid
            )
          );

          const snapshot =
            await getDocs(q);

          const data: any[] = [];

          for (
            const wishlistDoc of snapshot.docs
          ) {
            const wishlistData =
              wishlistDoc.data();

            let parkingData: any = {};

            /*
             * Fetch latest parking details
             */

            if (
              wishlistData.parkingId
            ) {
              try {
                const parkingRef =
                  doc(
                    db,
                    "parkings",
                    wishlistData.parkingId
                  );

                const parkingSnapshot =
                  await getDoc(
                    parkingRef
                  );

                if (
                  parkingSnapshot.exists()
                ) {
                  parkingData =
                    parkingSnapshot.data();
                }
              } catch (error) {
                console.log(
                  "Unable to fetch parking:",
                  error
                );
              }
            }

            data.push({
              id: wishlistDoc.id,

              /*
               * Wishlist data
               */
              ...wishlistData,

              /*
               * Latest parking data
               *
               * parking data comes after wishlist
               * data so current parking information
               * is displayed.
               */
              ...parkingData,

              /*
               * Always preserve the wishlist
               * parking ID.
               */
              parkingId:
                wishlistData.parkingId,
            });
          }

          setItems(data);
        } catch (error) {
          console.error(
            "Wishlist loading error:",
            error
          );
        }
      };

    fetchWishlist();
  }, [user]);

  /*
   * REMOVE WISHLIST
   */

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
          (current) =>
            current.filter(
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

  /*
   * LOADING
   */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold">
          Loading...
        </h1>
      </div>
    );
  }

  /*
   * PAGE
   */

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-10 pt-10">

        {/* HEADER */}

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

        {/* EMPTY STATE */}

        {items.length === 0 ? (

          <div className="text-center py-20">

            <h2 className="text-3xl font-bold mb-4">
              No Wishlist Items ❤️
            </h2>

            <p className="text-gray-500">
              Save your favourite parking
              spaces here.
            </p>

          </div>

        ) : (

          /*
           * PARKING CARDS
           */

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {items.map((item) => {

              const availableSlots =
                Number(
                  item.availableSlots || 0
                );

              const totalSlots =
                Number(
                  item.totalSlots || 0
                );

              const occupiedSlots =
                Number(
                  item.occupiedSlots || 0
                );

              const isAvailable =
                availableSlots > 0;

              return (

                <div
                  key={item.id}
                  className="w-[330px] bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 overflow-hidden"
                >

                  {/* IMAGE */}

                  <div className="relative">

                    <img
                      src={
                        item.image ||
                        "https://via.placeholder.com/400"
                      }
                      alt={
                        item.title ||
                        "Parking"
                      }
                      className="h-56 w-full object-cover"
                    />

                    {/* AVAILABILITY */}

                    <div
                      className={`absolute top-3 left-3 text-white px-3 py-1 rounded-full text-sm font-bold ${
                        isAvailable
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    >
                      {isAvailable
                        ? "Available"
                        : "Fully Occupied"}
                    </div>

                    {/* WISHLIST */}

                    <button
                      type="button"
                      className="absolute top-3 right-3 z-10 bg-white w-10 h-10 rounded-full shadow-lg text-red-500 font-bold"
                    >
                      ❤️
                    </button>

                  </div>

                  {/* DETAILS */}

                  <div className="p-6">

                    {/* TITLE */}

                    <h2 className="text-2xl font-bold mb-3 min-h-[70px]">
                      {item.title ||
                        "Parking"}
                    </h2>

                    {/* LOCATION */}

                    <p className="text-gray-500 mb-4">
                      {item.location ||
                        "Location unavailable"}
                    </p>

                    {/* OWNER */}

                    <div className="flex items-center gap-3 mb-4">

                      <img
                        src={
                          item.ownerPhoto &&
                          item.ownerPhoto.trim() !== ""
                            ? item.ownerPhoto
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                item.ownerName ||
                                  "Owner"
                              )}&background=16a34a&color=fff`
                        }
                        alt={
                          item.ownerName ||
                          "Owner"
                        }
                        className="w-10 h-10 rounded-full object-cover"
                      />

                      <div>

                        <h4 className="font-semibold text-sm">
                          {item.ownerName ||
                            "Owner"}
                        </h4>

                        <p className="text-xs text-gray-500">
                          {item.ownerCity ||
                            "Bangalore"}
                        </p>

                      </div>

                    </div>

                    {/* PRICE */}

                    <div className="bg-gray-50 rounded-2xl p-3 mb-4">

                      <div className="flex justify-between">

                        <div>

                          <p className="text-xs text-gray-500">
                            Monthly
                          </p>

                          <p className="font-bold text-green-600">
                            ₹
                            {item.monthlyPrice ||
                              0}
                            /mo
                          </p>

                        </div>

                        <div>

                          <p className="text-xs text-gray-500">
                            Yearly
                          </p>

                          <p className="font-bold">
                            ₹30000/yr
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* SLOT STATUS */}

                    <div className="bg-blue-50 rounded-2xl p-3 mb-4">

                      <div className="flex justify-between items-center">

                        <div>

                          <p className="text-xs text-gray-500">
                            Available Slots
                          </p>

                          <p className="font-bold text-green-600 text-lg">
                            {availableSlots} /{" "}
                            {totalSlots}
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-xs text-gray-500">
                            Occupied
                          </p>

                          <p className="font-bold text-red-600">
                            {occupiedSlots}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* BUTTONS */}

                    <div className="flex gap-3">

                      <a
                        href={`/parking/${item.parkingId}`}
                        className="flex-1 bg-black text-white text-center py-3 rounded-2xl font-bold"
                      >
                        View Parking
                      </a>

                      <button
                        type="button"
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

              );
            })}

          </div>

        )}

      </div>
    </>
  );
}