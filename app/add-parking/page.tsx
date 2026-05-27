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
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function AddParkingPage() {

  const [title, setTitle] = useState("");

  const [location, setLocation] = useState("");

  const [monthlyPrice, setMonthlyPrice] = useState("");

  const [yearlyPrice, setYearlyPrice] = useState("");

  const [parkingType, setParkingType] =
    useState("Covered Parking");

  const [cctv, setCctv] =
    useState("CCTV Available");

  const [description, setDescription] =
    useState("");

  const [availability, setAvailability] =
    useState("Available");

  const [image, setImage] = useState<any>(null);

  const [parkings, setParkings] = useState<any[]>([]);

  const [latitude, setLatitude] = useState("");

  const [longitude, setLongitude] = useState("");

  const [user, setUser] = useState<any>(null);

  const [loading, setLoading] =
    useState(false);

  const auth = getAuth(app);

  // AUTH CHECK

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {

        setUser(currentUser);

      }
    );

    return () => unsubscribe();

  }, []);

  if (!user) {

    return (

      <div className="min-h-screen flex items-center justify-center">

        <h1 className="text-3xl font-bold">
          Please login to add parking
        </h1>

      </div>

    );

  }

  return (

    <div className="min-h-screen bg-gray-100 py-16 px-6">

      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-10">

        <h1 className="text-5xl font-bold mb-10 text-center">
          List Your Parking Space
        </h1>

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
  placeholder="Location"
  value={location}
  onChange={(e) =>
    setLocation(e.target.value)
  }
  className="border p-4 rounded-2xl"
/>

          {/* MONTHLY PRICE */}

          <input
            type="text"
            placeholder="Monthly Price"
            value={monthlyPrice}
            onChange={(e) =>
              setMonthlyPrice(e.target.value)
            }
            className="border p-4 rounded-2xl"
          />

          {/* YEARLY PRICE */}

          <input
            type="text"
            placeholder="Yearly Price"
            value={yearlyPrice}
            onChange={(e) =>
              setYearlyPrice(e.target.value)
            }
            className="border p-4 rounded-2xl"
          />

          {/* PARKING TYPE */}

          <select
            value={parkingType}
            onChange={(e) =>
              setParkingType(e.target.value)
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
              setCctv(e.target.value)
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

          {/* AVAILABILITY */}

          <select
            value={availability}
            onChange={(e) =>
              setAvailability(e.target.value)
            }
            className="border p-4 rounded-2xl"
          >

            <option>
              Available
            </option>

            <option>
              Occupied
            </option>

          </select>

        </div>

        {/* CURRENT LOCATION BUTTON */}

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
                  "Unable to get location"
                );

              }

            );

          }}
          className="bg-black text-white px-6 py-4 rounded-2xl font-bold mt-6"
        >
          Use Current Location
        </button>

        {/* IMAGE */}

        <input
          type="file"
          onChange={(e) => {

            if (e.target.files?.[0]) {

              setImage(
                e.target.files[0]
              );

            }

          }}
          className="border p-4 rounded-2xl w-full mt-6"
        />

        {/* DESCRIPTION */}

        <textarea
          placeholder="Parking Description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          className="border p-4 rounded-2xl w-full mt-6 h-40"
        ></textarea>

        {/* SUBMIT BUTTON */}

        <button

          onClick={async (e) => {

            e.preventDefault();

            try {

              setLoading(true);

              if (!image) {

                alert(
                  "Please upload image"
                );

                return;

              }

              if (
                !title ||
                !location ||
                !monthlyPrice
              ) {

                alert(
                  "Please fill all fields"
                );

                return;

              }

              // FETCH USER PROFILE

              const userDoc = await getDoc(
                doc(
                  db,
                  "users",
                  user.uid
                )
              );

              const userData =
                userDoc.data();

              // IMAGE UPLOAD

              const imageRef = ref(
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

              // FIRESTORE SAVE

              const newParking = {

                title,

                location,

                monthlyPrice,

                yearlyPrice,

                description,

                parkingType,

                cctv,

                image: imageURL,

                availability,

                latitude,

                longitude,

                ownerUid:
                  user.uid,

                ownerName:
                  userData?.name || "",

                ownerEmail:
                  userData?.email || "",

                ownerPhoto:
                  userData?.photo || "",

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

              setParkings([
                ...parkings,
                newParking,
              ]);

              alert(
                "Parking Added Successfully"
              );

              // RESET

              setTitle("");

              setLocation("");

              setMonthlyPrice("");

              setYearlyPrice("");

              setDescription("");

              setImage(null);

              setLatitude("");

              setLongitude("");

            } catch (error) {

              console.log(error);

              alert(
                "Failed To Add Parking"
              );

            } finally {

              setLoading(false);

            }

          }}

          disabled={loading}

          className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-xl mt-8 disabled:bg-gray-400"
        >

          {loading
            ? "Submitting..."
            : "Submit Parking"}

        </button>

      </div>

      {/* SUBMITTED PARKINGS */}

      <div className="max-w-4xl mx-auto mt-10">

        <h2 className="text-3xl font-bold mb-6">
          Submitted Parking Listings
        </h2>

        <div className="grid gap-6">

          {parkings.map(
            (parking, index) => (

              <div
                key={index}
                className="bg-white p-6 rounded-3xl shadow-lg"
              >

                <img
                  src={parking.image}
                  alt={parking.title}
                  className="w-full h-60 object-cover rounded-2xl mb-4"
                />

                <div className="flex items-center gap-4 mb-4">

                  <img
                    src={
                      parking.ownerPhoto ||
                      "https://via.placeholder.com/100"
                    }
                    className="w-14 h-14 rounded-full object-cover"
                  />

                  <div>

                    <h3 className="font-bold text-lg">
                      {parking.ownerName}
                    </h3>

                    <p className="text-gray-500">
                      {parking.ownerCity}
                    </p>

                  </div>

                </div>

                <h3 className="text-2xl font-bold mb-2">
                  {parking.title}
                </h3>

                <p className="text-gray-600 mb-2">
                  {parking.location}
                </p>

                <p className="text-green-600 font-bold mb-2">
                  ₹{parking.monthlyPrice}/month
                </p>

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
                  className="inline-block bg-black text-white px-5 py-3 rounded-2xl font-bold mt-4"
                >
                  Open Exact Location
                </a>

              </div>

            )
          )}

        </div>

      </div>

    </div>

  );

}