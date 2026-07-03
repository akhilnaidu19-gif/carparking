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

  const [notification, setNotification] =
    useState("");

    const [tickets, setTickets] =
  useState<any[]>([]);

  const [activeSection, setActiveSection] =
  useState("dashboard");

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

const userData =
  userDoc.data();

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
  bookings.reduce(
    (acc, booking) =>
      acc +
      Number(
        booking.customerPaidAmount || 0
      ),
    0
  );

const totalPlatformRevenue =
  bookings.reduce(
    (acc, booking) =>
      acc +
      Number(
        booking.platformFeeAmount || 0
      ),
    0
  );

const pendingOwnerPayout =
  bookings
    .filter(
      (booking) =>
        booking.ownerPayoutStatus !==
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

const completedOwnerPayout =
  bookings
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
        );

    return (
      categoryMatch &&
      searchMatch
    );
  }

  
);

const filteredUsers = users.filter(
  (user) => {

    return (

      (user.name || "")
        .toLowerCase()
        .includes(
          userSearch.toLowerCase()
        ) ||

      (user.email || "")
        .toLowerCase()
        .includes(
          userSearch.toLowerCase()
        ) ||

      (user.phone || "")
        .toLowerCase()
        .includes(
          userSearch.toLowerCase()
        ) ||

      (user.city || "")
        .toLowerCase()
        .includes(
          userSearch.toLowerCase()
        )

    );

  }
);

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

    return (

      (booking.name || "")
        .toLowerCase()
        .includes(
          bookingSearch.toLowerCase()
        ) ||

      (booking.email || "")
        .toLowerCase()
        .includes(
          bookingSearch.toLowerCase()
        ) ||

      (booking.title || "")
        .toLowerCase()
        .includes(
          bookingSearch.toLowerCase()
        ) ||

      (booking.location || "")
        .toLowerCase()
        .includes(
          bookingSearch.toLowerCase()
        )

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

  const filteredListings =
  parkings.filter((parking) => {

    const matchesSearch =

      (parking.title || "")
        .toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||

      (parking.location || "")
        .toLowerCase()
        .includes(
          search.toLowerCase()
        ) ||

      (parking.ownerName || "")
        .toLowerCase()
        .includes(
          search.toLowerCase()
        );

    const matchesFilter =

      filter === "All"

        ? true

        : filter === "Pending"

        ? parking.status ===
          "Pending"

        : filter === "Approved"

        ? parking.status ===
          "Approved"

        : parking.availability ===
          filter;

    return (
      matchesSearch &&
      matchesFilter
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
    ₹{pendingOwnerPayout}
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

          <select
            value={filter}
            onChange={(e) => {

  setFilter(
    e.target.value
  );

  setListingPage(1);

}}
            className="border p-4 rounded-2xl"
          >

            <option>
              All
            </option>

            <option>
              Available
            </option>

            <option>
              Occupied
            </option>

            <option>
              Pending
            </option>

            <option>
              Approved
            </option>

          </select>

        </div>

        {/* LISTINGS */}

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

          <h2 className="text-4xl font-bold mb-8">

            Parking Listings

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
                              parking.status ===
                              "Approved"
                                ? "bg-green-500"
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

                              {parking.ownerEmail}

                            </p>

                          </div>

                        </div>

                      </div>

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
                                status:
                                  parking.status ===
                                  "Approved"
                                    ? "Pending"
                                    : "Approved",
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

                            alert(
                              parking.status ===
                                "Approved"
                                ? "Moved To Pending"
                                : "Listing Approved"
                            );

                          }}

                          className={`px-6 py-4 rounded-2xl font-bold text-white ${
                            parking.status ===
                            "Approved"
                              ? "bg-orange-500"
                              : "bg-green-500"
                          }`}

                        >

                          {parking.status ===
                          "Approved"
                            ? "Move To Pending"
                            : "Approve Listing"}

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

  <div className="flex items-center justify-between mb-8">

<div className="flex items-center gap-4">

  <h2 className="text-4xl font-bold">

    User Management

  </h2>

  <input
    type="text"
    placeholder="Search Name, Email, Phone, City"
    value={userSearch}
    onChange={(e) => {

      setUserSearch(
        e.target.value
      );

      setUserPage(1);

    }}
    className="border p-2 rounded-xl w-96"
  />

</div>

    <div className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold">

      {users.length} Users

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

  <div className="flex items-center justify-between mb-8">

<div className="flex items-center gap-4">

  <h2 className="text-4xl font-bold">

    Booking Management

  </h2>

  <input
    type="text"
    placeholder="Search Booking..."
    value={bookingSearch}
    onChange={(e) => {

      setBookingSearch(
        e.target.value
      );

      setBookingPage(1);

    }}
    className="border p-2 rounded-xl w-96"
  />

</div>

    <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold">

      {bookings.length} Bookings

    </div>

  </div>

  <div className="grid gap-6">

    {paginatedBookings.map((booking) => (

      <div
        key={booking.id}
        className="bg-gray-50 border rounded-3xl p-6"
      >

        <div className="grid md:grid-cols-4 gap-6">

          <div>

            <p className="text-gray-500">
              Customer
            </p>

            <h3 className="font-bold text-xl">
              {booking.name}
            </h3>

            <p>
              {booking.email}
            </p>

          </div>

          <div>

            <p className="text-gray-500">
              Parking
            </p>

            <h3 className="font-bold">
              {booking.title}
            </h3>

            <p>
              {booking.location}
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

    <div className="flex items-center justify-between mb-8">

      <h2 className="text-4xl font-bold">
        💳 Payment Management
      </h2>

      <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold">
        {bookings.length} Payments
      </div>

    </div>

    <div className="overflow-x-auto">

      <table className="w-full">

        <thead>

          <tr className="bg-gray-100">

            <th className="p-4 text-left">
              Booking ID
            </th>

            <th className="p-4 text-left">
              Customer
            </th>

            <th className="p-4 text-left">
              Customer Paid
            </th>

            <th className="p-4 text-left">
              Platform Fee
            </th>

            <th className="p-4 text-left">
              Owner Receives
            </th>

            <th className="p-4 text-left">
              Payment Status
            </th>

            <th className="p-4 text-left">
  UTR
</th>

<th className="p-4 text-left">
  Paid On
</th>

            <th className="p-4 text-left">
              Action
            </th>

          </tr>

        </thead>

        <tbody>

          {bookings.map((booking) => (

            <tr
              key={booking.id}
              className="border-b"
            >

              <td className="p-4">
                {booking.bookingId}
              </td>

              <td className="p-4">
                {booking.name}
              </td>

              <td className="p-4 font-bold text-black">
                ₹{booking.customerPaidAmount || 0}
              </td>

              <td className="p-4 text-green-600 font-bold">
                ₹{booking.platformFeeAmount || 0}
              </td>

              <td className="p-4 text-blue-600 font-bold">
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
  {booking.paymentReference || "-"}
</td>

<td className="p-4">
  {booking.ownerPaidDate
    ? new Date(
        booking.ownerPaidDate.seconds
          ? booking.ownerPaidDate.seconds * 1000
          : booking.ownerPaidDate
      ).toLocaleDateString()
    : "-"}
</td>

              <td className="p-4">

               <button
  className={`px-4 py-2 rounded-xl text-white font-bold ${
    booking.ownerPayoutStatus === "Paid"
      ? "bg-gray-500"
      : "bg-green-600 hover:bg-green-700"
  }`}
disabled={
  booking.ownerPayoutStatus === "Paid" ||
  booking.bookingStatus !== "Completed"
}
  onClick={async () => {

    if (booking.ownerPayoutStatus === "Paid") {
      return;
    }

const utr = prompt(
  "Enter UTR / Transaction Reference Number"
);

if (!utr) {
  alert("UTR is required.");
  return;
}

const confirmPayment = confirm(
  `Release ₹${booking.ownerReceivableAmount} to the parking owner?`
);

if (!confirmPayment) return;

    try {

await updateDoc(
  doc(db, "bookings", booking.id),
  {
    ownerPayoutStatus: "Paid",
    paymentStatus: "Paid",
    ownerPaidDate: new Date(),
    paymentReference: utr,
  }
);

      alert("Payment Released Successfully.");

    } catch (error) {

      console.error(error);

      alert("Unable to release payment.");

    }

  }}
>
{
  booking.ownerPayoutStatus === "Paid"
    ? "Paid"
    : booking.bookingStatus !== "Completed"
    ? "Not Eligible"
    : "Release Payment"
}
</button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

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