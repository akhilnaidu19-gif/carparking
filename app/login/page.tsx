"use client";

import { useState } from "react";

import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import { useRouter } from "next/navigation";

import { app, db } from "@/lib/firebase";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const auth = getAuth(app);
  const router = useRouter();

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setLoading(true);

      const userQuery = query(
  collection(db, "users"),
  where("phone", "==", `+91${phone}`)
);

const userSnapshot = await getDocs(userQuery);

if (userSnapshot.empty) {
  alert(
    "No account found with this mobile number.\n\nPlease register first."
  );
  return;
}

      if (!(window as any).loginRecaptchaVerifier) {
  (window as any).loginRecaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    {
      size: "invisible",
    }
  );
}

const recaptchaVerifier = (window as any).loginRecaptchaVerifier;

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
alert(
  "No account found with this mobile number.\n\nPlease create a new account first."
);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndLogin = async () => {
    if (!confirmationResult) {
      alert("Please send OTP first.");
      return;
    }

    if (otp.length !== 6) {
      alert("Enter valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        alert("Account not found. Please sign up first.");
        await auth.signOut();
        router.push("/signup");
        return;
      }

      const userData = userDoc.data();

      if (userData?.status === "Blocked") {
        alert("Your account has been blocked by Admin.");
        await auth.signOut();
        return;
      }

      await addDoc(collection(db, "logins"), {
        userId: userData?.userId || "",
        uid: user.uid,
        phone: userData?.phone || `+91${phone}`,
        email: userData?.email || "",
        name: userData?.name || "User",
        photo: userData?.photoURL || userData?.photo || "",
        loginTime: new Date().toLocaleString(),
        device: navigator.platform,
        browser: navigator.userAgent,
        online: true,
      });

      alert("Login Successful");

      if (userData?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.log(error);
      alert("OTP verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-6">
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-black text-white px-6 py-3 rounded-2xl font-bold text-xl">
            CarParking Bangalore
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-3">
          Welcome Back
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Login using your mobile number
        </p>

        <div className="mb-5">
          <label className="block font-semibold mb-2">
            Mobile Number
          </label>

          <div className="flex">
            <span className="bg-gray-100 border border-r-0 rounded-l-2xl px-4 flex items-center font-semibold">
              +91
            </span>

            <input
              type="text"
              placeholder="9876543210"
              value={phone}
              disabled={otpSent}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="w-full border border-l-0 p-4 rounded-r-2xl disabled:bg-gray-100"
            />
          </div>
        </div>

        <div id="recaptcha-container"></div>

        {!otpSent ? (
          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-xl disabled:bg-gray-400"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full border p-4 rounded-2xl mt-5"
            />

            <button
              onClick={verifyOtpAndLogin}
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-xl mt-5 disabled:bg-gray-400"
            >
              {loading ? "Verifying..." : "Verify OTP & Login"}
            </button>
          </>
        )}

        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">
            Secure Login Powered By Firebase
          </p>

          <p className="text-gray-600">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-green-600 font-bold hover:underline"
            >
              Sign Up Here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}