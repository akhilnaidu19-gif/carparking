"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function BecomeOwnerPage() {

  const [businessName, setBusinessName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);

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
            onChange={(e)=>setAccountName(e.target.value)}
          />

          <input
  className="w-full border p-4 rounded-2xl"
  placeholder="Bank Name"
  value={bankName}
  onChange={(e)=>setBankName(e.target.value)}
/>

          <input
            className="w-full border p-4 rounded-2xl"
            placeholder="Bank Account Number"
            value={accountNumber}
            onChange={(e)=>setAccountNumber(e.target.value)}
          />

          <input
            className="w-full border p-4 rounded-2xl"
            placeholder="IFSC Code"
            value={ifsc}
            onChange={(e)=>setIfsc(e.target.value)}
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

              await addDoc(
                collection(db,"ownerApplications"),
                {

                  userUid:
                    localStorage.getItem("userUid"),

                  userName:
                    localStorage.getItem("userName"),

                  userEmail:
                    localStorage.getItem("userEmail"),

                  userPhone:
                    localStorage.getItem("userPhone"),

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