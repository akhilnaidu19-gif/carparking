"use client";

import {
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type OwnerApplicationsProps = {
  ownerApplications: any[];
};

export default function OwnerApplications({
  ownerApplications,
}: OwnerApplicationsProps) {
  const approveOwner = async (
    owner: any
  ) => {
    const confirmApprove = confirm(
      `Approve ${owner.userName} as Parking Owner?`
    );

    if (!confirmApprove) {
      return;
    }

    try {
      await updateDoc(
        doc(
          db,
          "ownerApplications",
          owner.id
        ),
        {
          status: "Approved",
          approvedAt: new Date(),
        }
      );

      await updateDoc(
        doc(
          db,
          "users",
          owner.userUid
        ),
        {
          isOwner: true,
          ownerStatus: "Approved",
          updatedAt: new Date(),
        }
      );

      alert(
        "Owner Approved Successfully."
      );
    } catch (error) {
      console.error(
        "Unable to approve owner:",
        error
      );

      alert(
        "Unable to approve owner."
      );
    }
  };

  const rejectOwner = async (
    owner: any
  ) => {
    const confirmReject = confirm(
      `Reject ${owner.userName}'s owner application?`
    );

    if (!confirmReject) {
      return;
    }

    try {
      await updateDoc(
        doc(
          db,
          "ownerApplications",
          owner.id
        ),
        {
          status: "Rejected",
          rejectedAt: new Date(),
        }
      );

      await updateDoc(
        doc(
          db,
          "users",
          owner.userUid
        ),
        {
          isOwner: false,
          ownerStatus: "Rejected",
          updatedAt: new Date(),
        }
      );

      alert(
        "Owner Application Rejected."
      );
    } catch (error) {
      console.error(
        "Unable to reject owner:",
        error
      );

      alert(
        "Unable to reject owner."
      );
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

        <h2 className="text-4xl font-bold">
          🏢 Owner Applications
        </h2>

        <div className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold">
          {ownerApplications.length} Applications
        </div>

      </div>

      {ownerApplications.length === 0 ? (

        <div className="bg-gray-50 border rounded-3xl p-10 text-center">

          <h3 className="text-2xl font-bold text-gray-600">
            No owner applications found
          </h3>

        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="bg-gray-100">

                <th className="p-4 text-left">
                  Owner
                </th>

                <th className="p-4 text-left">
                  Email
                </th>

                <th className="p-4 text-left">
                  Phone
                </th>

                <th className="p-4 text-left">
                  Status
                </th>

                <th className="p-4 text-left">
                  Action
                </th>

              </tr>

            </thead>

            <tbody>

              {ownerApplications.map(
                (owner) => (

                  <tr
                    key={owner.id}
                    className="border-b"
                  >

                    <td className="p-4">

                      <p className="font-semibold">
                        {owner.userName ||
                          "Name Not Available"}
                      </p>

                      <p className="text-sm text-gray-500">
                        User ID:{" "}
                        {owner.userId ||
                          owner.userUid ||
                          "N/A"}
                      </p>

                    </td>

                    <td className="p-4 break-all">
                      {owner.userEmail ||
                        "Email Not Available"}
                    </td>

                    <td className="p-4">
                      {owner.userPhone ||
                        "Phone Not Available"}
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-2 rounded-full font-bold ${
                          owner.status ===
                          "Approved"
                            ? "bg-green-100 text-green-700"
                            : owner.status ===
                              "Rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {owner.status ||
                          "Pending"}
                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex flex-wrap gap-3">

                        {owner.status !==
                          "Approved" && (

                          <button
                            onClick={() =>
                              approveOwner(
                                owner
                              )
                            }
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold"
                          >
                            Approve
                          </button>

                        )}

                        {owner.status !==
                          "Rejected" && (

                          <button
                            onClick={() =>
                              rejectOwner(
                                owner
                              )
                            }
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold"
                          >
                            Reject
                          </button>

                        )}

                      </div>

                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      )}

    </div>
  );
}