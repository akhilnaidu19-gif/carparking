"use client";

import { useState } from "react";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import {
  app,
  db,
  storage,
} from "@/lib/firebase";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<any>(null);

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const auth = getAuth(app);

  const generateUserId = async () => {
    const counterRef = doc(db, "counters", "users");

    const newUserId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let currentNumber = 0;

      if (counterDoc.exists()) {
        currentNumber = counterDoc.data().currentNumber || 0;
      }

      const nextNumber = currentNumber + 1;

      transaction.set(
        counterRef,
        {
          currentNumber: nextNumber,
        },
        {
          merge: true,
        }
      );

      return `CPB-A${nextNumber.toString().padStart(3, "0")}`;
    });

    return newUserId;
  };

  const sendOtp = async () => {
    if (!name.trim()) {
      alert("Full Name is mandatory.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    if (
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      alert("Enter a valid email address.");
      return;
    }

    try {
      setSendingOtp(true);

if ((window as any).recaptchaVerifier) {
  (window as any).recaptchaVerifier.clear();
}

const existingUserQuery = query(
  collection(db, "users"),
  where("phone", "==", `+91${phone}`)
);

const existingUserSnapshot = await getDocs(existingUserQuery);

if (!existingUserSnapshot.empty) {
  alert(
    "This mobile number is already registered.\n\nPlease login instead."
  );
  window.location.href = "/login";
  return;
}

const recaptchaVerifier = new RecaptchaVerifier(
  auth,
  "recaptcha-container",
  {
    size: "invisible",
  }
);

(window as any).recaptchaVerifier = recaptchaVerifier;

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        recaptchaVerifier
      );

      setConfirmationResult(confirmation);
      setOtpSent(true);

      alert("OTP sent successfully.");
    } catch (error) {
      console.log(error);
alert("Unable to send OTP. Please try again.");
setOtpSent(false);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtpAndCreateAccount = async () => {
    if (!confirmationResult) {
      alert("Please send OTP first.");
      return;
    }

    if (otp.length !== 6) {
      alert("Please enter valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const existingUserDoc = await getDoc(doc(db, "users", user.uid));

      if (existingUserDoc.exists()) {
        alert("Account already exists. Please login.");
        window.location.href = "/login";
        return;
      }

      const userId = await generateUserId();

      let imageURL = "";

      if (image) {
        const imageRef = ref(
          storage,
          `profile-images/${Date.now()}-${image.name}`
        );

        await uploadBytes(imageRef, image);

        imageURL = await getDownloadURL(imageRef);
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        userId,

        name: name.trim(),
        phone: `+91${phone}`,
        city: city.trim(),
        bio: bio.trim(),
        email: email.trim().toLowerCase() || "",

        photo: imageURL,
        photoURL: imageURL,

        role: "customer",
        status: "Active",
        phoneVerified: true,

        createdAt: new Date(),
        updatedAt: new Date(),
      });

      alert("Account Created Successfully");
      window.location.href = "/";
    } catch (error) {
      console.log(error);
      alert("OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6 py-10">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-4">
          Create Account
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Fields marked with * are mandatory
        </p>

        <div className="grid md:grid-cols-2 gap-5">
          <input
            type="text"
            placeholder="Full Name *"
            value={name}
            onChange={(e) =>
              setName(e.target.value.replace(/[^A-Za-z ]/g, ""))
            }
            className="border p-4 rounded-2xl"
          />

          <div className="flex">
            <span className="bg-gray-100 border border-r-0 rounded-l-2xl px-4 flex items-center font-semibold">
              +91
            </span>

            <input
              type="text"
              placeholder="Mobile Number *"
              value={phone}
              disabled={otpSent}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setPhone(value);
              }}
              className="border border-l-0 rounded-r-2xl p-4 flex-1 disabled:bg-gray-100"
            />
          </div>

          <input
            type="text"
            placeholder="City Optional"
            value={city}
            onChange={(e) =>
              setCity(e.target.value.replace(/[^A-Za-z ]/g, ""))
            }
            className="border p-4 rounded-2xl"
          />

          <input
            type="email"
            placeholder="Email Optional"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
            className="border p-4 rounded-2xl"
          />
        </div>

        <textarea
          placeholder="Short Bio Optional"
          value={bio}
          onChange={(e) => {
            if (e.target.value.length <= 250) {
              setBio(e.target.value);
            }
          }}
          className="w-full border p-4 rounded-2xl mt-5 h-32"
        />

        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (!file) return;

            if (!file.type.startsWith("image/")) {
              alert("Please select an image file.");
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              alert("Image should be less than 5MB.");
              return;
            }

            setImage(file);
          }}
          className="w-full border p-4 rounded-2xl mt-5"
        />

        <div id="recaptcha-container"></div>

        {!otpSent ? (
          <button
            onClick={sendOtp}
            disabled={sendingOtp}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-xl mt-8 disabled:bg-gray-400"
          >
            {sendingOtp ? "Sending OTP..." : "Send OTP"}
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP *"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full border p-4 rounded-2xl mt-5"
            />

            <button
              onClick={verifyOtpAndCreateAccount}
              disabled={loading}
              className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-xl mt-8 disabled:bg-gray-400"
            >
              {loading ? "Creating Account..." : "Verify OTP & Create Account"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}