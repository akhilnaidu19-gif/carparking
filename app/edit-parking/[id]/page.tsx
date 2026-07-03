"use client";

import { useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { db, storage } from "@/lib/firebase";

import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function EditParkingPage() {

  const params = useParams();

  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  // FORM STATES

  const [title, setTitle] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [monthlyPrice, setMonthlyPrice] =
    useState("");

  const [yearlyPrice, setYearlyPrice] =
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

  //-----------------------------------------------------
  // LOAD PARKING
  //-----------------------------------------------------

  useEffect(() => {

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
              "/owner-dashboard"
            );

            return;

          }

          const data =
            docSnap.data();

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

          setYearlyPrice(
            data.yearlyPrice || ""
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
            data.images || []
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

  }, []);

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
onChange={(e)=>
setTitle(e.target.value)}
className="border p-4 rounded-2xl"
/>

<input
type="text"
placeholder="Location"
value={location}
onChange={(e)=>
setLocation(e.target.value)}
className="border p-4 rounded-2xl"
/>

<input
type="number"
placeholder="Monthly Price"
value={monthlyPrice}
onChange={(e)=>
setMonthlyPrice(e.target.value)}
className="border p-4 rounded-2xl"
/>

<input
type="number"
placeholder="Yearly Price"
value={yearlyPrice}
onChange={(e)=>
setYearlyPrice(e.target.value)}
className="border p-4 rounded-2xl"
/>

<input
type="number"
placeholder="Total Slots"
value={totalSlots}
onChange={(e)=>
setTotalSlots(e.target.value)}
className="border p-4 rounded-2xl"
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

      if (e.target.files) {

        setNewImages(

          Array.from(e.target.files)

        );

      }

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

title,

location,

monthlyPrice,

yearlyPrice,

description,

parkingType,

cctv,

latitude,

longitude,

totalSlots:Number(totalSlots),

availableSlots:Number(availableSlots),

occupiedSlots:Number(occupiedSlots),

images:uploadedImages,

image:uploadedImages[0],

}

);

alert(

"Parking Updated Successfully"

);

router.push(

"/owner-dashboard"

);

}

catch(error){

console.log(error);

alert(

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

"/owner-dashboard"

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