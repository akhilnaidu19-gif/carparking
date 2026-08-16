"use client";

import { useState } from "react";
import {
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type UsersProps = {
  users: any[];
};

export default function Users({
  users,
}: UsersProps) {
  const [userSearch, setUserSearch] =
    useState("");

  const [userTab, setUserTab] =
    useState("All");

  const [userPage, setUserPage] =
    useState(1);

  const usersPerPage = 10;

  const filteredUsers = users.filter(
    (user) => {
      const searchValue =
        userSearch.toLowerCase();

      const searchMatch =
        (user.name || "")
          .toLowerCase()
          .includes(searchValue) ||
        (user.email || "")
          .toLowerCase()
          .includes(searchValue) ||
        (user.phone || "")
          .toLowerCase()
          .includes(searchValue) ||
        (user.city || "")
          .toLowerCase()
          .includes(searchValue) ||
        (user.userId || "")
          .toLowerCase()
          .includes(searchValue);

      const tabMatch =
        userTab === "All"
          ? true
          : userTab === "Customers"
          ? user.role === "customer" &&
            user.isOwner !== true
          : userTab === "Owners"
          ? user.isOwner === true ||
            user.role === "owner"
          : userTab === "Admins"
          ? user.role === "admin"
          : user.status === "Blocked";

      return searchMatch && tabMatch;
    }
  );

  const totalUserPages = Math.ceil(
    filteredUsers.length / usersPerPage
  );

  const paginatedUsers =
    filteredUsers.slice(
      (userPage - 1) * usersPerPage,
      userPage * usersPerPage
    );

  const getTabCount = (
    tab: string
  ) => {
    if (tab === "All") {
      return users.length;
    }

    if (tab === "Customers") {
      return users.filter(
        (user) =>
          user.role === "customer" &&
          user.isOwner !== true
      ).length;
    }

    if (tab === "Owners") {
      return users.filter(
        (user) =>
          user.isOwner === true ||
          user.role === "owner"
      ).length;
    }

    if (tab === "Admins") {
      return users.filter(
        (user) =>
          user.role === "admin"
      ).length;
    }

    return users.filter(
      (user) =>
        user.status === "Blocked"
    ).length;
  };

  const handleBlockUser = async (
    user: any
  ) => {
    try {
      if (user.role === "admin") {
        alert(
          "Admin accounts cannot be blocked"
        );

        return;
      }

      const newStatus =
        user.status === "Blocked"
          ? "Active"
          : "Blocked";

      await updateDoc(
        doc(
          db,
          "users",
          user.id
        ),
        {
          status: newStatus,
          updatedAt: new Date(),
        }
      );

      alert(
        newStatus === "Blocked"
          ? "User Blocked Successfully"
          : "User Activated Successfully"
      );
    } catch (error) {
      console.error(
        "Unable to update user:",
        error
      );

      alert(
        "Unable to update user status"
      );
    }
  };

  const handleDeleteUser = async (
    user: any
  ) => {
    try {
      if (user.role === "admin") {
        alert(
          "Admin accounts cannot be deleted"
        );

        return;
      }

      const confirmDelete = confirm(
        `Delete ${
          user.name || "this user"
        }'s profile?`
      );

      if (!confirmDelete) {
        return;
      }

      await deleteDoc(
        doc(
          db,
          "users",
          user.id
        )
      );

      alert(
        "User Deleted Successfully"
      );
    } catch (error) {
      console.error(
        "Unable to delete user:",
        error
      );

      alert(
        "Unable to delete user"
      );
    }
  };

  return (
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
            placeholder="Search Name, Email, Phone, City or User ID"
            value={userSearch}
            onChange={(event) => {
              setUserSearch(
                event.target.value
              );

              setUserPage(1);
            }}
            className="border p-4 rounded-2xl w-full mb-6"
          />

          <div className="flex flex-wrap gap-3">

            {[
              "All",
              "Customers",
              "Owners",
              "Admins",
              "Blocked",
            ].map((tab) => (

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
                {getTabCount(tab)})
              </button>

            ))}

          </div>

        </div>

        {paginatedUsers.length === 0 ? (

          <div className="bg-gray-50 border rounded-3xl p-10 text-center">

            <h3 className="text-2xl font-bold text-gray-600">
              No users found
            </h3>

            <p className="text-gray-500 mt-2">
              Try changing the search text or selected tab.
            </p>

          </div>

        ) : (

          <div className="grid gap-6">

            {paginatedUsers.map(
              (user) => (

                <div
                  key={user.id}
                  className="bg-gray-50 border rounded-3xl p-6 flex flex-col md:flex-row justify-between gap-6"
                >

                  <div className="flex items-center gap-5">

                    <img
                      src={
                        user.photoURL ||
                        user.photo ||
                        "https://ui-avatars.com/api/?name=User"
                      }
                      alt={
                        user.name ||
                        "User"
                      }
                      className="w-20 h-20 rounded-full object-cover"
                    />

                    <div>

                      <h3 className="text-2xl font-bold">
                        {user.name ||
                          "No Name"}
                      </h3>

                      <p className="text-gray-600 break-all">
                        {user.email ||
                          "No Email"}
                      </p>

                      <p className="text-gray-500">
                        ID:{" "}
                        {user.userId ||
                          "N/A"}
                      </p>

                      <p className="text-gray-500">
                        {user.phone ||
                          "No Phone"}
                      </p>

                      <p className="text-gray-500">
                        {user.city ||
                          "No City"}
                      </p>

                      <p className="text-gray-500 capitalize">
                        Role:{" "}
                        {user.role ||
                          "customer"}
                      </p>

                    </div>

                  </div>

                  <div className="flex flex-wrap items-start gap-3">

                    {user.role ===
                      "admin" && (

                      <div className="bg-purple-600 text-white px-5 py-3 rounded-2xl font-bold">
                        Administrator
                      </div>

                    )}

                    {(user.isOwner ===
                      true ||
                      user.role ===
                        "owner") &&
                      user.role !==
                        "admin" && (

                        <div className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-bold">
                          Owner
                        </div>

                      )}

                    <span
                      className={`px-5 py-3 rounded-2xl text-white font-bold ${
                        user.status ===
                        "Blocked"
                          ? "bg-red-500"
                          : "bg-green-500"
                      }`}
                    >
                      {user.status ||
                        "Active"}
                    </span>

                    <button
                      onClick={() =>
                        handleBlockUser(
                          user
                        )
                      }
                      className={`px-6 py-3 rounded-2xl font-bold text-white ${
                        user.status ===
                        "Blocked"
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-orange-500 hover:bg-orange-600"
                      }`}
                    >
                      {user.status ===
                      "Blocked"
                        ? "Activate User"
                        : "Block User"}
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteUser(
                          user
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-2xl font-bold"
                    >
                      Delete User
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

        {filteredUsers.length > 0 && (

          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-8">

            <button
              disabled={
                userPage === 1
              }
              onClick={() =>
                setUserPage(
                  (currentPage) =>
                    currentPage - 1
                )
              }
              className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
            >
              Previous
            </button>

            <span className="font-bold">

              Showing{" "}

              {(userPage - 1) *
                usersPerPage +
                1}

              {" - "}

              {Math.min(
                userPage *
                  usersPerPage,
                filteredUsers.length
              )}

              {" of "}

              {filteredUsers.length}

            </span>

            <button
              disabled={
                userPage >=
                totalUserPages
              }
              onClick={() =>
                setUserPage(
                  (currentPage) =>
                    currentPage + 1
                )
              }
              className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
            >
              Next
            </button>

          </div>

        )}

      </div>
    </>
  );
}