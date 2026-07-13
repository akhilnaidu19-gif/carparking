"use client";

import { useState } from "react";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import { useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function BecomeOwnerPage() {

  const [businessName, setBusinessName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
const [userData, setUserData] = useState<any>(null);

const auth = getAuth(app);
const router = useRouter();

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (!currentUser) {
      alert("Please login first.");
      router.push("/login");
      return;
    }

    setUser(currentUser);

    const userSnap = await getDoc(
      doc(db, "users", currentUser.uid)
    );

    if (userSnap.exists()) {
      setUserData(userSnap.data());
    } else {
      alert("User profile not found.");
      router.push("/profile");
    }
  });

  return () => unsubscribe();
}, []);

  return (

    <div className="min-h-screen bg-gray-100 py-12 px-6">

      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-10">

        <h1 className="text-4xl font-bold mb-8">
          Become a Parking Owner
        </h1>

        <div className="space-y-5">

          <input
            className="w-full border p-4 rounded-2xl"
            placeholder="Business / Owner Name"
            value={businessName}
            onChange={(e)=>setBusinessName(e.target.value)}
          />

          <input
            className="w-full border p-4 rounded-2xl"
            placeholder="Account Holder Name"
            value={accountName}
onChange={(e)=>setAccountName(e.target.value.replace(/[^A-Za-z ]/g, ""))}
          />

          <input
  className="w-full border p-4 rounded-2xl"
  placeholder="Bank Name"
  value={bankName}
onChange={(e)=>setBankName(e.target.value.replace(/[^A-Za-z ]/g, ""))}
/>

          <input
            className="w-full border p-4 rounded-2xl"
            placeholder="Bank Account Number"
            value={accountNumber}
onChange={(e)=>setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 18))}
          />

          <input
            className="w-full border p-4 rounded-2xl"
            placeholder="IFSC Code"
            value={ifsc}
onChange={(e)=>setIfsc(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}
          />

          <input
            className="w-full border p-4 rounded-2xl"
            placeholder="UPI ID (Optional)"
            value={upiId}
            onChange={(e)=>setUpiId(e.target.value)}
          />

          <button
            disabled={loading}
            onClick={async()=>{

              

              setLoading(true);

if (!user || !userData) {
  alert("User data is still loading. Please try again.");
  setLoading(false);
  return;
}

const userId = userData.userId;

if (businessName.trim().length < 3) {
  alert("Business / Owner Name must contain at least 3 characters.");
  setLoading(false);
  return;
}

if (!/^[A-Za-z ]{3,80}$/.test(accountName.trim())) {
  alert("Account Holder Name should contain only letters and spaces.");
  setLoading(false);
  return;
}

if (!/^[A-Za-z ]{3,80}$/.test(bankName.trim())) {
  alert("Bank Name should contain only letters and spaces.");
  setLoading(false);
  return;
}

if (!/^\d{9,18}$/.test(accountNumber.trim())) {
  alert("Bank Account Number should contain 9 to 18 digits only.");
  setLoading(false);
  return;
}

if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
  alert("Enter a valid IFSC code. Example: HDFC0001234");
  setLoading(false);
  return;
}

if (
  upiId.trim() &&
  !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())
) {
  alert("Enter a valid UPI ID. Example: name@upi");
  setLoading(false);
  return;
}

// CHECK EXISTING OWNER APPLICATION

const existingQuery = query(
  collection(db, "ownerApplications"),
  where("userId", "==", userId)
);

const existingSnapshot =
  await getDocs(existingQuery);

if (!existingSnapshot.empty) {
  alert(
    "You have already submitted an owner application."
  );

  setLoading(false);
  return;
}

// CREATE NEW OWNER APPLICATION

await addDoc(
                collection(db,"ownerApplications"),
                {

userUid: user.uid,
userId: userData.userId,
userName: userData.name || "",
userEmail: userData.email || "",
userPhone: userData.phone || "",

                  businessName,

accountName,

bankName,

accountNumber,

ifsc,

                  upiId,

                  status:"Pending",

                  appliedAt:new Date(),

                }
              );

              alert("Application Submitted Successfully");

              setLoading(false);

            }}
            className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-xl"
          >

            {loading
              ? "Submitting..."
              : "Submit Application"}

          </button>

        </div>

      </div>

    </div>

  );

}