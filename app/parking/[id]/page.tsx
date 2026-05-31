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

import { db } from "@/lib/firebase";

export default function ParkingDetailsPage() {

  const params = useParams();

  const [parking, setParking] =
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

  // BOOKING WITH RAZORPAY

  const handleBooking = async (
    plan: string
  ) => {

    try {

      const userEmail =
        localStorage.getItem(
          "userEmail"
        );

      const userName =
        localStorage.getItem(
          "userName"
        );

      if (!userEmail) {

        alert(
          "Please login first"
        );

        return;

      }

      if (
        parking.availability ===
        "Occupied"
      ) {

        alert(
          "Parking Already Occupied"
        );

        return;

      }

      const amount =

        plan === "Monthly"

          ? Number(
              parking.monthlyPrice
            )

          : 30000;

      const options = {

        key: process.env
          .NEXT_PUBLIC_RAZORPAY_KEY_ID,

        amount:
          amount * 100,

        currency: "INR",

        name:
          "CarParking Bangalore",

        description:
          `${plan} Parking Booking`,

        image:
          parking.image,

        handler:
          async function (
            response: any
          ) {

            try {

              // SAVE BOOKING

              await addDoc(

                collection(
                  db,
                  "bookings"
                ),

                {
  ownerPhone:
    parking.ownerPhone || "",

  ownerEmail:
    parking.ownerEmail || "",

  parkingId:
    parking.id,

  title:
    parking.title,

  image:
    parking.image
      ? parking.image
      : "",

  owner:
    parking.ownerName
      ? parking.ownerName
      : "Parking Owner",

  ownerPhoto:
    parking.ownerPhoto
      ? parking.ownerPhoto
      : "",


                  location:
  parking.location
    ? parking.location
    : "",

                  latitude:
  parking.latitude
    ? parking.latitude
    : "",

longitude:
  parking.longitude
    ? parking.longitude
    : "",

                  paymentId:
                    response.razorpay_payment_id,

                  paymentStatus:
                    "Paid",

                  amount,

                  plan,

                  email:
  userEmail,

name:
  userName,

phone:
  localStorage.getItem(
    "userPhone"
  ) || "",

                  bookingDate:
                    new Date().toLocaleDateString(),

                  bookingTime:
                    new Date().toLocaleTimeString(),

                  validTill:

                    plan ===
                    "Monthly"

                      ? new Date(

                          Date.now() +

                            30 *
                              24 *
                              60 *
                              60 *
                              1000

                        ).toLocaleDateString()

                      : new Date(

                          Date.now() +

                            365 *
                              24 *
                              60 *
                              60 *
                              1000

                        ).toLocaleDateString(),

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
      "New Booking",

    message:
      `${userName} booked ${parking.title}`,

    createdAt:
      new Date(),

    read: false,

  }

);

              // UPDATE PARKING

              await updateDoc(

                doc(
                  db,
                  "parkings",
                  parking.id
                ),

                {

                  availability:
                    "Occupied",

                }

              );

              setParking({

                ...parking,

                availability:
                  "Occupied",

              });

              alert(
                "Payment Successful & Booking Confirmed"
              );

           } catch (error: any) {

  console.log(
    "BOOKING ERROR:",
    error
  );

  alert(
    error.message ||
    "Booking Failed"
  );

}

          },

        prefill: {

          name:
            userName || "",

          email:
            userEmail || "",

        },

        theme: {

          color: "#16a34a",

        },

      };

      const razorpay = new (window as any)
        .Razorpay(options);

      razorpay.open();

    } catch (error) {

      console.log(error);

      alert(
        "Payment Failed"
      );

    }

  };

  return (

    <>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

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

          {/* BUTTONS */}

          <div className="flex flex-col md:flex-row gap-4 mb-8">

            <a
              href={
                parking.latitude &&
                parking.longitude
                  ? `https://www.google.com/maps?q=${parking.latitude},${parking.longitude}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      parking.location
                    )}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white px-6 py-4 rounded-2xl font-bold text-center"
            >

              Open Exact Location

            </a>

          </div>

          {/* MAP */}

          {parking.latitude &&
            parking.longitude && (

              <div className="bg-white p-6 rounded-3xl shadow-lg mb-8">

                <h2 className="text-3xl font-bold mb-6">

                  Parking Location

                </h2>

                <iframe
                  src={`https://maps.google.com/maps?q=${parking.latitude},${parking.longitude}&z=15&output=embed`}
                  width="100%"
                  height="400"
                  style={{
                    border: 0,
                    borderRadius:
                      "20px",
                  }}
                  loading="lazy"
                ></iframe>

              </div>

            )}

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

              </div>

            </div>

          </div>

          {/* PLANS */}

          <div className="grid md:grid-cols-2 gap-6 mb-10">

            {/* MONTHLY */}

            <div className="bg-white p-8 rounded-3xl shadow-lg">

              <h2 className="text-2xl font-bold mb-4">

                Monthly Plan

              </h2>

              <p className="text-4xl font-bold text-green-600 mb-4">

                ₹
                {
                  parking.monthlyPrice
                }
                /month

              </p>

              <button

                onClick={() =>
                  handleBooking(
                    "Monthly"
                  )
                }

                disabled={
                  parking.availability ===
                  "Occupied"
                }

                className="w-full bg-green-500 text-white px-6 py-4 rounded-2xl font-bold disabled:bg-gray-400"

              >

                {parking.availability ===
                "Occupied"

                  ? "Already Occupied"

                  : "Book Monthly"}

              </button>

            </div>

            {/* YEARLY */}

            <div className="bg-white p-8 rounded-3xl shadow-lg">

              <h2 className="text-2xl font-bold mb-4">

                Yearly Plan

              </h2>

              <p className="text-4xl font-bold text-black mb-4">

                ₹30000/year

              </p>

              <button

                onClick={() =>
                  handleBooking(
                    "Yearly"
                  )
                }

                disabled={
                  parking.availability ===
                  "Occupied"
                }

                className="w-full bg-black text-white px-6 py-4 rounded-2xl font-bold disabled:bg-gray-400"

              >

                {parking.availability ===
                "Occupied"

                  ? "Already Occupied"

                  : "Book Yearly"}

              </button>

            </div>

          </div>

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