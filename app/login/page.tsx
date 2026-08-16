"use client";

import { useEffect, useRef, useState } from "react";
import {
  ConfirmationResult,
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { app, db } from "@/lib/firebase";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] =
    useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const auth = getAuth(app);
  const router = useRouter();

  const clearRecaptcha = () => {
    try {
      recaptchaVerifierRef.current?.clear();
    } catch (error) {
      console.warn("Unable to clear reCAPTCHA cleanly:", error);
    }

    recaptchaVerifierRef.current = null;

    const container = document.getElementById("recaptcha-container");
    if (container) {
      container.innerHTML = "";
    }
  };

  useEffect(() => {
    return () => {
      clearRecaptcha();
    };
  }, []);

  const createRecaptchaVerifier = async () => {
    clearRecaptcha();

    const container = document.getElementById("recaptcha-container");

    if (!container) {
      throw new Error("reCAPTCHA container is not available.");
    }

    const verifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      }
    );

    recaptchaVerifierRef.current = verifier;

    // Render before requesting OTP so Firebase always uses the current DOM node.
    await verifier.render();

    return verifier;
  };

  const sendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      alert("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setLoading(true);

      const recaptchaVerifier = await createRecaptchaVerifier();

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${phone}`,
        recaptchaVerifier
      );

      setConfirmationResult(confirmation);
      setOtpSent(true);
      alert("OTP sent successfully.");
    } catch (error: any) {
      console.error("Send OTP error:", error);

      clearRecaptcha();

      if (error?.code === "auth/too-many-requests") {
        alert(
          "Too many OTP requests were made. Please wait for some time and try again."
        );
      } else if (error?.code === "auth/invalid-phone-number") {
        alert("The mobile number is invalid.");
      } else if (error?.code === "auth/quota-exceeded") {
        alert("Firebase OTP quota has been exceeded. Please try again later.");
      } else if (error?.code === "auth/captcha-check-failed") {
        alert("reCAPTCHA verification failed. Please refresh and try again.");
      } else {
        alert("Unable to send OTP. Please refresh the page and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndLogin = async () => {
    if (!confirmationResult) {
      alert("Please send OTP first.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      alert("Enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const result = await confirmationResult.confirm(otp);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);

        alert(
          "No CarParking Bangalore profile is linked to this mobile login. Please create an account first."
        );

        router.replace("/signup");
        return;
      }

      const userData = userDoc.data();

      if (userData?.status === "Blocked") {
        await signOut(auth);
        alert("Your account has been blocked by Admin.");
        return;
      }

      await addDoc(collection(db, "logins"), {
        userId: userData?.userId || "",
        uid: user.uid,
        phone: userData?.phone || `+91${phone}`,
        email: userData?.email || "",
        name: userData?.name || "User",
        photo: userData?.photoURL || userData?.photo || "",
        loginTime: serverTimestamp(),
        device: navigator.platform || "Unknown",
        browser: navigator.userAgent || "Unknown",
        online: true,
      });

      clearRecaptcha();
      alert("Login Successful");

      if (userData?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);

      if (error?.code === "auth/invalid-verification-code") {
        alert("The OTP is incorrect. Please check it and try again.");
      } else if (error?.code === "auth/code-expired") {
        alert("The OTP has expired. Please request a new OTP.");
        setOtpSent(false);
        setOtp("");
        setConfirmationResult(null);
        clearRecaptcha();
      } else if (error?.code === "permission-denied") {
        alert(
          "OTP was verified, but your profile could not be accessed due to Firestore permissions."
        );
      } else {
        alert("OTP verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const changeMobileNumber = async () => {
    setOtp("");
    setOtpSent(false);
    setConfirmationResult(null);
    clearRecaptcha();

    if (auth.currentUser) {
      await signOut(auth);
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

        <h1 className="text-4xl font-bold text-center mb-3">Welcome Back</h1>

        <p className="text-center text-gray-500 mb-8">
          Login using your mobile number
        </p>

        <div className="mb-5">
          <label htmlFor="login-phone" className="block font-semibold mb-2">
            Mobile Number
          </label>

          <div className="flex">
            <span className="bg-gray-100 border border-r-0 rounded-l-2xl px-4 flex items-center font-semibold">
              +91
            </span>

            <input
              id="login-phone"
              name="phone"
              type="text"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="9876543210"
              value={phone}
              disabled={otpSent || loading}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="w-full border border-l-0 p-4 rounded-r-2xl disabled:bg-gray-100"
            />
          </div>
        </div>

        <div id="recaptcha-container" />

        {!otpSent ? (
          <button
            type="button"
            onClick={sendOtp}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-2xl font-bold text-xl disabled:bg-gray-400"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        ) : (
          <>
            <label htmlFor="login-otp" className="sr-only">
              Enter OTP
            </label>

            <input
              id="login-otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter OTP"
              value={otp}
              disabled={loading}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="w-full border p-4 rounded-2xl mt-5 disabled:bg-gray-100"
            />

            <button
              type="button"
              onClick={verifyOtpAndLogin}
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-xl mt-5 disabled:bg-gray-400"
            >
              {loading ? "Verifying..." : "Verify OTP & Login"}
            </button>

            <button
              type="button"
              onClick={changeMobileNumber}
              disabled={loading}
              className="w-full text-gray-600 font-semibold mt-4 hover:text-black disabled:text-gray-400"
            >
              Change Mobile Number
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
              type="button"
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