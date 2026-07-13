"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { useRouter } from "next/navigation";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { db } from "@/lib/firebase";
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

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("All");

    const [listingTab, setListingTab] =
  useState("Pending");

  const [notification, setNotification] =
    useState("");

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

const [remarks, setRemarks] =
  useState<{ [key: string]: string }>({});

  const [ticketCategoryFilter,
  setTicketCategoryFilter] =
  useState("All");

  const [ticketSearch, setTicketSearch] =
  useState("");

const [ticketPage, setTicketPage] =
  useState(1);

const ticketsPerPage = 5;

const [userSearch, setUserSearch] =
  useState("");

  const [userTab, setUserTab] =
  useState("All");

const [userPage, setUserPage] =
  useState(1);

const usersPerPage = 10;

const [bookingSearch, setBookingSearch] =
  useState("");

const [bookingPage, setBookingPage] =
  useState(1);

const bookingsPerPage = 5;

const [listingPage, setListingPage] =
  useState(1);

const listingsPerPage = 6;

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
      payment.paymentStatus === "Refund Pending"
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
      booking.refundStatus === "Failed" ||
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

          const bookingData: any[] =
            [];

          snapshot.forEach((doc) => {

            bookingData.push({

              id: doc.id,

              ...doc.data(),

            });

          });

          setBookings(
            bookingData
          );

          setNotification(
            "New Booking Received"
          );

          setTimeout(() => {

            setNotification("");

          }, 3000);

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
  .filter((booking) => {
    const eligibleStatus =
      booking.bookingStatus === "Completed" ||
      booking.bookingStatus === "Cancelled After Approval";

    return (
      eligibleStatus &&
      booking.ownerPayoutStatus !== "Paid"
    );
  })
  .reduce(
    (total, booking) =>
      total +
      Number(
        booking.ownerReceivableAmount || 0
      ),
    0
  );

const completedOwnerPayout =
  payments
    .filter(
      (booking) =>
        booking.ownerPayoutStatus ===
        "Paid"
    )
    .reduce(
      (acc, booking) =>
        acc +
        Number(
          booking.ownerReceivableAmount ||
            0
        ),
      0
    );

  const availableCount =
    parkings.filter(

      (item) =>
        item.availability ===
        "Available"

    ).length;

  const occupiedCount =
    parkings.filter(

      (item) =>
        item.availability ===
        "Occupied"

    ).length;

  const pendingCount =
    parkings.filter(

      (item) =>
        item.status ===
        "Pending"

    ).length;

  const approvedCount =
    parkings.filter(

      (item) =>
        item.status ===
        "Approved"

    ).length;

  const featuredCount =
    parkings.filter(
      (item) =>
        item.featured === true
    ).length;

  const onlineUsers =
    logins.filter(
      (item) =>
        item.online === true
    ).length;

    const openTickets =
  tickets.filter(
    (ticket) =>
      (ticket.status || "Open") ===
      "Open"
  ).length;

const progressTickets =
  tickets.filter(
    (ticket) =>
      ticket.status ===
      "In Progress"
  ).length;

const waitingTickets =
  tickets.filter(
    (ticket) =>
      ticket.status ===
      "Waiting For Customer"
  ).length;

const resolvedTickets =
  tickets.filter(
    (ticket) =>
      ticket.status ===
      "Resolved"
  ).length;

  const filteredTickets = tickets.filter(
  (ticket) => {


    const categoryMatch =
      ticketCategoryFilter === "All"
        ? true
        : ticket.category ===
          ticketCategoryFilter;

    const searchMatch =
      (
        ticket.ticketId || ""
      )
        .toLowerCase()
        .includes(
          ticketSearch.toLowerCase()
        ) ||

      (
        ticket.userName || ""
      )
        .toLowerCase()
        .includes(
          ticketSearch.toLowerCase()
        ) ||

      (
        ticket.userEmail || ""
      )
        .toLowerCase()
        .includes(
          ticketSearch.toLowerCase()
        ) ||

      (
        ticket.subject || ""
      )
        .toLowerCase()
        .includes(
          ticketSearch.toLowerCase()
        )
        
        ||

(ticket.userId || "")
  .toLowerCase()
  .includes(
    ticketSearch.toLowerCase()
  );

    return (
      categoryMatch &&
      searchMatch
    );
  }

  
);

const filteredUsers = users.filter((user) => {
  const searchMatch =
    (user.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.phone || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.city || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.userId || "").toLowerCase().includes(userSearch.toLowerCase());

  const tabMatch =
    userTab === "All"
      ? true
      : userTab === "Customers"
      ? user.role === "customer" && user.isOwner !== true
      : userTab === "Owners"
      ? user.isOwner === true || user.role === "owner"
      : userTab === "Admins"
      ? user.role === "admin"
      : user.status === "Blocked";

  return searchMatch && tabMatch;
});

const totalUserPages =
  Math.ceil(
    filteredUsers.length /
      usersPerPage
  );

const paginatedUsers =
  filteredUsers.slice(
    (userPage - 1) *
      usersPerPage,

    userPage *
      usersPerPage
  );

 const filteredBookings =
  bookings.filter((booking) => {

    const searchValue =
      bookingSearch.toLowerCase();

    return (

      (booking.bookingId || "")
        .toLowerCase()
        .includes(searchValue)

      ||

      (booking.customerId || "")
        .toLowerCase()
        .includes(searchValue)

      ||

      (booking.customerName || booking.name || "")
        .toLowerCase()
        .includes(searchValue)

      ||

      (booking.customerEmail || booking.email || "")
        .toLowerCase()
        .includes(searchValue)

      ||

      (booking.customerPhone || "")
        .toLowerCase()
        .includes(searchValue)

      ||

      (booking.title || "")
        .toLowerCase()
        .includes(searchValue)

      ||

      (booking.location || "")
        .toLowerCase()
        .includes(searchValue)

    );

  });

const totalBookingPages =
  Math.ceil(
    filteredBookings.length /
      bookingsPerPage
  );

const paginatedBookings =
  filteredBookings.slice(
    (bookingPage - 1) *
      bookingsPerPage,

    bookingPage *
      bookingsPerPage
  );

  const filteredListings = parkings.filter((parking) => {

  const matchesSearch =

    (parking.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())

    ||

    (parking.location || "")
      .toLowerCase()
      .includes(search.toLowerCase())

    ||

    (parking.ownerName || "")
      .toLowerCase()
      .includes(search.toLowerCase())

    ||

    (parking.ownerId || "")
      .toLowerCase()
      .includes(search.toLowerCase());

  const matchesTab =
    listingTab === "Pending"
      ? parking.status === "Pending"
      : listingTab === "Approved"
      ? parking.status === "Approved"
      : parking.status === "Rejected";

  return (
    matchesSearch &&
    matchesTab
  );

});

const totalListingPages =
  Math.ceil(
    filteredListings.length /
      listingsPerPage
  );

const paginatedListings =
  filteredListings.slice(
    (listingPage - 1) *
      listingsPerPage,

    listingPage *
      listingsPerPage
  );



const totalTicketPages =
  Math.ceil(
    filteredTickets.length /
      ticketsPerPage
  );

const paginatedTickets =
  filteredTickets.slice(
    (ticketPage - 1) *
      ticketsPerPage,

    ticketPage *
      ticketsPerPage
  );

  // CHART DATA

  const chartData = [

    {
      name: "Listings",
      value: parkings.length,
    },

    {
      name: "Bookings",
      value: bookings.length,
    },

    {
      name: "Users",
      value: users.length,
    },

{
  name: "Revenue",
  value: totalPlatformRevenue,
},

  ];




  const pieData = [

    {
      name: "Available",
      value: availableCount,
    },

    {
      name: "Occupied",
      value: occupiedCount,
    },

  ];

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
<>

        {/* STATS */}

        <div className="mb-10">

<h2 className="text-2xl font-bold mb-6">
📊 Platform Overview
</h2>

<div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">

          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Listings

            </p>

            <h2 className="text-5xl font-bold">

              {parkings.length}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Pending

            </p>

            <h2 className="text-5xl font-bold">

              {pendingCount}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Approved

            </p>

            <h2 className="text-5xl font-bold">

              {approvedCount}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Featured

            </p>

            <h2 className="text-5xl font-bold">

              {featuredCount}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-8 rounded-3xl shadow-xl">

            <p className="text-lg mb-3">

              Users

            </p>

            <h2 className="text-5xl font-bold">

              {users.length}

            </h2>

          </div>

          <div className="bg-gradient-to-r from-black to-gray-800 text-white p-8 rounded-3xl shadow-xl">

  <p className="text-lg mb-3">
    Customer Payments
  </p>

  <h2 className="text-4xl font-bold">
    ₹{totalCustomerPayments}
  </h2>

</div>

<div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-8 rounded-3xl shadow-xl">

  <p className="text-lg mb-3">
    Platform Revenue
  </p>

  <h2 className="text-4xl font-bold">
    ₹{totalPlatformRevenue}
  </h2>

</div>

<div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-8 rounded-3xl shadow-xl">

  <p className="text-lg mb-3">
    Pending Payout
  </p>

  <h2 className="text-4xl font-bold">
    ₹{pendingOwnerPayments}
  </h2>

</div>

<div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-8 rounded-3xl shadow-xl">

  <p className="text-lg mb-3">
    Owners Paid
  </p>

  <h2 className="text-4xl font-bold">
    ₹{completedOwnerPayout}
  </h2>

</div>

<div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-8 rounded-3xl shadow-xl">

  <p className="text-lg mb-3">
    Total Tickets
  </p>

  

  <h2 className="text-5xl font-bold">
    {tickets.length}
  </h2>

  

</div>

</div>

<h2 className="text-2xl font-bold mb-6">
💳 Financial Overview
</h2>

<div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10"></div>



        </div>

        {/* ANALYTICS */}

        <div className="grid md:grid-cols-2 gap-8 mb-10">

          <div className="bg-white rounded-3xl shadow-xl p-8">

            <h2 className="text-3xl font-bold mb-8">

              Platform Analytics

            </h2>

            <div className="h-[350px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart
                  data={chartData}
                >

                  <XAxis dataKey="name" />

                  <YAxis />

                  <Tooltip />

                  <Bar dataKey="value" />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">

            <h2 className="text-3xl font-bold mb-8">

              Occupancy Analytics

            </h2>

            <div className="h-[350px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={pieData}
                    dataKey="value"
                    outerRadius={120}
                    label
                  >

                    <Cell fill="#22c55e" />

                    <Cell fill="#ef4444" />

                  </Pie>

                  <Tooltip />

                </PieChart>

              </ResponsiveContainer>

            </div>

          </div>

        </div>

        {/* SUPPORT ANALYTICS */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-4xl font-bold">
      🎫 Support Analytics
    </h2>

    <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold">
      {tickets.length} Tickets
    </div>

  </div>

  <div className="grid md:grid-cols-4 gap-6">

    <div className="bg-yellow-500 text-white p-6 rounded-3xl">

      <p className="text-lg">
        Open
      </p>

      <h2 className="text-5xl font-bold">
        {openTickets}
      </h2>

    </div>

    <div className="bg-blue-500 text-white p-6 rounded-3xl">

      <p className="text-lg">
        In Progress
      </p>

      <h2 className="text-5xl font-bold">
        {progressTickets}
      </h2>

    </div>

    <div className="bg-orange-500 text-white p-6 rounded-3xl">

      <p className="text-lg">
        Waiting
      </p>

      <h2 className="text-5xl font-bold">
        {waitingTickets}
      </h2>

    </div>

    <div className="bg-green-600 text-white p-6 rounded-3xl">

      <p className="text-lg">
        Resolved
      </p>

      <h2 className="text-5xl font-bold">
        {resolvedTickets}
      </h2>

    </div>

  </div>

  <div className="mt-8 bg-gray-100 rounded-3xl p-6">

    <h3 className="text-2xl font-bold mb-4">
      Support Performance
    </h3>

    <div className="grid md:grid-cols-2 gap-6">

      <div>

        <p className="text-gray-500">
          Total Tickets
        </p>

        <h2 className="text-4xl font-bold">
          {tickets.length}
        </h2>

      </div>

      <div>

        <p className="text-gray-500">
          Resolution Rate
        </p>

        <h2 className="text-4xl font-bold text-green-600">

          {tickets.length > 0
            ? Math.round(
                (resolvedTickets /
                  tickets.length) *
                  100
              )
            : 0}

          %

        </h2>

      </div>

    </div>

  </div>

{/* RECENT TICKETS */}

<div className="mt-10">

  <h3 className="text-2xl font-bold mb-5">

    Recent Support Tickets

  </h3>

  <div className="overflow-x-auto">

    <table className="w-full">

      <thead>

        <tr className="bg-gray-100">

          <th className="p-4 text-left">
            Ticket ID
          </th>

          <th className="p-4 text-left">
            User
          </th>

          <th className="p-4 text-left">
            Subject
          </th>

          <th className="p-4 text-left">
            Priority
          </th>

          <th className="p-4 text-left">
            Status
          </th>

        </tr>

      </thead>

      <tbody>

        {tickets

          .slice(0, 5)

          .map((ticket) => (

            <tr
              key={ticket.id}
              className="border-b"
            >

              <td className="p-4 font-semibold">

                {ticket.ticketId}

              </td>

              <td className="p-4">

                {ticket.userName}

              </td>

              <td className="p-4">

                {ticket.subject}

              </td>

              <td className="p-4">

                {ticket.priority}

              </td>

              <td className="p-4">

                <span
                  className={`px-3 py-1 rounded-full text-white text-sm font-bold ${
                    ticket.status ===
                    "Resolved"
                      ? "bg-green-500"
                      : ticket.status ===
                        "In Progress"
                      ? "bg-blue-500"
                      : ticket.status ===
                        "Waiting For Customer"
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                >

                  {ticket.status ||
                    "Open"}

                </span>

                
              </td>

            </tr>

          ))}

      </tbody>

    </table>

  </div>

</div>

</div>
</>
)}

{activeSection === "listings" && (
<>
        {/* SEARCH */}

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-10 flex flex-col md:flex-row gap-4">

          <input
            type="text"
            placeholder="Search Listings"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="border p-4 rounded-2xl flex-1"
          />

          <div className="flex gap-4 mb-8">

<button
onClick={()=>{
setListingTab("Pending");
setListingPage(1);
}}
className={`px-6 py-3 rounded-2xl font-bold ${
listingTab==="Pending"
?"bg-orange-500 text-white"
:"bg-gray-200"
}`}
>
Pending (
{
parkings.filter(
p=>p.status==="Pending"
).length
}
)
</button>

<button
onClick={()=>{
setListingTab("Approved");
setListingPage(1);
}}
className={`px-6 py-3 rounded-2xl font-bold ${
listingTab==="Approved"
?"bg-green-600 text-white"
:"bg-gray-200"
}`}
>
Approved (
{
parkings.filter(
p=>p.status==="Approved"
).length
}
)
</button>

<button
onClick={()=>{
setListingTab("Rejected");
setListingPage(1);
}}
className={`px-6 py-3 rounded-2xl font-bold ${
listingTab==="Rejected"
?"bg-red-600 text-white"
:"bg-gray-200"
}`}
>
Rejected (
{
parkings.filter(
p=>p.status==="Rejected"
).length
}
)
</button>

</div>

        </div>

        {/* LISTINGS */}

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

          <h2 className="text-4xl font-bold mb-8">

            {listingTab} Parking Listings

          </h2>

          <div className="grid gap-8">

            {paginatedListings.map(
  (parking) => (

                <div
                  key={parking.id}
                  className="bg-gray-50 rounded-3xl border p-6 flex flex-col md:flex-row gap-6"
                >

                  <img
                    src={parking.image}
                    className="w-full md:w-72 h-52 object-cover rounded-2xl"
                  />

                  <div className="flex-1">

                    <div className="flex flex-col md:flex-row md:justify-between gap-6">

                      <div>

                        {/* BADGES */}

                        <div className="flex flex-wrap gap-3 mb-4">

                          <span
                            className={`px-4 py-2 rounded-xl font-bold text-white ${
parking.status === "Approved"
  ? "bg-green-500"
  : parking.status === "Rejected"
  ? "bg-red-500"
  : "bg-orange-500"
                            }`}
                          >

                            {parking.status}

                          </span>

                          <span
                            className={`px-4 py-2 rounded-xl font-bold text-white ${
                              parking.availability ===
                              "Available"
                                ? "bg-green-500"
                                : "bg-red-500"
                            }`}
                          >

                            {parking.availability}

                          </span>

                          {parking.featured && (

                            <span className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold">

                              Featured

                            </span>

                          )}

                          {parking.verified && (

                            <span className="bg-blue-500 text-white px-4 py-2 rounded-xl font-bold">

                              Verified

                            </span>

                          )}

                        </div>

                        <h3 className="text-3xl font-bold mb-3">

                          {parking.title}

                        </h3>

                        <p className="text-gray-500 mb-3">

                          {parking.location}

                        </p>

                        <p className="text-green-600 font-bold text-2xl mb-4">

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
  Owner ID: {parking.ownerId || "N/A"}
</p>

<p className="text-gray-500">
  {parking.ownerEmail}
</p>

                          </div>

                        </div>

                      </div>

                      <textarea
  placeholder="Rejection Remarks..."
  value={remarks[parking.id] || ""}
  onChange={(e) =>
    setRemarks({
      ...remarks,
      [parking.id]: e.target.value,
    })
  }
  className="w-full border p-3 rounded-xl mt-4 h-24"
/>

                      {/* ACTIONS */}

                      <div className="flex flex-col gap-4">

                        {/* APPROVE */}

                        <button

                          onClick={async () => {

                            await updateDoc(

                              doc(
                                db,
                                "parkings",
                                parking.id
                              ),

                             {
  status: "Approved",
  availability: "Available",
}

                            );

                            if (
  parking.status !== "Approved"
) {

  await addDoc(
    collection(
      db,
      "notifications"
    ),
    {
      ownerEmail:
        parking.ownerEmail,

      title:
        "Listing Approved",

      message: `${parking.title} approved by admin`,

      createdAt:
        new Date(),

      read: false,
    }
  );

}

                            alert("Listing Approved Successfully");

                          }}

                          className={`px-6 py-4 rounded-2xl font-bold text-white ${
                            parking.status ===
                            "Approved"
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}

                        >

                         Approve Listing

                        </button>

                        {/* REJECT */}

<button
  onClick={async () => {
    if (!remarks[parking.id]?.trim()) {
      alert("Please enter rejection remarks.");
      return;
    }

    await updateDoc(
      doc(db, "parkings", parking.id),
      {
        status: "Rejected",
        availability: "Rejected",
        adminRemarks: remarks[parking.id],
      }
    );

    await addDoc(
      collection(db, "notifications"),
      {
        ownerId: parking.ownerId,
        title: "Listing Rejected",
        message: `${parking.title} was rejected by admin.`,
        createdAt: new Date(),
        read: false,
      }
    );

    alert("Listing Rejected");
  }}
  className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-bold"
>
  Reject Listing
</button>

                        {/* VERIFY */}

                        <button

                          onClick={async () => {

                            await updateDoc(

                              doc(
                                db,
                                "parkings",
                                parking.id
                              ),

                              {
                                verified:
                                  !parking.verified,
                              }

                            );

                            alert(
                              parking.verified
                                ? "Verification Removed"
                                : "Owner Verified"
                            );

                          }}

                          className={`px-6 py-4 rounded-2xl font-bold text-white ${
                            parking.verified
                              ? "bg-gray-500"
                              : "bg-blue-500"
                          }`}

                        >

                          {parking.verified
                            ? "Remove Verification"
                            : "Verify Owner"}

                        </button>

                        {/* FEATURED */}

                        <button

                          onClick={async () => {

                            await updateDoc(

                              doc(
                                db,
                                "parkings",
                                parking.id
                              ),

                              {
                                featured:
                                  !parking.featured,
                              }

                            );

                            alert(
                              parking.featured
                                ? "Featured Removed"
                                : "Listing Featured"
                            );

                          }}

                          className={`px-6 py-4 rounded-2xl font-bold text-white ${
                            parking.featured
                              ? "bg-gray-500"
                              : "bg-purple-600"
                          }`}

                        >

                          {parking.featured
                            ? "Remove Featured"
                            : "Make Featured"}

                        </button>

                        {/* DELETE */}

                        <button

                          onClick={async () => {

                            const confirmDelete =
                              confirm(
                                "Delete Listing?"
                              );

                            if (
                              !confirmDelete
                            )
                              return;

                            await deleteDoc(
                              doc(
                                db,
                                "parkings",
                                parking.id
                              )
                            );

                            alert(
                              "Listing Deleted"
                            );

                          }}

                          className="bg-red-500 text-white px-6 py-4 rounded-2xl font-bold"

                        >

                          Delete

                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

</div>

<div className="flex justify-center items-center gap-4 mt-8">

  <button
    disabled={listingPage === 1}
    onClick={() =>
      setListingPage(
        listingPage - 1
      )
    }
    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
  >
    Previous
  </button>

  <span className="font-bold">
    Showing {
      (listingPage - 1) *
        listingsPerPage +
      1
    }
    -
    {Math.min(
      listingPage *
        listingsPerPage,
      filteredListings.length
    )}{" "}
    of {filteredListings.length}
  </span>

  <button
    disabled={
      listingPage >=
      totalListingPages
    }
    onClick={() =>
      setListingPage(
        listingPage + 1
      )
    }
    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
  >
    Next
  </button>

</div>



</div>

</>

)}

        {activeSection === "users" && (
<>

{/* USERS MANAGEMENT */}

        

<div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

  <div className="mb-8">

  <div className="flex items-center justify-between mb-6">

    <h2 className="text-4xl font-bold">
      User Management
    </h2>

    <div className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold">
      {filteredUsers.length} Users
    </div>

  </div>

  <input
    type="text"
    placeholder="Search Name, Email, Phone, City"
    value={userSearch}
    onChange={(e) => {
      setUserSearch(e.target.value);
      setUserPage(1);
    }}
    className="border p-4 rounded-2xl w-full mb-6"
  />

  <div className="flex flex-wrap gap-3">
    {["All", "Customers", "Owners", "Admins", "Blocked"].map((tab) => (
      <button
        key={tab}
        onClick={() => {
          setUserTab(tab);
          setUserPage(1);
        }}
        className={`px-5 py-3 rounded-2xl font-bold ${
          userTab === tab
            ? "bg-blue-600 text-white"
            : "bg-gray-200"
        }`}
      >
        {tab} (
        {tab === "All"
          ? users.length
          : tab === "Customers"
          ? users.filter((u) => u.role === "customer" && u.isOwner !== true).length
          : tab === "Owners"
          ? users.filter((u) => u.isOwner === true || u.role === "owner").length
          : tab === "Admins"
          ? users.filter((u) => u.role === "admin").length
          : users.filter((u) => u.status === "Blocked").length}
        )
      </button>
    ))}
  </div>

</div>
  <div className="grid gap-6">

    {paginatedUsers.map((user) => (

      <div
        key={user.id}
        className="bg-gray-50 border rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6"
      >

        <div className="flex items-center gap-5">

          <img
            src={
              user.photoURL ||
              "https://ui-avatars.com/api/?name=User"
            }
            className="w-20 h-20 rounded-full object-cover"
          />

          <div>

            <h3 className="text-2xl font-bold">

              {user.name || "No Name"}

            </h3>

            <p className="text-gray-600">

              {user.email}

            </p>

            <p className="text-gray-500">
  ID: {user.userId || "N/A"}
</p>

            <p className="text-gray-500">

              {user.phone || "No Phone"}

            </p>

            <p className="text-gray-500">

              {user.city || "No City"}

            </p>

          </div>

        </div>

        <div className="flex flex-wrap gap-3">

          {user.role === "admin" && (

  <div className="bg-purple-600 text-white px-5 py-3 rounded-2xl font-bold">

    Administrator

  </div>

)}

          <span
            className={`px-5 py-3 rounded-2xl text-white font-bold ${
              user.status === "Blocked"
                ? "bg-red-500"
                : "bg-green-500"
            }`}
          >

            {user.status || "Active"}

          </span>

          <button

            onClick={async () => {

  if (
    user.role === "admin"
  ) {

    alert(
      "Admin accounts cannot be blocked"
    );

    return;

  }

  await updateDoc(

    doc(
      db,
      "users",
      user.id
    ),

    {
      status:
        user.status ===
        "Blocked"
          ? "Active"
          : "Blocked",
    }

  );

}}

            className={`px-6 py-3 rounded-2xl font-bold text-white ${
              user.status ===
              "Blocked"
                ? "bg-green-500"
                : "bg-orange-500"
            }`}

          >

            {user.status ===
            "Blocked"

              ? "Activate User"

              : "Block User"}

          </button>

          <button

            onClick={async () => {

  if (
    user.role === "admin"
  ) {

    alert(
      "Admin accounts cannot be deleted"
    );

    return;

  }

  const confirmDelete =
    confirm(
      "Delete User Profile?"
    );

  if (!confirmDelete)
    return;

  await deleteDoc(

                doc(
                  db,
                  "users",
                  user.id
                )

              );

              alert(
                "User Deleted"
              );

            }}

            className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold"

          >

            Delete User

          </button>

        </div>

      </div>

    ))}

  </div>

<div className="flex justify-center items-center gap-4 mt-8">

  <button
    disabled={userPage === 1}
    onClick={() =>
      setUserPage(userPage - 1)
    }
    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
  >
    Previous
  </button>

  <span className="font-bold">
    Showing {
      (userPage - 1) *
        usersPerPage +
      1
    }
    -
    {Math.min(
      userPage *
        usersPerPage,
      filteredUsers.length
    )}{" "}
    of {filteredUsers.length}
  </span>

  <button
    disabled={
      userPage >= totalUserPages
    }
    onClick={() =>
      setUserPage(userPage + 1)
    }
    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
  >
    Next
  </button>

</div>

</div>

</>
)}


{activeSection === "bookings" && (
<>

{/* BOOKINGS MANAGEMENT */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

 <div className="mb-8">

  <div className="flex items-center justify-between mb-6">
    <h2 className="text-4xl font-bold">
      Booking Management
    </h2>

    <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold">
      {filteredBookings.length} Bookings
    </div>
  </div>

  <input
    type="text"
    placeholder="Search Booking ID, Customer ID, Name, Email, Phone..."
    value={bookingSearch}
    onChange={(e) => {
      setBookingSearch(e.target.value);
      setBookingPage(1);
    }}
    className="border p-4 rounded-2xl w-full"
  />

</div>

  <div className="grid gap-6">

    {paginatedBookings.map((booking) => (

      <div
        key={booking.id}
        className="bg-gray-50 border rounded-3xl p-6"
      >

<div className="grid md:grid-cols-4 gap-8">

          <div>

            <p className="text-gray-500">
              Customer
            </p>

            <h3 className="font-bold text-xl">
              {booking.customerName || "Customer Name Not Available"}
            </h3>

<p className="break-words text-gray-600 max-w-xs">
  {booking.customerEmail || "Email Not Available"}
</p>

          </div>

          <div>

            <p className="text-gray-500">
              Parking
            </p>

            <h3 className="font-bold">
              {booking.parkingTitle || "Parking Name Not Available"}
            </h3>

            <p>
              {booking.parkingLocation || "Location Not Available"}
            </p>

          </div>

          <div>

            <p className="text-gray-500">
              Plan
            </p>

            <h3 className="font-bold">
              {booking.plan}
            </h3>

            <p>
              Valid Till:
              {booking.validTill}
            </p>

          </div>

          <div>

            <p className="text-gray-500">
              Payment
            </p>

            <h3 className="font-bold text-green-600">
              {booking.paymentStatus}
            </h3>

            <p>
              {booking.bookingDate?.seconds
  ? new Date(
      booking.bookingDate.seconds * 1000
    ).toLocaleString()
  : "N/A"}
            </p>

          </div>

        </div>

        <div className="mt-6">

          <button

            onClick={async () => {

              const confirmDelete =
                confirm(
                  "Cancel this booking?"
                );

              if (!confirmDelete)
                return;

              try {

                if (
                  booking.parkingId
                ) {

                  await updateDoc(

                    doc(
                      db,
                      "parkings",
                      booking.parkingId
                    ),

                    {
                      availability:
                        "Available",
                    }

                  );

                }

                await deleteDoc(

                  doc(
                    db,
                    "bookings",
                    booking.id
                  )

                );

                alert(
                  "Booking Cancelled"
                );

              } catch (error) {

                console.log(error);

              }

            }}

            className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold"

          >

            Cancel Booking

          </button>

        </div>

      </div>

    ))}

</div>

<div className="flex justify-center items-center gap-4 mt-8">

  <button
    disabled={bookingPage === 1}
    onClick={() =>
      setBookingPage(
        bookingPage - 1
      )
    }
    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
  >
    Previous
  </button>

  <span className="font-bold">
    Showing {
      (bookingPage - 1) *
        bookingsPerPage +
      1
    }
    -
    {Math.min(
      bookingPage *
        bookingsPerPage,
      filteredBookings.length
    )}{" "}
    of {filteredBookings.length}
  </span>

  <button
    disabled={
      bookingPage >=
      totalBookingPages
    }
    onClick={() =>
      setBookingPage(
        bookingPage + 1
      )
    }
    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
  >
    Next
  </button>

</div>

</div>

</>
)}

{activeSection === "payments" && (
<>
  <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

    <h2 className="text-4xl font-bold mb-8">
      💳 Payments & Refunds
    </h2>

    <p className="text-gray-500 mb-4">
  Payments collection records: {payments.length}
</p>

    {/* PAYMENT SUMMARY */}

    <div className="grid md:grid-cols-4 gap-6 mb-10">

      <div className="bg-green-100 p-6 rounded-3xl">
        <p className="text-gray-600">Customer Payments</p>
        <h2 className="text-3xl font-bold text-green-700">
          ₹{totalCustomerPayments}
        </h2>
      </div>

      <div className="bg-blue-100 p-6 rounded-3xl">
        <p className="text-gray-600">Platform Revenue</p>
        <h2 className="text-3xl font-bold text-blue-700">
          ₹{totalPlatformRevenue}
        </h2>
      </div>

      <div className="bg-red-100 p-6 rounded-3xl">
        <p className="text-gray-600">Pending Refunds</p>
        <h2 className="text-3xl font-bold text-red-700">
          {pendingRefunds.length}
        </h2>
      </div>

      <div className="bg-purple-100 p-6 rounded-3xl">
  <p className="text-gray-600">
    Refund History
  </p>

  <h2 className="text-3xl font-bold text-purple-700">
    {refundHistory.length}
  </h2>
</div>

      <div className="bg-yellow-100 p-6 rounded-3xl">
        <p className="text-gray-600">Pending Owner Payout</p>
        <h2 className="text-3xl font-bold text-yellow-700">
          ₹{pendingOwnerPayments}
        </h2>
      </div>

    </div>

    {/* REFUND REQUESTS */}

    <div className="bg-red-50 border border-red-300 rounded-3xl p-8 mb-12">

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-red-700">
          Refund Requests
        </h2>

        <div className="bg-red-600 text-white px-5 py-3 rounded-2xl font-bold">
          {pendingRefunds.length} Pending
        </div>
      </div>

      {pendingRefunds.length === 0 ? (
        <p className="text-gray-500">
          No refund requests pending.
        </p>
      ) : (
        <>
          <div className="grid gap-6">
            {visibleRefunds.map((booking) => (
              <div
                key={booking.id}
                className="bg-white border rounded-3xl p-6"
              >
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className="text-2xl font-bold">
                      Booking: {booking.bookingId}
                    </h3>
                    <p className="text-gray-500">
                      Cancelled On:{" "}
                      {booking.cancelledAt?.seconds
                        ? new Date(booking.cancelledAt.seconds * 1000).toLocaleString()
                        : booking.cancelledAt
                        ? new Date(booking.cancelledAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>

                  <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-xl font-bold">
                    {booking.refundStatus || "Pending"}
                  </span>
                </div>

                <div className="grid md:grid-cols-3 gap-6">

                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-bold text-blue-700 mb-3">
                      👤 Customer Details
                    </h4>
                    <p><b>Name:</b> {booking.customerName || "N/A"}</p>
                    <p><b>Phone:</b> {booking.customerPhone || "N/A"}</p>
                    <p><b>Email:</b> {booking.customerEmail || "N/A"}</p>
                    <p><b>Customer ID:</b> {booking.customerId || "N/A"}</p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-bold text-purple-700 mb-3">
                      🅿️ Parking Details
                    </h4>
                    <p><b>Parking:</b> {booking.parkingTitle || "N/A"}</p>
                    <p><b>Parking ID:</b> {booking.parkingId || "N/A"}</p>
                    <p><b>Owner:</b> {booking.ownerName || "N/A"}</p>
                    <p><b>Plan:</b> {booking.plan || "N/A"}</p>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-2xl">
                    <h4 className="font-bold text-green-700 mb-3">
                      💰 Refund Details
                    </h4>
                    <p><b>Customer Paid:</b> ₹{booking.customerPaidAmount || 0}</p>
                    <p><b>Parking Amount:</b> ₹{booking.parkingAmount || 0}</p>
                    <p><b>Platform Fee:</b> ₹{booking.platformFeeAmount || 0}</p>
                    <p className="break-all mt-2">
  <b>Payment ID:</b>{" "}
  {booking.razorpayPaymentId ||
    "Not Available"}
</p>

<p className="break-all">
  <b>Refund ID:</b>{" "}
  {booking.razorpayRefundId ||
    "Not Generated"}
</p>



<p className="break-all">
  <b>Order ID:</b>{" "}
  {booking.razorpayOrderId || "Not Available"}
</p>
                    <p className="text-red-600 font-bold">
                      Refund Amount: ₹{booking.refundAmount || booking.parkingAmount || 0}
                    </p>
                    <p className="text-gray-500 text-sm">
                      Platform fee is non-refundable.
                    </p>
                  </div>

                </div>

                <button
  onClick={async () => {
    const paymentId =
      booking.razorpayPaymentId || "";

    const refundAmount = Number(
      booking.refundAmount ||
      booking.parkingAmount ||
      0
    );

    const bookingDocumentId =
      booking.bookingDocumentId || "";

    if (!paymentId) {
      alert(
        "Razorpay Payment ID is not available. Automatic refund cannot be processed."
      );
      return;
    }

    if (!bookingDocumentId) {
      alert(
        "Linked booking document ID is not available. Refund cannot be synchronized."
      );
      return;
    }

    if (refundAmount <= 0) {
      alert("Invalid refund amount.");
      return;
    }

    const confirmRefund = confirm(
      `Process refund of ₹${refundAmount}?\n\nPlatform fee will not be refunded.`
    );

    if (!confirmRefund) return;

    try {
      // Mark payment transaction as processing
      await updateDoc(
        doc(db, "payments", booking.id),
        {
          refundStatus: "Processing",
          paymentStatus: "Refund Processing",
          refundRequestedAt: new Date(),
          updatedAt: new Date(),
        }
      );

      // Keep booking document synchronized
      await updateDoc(
        doc(db, "bookings", bookingDocumentId),
        {
          refundStatus: "Processing",
          paymentStatus: "Refund Processing",
          refundRequestedAt: new Date(),
        }
      );

      const response = await fetch(
        "/api/refund",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            paymentId,
            amount: refundAmount,
            bookingId:
              booking.bookingId ||
              bookingDocumentId,
          }),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        const failureData = {
          refundStatus: "Failed",
          paymentStatus: "Refund Failed",
          refundFailedAt: new Date(),
          refundFailureReason:
            result.message ||
            "Refund failed",
          updatedAt: new Date(),
        };

        await updateDoc(
          doc(db, "payments", booking.id),
          failureData
        );

        await updateDoc(
          doc(db, "bookings", bookingDocumentId),
          {
            refundStatus: "Failed",
            paymentStatus: "Refund Failed",
            refundFailedAt: new Date(),
            refundFailureReason:
              result.message ||
              "Refund failed",
          }
        );

        alert(
          result.message ||
          "Unable to process refund."
        );

        return;
      }

      const refund = result.refund;

      const finalRefundStatus =
        refund.status === "processed"
          ? "Completed"
          : "Processing";

      const finalPaymentStatus =
        refund.status === "processed"
          ? "Refunded"
          : "Refund Processing";

      const paymentRefundData = {
        refundStatus:
          finalRefundStatus,

        paymentStatus:
          finalPaymentStatus,

        refundAmount,

        razorpayRefundId:
          refund.id || "",

        refundPaymentId:
          refund.payment_id ||
          paymentId,

        refundSpeed:
          refund.speed_processed ||
          refund.speed_requested ||
          "normal",

        refundReference:
          refund.id || "",

        refundRequestedAt:
          new Date(),

        refundProcessedAt:
          refund.status === "processed"
            ? new Date()
            : null,

        platformFeeRefunded:
          false,

        refundRemarks:
          "Parking amount refunded through Razorpay. Platform fee was not refunded.",

        updatedAt:
          new Date(),
      };

      // Update payments collection
      await updateDoc(
        doc(db, "payments", booking.id),
        paymentRefundData
      );

      // Update linked booking document
      await updateDoc(
        doc(db, "bookings", bookingDocumentId),
        {
          refundStatus:
            finalRefundStatus,

          paymentStatus:
            finalPaymentStatus,

          refundAmount,

          razorpayRefundId:
            refund.id || "",

          refundPaymentId:
            refund.payment_id ||
            paymentId,

          refundSpeed:
            refund.speed_processed ||
            refund.speed_requested ||
            "normal",

          refundReference:
            refund.id || "",

          refundRequestedAt:
            new Date(),

          refundProcessedAt:
            refund.status === "processed"
              ? new Date()
              : null,

          platformFeeRefunded:
            false,

          refundRemarks:
            "Parking amount refunded through Razorpay. Platform fee was not refunded.",
        }
      );

      alert(
        refund.status === "processed"
          ? `Refund completed successfully.\nRefund ID: ${refund.id}`
          : `Refund initiated successfully.\nRefund ID: ${refund.id}\nCurrent status: ${refund.status}`
      );
    } catch (error: any) {
      console.error(
        "Refund processing error:",
        error
      );

      const errorMessage =
        error?.message ||
        "Unknown refund error";

      await updateDoc(
        doc(db, "payments", booking.id),
        {
          refundStatus: "Failed",
          paymentStatus: "Refund Failed",
          refundFailedAt: new Date(),
          refundFailureReason:
            errorMessage,
          updatedAt: new Date(),
        }
      );

      if (bookingDocumentId) {
        await updateDoc(
          doc(
            db,
            "bookings",
            bookingDocumentId
          ),
          {
            refundStatus: "Failed",
            paymentStatus: "Refund Failed",
            refundFailedAt:
              new Date(),
            refundFailureReason:
              errorMessage,
          }
        );
      }

      alert(errorMessage);
    }
  }}
  disabled={
    booking.refundStatus ===
      "Processing" ||
    booking.refundStatus ===
      "Completed"
  }
  className={`mt-6 px-6 py-3 rounded-2xl font-bold text-white ${
    booking.refundStatus ===
      "Processing" ||
    booking.refundStatus ===
      "Completed"
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-green-600 hover:bg-green-700"
  }`}
>
  {booking.refundStatus ===
  "Processing"
    ? "Refund Processing..."
    : booking.refundStatus ===
      "Completed"
    ? "Refund Completed"
    : "Process Refund"}
</button>

              </div>
            ))}
          </div>

          {pendingRefunds.length > 3 && (
            <button
              onClick={() => setShowAllRefunds(!showAllRefunds)}
              className="mt-6 bg-black text-white px-6 py-3 rounded-2xl font-bold"
            >
              {showAllRefunds ? "Show Less" : "View All Refund Requests"}
            </button>
          )}
        </>
      )}

    </div>

    {/* REFUND HISTORY */}

<div className="bg-purple-50 border border-purple-300 rounded-3xl p-8 mb-12">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-3xl font-bold text-purple-700">
      Refund History
    </h2>

    <div className="bg-purple-600 text-white px-5 py-3 rounded-2xl font-bold">
      {refundHistory.length} Refunds
    </div>

  </div>

  {refundHistory.length === 0 ? (

    <p className="text-gray-500">
      No processed refunds found.
    </p>

  ) : (

    <>

      <div className="overflow-x-auto">

        <table className="w-full bg-white rounded-2xl overflow-hidden">

          <thead>

            <tr className="bg-gray-100">

              <th className="p-4 text-left">
                Booking
              </th>

              <th className="p-4 text-left">
                Customer
              </th>

              <th className="p-4 text-left">
                Payment ID
              </th>

              <th className="p-4 text-left">
                Refund ID
              </th>

              <th className="p-4 text-left">
                Amount
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Processed On
              </th>

            </tr>

          </thead>

          <tbody>

            {visibleRefundHistory.map((booking) => (

              <tr
                key={booking.id}
                className="border-b"
              >

                <td className="p-4">

                  <p className="font-bold">
                    {booking.bookingId || "N/A"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {booking.parkingTitle || ""}
                  </p>

                </td>

                <td className="p-4">

                  <p className="font-bold">
                    {booking.customerName || "N/A"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {booking.customerPhone || ""}
                  </p>

                </td>

                <td className="p-4 break-all text-sm">

                  {booking.razorpayPaymentId ||
                    booking.refundPaymentId ||
                    "Not Available"}

                </td>

                <td className="p-4 break-all text-sm">

                  {booking.razorpayRefundId ||
                    booking.refundReference ||
                    "Not Available"}

                </td>

                <td className="p-4 font-bold text-red-600">

                  ₹{booking.refundAmount ||
                    booking.parkingAmount ||
                    0}

                </td>

                <td className="p-4">

                  <span
                    className={`px-3 py-1 rounded-full font-bold ${
                      booking.refundStatus === "Completed"
                        ? "bg-green-100 text-green-700"
                        : booking.refundStatus === "Failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >

                    {booking.refundStatus ||
                      booking.paymentStatus ||
                      "Unknown"}

                  </span>

                </td>

                <td className="p-4">

                  {booking.refundProcessedAt?.seconds
                    ? new Date(
                        booking.refundProcessedAt.seconds *
                          1000
                      ).toLocaleString()
                    : booking.refundCompletedAt?.seconds
                    ? new Date(
                        booking.refundCompletedAt.seconds *
                          1000
                      ).toLocaleString()
                    : booking.refundProcessedAt
                    ? new Date(
                        booking.refundProcessedAt
                      ).toLocaleString()
                    : booking.refundCompletedAt
                    ? new Date(
                        booking.refundCompletedAt
                      ).toLocaleString()
                    : booking.refundRequestedAt?.seconds
                    ? new Date(
                        booking.refundRequestedAt.seconds *
                          1000
                      ).toLocaleString()
                    : "N/A"}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      {refundHistory.length > 5 && (

        <button
          onClick={() =>
            setShowAllRefundHistory(
              !showAllRefundHistory
            )
          }
          className="mt-6 bg-black text-white px-6 py-3 rounded-2xl font-bold"
        >

          {showAllRefundHistory
            ? "Show Less"
            : "View All Refund History"}

        </button>

      )}

    </>

  )}

</div>

    {/* OWNER PAYOUTS */}

    <div className="bg-blue-50 border border-blue-300 rounded-3xl p-8">

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-blue-700">
          Owner Payout Management
        </h2>

        <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold">
          {ownerPayouts.length} Payouts
        </div>
      </div>

      <div className="overflow-x-auto">

        <table className="w-full bg-white rounded-2xl overflow-hidden">

          <thead>
            <tr className="bg-gray-100">
              <th className="p-4 text-left">Booking</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Owner</th>
              <th className="p-4 text-left">Parking</th>
              <th className="p-4 text-left">Owner Receives</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Reference</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {visibleOwnerPayouts.map((booking) => (
              <tr key={booking.id} className="border-b">

                <td className="p-4 font-semibold">
                  {booking.bookingId}
                </td>

                <td className="p-4">
                  <p className="font-bold">{booking.customerName || "N/A"}</p>
                  <p className="text-sm text-gray-500">{booking.customerPhone || ""}</p>
                </td>

                <td className="p-4">
                  <p className="font-bold">{booking.ownerName || "N/A"}</p>
                  <p className="text-sm text-gray-500">{booking.ownerPhone || ""}</p>
                  <p className="text-sm text-gray-500">{booking.ownerEmail || ""}</p>
                </td>

                <td className="p-4">
                  <p className="font-bold">{booking.parkingTitle || "N/A"}</p>
                  <p className="text-sm text-gray-500">{booking.parkingId || ""}</p>
                </td>

                <td className="p-4 text-blue-700 font-bold">
                  ₹{booking.ownerReceivableAmount || 0}
                </td>

                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full font-bold ${
                      booking.ownerPayoutStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {booking.ownerPayoutStatus === "Paid"
                      ? "✅ Paid"
                      : "🟡 Pending"}
                  </span>
                </td>

                <td className="p-4 font-mono text-sm">
                 {booking.ownerPayoutReference ||
  booking.paymentReference ||
  "-"}
                </td>

                <td className="p-4">
                  <button
disabled={
  booking.ownerPayoutStatus === "Paid" ||
  !(
    booking.bookingStatus === "Completed" ||
    booking.bookingStatus === "Cancelled After Approval"
  )
}
                    onClick={async () => {
                      const utr = prompt(
                        "Enter UTR / Transaction Reference Number"
                      );

                      if (!utr) {
                        alert("UTR is required.");
                        return;
                      }

                      const confirmPayment = confirm(
                        `Release ₹${booking.ownerReceivableAmount} to ${booking.ownerName}?`
                      );

                      if (!confirmPayment) return;

                      const paidAt = new Date();

const bookingDocumentId =
  booking.bookingDocumentId || "";

if (!bookingDocumentId) {
  alert(
    "Linked booking document ID is missing. Payout cannot be synchronized."
  );
  return;
}

// Update payment transaction
await updateDoc(
  doc(db, "payments", booking.id),
  {
    ownerPayoutStatus: "Paid",
    ownerPaidAt: paidAt,
    ownerPaidDate: paidAt,
    ownerPayoutReference: utr,
    paymentReference: utr,
    updatedAt: paidAt,
  }
);

// Update linked booking
await updateDoc(
  doc(
    db,
    "bookings",
    bookingDocumentId
  ),
  {
    ownerPayoutStatus: "Paid",
    ownerPaidAt: paidAt,
    ownerPaidDate: paidAt,
    ownerPayoutReference: utr,
    paymentReference: utr,
  }
);

alert(
  "Owner payout marked as paid successfully."
);
                    }}
                    className={`px-4 py-2 rounded-xl text-white font-bold ${
booking.ownerPayoutStatus === "Paid" ||
!(
  booking.bookingStatus === "Completed" ||
  booking.bookingStatus === "Cancelled After Approval"
)
  ? "bg-gray-400"
  : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
{booking.ownerPayoutStatus === "Paid"
  ? "Paid"
  : booking.bookingStatus === "Completed" ||
    booking.bookingStatus === "Cancelled After Approval"
  ? "Release Payment"
  : "Not Eligible"}
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {ownerPayouts.length > 5 && (
        <button
          onClick={() => setShowAllPayouts(!showAllPayouts)}
          className="mt-6 bg-black text-white px-6 py-3 rounded-2xl font-bold"
        >
          {showAllPayouts ? "Show Less" : "View All Owner Payouts"}
        </button>
      )}

    </div>

  </div>
</>
)}

{activeSection === "ownerApplications" && (

<div className="bg-white rounded-3xl shadow-xl p-8">

<h2 className="text-4xl font-bold mb-8">
🏢 Owner Applications
</h2>

<div className="overflow-x-auto">

<table className="w-full">

<thead>

<tr className="bg-gray-100">

<th className="p-4 text-left">Owner</th>

<th className="p-4 text-left">Email</th>

<th className="p-4 text-left">Phone</th>

<th className="p-4 text-left">Status</th>

<th className="p-4 text-left">Action</th>

</tr>

</thead>

<tbody>

{ownerApplications.map((owner) => (

<tr
key={owner.id}
className="border-b"
>

<td className="p-4 font-semibold">
  {owner.userName}
</td>

<td className="p-4">
  {owner.userEmail}
</td>

<td className="p-4">
  {owner.userPhone}
</td>

<td className="p-4">

<span
className={`px-3 py-1 rounded-full font-bold ${
owner.status === "Approved"
? "bg-green-100 text-green-700"
: owner.status === "Rejected"
? "bg-red-100 text-red-700"
: "bg-yellow-100 text-yellow-700"
}`}
>

{owner.status}

</span>

</td>

<td className="p-4">

<button
  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl"
  onClick={async () => {

    const confirmApprove = confirm(
      `Approve ${owner.userName} as Parking Owner?`
    );

    if (!confirmApprove) return;

    try {

      await updateDoc(
  doc(db, "ownerApplications", owner.id),
  {
    status: "Approved",
    approvedAt: new Date(),
  }
);

await updateDoc(
  doc(db, "users", owner.userUid),
  {
    isOwner: true,
    ownerStatus: "Approved",
  }
);

      alert("Owner Approved Successfully.");

    } catch (error) {

      console.error(error);

      alert("Unable to approve owner.");

    }

  }}
>
  Approve
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)}

{activeSection === "tickets" && (
<>

{/* SUPPORT TICKETS */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

  <div className="flex items-center justify-between mb-8">

<div className="flex items-center gap-4">

  <h2 className="text-4xl font-bold">
    Support Tickets
  </h2>

  <select
    value={ticketCategoryFilter}
    onChange={(e) =>
      setTicketCategoryFilter(
        e.target.value
      )
    }
    className="border p-2 rounded-xl"
  >

    <option>All</option>
    <option>Booking Issue</option>
    <option>Payment Issue</option>
    <option>Refund Request</option>
    <option>Login Issue</option>
    <option>Listing Issue</option>
    <option>Complaint</option>
    <option>Technical Issue</option>

  </select>

  <input
  type="text"
  placeholder="Search Ticket ID, User, Email..."
  value={ticketSearch}
  onChange={(e) => {
    setTicketSearch(
      e.target.value
    );
    setTicketPage(1);
  }}
  className="border p-2 rounded-xl w-80"
/>

</div>

    <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold">

      {tickets.length} Tickets

    </div>

  </div>

  <div className="grid gap-6">

  {paginatedTickets.map((ticket) => (

      <div

        key={ticket.id}

        className="bg-gray-50 border rounded-3xl p-6"

      >

        <div className="flex justify-between items-start">

          <div>

            <h3 className="text-2xl font-bold">
  {ticket.subject}
</h3>

<p className="text-gray-500">
  Ticket ID :
  {ticket.ticketId}
</p>

<p className="text-gray-500">
  User :
  {ticket.userName}
</p>

<p className="text-gray-500">
  Email :
  {ticket.userEmail}
</p>

<p className="text-gray-500">
  Priority :
  {ticket.priority}
</p>

<div className="mt-2">

  <span
    className="
      bg-blue-100
      text-blue-700
      px-3
      py-1
      rounded-full
      text-sm
      font-bold
    "
  >
    {ticket.category || "General"}
  </span>

</div>

            <p className="mt-4">

              {ticket.message}

            </p>

            <div className="mt-5">

  <h4 className="font-bold mb-2">
    Admin Remarks
  </h4>

  <textarea
    value={
      remarks[ticket.id] ??
      ticket.adminRemarks ??
      ""
    }
    onChange={(e) =>
      setRemarks({
        ...remarks,
        [ticket.id]:
          e.target.value,
      })
    }
    className="w-full border p-3 rounded-xl h-24"
  />

</div>

          </div>

          <select
  value={ticket.status || "Open"}
  onChange={async (e) => {

    await updateDoc(
      doc(
        db,
        "supportTickets",
        ticket.id
      ),
      {
        status:
          e.target.value,
      }
    );

  }}
  className="border p-3 rounded-xl"
>

  <option>
    Open
  </option>

  <option>
    In Progress
  </option>

  <option>
    Waiting For Customer
  </option>

  <option>
    Resolved
  </option>

</select>

        </div>

       <div className="flex flex-wrap gap-4 mt-6">

          <button

            onClick={async () => {

              await updateDoc(

                doc(
                  db,
                  "supportTickets",
                  ticket.id
                ),

                {
                  status:
                    "Resolved",
                }

              );

            }}

            className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold"

          >

            Mark Resolved

          </button>

<button

  onClick={async () => {

    await updateDoc(

      doc(
        db,
        "supportTickets",
        ticket.id
      ),

      {
        adminRemarks:
          remarks[ticket.id] ||
          "",
      }

    );

    alert(
      "Remarks Updated"
    );

  }}

  className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold"

>

  Save Remarks

</button>

          <button

            onClick={async () => {

              await deleteDoc(

                doc(
                  db,
                  "supportTickets",
                  ticket.id
                )

              );

            }}

            className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold"

          >

            Delete Ticket

          </button>

        </div>

      </div>

    ))}

  </div>

<div className="flex justify-center items-center gap-4 mt-8">

  <button
    disabled={ticketPage === 1}
    onClick={() =>
      setTicketPage(ticketPage - 1)
    }
    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
  >
    Previous
  </button>

<span className="font-bold">
  Showing {
    (ticketPage - 1) *
      ticketsPerPage +
    1
  }
  -
  {Math.min(
    ticketPage *
      ticketsPerPage,
    filteredTickets.length
  )}{" "}
  of {filteredTickets.length}
</span>

  <button
    disabled={
      ticketPage >= totalTicketPages
    }
    onClick={() =>
      setTicketPage(ticketPage + 1)
    }
    className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
  >
    Next
  </button>

</div>

</div>

</>
)}

      </div>

    </div>

  </div>

  );

}