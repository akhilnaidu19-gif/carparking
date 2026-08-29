"use client";

import { useEffect, useRef, useState } from "react";


import {
  collection,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import { db } from "@/lib/firebase";
import Payments from "./components/Payments";
import RefundRequests from "./components/RefundRequests";
import RefundHistory from "./components/RefundHistory";
import WaitingSettlement from "./components/WaitingSettlement";
import EligiblePayouts from "./components/EligiblePayouts";
import PaidHistory from "./components/PaidHistory";
import Users from "./components/Users";
import Bookings from "./components/Bookings";
import Listings from "./components/Listings";
import OwnerApplications from "./components/OwnerApplications";
import Tickets from "./components/Tickets";
import Dashboard from "./components/Dashboard";

export default function AdminPage() {

  

  const [parkings, setParkings] =
    useState<any[]>([]);

  const [bookings, setBookings] =
    useState<any[]>([]);
    const [payments, setPayments] = useState<any[]>([]);

  const [users, setUsers] =
    useState<any[]>([]);

  const [logins, setLogins] =
    useState<any[]>([]);

  const [authorized, setAuthorized] =
    useState(false);

  const [filter, setFilter] =
    useState("All");

  const [notification, setNotification] =
    useState("");

    const bookingsInitialized = useRef(false);

    const [tickets, setTickets] =
  useState<any[]>([]);

  const [activeSection, setActiveSection] =
  useState("dashboard");

  const [showAllRefunds, setShowAllRefunds] =
  useState(false);

  const [showAllRefundHistory, setShowAllRefundHistory] =
  useState(false);

const [showAllPayouts, setShowAllPayouts] =
  useState(false);

  const router = useRouter();

  const auth = getAuth();
  const [ownerApplications, setOwnerApplications] = useState<any[]>([]);

const getRefundDate = (booking: any) => {
  const dateValue =
    booking.refundProcessedAt ||
    booking.refundCompletedAt ||
    booking.refundRequestedAt ||
    booking.cancelledAt ||
    booking.bookingDate;

  if (dateValue?.seconds) {
    return dateValue.seconds * 1000;
  }

  if (dateValue) {
    return new Date(dateValue).getTime();
  }

  return 0;
};

const pendingRefunds = payments
  .filter(
    (payment) =>
      payment.refundStatus === "Pending" ||
      payment.refundStatus === "Failed" ||
      payment.paymentStatus === "Refund Pending" ||
      payment.paymentStatus === "Refund Failed"
  )
  .sort(
    (a, b) =>
      getRefundDate(b) -
      getRefundDate(a)
  );

const refundHistory = payments
  .filter(
    (booking) =>
      booking.refundStatus === "Completed" ||
      booking.refundStatus === "Processing" ||
      booking.paymentStatus === "Refunded" ||
      booking.paymentStatus === "Refund Processing"
  )
  .sort(
    (a, b) =>
      getRefundDate(b) -
      getRefundDate(a)
  );

const visibleRefunds = showAllRefunds
  ? pendingRefunds
  : pendingRefunds.slice(0, 3);

const visibleRefundHistory =
  showAllRefundHistory
    ? refundHistory
    : refundHistory.slice(0, 5);

const ownerPayouts = payments
  .filter((booking) => {
    const hasPayoutAmount =
      Number(booking.ownerReceivableAmount || 0) > 0;

    const isEligibleStatus =
      booking.bookingStatus === "Completed" ||
      booking.bookingStatus === "Cancelled After Approval";

    const isAlreadyPaid =
      booking.ownerPayoutStatus === "Paid";

    return (
      hasPayoutAmount &&
      (isEligibleStatus || isAlreadyPaid)
    );
  })
  .sort((a, b) => {
    const getDate = (booking: any) => {
      const dateValue =
        booking.ownerPaidDate ||
        booking.cancelledAt ||
        booking.bookingDate ||
        booking.createdAt;

      if (dateValue?.seconds) {
        return dateValue.seconds * 1000;
      }

      if (dateValue) {
        return new Date(dateValue).getTime();
      }

      return 0;
    };

    return getDate(b) - getDate(a);
  });

const visibleOwnerPayouts = showAllPayouts
  ? ownerPayouts
  : ownerPayouts.slice(0, 5);

  const waitingForSettlementPayouts =
  payments
    .filter(
      (payment) =>
        payment.ownerPayoutStatus ===
        "Waiting For Settlement"
    )
    .sort((a, b) => {
      const dateA =
        a.completedDate?.seconds
          ? a.completedDate.seconds * 1000
          : new Date(
              a.completedDate ||
                a.updatedAt ||
                0
            ).getTime();

      const dateB =
        b.completedDate?.seconds
          ? b.completedDate.seconds * 1000
          : new Date(
              b.completedDate ||
                b.updatedAt ||
                0
            ).getTime();

      return dateB - dateA;
    });

const eligiblePayouts =
  payments
    .filter(
      (payment) =>
        payment.ownerPayoutStatus ===
          "Eligible" &&
        payment.eligibleForPayout ===
          true &&
        payment.settlementStatus ===
          "Settled"
    )
    .sort((a, b) => {
      const dateA =
        a.payoutEligibleAt?.seconds
          ? a.payoutEligibleAt.seconds *
            1000
          : new Date(
              a.payoutEligibleAt ||
                a.settledAt ||
                0
            ).getTime();

      const dateB =
        b.payoutEligibleAt?.seconds
          ? b.payoutEligibleAt.seconds *
            1000
          : new Date(
              b.payoutEligibleAt ||
                b.settledAt ||
                0
            ).getTime();

      return dateB - dateA;
    });

const paidPayouts =
  payments
    .filter(
      (payment) =>
        payment.ownerPayoutStatus ===
        "Paid"
    )
    .sort((a, b) => {
      const dateA =
        a.ownerPaidAt?.seconds
          ? a.ownerPaidAt.seconds * 1000
          : new Date(
              a.ownerPaidAt ||
                a.ownerPaidDate ||
                0
            ).getTime();

      const dateB =
        b.ownerPaidAt?.seconds
          ? b.ownerPaidAt.seconds * 1000
          : new Date(
              b.ownerPaidAt ||
                b.ownerPaidDate ||
                0
            ).getTime();

      return dateB - dateA;
    });
  // ADMIN AUTH

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        async (currentUser) => {

          if (!currentUser) {

            router.push("/login");

            return;

          }

          const userDoc =
  await getDoc(
    doc(
      db,
      "users",
      currentUser.uid
    )
  );

if (!userDoc.exists()) {
  alert("User profile not found.");
  router.push("/");
  return;
}

const userData = userDoc.data();

if (
  userData?.role ===
  "admin"
) {

  setAuthorized(true);

} else {

  alert(
    "Access Denied"
  );

  router.push("/");

}

        }

      );

    return () => unsubscribe();

  }, []);

  // FETCH PARKINGS

  useEffect(() => {

    const unsubscribe =
      onSnapshot(

        collection(db, "parkings"),

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

  }, []);

  // FETCH BOOKINGS

useEffect(() => {

  const unsubscribe =
    onSnapshot(

      collection(db, "bookings"),

      (snapshot) => {

        const bookingData: any[] = [];

        snapshot.forEach((doc) => {

          bookingData.push({

            id: doc.id,

            ...doc.data(),

          });

        });

        // Always update booking list
        setBookings(bookingData);

        // Do NOT show notification for the initial Firestore load
        if (!bookingsInitialized.current) {

          bookingsInitialized.current = true;

          return;
        }

        // Check whether a genuinely new booking was added
        const newBookingAdded =
          snapshot.docChanges().some(
            (change) =>
              change.type === "added"
          );

        if (newBookingAdded) {

          setNotification(
            "New Booking Received"
          );

          setTimeout(() => {

            setNotification("");

          }, 3000);

        }

      }

    );

  return () => unsubscribe();

}, []);

  // FETCH PAYMENTS

useEffect(() => {

  const unsubscribe =
    onSnapshot(

      collection(db, "payments"),

      (snapshot) => {

        const paymentData: any[] = [];

        snapshot.forEach((paymentDoc) => {

          paymentData.push({

            id: paymentDoc.id,

            ...paymentDoc.data(),

          });

        });

        setPayments(paymentData);

        console.log(
          "Payments loaded:",
          paymentData
        );

      },

      (error) => {

        console.error(
          "Unable to load payments:",
          error
        );

      }

    );

  return () => unsubscribe();

}, []);

  // FETCH OWNER APPLICATIONS

useEffect(() => {

  const unsubscribe =
    onSnapshot(

      collection(db, "ownerApplications"),

      (snapshot) => {

        const ownerData: any[] = [];

        snapshot.forEach((doc) => {

          ownerData.push({

            id: doc.id,

            ...doc.data(),

          });

        });

        setOwnerApplications(ownerData);

      }

    );

  return () => unsubscribe();

}, []);

  // FETCH USERS

  useEffect(() => {

    const unsubscribe =
      onSnapshot(

        collection(db, "users"),

        (snapshot) => {

          const usersData: any[] =
            [];

          snapshot.forEach((doc) => {

            usersData.push({

              id: doc.id,

              ...doc.data(),

            });

          });

          setUsers(
            usersData
          );

        }

      );

    return () => unsubscribe();

  }, []);

  // FETCH LOGIN ACTIVITY

  useEffect(() => {

    const unsubscribe =
      onSnapshot(

        collection(db, "logins"),

        (snapshot) => {

          const loginData: any[] =
            [];

          snapshot.forEach((doc) => {

            loginData.push({

              id: doc.id,

              ...doc.data(),

            });

          });

          setLogins(
            loginData
          );

        }

      );

    return () => unsubscribe();

  }, []);

  // FETCH SUPPORT TICKETS

useEffect(() => {

  const unsubscribe =
    onSnapshot(

      collection(
        db,
        "supportTickets"
      ),

      (snapshot) => {

        const ticketData: any[] =
          [];

        snapshot.forEach((doc) => {

          ticketData.push({

            id: doc.id,

            ...doc.data(),

          });

        });

        setTickets(
          ticketData
        );

      }

    );

  return () => unsubscribe();

}, []);

  if (!authorized) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-black text-white">

        <h1 className="text-4xl font-bold">

          Checking Admin Access...

        </h1>

      </div>

    );

  }

  // STATS

const totalCustomerPayments =
  payments.reduce(
    (sum, payment) =>
      sum +
      Number(
        payment.customerPaidAmount || 0
      ),
    0
  );

const totalPlatformRevenue =
  payments.reduce(
    (acc, payment) =>
      acc +
      Number(payment.platformFeeAmount || 0),
    0
  );

const pendingOwnerPayments =
  payments
    .filter(
      (payment) =>
        payment.ownerPayoutStatus ===
          "Eligible" &&
        payment.eligibleForPayout ===
          true &&
        payment.settlementStatus ===
          "Settled"
    )
    .reduce(
      (total, payment) =>
        total +
        Number(
          payment.ownerReceivableAmount ||
            0
        ),
      0
    );


return (

  <div className="min-h-screen bg-gray-100 flex">

    {/* SIDEBAR */}

<div className="w-72 bg-black text-white min-h-screen p-6 sticky top-0">

  <h2 className="text-3xl font-bold mb-8">
    Admin Panel
  </h2>

  <div className="flex flex-col gap-3">

    <button
      onClick={() =>
        setActiveSection("dashboard")
      }
      className={`p-4 rounded-xl text-left ${
        activeSection === "dashboard"
          ? "bg-green-500"
          : "bg-gray-800"
      }`}
    >
      Dashboard
    </button>

    <button
      onClick={() =>
        setActiveSection("listings")
      }
      className={`p-4 rounded-xl text-left ${
        activeSection === "listings"
          ? "bg-green-500"
          : "bg-gray-800"
      }`}
    >
      Parking Listings
    </button>

    <button
      onClick={() =>
        setActiveSection("users")
      }
      className={`p-4 rounded-xl text-left ${
        activeSection === "users"
          ? "bg-green-500"
          : "bg-gray-800"
      }`}
    >
      Users
    </button>

    <button
      onClick={() =>
        setActiveSection("bookings")
      }
      className={`p-4 rounded-xl text-left ${
        activeSection === "bookings"
          ? "bg-green-500"
          : "bg-gray-800"
      }`}
    >
      Bookings
    </button>

<button
  onClick={() => setActiveSection("payments")}
  className={`w-full text-left px-6 py-4 rounded-2xl transition ${
    activeSection === "payments"
      ? "bg-green-500 text-white"
      : "bg-gray-800 text-white hover:bg-gray-700"
  }`}
>
  💳 Payments
</button>

<button
  onClick={() =>
    setActiveSection("ownerApplications")
  }
  className={`p-4 rounded-xl text-left ${
    activeSection === "ownerApplications"
      ? "bg-green-500"
      : "bg-gray-800"
  }`}
>
  🏢 Owner Applications
</button>

    <button
      onClick={() =>
        setActiveSection("tickets")
      }
      className={`p-4 rounded-xl text-left ${
        activeSection === "tickets"
          ? "bg-green-500"
          : "bg-gray-800"
      }`}
    >
      Support Tickets
    </button>

  </div>

</div>

<div className="flex-1">

      {/* NOTIFICATION */}

      {notification && (

        <div className="fixed top-5 right-5 bg-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 font-bold">

          {notification}

        </div>

      )}

      {/* HEADER */}

      <div className="bg-black text-white px-8 py-6 shadow-xl">

        <div className="max-w-7xl mx-auto flex items-center justify-between">

          <div>

            <h1 className="text-5xl font-bold">

              Admin Dashboard

            </h1>

            <p className="text-gray-400 mt-2">

              Manage platform, users, listings and analytics

            </p>

          </div>

          <div className="bg-green-500 px-6 py-3 rounded-2xl font-bold text-lg">

            CarParking Bangalore

          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto p-6">

{activeSection === "dashboard" && (
  <Dashboard
    parkings={parkings}
    bookings={bookings}
    users={users}
    payments={payments}
    tickets={tickets}
  />
)}

{activeSection === "listings" && (
  <Listings parkings={parkings} />
)}

        {activeSection === "users" && (
  <Users users={users} />
)}

{activeSection === "bookings" && (
  <Bookings bookings={bookings} />
)}


{activeSection === "payments" && (
<>
  <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

    <h2 className="text-4xl font-bold mb-8">
      💳 Payments & Refunds
    </h2>

    <Payments
  paymentsCount={payments.length}
  totalCustomerPayments={totalCustomerPayments}
  totalPlatformRevenue={totalPlatformRevenue}
  pendingRefundCount={pendingRefunds.length}
  refundHistoryCount={refundHistory.length}
  pendingOwnerPayments={pendingOwnerPayments}
/>

<RefundRequests
  pendingRefunds={pendingRefunds}
  visibleRefunds={visibleRefunds}
  showAllRefunds={showAllRefunds}
  setShowAllRefunds={setShowAllRefunds}
/>

<RefundHistory
  refundHistory={refundHistory}
  visibleRefundHistory={visibleRefundHistory}
  showAllRefundHistory={showAllRefundHistory}
  setShowAllRefundHistory={setShowAllRefundHistory}
/>


 {/* OWNER PAYOUTS */}

<div className="space-y-12">

  <WaitingSettlement
    waitingForSettlementPayouts={waitingForSettlementPayouts}
  />

  <EligiblePayouts
    eligiblePayouts={eligiblePayouts}
  />

  <PaidHistory
    paidPayouts={paidPayouts}
  />

</div>

  </div>
</>
)}

{activeSection === "ownerApplications" && (
  <OwnerApplications
    ownerApplications={
      ownerApplications
    }
  />
)}

{activeSection === "tickets" && (
  <Tickets tickets={tickets} />
)}


      </div>

    </div>

  </div>

  );

}