"use client";

import Script from "next/script";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { app, db } from "@/lib/firebase";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";


export default function ParkingDetailsPage() {

  const params = useParams();

  const auth = getAuth(app);

  const [parking, setParking] =
    useState<any>(null);

    const [user, setUser] =
  useState<any>(null);

  const [reviews, setReviews] =
    useState<any[]>([]);

  const [rating, setRating] =
    useState(5);

  const [reviewText, setReviewText] =
    useState("");

  const [wishlist, setWishlist] =
    useState(false);

  const [submittingReview, setSubmittingReview] =
    useState(false);

  // FETCH PARKING

  useEffect(() => {

    const fetchParking = async () => {

      const docRef = doc(
        db,
        "parkings",
        params.id as string
      );

      const docSnap =
        await getDoc(docRef);

      if (docSnap.exists()) {

        const parkingData: any = {

          id: docSnap.id,

          ...docSnap.data(),

        };

        setParking(
          parkingData
        );

      }

    };

    fetchParking();

  }, []);

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

  // FETCH REVIEWS

  useEffect(() => {

    if (!params.id) return;

    const q = query(

      collection(
        db,
        "reviews"
      ),

      where(
        "parkingId",
        "==",
        params.id
      )

    );

    const unsubscribe =
      onSnapshot(

        q,

        (snapshot) => {

          const reviewData: any[] =
            [];

          snapshot.forEach((doc) => {

            reviewData.push({

              id: doc.id,

              ...doc.data(),

            });

          });

          setReviews(
            reviewData
          );

        }

      );

    return () => unsubscribe();

  }, [params.id]);

  if (!parking) {

    return (

      <h1 className="p-10 text-3xl font-bold">

        Loading...

      </h1>

    );

  }

  // AVERAGE RATING

  const averageRating =

    reviews.length > 0

      ? (
          reviews.reduce(

            (acc, item) =>

              acc +
              Number(
                item.rating
              ),

            0

          ) / reviews.length

        ).toFixed(1)

      : "0";

 const isOwner =
  user &&
  parking &&
  parking.ownerUid === user.uid;

  return (

    <>

      

      <div className="min-h-screen bg-gray-100">

        {/* HERO IMAGE */}

        <div
          className="h-[450px] bg-cover bg-center relative"
          style={{
            backgroundImage: `url(${parking.image})`,
          }}
        >

          <div className="absolute inset-0 bg-black/40"></div>

          {/* WISHLIST */}

          <button

            onClick={() =>
              setWishlist(
                !wishlist
              )
            }

            className="absolute top-8 right-8 bg-white w-16 h-16 rounded-full text-3xl shadow-2xl z-10"

          >

            {wishlist
              ? "❤️"
              : "🤍"}

          </button>

        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">

          {/* BADGES */}

          <div className="flex flex-wrap gap-4 mb-6">

            {parking.featured && (

              <span className="bg-purple-600 text-white px-5 py-2 rounded-2xl font-bold">

                Featured

              </span>

            )}

            {parking.verified && (

              <span className="bg-blue-500 text-white px-5 py-2 rounded-2xl font-bold">

                Verified Owner

              </span>

            )}

            <span
              className={`px-5 py-2 rounded-2xl text-white font-bold ${
                parking.availability ===
                "Available"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            >

              {
                parking.availability
              }

            </span>

          </div>

          {/* TITLE */}

          <h1 className="text-5xl font-bold mb-4">

            {parking.title}

          </h1>

          {/* LOCATION */}

          <p className="text-gray-600 text-2xl mb-4">

            {parking.location}

          </p>

          {/* RATING */}

          <div className="flex items-center gap-4 mb-8">

            <div className="bg-yellow-400 px-5 py-3 rounded-2xl font-bold text-xl">

              ⭐ {averageRating}

            </div>

            <p className="text-gray-500 text-lg">

              {reviews.length}
              Reviews

            </p>

          </div>

          {/* OWNER */}

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8 flex items-center gap-5">

            <img
              src={
                parking.ownerPhoto ||
                "https://via.placeholder.com/100"
              }
              className="w-20 h-20 rounded-full object-cover"
            />

            <div>

              <h2 className="text-2xl font-bold">

                {parking.ownerName}

              </h2>

              <p className="text-gray-600">

                {parking.ownerCity}

              </p>

              <p className="text-green-600 font-bold">

                {parking.ownerPhone}

              </p>

            </div>

          </div>

          <div className="bg-yellow-50 border border-yellow-300 p-6 rounded-3xl mb-8">

  <h3 className="text-2xl font-bold mb-2">
    🔒 Exact Location Hidden
  </h3>

  <p className="text-gray-600">
    Exact parking location and directions will be available after successful booking.
  </p>

</div>

        <div className="bg-white p-8 rounded-3xl shadow-lg mb-8">

  <h2 className="text-3xl font-bold mb-4">
    Parking Location
  </h2>

  <p className="text-xl font-semibold text-green-600 mb-4">
    📍 {parking.location}
  </p>

  <div className="bg-gray-100 rounded-2xl p-10 text-center">

    <h3 className="text-2xl font-bold mb-3">
      🔒 Exact Location Hidden
    </h3>

    <p className="text-gray-600">
      To protect parking owners, the exact address and map directions are available only after booking confirmation.
    </p>

  </div>

</div>

          {/* DETAILS */}

          <div className="bg-white p-8 rounded-3xl shadow-lg mb-8">

            <h2 className="text-3xl font-bold mb-4">

              Parking Details

            </h2>

            <p className="text-gray-700 text-lg mb-6">

              {parking.description}

            </p>

            <div className="grid md:grid-cols-2 gap-4">

              <div className="bg-gray-100 p-4 rounded-2xl">

                <p className="font-bold">
                  Parking Type
                </p>

                <p>
                  {
                    parking.parkingType
                  }
                </p>

              </div>

              <div className="bg-gray-100 p-4 rounded-2xl">

                <p className="font-bold">
                  CCTV
                </p>

                <p>
                  {parking.cctv}
                </p>

                <div className="bg-gray-100 p-4 rounded-2xl">

  <p className="font-bold">
    Available Slots
  </p>

  <p className="text-green-600 text-xl font-bold">
    {parking.availableSlots} / {parking.totalSlots}
  </p>

</div>

              </div>

            </div>

          </div>

          {/* PLANS */}

{isOwner ? (

  <div className="bg-blue-50 border-2 border-blue-500 rounded-3xl p-10 mb-10 text-center">

    <h2 className="text-3xl font-bold text-blue-700 mb-4">
      🏠 This is Your Parking Listing
    </h2>

    <p className="text-gray-600 text-lg mb-8">
      You cannot book your own parking.
      Use the Owner Dashboard to edit your listing,
      manage bookings, and update parking details.
    </p>

    <button
      onClick={() =>
        window.location.href = "/owner-dashboard"
      }
      className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold"
    >
      Edit Listing
    </button>

  </div>

) : (

<div className="grid md:grid-cols-2 gap-6 mb-10">

  {/* Monthly */}

  <div className="bg-white p-8 rounded-3xl shadow-lg">

    <h2 className="text-2xl font-bold mb-4">
      Monthly Plan
    </h2>

    <p className="text-4xl font-bold text-green-600 mb-4">
      ₹{parking.monthlyPrice}/month
    </p>

    <button
      onClick={() =>
        window.location.href =
          `/booking/${parking.id}?plan=Monthly`
      }
      disabled={
        Number(parking.availableSlots) <= 0
      }
      className="w-full bg-green-500 text-white px-6 py-4 rounded-2xl font-bold disabled:bg-gray-400"
    >
      {Number(parking.availableSlots) <= 0
        ? "Fully Occupied"
        : "Book Monthly"}
    </button>

  </div>

  {/* Yearly */}

  <div className="bg-white p-8 rounded-3xl shadow-lg">

    <h2 className="text-2xl font-bold mb-4">
      Yearly Plan
    </h2>

    <p className="text-4xl font-bold text-black mb-4">
      ₹30000/year
    </p>

    <button
      onClick={() =>
        window.location.href =
          `/booking/${parking.id}?plan=Yearly`
      }
      disabled={
        Number(parking.availableSlots) <= 0
      }
      className="w-full bg-black text-white px-6 py-4 rounded-2xl font-bold disabled:bg-gray-400"
    >
      {Number(parking.availableSlots) <= 0
        ? "Fully Occupied"
        : "Book Yearly"}
    </button>

  </div>

</div>

)}

          {/* REVIEWS */}

          <div className="bg-white p-8 rounded-3xl shadow-lg">

            <div className="flex items-center justify-between mb-8">

              <div>

                <h2 className="text-3xl font-bold">

                  Reviews & Ratings

                </h2>

                <p className="text-gray-500">

                  {reviews.length}
                  Reviews

                </p>

              </div>

              <div className="bg-green-500 text-white px-6 py-4 rounded-2xl text-center">

                <h2 className="text-4xl font-bold">

                  {
                    averageRating
                  }

                </h2>

                <p>
                  Rating
                </p>

              </div>

            </div>

            {/* REVIEW FORM */}

            <div className="border p-6 rounded-3xl mb-8">

              <h3 className="text-2xl font-bold mb-5">

                Add Review

              </h3>

              <select
                value={rating}
                onChange={(e) =>
                  setRating(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="border p-4 rounded-2xl w-full mb-5"
              >

                <option value={5}>
                  ⭐⭐⭐⭐⭐
                </option>

                <option value={4}>
                  ⭐⭐⭐⭐
                </option>

                <option value={3}>
                  ⭐⭐⭐
                </option>

                <option value={2}>
                  ⭐⭐
                </option>

                <option value={1}>
                  ⭐
                </option>

              </select>

              <textarea
                placeholder="Write review..."
                value={
                  reviewText
                }
                onChange={(e) =>
                  setReviewText(
                    e.target.value
                  )
                }
                className="border p-4 rounded-2xl w-full h-32 mb-5"
              ></textarea>

              <button

                onClick={async () => {

                  try {

                    setSubmittingReview(
                      true
                    );

                    await addDoc(

                      collection(
                        db,
                        "reviews"
                      ),

                      {

                        parkingId:
                          parking.id,

                        userName:
                          localStorage.getItem(
                            "userName"
                          ) || "User",

                        userEmail:
                          localStorage.getItem(
                            "userEmail"
                          ) || "",

                        review:
                          reviewText,

                        rating,

                        createdAt:
                          new Date(),

                      }

                    );

                    await addDoc(

  collection(
    db,
    "notifications"
  ),

  {

    ownerEmail:
      parking.ownerEmail || "",

    title:
      "New Review",

    message:
      `${localStorage.getItem(
        "userName"
      )} reviewed ${parking.title}`,

    createdAt:
      new Date(),

    read: false,

  }

);

                    

                    setReviewText("");

                    setRating(5);

                    alert(
                      "Review Added"
                    );

                  } catch (error) {

                    console.log(error);

                  } finally {

                    setSubmittingReview(
                      false
                    );

                  }

                }}

                disabled={
                  submittingReview
                }

                className="bg-green-500 text-white px-6 py-4 rounded-2xl font-bold"

              >

                {submittingReview
                  ? "Submitting..."
                  : "Submit Review"}

              </button>

            </div>

            {/* REVIEW LIST */}

            <div className="grid gap-5">

              {reviews.length ===
              0 ? (

                <div className="text-center py-10">

                  <h2 className="text-2xl font-bold text-gray-500">

                    No Reviews Yet

                  </h2>

                </div>

              ) : (

                reviews.map(
                  (review) => (

                    <div
                      key={
                        review.id
                      }
                      className="border p-6 rounded-3xl"
                    >

                      <div className="flex items-center justify-between mb-4">

                        <div>

                          <h3 className="text-xl font-bold">

                            {
                              review.userName
                            }

                          </h3>

                          <p className="text-gray-500">

                            {
                              review.userEmail
                            }

                          </p>

                        </div>

                        <div className="bg-yellow-400 px-5 py-3 rounded-2xl font-bold">

                          ⭐{" "}
                          {
                            review.rating
                          }
                          /5

                        </div>

                      </div>

                      <p className="text-gray-700">

                        {
                          review.review
                        }

                      </p>

                    </div>

                  )
                )

              )}

            </div>

          </div>

        </div>

      </div>

    </>

  );

}