"use client";

import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
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

  const router = useRouter();

  const auth = getAuth();

  // ADMIN AUTH

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(

        auth,

        (currentUser) => {

          if (!currentUser) {

            router.push("/login");

            return;

          }

          if (
            currentUser.email ===
            "akhilnaidu19@gmail.com"
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

  const totalRevenue =
    bookings.reduce(

      (acc, item) => {

        if (
          item.plan === "Yearly"
        ) {

          return acc + 30000;

        }

        return (
  acc +
  Number(
    item.amount || 0
  )
);

      },

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
      value: totalRevenue,
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

    <div className="min-h-screen bg-gray-100">

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

        {/* STATS */}

        <div className="grid md:grid-cols-6 gap-6 mb-10">

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

              Revenue

            </p>

            <h2 className="text-5xl font-bold">

              ₹{totalRevenue}

            </h2>

          </div>

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
            onChange={(e) =>
              setFilter(
                e.target.value
              )
            }
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

            {parkings

              .filter((parking) => {

                const matchesSearch =
                  parking.title
                    ?.toLowerCase()
                    .includes(
                      search.toLowerCase()
                    );

                const matchesFilter =

                  filter === "All"

                    ? true

                    : filter ===
                      "Pending"

                    ? parking.status ===
                      "Pending"

                    : filter ===
                      "Approved"

                    ? parking.status ===
                      "Approved"

                    : parking.availability ===
                      filter;

                return (
                  matchesSearch &&
                  matchesFilter
                );

              })

              .map((parking) => (

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

        </div>
        </div>

        {/* USERS MANAGEMENT */}

        

<div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-4xl font-bold">

      User Management

    </h2>

    <div className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold">

      {users.length} Users

    </div>

  </div>

  <div className="grid gap-6">

    {users.map((user) => (

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

{/* BOOKINGS MANAGEMENT */}

<div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-4xl font-bold">

      Booking Management

    </h2>

    <div className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold">

      {bookings.length} Bookings

    </div>

  </div>

  <div className="grid gap-6">

    {bookings.map((booking) => (

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
              {booking.bookingDate}
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

</div>

      </div>

    </div>

  );

}