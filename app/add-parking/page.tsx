"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

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
  serverTimestamp,
  getDocs,
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


    const [totalSlots, setTotalSlots] =
  useState("1");

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

    const [ownerStatus, setOwnerStatus] = useState("");

const [checkingOwner, setCheckingOwner] = useState(true);

  const auth = getAuth(app);

  const router = useRouter();

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

  // CHECK OWNER STATUS

useEffect(() => {

  if (!user) return;

  const q = query(

    collection(db, "ownerApplications"),
where(
  "userUid",
  "==",
  user.uid
)

  );

  const unsubscribe =
    onSnapshot(

      q,

      (snapshot) => {

        if (snapshot.empty) {

          setOwnerStatus("NotOwner");

        } else {

          setOwnerStatus(
            snapshot.docs[0].data().status
          );

        }

        setCheckingOwner(false);

      }

    );

  return () => unsubscribe();

}, [user]);

// REDIRECT NON-OWNERS

useEffect(() => {

  if (
    !checkingOwner &&
    ownerStatus === "NotOwner"
  ) {

    router.push("/become-owner");

  }

}, [
  checkingOwner,
  ownerStatus,
  router,
]);



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

  // OWNER APPROVAL CHECK

if (checkingOwner) {

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <h1 className="text-3xl font-bold">

        Checking Owner Access...

      </h1>

    </div>

  );

}



if (ownerStatus === "Pending") {

  return (

    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-10 rounded-3xl shadow-xl text-center">

        <h1 className="text-4xl font-bold text-yellow-600 mb-4">

          Your application is under review

        </h1>

        <p className="text-gray-600 text-lg">

          Once the admin approves your application, you can start listing parking spaces.

        </p>

      </div>

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
  setTitle(
    e.target.value
      .replace(/[^A-Za-z0-9\s]/g, "")
      .slice(0, 80)
  )
}
            className="border p-4 rounded-2xl"
          />

          {/* LOCATION */}

          <input
            type="text"
            placeholder="Parking Location"
            value={location}
onChange={(e) =>
  setLocation(
    e.target.value
      .replace(/[^A-Za-z0-9,\-./() ]/g, "")
      .slice(0, 150)
  )
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
.replace(/\D/g,"")
.slice(0,6)
)
}
            className="border p-4 rounded-2xl"
          />

          

          {/* TOTAL PARKING SLOTS */}



<input
  type="text"
  value="1"
  readOnly
  className="border p-4 rounded-2xl bg-gray-100 text-gray-600 cursor-not-allowed"
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

if (!e.target.files) return;

const files = Array.from(e.target.files);

for (const file of files) {

  if (file.size > 5 * 1024 * 1024) {

    alert("Each image must be below 5MB");

    return;

  }

  if (
    ![
      "image/jpeg",
      "image/png",
      "image/webp",
    ].includes(file.type)
  ) {

    alert("Only JPG, PNG and WEBP images are allowed");

    return;

  }

}

setImages(files);

            }}
            className="border p-4 rounded-2xl w-full"
          />

        </div>

        {/* DESCRIPTION */}

        <textarea
          placeholder="Parking Description"
          value={description}
onChange={(e)=>{

if(e.target.value.length<=500){

setDescription(e.target.value);

}

}}
          className="border p-4 rounded-2xl w-full mt-8 h-40"
        ></textarea>

        {/* SUBMIT */}

        <button

          onClick={async (e) => {

            e.preventDefault();

            try {

              setLoading(true);

              if(title.trim().length < 5){

alert("Parking title should contain at least 5 characters");

setLoading(false);

return;

}

if(location.trim().length < 3){

alert("Please enter a complete parking location");

setLoading(false);

return;

}

if(Number(monthlyPrice) < 100){

alert("Monthly price should be at least ₹100");

setLoading(false);

return;

}



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

              // Generate Unique Parking ID
const parkingId =
  "PK" +
  Date.now().toString().slice(-8);

              // FIRESTORE SAVE

              const formattedTitle = title
.split(" ")
.map(
word =>
word.charAt(0).toUpperCase() +
word.slice(1).toLowerCase()
)
.join(" ");

              const newParking = {
                
                parkingId,

parkingCode: parkingId,

                title: formattedTitle,

                location,

                monthlyPrice,

totalSlots: Number(totalSlots),

occupiedSlots: 0,

availableSlots: Number(totalSlots),

slots: Array.from(
  { length: Number(totalSlots) },
  (_, index) => ({
    slotId: `S${index + 1}`,
    slotName: `S${index + 1}`,
    status: "Available",
  })
),

                description,

                parkingType,

                cctv,

                images:
                  uploadedImages,

                image:
                  uploadedImages[0],

                latitude,

                longitude,

                status: "Pending",

availability: "Pending Approval",

featured: false,

verified: false,

                ownerUid:
                  user.uid,

ownerId: userData?.userId || "",

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

               createdAt: serverTimestamp(),

              };

              const duplicateQuery = query(
collection(db,"parkings"),
where("ownerUid", "==", user.uid),
where("title","==",title)
);

const duplicate = await getDocs(duplicateQuery);

if(!duplicate.empty){

alert("Parking with this name already exists.");

setLoading(false);

return;

}

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


              setTotalSlots("1");

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