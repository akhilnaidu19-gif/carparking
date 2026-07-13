"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { db, storage,app } from "@/lib/firebase";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

export default function EditParkingPage() {

  const params = useParams();

  const router = useRouter();
  const auth = getAuth(app);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

    const [user, setUser] =
  useState<any>(null);

  // FORM STATES

  const [title, setTitle] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [monthlyPrice, setMonthlyPrice] =
    useState("");


  const [description, setDescription] =
    useState("");

  const [parkingType, setParkingType] =
    useState("Covered Parking");

  const [cctv, setCctv] =
    useState("CCTV Available");

  const [totalSlots, setTotalSlots] =
    useState("1");

  const [availableSlots,
    setAvailableSlots] =
    useState("1");

  const [occupiedSlots,
    setOccupiedSlots] =
    useState("0");

  const [latitude,
    setLatitude] =
    useState("");

  const [longitude,
    setLongitude] =
    useState("");

  // EXISTING IMAGES

  const [existingImages,
    setExistingImages] =
    useState<string[]>([]);

  // NEW IMAGES

  const [newImages,
    setNewImages] =
    useState<File[]>([]);

  // ORIGINAL DOCUMENT

  const [parkingData,
    setParkingData] =
    useState<any>(null);

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    (currentUser) => {
      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);
    }
  );

  return () => unsubscribe();
}, [auth, router]);

  //-----------------------------------------------------
  // LOAD PARKING
  //-----------------------------------------------------

  useEffect(() => {
  if (!user || !params.id) return;

  const loadParking =
    async () => {

        try {

          const docRef =
            doc(
              db,
              "parkings",
              params.id as string
            );

          const docSnap =
            await getDoc(docRef);

          if (!docSnap.exists()) {

            alert("Parking not found");

            router.push(
              "/dashboard"
            );

            return;

          }

          const data =
            docSnap.data();



if (data.ownerUid !== user.uid) {

  alert("You are not allowed to edit this parking.");

  router.push("/dashboard");

  return;

}

const hasActiveBooking =
  data.availability === "Occupied" ||
  Number(data.occupiedSlots || 0) > 0;

if (hasActiveBooking) {
  alert("This parking cannot be edited while it has an active booking.");
  router.push("/dashboard");
  return;
}

          setParkingData(data);

          setTitle(
            data.title || ""
          );

          setLocation(
            data.location || ""
          );

          setMonthlyPrice(
            data.monthlyPrice || ""
          );



          setDescription(
            data.description || ""
          );

          setParkingType(
            data.parkingType || ""
          );

          setCctv(
            data.cctv || ""
          );

          setLatitude(
            data.latitude || ""
          );

          setLongitude(
            data.longitude || ""
          );

          setTotalSlots(
            String(
              data.totalSlots
            )
          );

          setAvailableSlots(
            String(
              data.availableSlots
            )
          );

          setOccupiedSlots(
            String(
              data.occupiedSlots
            )
          );

setExistingImages(
  Array.isArray(data.images) && data.images.length > 0
    ? data.images
    : data.image
    ? [data.image]
    : []
);

        }

        catch (error) {

          console.log(error);

        }

        finally {

          setLoading(false);

        }

      };

    loadParking();

}, [params.id, user]);

  if (loading) {

  return (

    <div className="min-h-screen flex items-center justify-center">

      <h1 className="text-3xl font-bold">

        Loading Parking...

      </h1>

    </div>

  );

}

return (

<div className="min-h-screen bg-gray-100 py-16">

<div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl p-10">

<h1 className="text-5xl font-bold mb-10">

Edit Parking Listing

</h1>

<div className="grid md:grid-cols-2 gap-6">

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

<input
type="text"
placeholder="Location"
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

<input
type="number"
placeholder="Monthly Price"
value={monthlyPrice}
onChange={(e) =>
  setMonthlyPrice(
    e.target.value
      .replace(/\D/g, "")
      .slice(0, 6)
  )
}
className="border p-4 rounded-2xl"
/>



<input
  type="text"
  value="1"
  readOnly
  className="border p-4 rounded-2xl bg-gray-100 text-gray-600 cursor-not-allowed"
/>

<select
value={parkingType}
onChange={(e)=>
setParkingType(e.target.value)}
className="border p-4 rounded-2xl"
>

<option>Covered Parking</option>

<option>Open Parking</option>

<option>Basement Parking</option>

</select>

<select
value={cctv}
onChange={(e)=>
setCctv(e.target.value)}
className="border p-4 rounded-2xl"
>

<option>CCTV Available</option>

<option>No CCTV</option>

</select>

</div>

<textarea
value={description}
onChange={(e)=>
setDescription(e.target.value)}
placeholder="Parking Description"
className="border rounded-2xl w-full h-40 p-5 mt-8"
/>
{/* CURRENT IMAGES */}

<div className="mt-8">

  <h2 className="text-2xl font-bold mb-4">

    Current Images

  </h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

    {existingImages.map((image, index) => (

      <img
        key={index}
        src={image}
        className="h-40 w-full rounded-2xl object-cover border"
      />

    ))}

  </div>

</div>

{/* NEW IMAGE */}

<div className="mt-10">

  <label className="block text-xl font-bold mb-3">

    Upload New Images (Optional)

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

setNewImages(files);

    }}
    className="border p-4 rounded-2xl w-full"
  />

</div>

{/* LOCATION */}

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

alert("Location Updated");

},

(error) => {

console.log(error);

alert("Unable to get location");

}

);

}}

className="bg-black text-white px-8 py-4 rounded-2xl font-bold mt-8"

>

Use Current Location

</button>

{/* ACTION BUTTONS */}

<div className="flex gap-5 mt-10">

<button

onClick={async () => {

try {

setSaving(true);

if (title.trim().length < 3) {
  alert("Parking title should contain at least 3 characters");
  setSaving(false);
  return;
}

if (location.trim().length < 3) {
  alert("Please enter a complete parking location");
  setSaving(false);
  return;
}

if (Number(monthlyPrice) < 100) {
  alert("Monthly price should be at least ₹100");
  setSaving(false);
  return;
}


let uploadedImages = [...existingImages];

if (newImages.length > 0) {
  uploadedImages = [];

  for (const image of newImages) {

const imageRef = ref(

storage,

`parking-images/${Date.now()}-${image.name}`

);

await uploadBytes(

imageRef,

image

);

const imageUrl =

await getDownloadURL(

imageRef

);

uploadedImages.push(imageUrl);

}

}

await updateDoc(

doc(

db,

"parkings",


params.id as string

),

{
  title: title.trim(),

  location: location.trim(),

  monthlyPrice: Number(monthlyPrice),

  description: description.trim(),

  parkingType,

  cctv,

  latitude: latitude
    ? Number(latitude)
    : parkingData?.latitude || null,

  longitude: longitude
    ? Number(longitude)
    : parkingData?.longitude || null,

  totalSlots: 1,

  availableSlots: Number(availableSlots || 1),

  occupiedSlots: Number(occupiedSlots || 0),

  images: uploadedImages,

  image:
    uploadedImages.length > 0
      ? uploadedImages[0]
      : parkingData?.image || "",

  status: "Pending",

  availability: "Pending Approval",

  verified: false,

  featured: false,

  adminRemarks: "",

  updatedAt: serverTimestamp(),

  updatedBy: user.uid,
}

);

alert(
  "Parking updated successfully and sent for admin approval."
);

router.push(

"/dashboard"

);

}

catch (error: any) {
  console.error("Parking update error:", error);

  alert(
    error?.message ||
    "Unable to update parking"
  );
}

finally{

setSaving(false);

}

}}

disabled={saving}

className="flex-1 bg-green-600 text-white py-5 rounded-2xl text-xl font-bold disabled:bg-gray-400"

>

{saving

? "Saving Changes..."

: "Save Changes"}

</button>

<button

onClick={()=>

router.push(

"/dashboard"

)

}

className="flex-1 bg-red-500 text-white py-5 rounded-2xl text-xl font-bold"

>

Cancel

</button>

</div>

</div>

</div>

);
}