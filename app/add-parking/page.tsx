"use client";

import { useEffect, useState } from "react";

import { db, app, storage } from "@/lib/firebase";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function AddParkingPage() {

  const [title, setTitle] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [monthlyPrice, setMonthlyPrice] =
    useState("");

  const [yearlyPrice, setYearlyPrice] =
    useState("");

  const [parkingType, setParkingType] =
    useState("Covered Parking");

  const [cctv, setCctv] =
    useState("CCTV Available");

  const [description, setDescription] =
    useState("");

  const [images, setImages] =
    useState<any[]>([]);

  const [parkings, setParkings] =
    useState<any[]>([]);

  const [latitude, setLatitude] =
    useState("");

  const [longitude, setLongitude] =
    useState("");

  const [user, setUser] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const auth = getAuth(app);

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

  // FETCH OWNER PARKINGS

  useEffect(() => {

    if (!user) return;

    const q = query(

      collection(db, "parkings"),

      where(
        "ownerUid",
        "==",
        user.uid
      )

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

          setParkings(
            parkingData
          );

        }

      );

    return () => unsubscribe();

  }, [user]);

  // LOGIN CHECK

  if (!user) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-100">

        <h1 className="text-4xl font-bold">

          Please Login To Add Parking

        </h1>

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-gray-100 py-16 px-6">

      {/* HEADER */}

      <div className="max-w-6xl mx-auto mb-10">

        <div className="bg-black text-white rounded-3xl p-10 shadow-2xl">

          <h1 className="text-5xl font-bold mb-4">

            List Your Parking Space

          </h1>

          <p className="text-gray-300 text-xl">

            Submit your parking space and start earning monthly income.

          </p>

        </div>

      </div>

      {/* FORM */}

      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-10">

        <div className="grid md:grid-cols-2 gap-6">

          {/* TITLE */}

          <input
            type="text"
            placeholder="Parking Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            className="border p-4 rounded-2xl"
          />

          {/* LOCATION */}

          <input
            type="text"
            placeholder="Parking Location"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            className="border p-4 rounded-2xl"
          />

          {/* MONTHLY */}

          <input
            type="number"
            placeholder="Monthly Price"
            value={monthlyPrice}
            onChange={(e) =>
              setMonthlyPrice(
                e.target.value
              )
            }
            className="border p-4 rounded-2xl"
          />

          {/* YEARLY */}

          <input
            type="number"
            placeholder="Yearly Price"
            value={yearlyPrice}
            onChange={(e) =>
              setYearlyPrice(
                e.target.value
              )
            }
            className="border p-4 rounded-2xl"
          />

          {/* TYPE */}

          <select
            value={parkingType}
            onChange={(e) =>
              setParkingType(
                e.target.value
              )
            }
            className="border p-4 rounded-2xl"
          >

            <option>
              Covered Parking
            </option>

            <option>
              Open Parking
            </option>

            <option>
              Basement Parking
            </option>

          </select>

          {/* CCTV */}

          <select
            value={cctv}
            onChange={(e) =>
              setCctv(
                e.target.value
              )
            }
            className="border p-4 rounded-2xl"
          >

            <option>
              CCTV Available
            </option>

            <option>
              No CCTV
            </option>

          </select>

        </div>

        {/* CURRENT LOCATION */}

        <button

          type="button"

          onClick={() => {

            navigator.geolocation.getCurrentPosition(

              (position) => {

                setLatitude(
                  position.coords.latitude.toString()
                );

                setLongitude(
                  position.coords.longitude.toString()
                );

                alert(
                  "Current Location Captured"
                );

              },

              (error) => {

                console.log(error);

                alert(
                  "Location Permission Denied"
                );

              }

            );

          }}

          className="bg-black text-white px-8 py-4 rounded-2xl font-bold mt-8"

        >

          Use Current Location

        </button>

        {/* MULTI IMAGE */}

        <div className="mt-8">

          <label className="block text-xl font-bold mb-4">

            Upload Parking Images

          </label>

          <input
            type="file"
            multiple
            onChange={(e) => {

              if (e.target.files) {

                setImages(
                  Array.from(
                    e.target.files
                  )
                );

              }

            }}
            className="border p-4 rounded-2xl w-full"
          />

        </div>

        {/* DESCRIPTION */}

        <textarea
          placeholder="Parking Description"
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          className="border p-4 rounded-2xl w-full mt-8 h-40"
        ></textarea>

        {/* SUBMIT */}

        <button

          onClick={async (e) => {

            e.preventDefault();

            try {

              setLoading(true);

              if (
                !title ||
                !location ||
                !monthlyPrice
              ) {

                alert(
                  "Please Fill All Fields"
                );

                return;

              }

              if (
                images.length === 0
              ) {

                alert(
                  "Please Upload Images"
                );

                return;

              }

              // USER PROFILE

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

              // IMAGE UPLOADS

              const uploadedImages =
                [];

              for (const image of images) {

                const imageRef =
                  ref(

                    storage,

                    `parking-images/${Date.now()}-${image.name}`

                  );

                await uploadBytes(
                  imageRef,
                  image
                );

                const imageURL =
                  await getDownloadURL(
                    imageRef
                  );

                uploadedImages.push(
                  imageURL
                );

              }

              // FIRESTORE SAVE

              const newParking = {

                title,

                location,

                monthlyPrice,

                yearlyPrice,

                description,

                parkingType,

                cctv,

                images:
                  uploadedImages,

                image:
                  uploadedImages[0],

                latitude,

                longitude,

                status:
                  "Pending",

                availability:
                  "Available",

                featured: false,

                verified: false,

                ownerUid:
                  user.uid,

                ownerName:
                  userData?.name || "",

                ownerEmail:
                  userData?.email || "",

                ownerPhoto:
                  userData?.photoURL || "",

                ownerPhone:
                  userData?.phone || "",

                ownerCity:
                  userData?.city || "",

                createdAt:
                  new Date(),

              };

              await addDoc(

                collection(
                  db,
                  "parkings"
                ),

                newParking

              );

              alert(
                "Parking Submitted For Admin Approval"
              );

              // RESET

              setTitle("");

              setLocation("");

              setMonthlyPrice("");

              setYearlyPrice("");

              setDescription("");

              setImages([]);

              setLatitude("");

              setLongitude("");

            } catch (error) {

              console.log(error);

              alert(
                "Failed To Submit Parking"
              );

            } finally {

              setLoading(false);

            }

          }}

          disabled={loading}

          className="w-full bg-green-500 text-white py-5 rounded-2xl font-bold text-2xl mt-10 disabled:bg-gray-400"

        >

          {loading
            ? "Submitting..."
            : "Submit Parking"}

        </button>

      </div>

      {/* OWNER LISTINGS */}

      <div className="max-w-6xl mx-auto mt-14">

        <div className="flex items-center justify-between mb-8">

          <h2 className="text-4xl font-bold">

            Your Parking Listings

          </h2>

          <div className="bg-black text-white px-6 py-3 rounded-2xl font-bold">

            {parkings.length} Listings

          </div>

        </div>

        {parkings.length === 0 ? (

          <div className="bg-white rounded-3xl shadow-xl p-16 text-center">

            <h2 className="text-3xl font-bold mb-4">

              No Listings Found

            </h2>

            <p className="text-gray-500 text-xl">

              Add your first parking listing.

            </p>

          </div>

        ) : (

          <div className="grid gap-8">

            {parkings.map((parking) => (

              <div
                key={parking.id}
                className="bg-white rounded-3xl shadow-xl overflow-hidden"
              >

                <div className="grid md:grid-cols-3">

                  {/* IMAGE */}

                  <img
                    src={parking.image}
                    className="w-full h-full object-cover md:h-80"
                  />

                  {/* CONTENT */}

                  <div className="md:col-span-2 p-8">

                    <div className="flex flex-col md:flex-row md:justify-between gap-6">

                      <div>

                        {/* BADGES */}

                        <div className="flex flex-wrap gap-3 mb-5">

                          <span
                            className={`px-5 py-2 rounded-xl font-bold text-white ${
                              parking.status ===
                              "Pending"
                                ? "bg-orange-500"
                                : "bg-green-500"
                            }`}
                          >

                            {parking.status}

                          </span>

                          {parking.featured && (

                            <span className="bg-purple-600 text-white px-5 py-2 rounded-xl font-bold">

                              Featured

                            </span>

                          )}

                          {parking.verified && (

                            <span className="bg-blue-500 text-white px-5 py-2 rounded-xl font-bold">

                              Verified

                            </span>

                          )}

                        </div>

                        <h3 className="text-4xl font-bold mb-4">

                          {parking.title}

                        </h3>

                        <p className="text-gray-500 text-lg mb-4">

                          {parking.location}

                        </p>

                        <p className="text-green-600 font-bold text-2xl mb-6">

                          ₹
                          {parking.monthlyPrice}
                          /month

                        </p>

                        {/* OWNER */}

                        <div className="flex items-center gap-4">

                          <img
                            src={
                              parking.ownerPhoto ||
                              "https://ui-avatars.com/api/?name=User&background=16a34a&color=fff"
                            }
                            className="w-16 h-16 rounded-full object-cover"
                          />

                          <div>

                            <h4 className="font-bold text-xl">

                              {parking.ownerName}

                            </h4>

                            <p className="text-gray-500">

                              {parking.ownerCity}

                            </p>

                          </div>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-col gap-4">

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
                          className="bg-black text-white px-6 py-4 rounded-2xl font-bold text-center"
                        >

                          Open Location

                        </a>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>

  );

}