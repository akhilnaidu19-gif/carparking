"use client";

import Link from "next/link";
import Image from "next/image";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  onSnapshot,
  query,
where,
getDocs,
deleteDoc,
doc,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { app, db } from "@/lib/firebase";

export default function Home() {

  const [parkingSpots, setParkingSpots] =
    useState<any[]>([]);

    const [wishlistIds,
  setWishlistIds] =
  useState<string[]>([]);

  const [search, setSearch] =
    useState("");

    const [parkingTypeFilter,
  setParkingTypeFilter] =
  useState("All");

const [availableOnly,
  setAvailableOnly] =
  useState(false);

  const [maxPrice,
  setMaxPrice] =
  useState("All");

  const [userLatitude, setUserLatitude] =
    useState<any>(null);

  const [userLongitude, setUserLongitude] =
    useState<any>(null);

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const auth = getAuth(app);

  const [locationText, setLocationText] =
  useState("");

  const [filteredSpots, setFilteredSpots] =
  useState<any[]>([]);

  // DISTANCE CALCULATION

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {

    const R = 6371;

    const dLat =
      ((lat2 - lat1) * Math.PI) /
      180;

    const dLon =
      ((lon2 - lon1) * Math.PI) /
      180;

    const a =
      Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +
      Math.cos(
        (lat1 * Math.PI) / 180
      ) *
        Math.cos(
          (lat2 * Math.PI) / 180
        ) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;

  };

  // AUTH

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        (currentUser) => {

          setUser(currentUser);

        }

      );

    return () => unsubscribe();

  }, []);

  // FETCH PARKINGS

  useEffect(() => {

    setLoading(true);

    const q = query(
  collection(db, "parkings"),
  where("status", "==", "Approved")
);

    const unsubscribe =
onSnapshot(
  q,

        (snapshot) => {

          const parkingData: any[] =
            [];

          snapshot.forEach((doc) => {

            parkingData.push({

              id: doc.id,

              ...doc.data(),

            });

          });

          setParkingSpots(
            parkingData
          );

          setFilteredSpots(
  parkingData
);

          setLoading(false);

        },

        (error) => {

          console.log(error);

          setLoading(false);

        }

      );

    return () => unsubscribe();

  }, []);

  useEffect(() => {

  const loadWishlist =
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

      const ids =
        snapshot.docs.map(

          (doc) =>

            doc.data()
              .parkingId

        );

      setWishlistIds(ids);

    };

  loadWishlist();

}, [user]);

const handleSearch = () => {

  const results = parkingSpots

    .filter(
      (spot) =>
        spot.status === "Approved"
    )

    .filter(
      (spot) =>
        spot.location
          ?.toLowerCase()
          .includes(search.toLowerCase())

        ||

        spot.title
          ?.toLowerCase()
          .includes(search.toLowerCase())
    )

    .filter(
      (spot) =>

        parkingTypeFilter === "All"

          ? true

          : spot.parkingType === parkingTypeFilter
    )

    .filter(
      (spot) =>

        availableOnly

          ? spot.availability === "Available"

          : true
    )

    .filter(
      (spot) =>

        maxPrice === "All"

          ? true

          : Number(spot.monthlyPrice) <= Number(maxPrice)
    );

  setFilteredSpots(results);

};

  return (

    <div className="min-h-screen bg-gray-100 text-gray-900">

   

      

      {/* HERO */}

<section
  id="home"
  className="relative min-h-[85vh] bg-cover bg-center"
  style={{
backgroundImage:
"url('https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=1920&auto=format&fit=crop')"
  }}
>

  <div className="absolute inset-0 bg-black/55"></div>

  <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16">

    <div className="grid lg:grid-cols-2 gap-12 items-center">

      

      {/* LEFT CONTENT */}

      <div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">

 Find Secure Parking

<span className="block text-green-400">
  Anywhere In Bangalore
</span>

</h1>

        <p className="text-xl text-gray-300 mb-8">

          Book monthly or yearly parking spaces instantly and hassle-free.

        </p>

        <div className="flex gap-4 mb-8">

  <a
    href="#parking"
    className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold"
  >
    Find Parking
  </a>

  <a
    href="/add-parking"
    className="bg-white text-black px-8 py-4 rounded-2xl font-bold"
  >
    List Parking
  </a>

</div>

        <div className="flex gap-8 mt-8">

  <div>
    <p className="text-4xl font-bold text-green-400">
      500+
    </p>
    <p className="text-gray-300">
      Parking Spaces
    </p>
  </div>

  <div>
    <p className="text-4xl font-bold text-green-400">
      100+
    </p>
    <p className="text-gray-300">
      Verified Owners
    </p>
  </div>

  <div>
    <p className="text-4xl font-bold text-green-400">
      24/7
    </p>
    <p className="text-gray-300">
      Support
    </p>
  </div>

</div>

      </div>

      {/* RIGHT FEATURES */}

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-black/40 backdrop-blur-lg border border-gray-700 rounded-3xl p-4">

          <h3 className="text-green-400 font-bold text-1g mb-2">
            Secure Parking
          </h3>

          <p className="text-gray-300">
            Safe & monitored spaces
          </p>

        </div>

        <div className="bg-black/40 backdrop-blur-lg border border-gray-700 rounded-3xl p-4">

          <h3 className="text-green-400 font-bold text-lg mb-2">
            Best Prices
          </h3>

          <p className="text-gray-300">
            Affordable & transparent
          </p>

        </div>

        <div className="bg-black/40 backdrop-blur-lg border border-gray-700 rounded-3xl p-4">

          <h3 className="text-green-400 font-bold text-lg mb-2">
            Easy Booking
          </h3>

          <p className="text-gray-300">
            Monthly & yearly plans
          </p>

        </div>

        <div className="bg-black/40 backdrop-blur-lg border border-gray-700 rounded-3xl p-4">

          <h3 className="text-green-400 font-bold text-lg mb-2">
            Prime Locations
          </h3>

          <p className="text-gray-300">
            Across Bangalore
          </p>

        </div>

      </div>

    </div>

    {/* SEARCH BAR */}

    <div className="bg-white rounded-3xl shadow-2xl p-3 mt-12 relative z-20 max-w-6xl mx-auto">

     <div className="space-y-3">

  {/* FIRST ROW */}

  <div className="flex gap-3 items-center">

    <input
      type="text"
      placeholder="Search location, area or parking name..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="flex-1 border border-gray-300 py-4 px-5 rounded-xl"
    />

<button
  onClick={handleSearch}
  className="bg-green-500 text-white px-8 py-4 rounded-xl font-semibold"
>
  🔍 Search
</button>

    <button
      onClick={() => {

        navigator.geolocation.getCurrentPosition(

          async (position) => {

            const lat =
              position.coords.latitude;

            const lng =
              position.coords.longitude;

            setUserLatitude(lat);
            setUserLongitude(lng);

            try {

              const response =
                await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
                );

              const data =
                await response.json();

              const area =
                data.address?.suburb ||
                data.address?.city ||
                data.address?.town ||
                data.display_name;

              setSearch(area);
              setLocationText(area);

            } catch (error) {

              console.log(error);

            }

          }

        );

      }}
      className="bg-black text-white px-8 py-4 rounded-xl font-semibold"
    >
      📍 Use My Location
    </button>

  </div>

  {/* SECOND ROW */}

  <div className="flex gap-3 items-center">

    <select
      value={parkingTypeFilter}
      onChange={(e) =>
        setParkingTypeFilter(
          e.target.value
        )
      }
      className="flex-1 border border-gray-300 py-3 px-4 rounded-xl"
    >
      <option value="All">
        All Types
      </option>

      <option value="Covered Parking">
        Covered Parking
      </option>

      <option value="Open Parking">
        Open Parking
      </option>
    </select>

    <select
      value={maxPrice}
      onChange={(e) =>
        setMaxPrice(
          e.target.value
        )
      }
      className="flex-1 border border-gray-300 py-3 px-4 rounded-xl"
    >
      <option value="All">
        Any Price
      </option>

      <option value="1000">
        Under ₹1000
      </option>

      <option value="2000">
        Under ₹2000
      </option>

      <option value="3000">
        Under ₹3000
      </option>

      <option value="5000">
        Under ₹5000
      </option>
    </select>

    <label className="flex items-center gap-3 border border-gray-300 rounded-xl px-6 py-3">

      <input
        type="checkbox"
        checked={availableOnly}
        onChange={(e) =>
          setAvailableOnly(
            e.target.checked
          )
        }
      />

      Available Only

    </label>

  </div>

  {locationText && (

    <p className="text-sm text-green-600 font-medium">

      📍 Current Location:
      {" "}
      {locationText}

    </p>

  )}

</div>

    </div>

    {/* TRUST BAR */}

    <div className="grid md:grid-cols-4 gap-4 mt-6">

      <div className="bg-white rounded-2xl p-4 text-center shadow-lg">

        <h3 className="font-bold text-lg">
          📍 Wide Coverage
        </h3>

        <p className="text-gray-500">
          Across Bangalore
        </p>

      </div>

      <div className="bg-white rounded-2xl p-4 text-center shadow-lg">

        <h3 className="font-bold text-lg">
          ✅ Verified Owners
        </h3>

        <p className="text-gray-500">
          Trusted Listings
        </p>

      </div>

      <div className="bg-white rounded-2xl p-4 text-center shadow-lg">

        <h3 className="font-bold text-lg">
          🎧 24/7 Support
        </h3>

        <p className="text-gray-500">
          We're Here To Help
        </p>

      </div>

      <div className="bg-white rounded-2xl p-4 text-center shadow-lg">

        <h3 className="font-bold text-lg">
          💰 No Hidden Charges
        </h3>

        <p className="text-gray-500">
          Transparent Pricing
        </p>

      </div>

    </div>

  </div>

</section>

      <section
        id="parking"
        className="py-20 px-6"
      >

        <div className="max-w-7xl mx-auto">

          <div className="flex items-center justify-between mb-12">

           <div>

  <h2 className="text-4xl font-bold">

    Available Parking Slots

  </h2>

  <p className="text-gray-500 mt-2">

    Find verified parking spaces across Bangalore

  </p>

</div>

            <div className="bg-black text-white px-6 py-3 rounded-2xl font-bold">

              {
                parkingSpots.filter(
                  (spot) =>
                    spot.status ===
                    "Approved"
                ).length
              } Listings

            </div>

          </div>

          {loading ? (

            <div className="text-center text-xl font-bold py-20">

              Loading Parking Slots...

            </div>

          ) : (

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
              

              {filteredSpots

                // ONLY APPROVED

                



                // FEATURED FIRST

                .sort((a, b) => {

                  if (
                    a.featured &&
                    !b.featured
                  ) {

                    return -1;

                  }

                  if (
                    !a.featured &&
                    b.featured
                  ) {

                    return 1;

                  }

                  return 0;

                })

                // DISTANCE SORT

                .sort((a, b) => {

                  if (
                    !userLatitude ||
                    !userLongitude
                  ) {

                    return 0;

                  }

                  const distanceA =
                    calculateDistance(

                      Number(
                        userLatitude
                      ),

                      Number(
                        userLongitude
                      ),

                      Number(
                        a.latitude
                      ),

                      Number(
                        a.longitude
                      )

                    );

                  const distanceB =
                    calculateDistance(

                      Number(
                        userLatitude
                      ),

                      Number(
                        userLongitude
                      ),

                      Number(
                        b.latitude
                      ),

                      Number(
                        b.longitude
                      )

                    );

                  return (
                    distanceA -
                    distanceB
                  );

                })

.map((spot) => {

  const isOwner =
    user &&
    spot.ownerUid === user.uid;

  return (

    <div
      key={spot.id}
      className="min-w-[350px] max-w-[350px] bg-white rounded-3xl shadow-lg overflow-hidden"
    >

                    <div className="relative">

  <Image
    src={
      spot.image ||
      "https://via.placeholder.com/400"
    }
    alt={spot.title}
    width={500}
    height={300}
    className="h-52 w-full object-cover transition duration-500 hover:scale-105"
  />

  <div className="absolute top-3 right-3">

<button

  onClick={async () => {

    try {

if (!user) {

        alert(
          "Please Login First"
        );

        return;

      }

      const q = query(

        collection(
          db,
          "wishlist"
        ),

where(
  "userUid",
  "==",
  user.uid
),

        where(
          "parkingId",
          "==",
          spot.id
        )

      );

      const snapshot =
        await getDocs(q);

      if (!snapshot.empty) {

        const wishlistDoc =
          snapshot.docs[0];

        await deleteDoc(

          

          doc(
            db,
            "wishlist",
            wishlistDoc.id
          )

        );

        setWishlistIds(

  wishlistIds.filter(

    (id) =>
      id !== spot.id

  )

);

        alert(
          "Removed From Wishlist"
        );

        return;

      }

      await addDoc(

        collection(
          db,
          "wishlist"
        ),

        {

         userUid: user.uid,
userPhone: user.phoneNumber || "",

          parkingId:
            spot.id,

          title:
            spot.title,

          image:
            spot.image,

          location:
            spot.location,

          monthlyPrice:
            spot.monthlyPrice,

          createdAt:
            new Date(),

        }

      );

      setWishlistIds([

  ...wishlistIds,

  spot.id,

]);

      alert(
        "Added To Wishlist ❤️"
      );

    } catch (error) {

      console.log(error);

    }

  }}

  className="bg-white w-10 h-10 rounded-full shadow-lg hover:scale-110 transition"

>

  {wishlistIds.includes(
  spot.id
)
  ? "❤️"
  : "🤍"}

</button> 

</div>

  {/* BADGES ON IMAGE */}

  <div className="absolute top-3 left-3 flex gap-2">

  {spot.featured && (
    <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
      Featured
    </span>
  )}

  {spot.verified && (
    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
      Verified
    </span>
  )}

<span
  className={`text-xs px-3 py-1 rounded-full text-white font-semibold ${
    Number(spot.availableSlots) > 0
      ? "bg-green-500"
      : "bg-red-500"
  }`}
>

  {Number(spot.availableSlots) > 0
    ? "Available"
    : "Fully Occupied"}

</span>

</div>

</div>

                    <div className="p-5">

                      

                      <h3 className="text-lg font-bold mb-2 line-clamp-2">

                        {spot.title}

                      </h3>

                      <p className="text-gray-600 mb-4">

                        {spot.location}

                      </p>

                      {/* DISTANCE */}

                      {userLatitude &&
                        userLongitude &&
                        spot.latitude &&
                        spot.longitude && (

                          <p className="text-green-600 font-bold mb-4">

                            {calculateDistance(

                              Number(
                                userLatitude
                              ),

                              Number(
                                userLongitude
                              ),

                              Number(
                                spot.latitude
                              ),

                              Number(
                                spot.longitude
                              )

                            ).toFixed(1)}
                            km away

                          </p>

                        )}

                      {/* STATUS */}

                      

                      {/* OWNER */}

                      <div className="flex items-center gap-3 mb-4">

                        <img
                          src={
  spot.ownerPhoto &&
  spot.ownerPhoto.trim() !== ""
    ? spot.ownerPhoto
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
        spot.ownerName || "Owner"
      )}&background=16a34a&color=fff`
}
                          className="w-10 h-10 rounded-full object-cover"
                        />

                        <div>

                          <h4 className="font-semibold text-sm">

                            {
                              spot.ownerName
                            }

                          </h4>

                          <p className="text-xs text-gray-500">

                            {
                              spot.ownerCity
                            }

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

        ₹{spot.monthlyPrice}/mo

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
        {spot.availableSlots} / {spot.totalSlots}
      </p>

    </div>

    <div className="text-right">

      <p className="text-xs text-gray-500">
        Occupied
      </p>

      <p className="font-bold text-red-600">
        {spot.occupiedSlots}
      </p>

    </div>

  </div>

</div>

                      {/* BUTTONS */}

                      <div className="flex gap-3">

                       {isOwner ? (

  <button
    disabled
    className="flex-1 bg-blue-500 text-white py-3 rounded-2xl font-bold cursor-not-allowed"
  >
    Your Listing
  </button>

) : Number(spot.availableSlots) > 0 ? (

  <Link
    href={`/parking/${spot.id}`}
    className="flex-1 text-center bg-green-500 text-white py-3 rounded-2xl font-bold"
  >
    Book Now
  </Link>

) : (

  <button
    disabled
    className="flex-1 bg-gray-400 text-white py-3 rounded-2xl font-bold cursor-not-allowed"
  >
    Fully Occupied
  </button>

)}

<Link
  href={`/parking/${spot.id}`}
  className="flex-1 text-center bg-black text-white py-3 rounded-2xl font-bold"
>
  View Details
</Link>

                      </div>

                    </div>

                 </div>

                  );

                })}

            </div>

          )}

        </div>

      </section>

      {/* OWNER SECTION */}

      <section
        id="owners"
        className="bg-black text-white py-20 px-6 text-center"
      >

        <div className="max-w-4xl mx-auto">

          <h2 className="text-5xl font-bold mb-6">

            Earn From Your Parking Space

          </h2>

          <p className="text-xl text-gray-300 mb-10">

            List your empty parking slots and start earning.

          </p>

          <Link
            href="/add-parking"
            className="inline-block bg-green-500 px-10 py-5 rounded-2xl text-xl font-bold"
          >

            List Your Parking

          </Link>

        </div>

      </section>

      

    </div>

  );

}