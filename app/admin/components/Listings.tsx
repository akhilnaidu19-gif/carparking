"use client";


import { useState } from "react";
import {
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";


import { db } from "@/lib/firebase";

import { sendNotification } from "@/lib/notifications";

type ListingsProps = {
  parkings: any[];
};

type ListingTab =
  | "Pending"
  | "Approved"
  | "Rejected";

export default function Listings({
  parkings,
}: ListingsProps) {
  const [search, setSearch] =
    useState("");

  const [listingTab, setListingTab] =
    useState<ListingTab>("Pending");

  const [listingPage, setListingPage] =
    useState(1);

  const [remarks, setRemarks] =
    useState<Record<string, string>>(
      {}
    );

  const listingsPerPage = 6;

  const filteredListings =
    parkings.filter((parking) => {
      const searchValue = search
        .trim()
        .toLowerCase();

      const matchesSearch =
        (parking.title || "")
          .toLowerCase()
          .includes(searchValue) ||
        (parking.location || "")
          .toLowerCase()
          .includes(searchValue) ||
        (parking.ownerName || "")
          .toLowerCase()
          .includes(searchValue) ||
        (parking.ownerId || "")
          .toLowerCase()
          .includes(searchValue) ||
        (parking.ownerEmail || "")
          .toLowerCase()
          .includes(searchValue);

      const matchesTab =
        parking.status === listingTab;

      return (
        matchesSearch && matchesTab
      );
    });

  const totalListingPages = Math.ceil(
    filteredListings.length /
      listingsPerPage
  );

  const paginatedListings =
    filteredListings.slice(
      (listingPage - 1) *
        listingsPerPage,
      listingPage * listingsPerPage
    );

  const getListingCount = (
    status: ListingTab
  ) =>
    parkings.filter(
      (parking) =>
        parking.status === status
    ).length;

  const handleApproveListing =
    async (parking: any) => {
      try {
        await updateDoc(
          doc(
            db,
            "parkings",
            parking.id
          ),
          {
            status: "Approved",
            availability: "Available",
            adminRemarks: "",
            updatedAt: new Date(),
          }
        );

        if (
          parking.status !== "Approved"
        ) {
          await sendNotification({
  recipientUid: parking.ownerUid,
  recipientRole: "owner",
  title: "Listing Approved",
  message: `Congratulations! Your parking "${parking.title}" has been approved by the admin and is now live.`,
  type: "LISTING",
  relatedId: parking.id,
});
        }

        setRemarks((current) => {
          const updated = {
            ...current,
          };

          delete updated[parking.id];

          return updated;
        });

        alert(
          "Listing Approved Successfully"
        );
      } catch (error) {
        console.error(
          "Unable to approve listing:",
          error
        );

        alert(
          "Unable to approve listing"
        );
      }
    };

  const handleRejectListing =
    async (parking: any) => {
      const rejectionRemark =
        remarks[parking.id]?.trim();

      if (!rejectionRemark) {
        alert(
          "Please enter rejection remarks."
        );

        return;
      }

      try {
        await updateDoc(
          doc(
            db,
            "parkings",
            parking.id
          ),
          {
            status: "Rejected",
            availability: "Rejected",
            adminRemarks:
              rejectionRemark,
            updatedAt: new Date(),
          }
        );

        await sendNotification({
  recipientUid: parking.ownerUid,
  recipientRole: "owner",
  title: "Listing Rejected",
  message: `Your parking "${parking.title}" was rejected.\n\nRemarks: ${rejectionRemark}`,
  type: "LISTING",
  relatedId: parking.id,
});

        alert("Listing Rejected");
      } catch (error) {
        console.error(
          "Unable to reject listing:",
          error
        );

        alert(
          "Unable to reject listing"
        );
      }
    };

  const handleVerifyListing =
    async (parking: any) => {
      try {
        await updateDoc(
          doc(
            db,
            "parkings",
            parking.id
          ),
          {
            verified:
              !parking.verified,
            updatedAt: new Date(),
          }
        );

        alert(
          parking.verified
            ? "Verification Removed"
            : "Owner Verified"
        );
      } catch (error) {
        console.error(
          "Unable to update verification:",
          error
        );

        alert(
          "Unable to update verification"
        );
      }
    };

  const handleFeaturedListing =
    async (parking: any) => {
      try {
        await updateDoc(
          doc(
            db,
            "parkings",
            parking.id
          ),
          {
            featured:
              !parking.featured,
            updatedAt: new Date(),
          }
        );

        alert(
          parking.featured
            ? "Featured Removed"
            : "Listing Featured"
        );
      } catch (error) {
        console.error(
          "Unable to update featured status:",
          error
        );

        alert(
          "Unable to update featured status"
        );
      }
    };

  const handleDeleteListing =
    async (parking: any) => {
      const confirmDelete = confirm(
        `Delete ${
          parking.title ||
          "this listing"
        }?`
      );

      if (!confirmDelete) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "parkings",
            parking.id
          )
        );

        if (
          paginatedListings.length ===
            1 &&
          listingPage > 1
        ) {
          setListingPage(
            listingPage - 1
          );
        }

        alert("Listing Deleted");
      } catch (error) {
        console.error(
          "Unable to delete listing:",
          error
        );

        alert(
          "Unable to delete listing"
        );
      }
    };

  return (
    <>
      {/* SEARCH AND TABS */}

      <div className="bg-white rounded-3xl shadow-xl p-6 mb-10">

        <div className="flex flex-col xl:flex-row gap-5 xl:items-center">

          <input
            type="text"
            placeholder="Search Title, Location, Owner Name, Owner ID or Email"
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );

              setListingPage(1);
            }}
            className="border p-4 rounded-2xl flex-1"
          />

          <div className="flex flex-wrap gap-3">

            {(
              [
                "Pending",
                "Approved",
                "Rejected",
              ] as ListingTab[]
            ).map((tab) => (

              <button
                key={tab}
                onClick={() => {
                  setListingTab(tab);
                  setListingPage(1);
                }}
                className={`px-6 py-3 rounded-2xl font-bold ${
                  listingTab === tab
                    ? tab === "Pending"
                      ? "bg-orange-500 text-white"
                      : tab ===
                        "Approved"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                    : "bg-gray-200"
                }`}
              >
                {tab} (
                {getListingCount(tab)})
              </button>

            ))}

          </div>

        </div>

      </div>

      {/* LISTINGS */}

      <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <h2 className="text-4xl font-bold">
            {listingTab} Parking
            Listings
          </h2>

          <div
            className={`text-white px-6 py-3 rounded-2xl font-bold ${
              listingTab === "Pending"
                ? "bg-orange-500"
                : listingTab ===
                  "Approved"
                ? "bg-green-600"
                : "bg-red-600"
            }`}
          >
            {filteredListings.length}{" "}
            Listings
          </div>

        </div>

        {paginatedListings.length ===
        0 ? (

          <div className="bg-gray-50 border rounded-3xl p-10 text-center">

            <h3 className="text-2xl font-bold text-gray-600">
              No {listingTab.toLowerCase()}{" "}
              listings found
            </h3>

            <p className="text-gray-500 mt-2">
              Try changing the search
              value or selected tab.
            </p>

          </div>

        ) : (

          <div className="grid gap-8">

            {paginatedListings.map(
              (parking) => (

                <div
                  key={parking.id}
                  className="bg-gray-50 rounded-3xl border p-6 flex flex-col md:flex-row gap-6"
                >

                  <img
                    src={
                      parking.image ||
                      "https://via.placeholder.com/500x350?text=Parking"
                    }
                    alt={
                      parking.title ||
                      "Parking"
                    }
                    className="w-full md:w-72 h-52 object-cover rounded-2xl"
                  />

                  <div className="flex-1">

                    <div className="flex flex-col xl:flex-row xl:justify-between gap-6">

                      <div className="flex-1">

                        <div className="flex flex-wrap gap-3 mb-4">

                          <span
                            className={`px-4 py-2 rounded-xl font-bold text-white ${
                              parking.status ===
                              "Approved"
                                ? "bg-green-500"
                                : parking.status ===
                                  "Rejected"
                                ? "bg-red-500"
                                : "bg-orange-500"
                            }`}
                          >
                            {parking.status ||
                              "Pending"}
                          </span>

                          <span
                            className={`px-4 py-2 rounded-xl font-bold text-white ${
                              parking.availability ===
                              "Available"
                                ? "bg-green-500"
                                : parking.availability ===
                                  "Rejected"
                                ? "bg-red-600"
                                : "bg-orange-500"
                            }`}
                          >
                            {parking.availability ||
                              "Pending Approval"}
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
                          {parking.title ||
                            "Untitled Parking"}
                        </h3>

                        <p className="text-gray-500 mb-3">
                          {parking.location ||
                            "Location Not Available"}
                        </p>

                        <p className="text-green-600 font-bold text-2xl mb-4">
                          ₹
                          {Number(
                            parking.monthlyPrice ||
                              0
                          )}
                          /month
                        </p>

                        {parking.yearlyPrice && (

                          <p className="text-gray-600 font-semibold mb-4">
                            ₹
                            {Number(
                              parking.yearlyPrice
                            )}
                            /year
                          </p>

                        )}

                        <div className="flex items-center gap-4">

                          <img
                            src={
                              parking.ownerPhoto ||
                              "https://ui-avatars.com/api/?name=User&background=16a34a&color=fff"
                            }
                            alt={
                              parking.ownerName ||
                              "Owner"
                            }
                            className="w-16 h-16 rounded-full object-cover"
                          />

                          <div>

                            <h4 className="font-bold text-xl">
                              {parking.ownerName ||
                                "Owner Name Not Available"}
                            </h4>

                            <p className="text-gray-500">
                              Owner ID:{" "}
                              {parking.ownerId ||
                                "N/A"}
                            </p>

                            <p className="text-gray-500 break-all">
                              {parking.ownerEmail ||
                                "Email Not Available"}
                            </p>

                            <p className="text-gray-500">
                              {parking.ownerPhone ||
                                "Phone Not Available"}
                            </p>

                          </div>

                        </div>

                        {parking.adminRemarks && (

                          <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-4">

                            <p className="font-bold text-red-700">
                              Admin Remarks
                            </p>

                            <p className="text-red-600 mt-1">
                              {
                                parking.adminRemarks
                              }
                            </p>

                          </div>

                        )}

                        {parking.status !==
                          "Approved" && (

                          <textarea
                            placeholder="Enter rejection remarks..."
                            value={
                              remarks[
                                parking.id
                              ] || ""
                            }
                            onChange={(
                              event
                            ) =>
                              setRemarks(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  [parking.id]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            className="w-full border p-3 rounded-xl mt-5 h-24"
                          />

                        )}

                      </div>

                      <div className="flex flex-col gap-4 xl:w-64">

                        {parking.status !==
                          "Approved" && (

                          <button
                            onClick={() =>
                              handleApproveListing(
                                parking
                              )
                            }
                            className="bg-green-500 hover:bg-green-600 px-6 py-4 rounded-2xl font-bold text-white"
                          >
                            Approve Listing
                          </button>

                        )}

                        {parking.status !==
                          "Rejected" && (

                          <button
                            onClick={() =>
                              handleRejectListing(
                                parking
                              )
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-bold"
                          >
                            Reject Listing
                          </button>

                        )}

                        <button
                          onClick={() =>
                            handleVerifyListing(
                              parking
                            )
                          }
                          className={`px-6 py-4 rounded-2xl font-bold text-white ${
                            parking.verified
                              ? "bg-gray-500 hover:bg-gray-600"
                              : "bg-blue-500 hover:bg-blue-600"
                          }`}
                        >
                          {parking.verified
                            ? "Remove Verification"
                            : "Verify Owner"}
                        </button>

                        <button
                          onClick={() =>
                            handleFeaturedListing(
                              parking
                            )
                          }
                          className={`px-6 py-4 rounded-2xl font-bold text-white ${
                            parking.featured
                              ? "bg-gray-500 hover:bg-gray-600"
                              : "bg-purple-600 hover:bg-purple-700"
                          }`}
                        >
                          {parking.featured
                            ? "Remove Featured"
                            : "Make Featured"}
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteListing(
                              parking
                            )
                          }
                          className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-bold"
                        >
                          Delete Listing
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

        {filteredListings.length >
          0 && (

          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-8">

            <button
              disabled={
                listingPage === 1
              }
              onClick={() =>
                setListingPage(
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

              {(listingPage - 1) *
                listingsPerPage +
                1}

              {" - "}

              {Math.min(
                listingPage *
                  listingsPerPage,
                filteredListings.length
              )}

              {" of "}

              {filteredListings.length}

            </span>

            <button
              disabled={
                listingPage >=
                totalListingPages
              }
              onClick={() =>
                setListingPage(
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