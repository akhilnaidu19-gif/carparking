"use client";

import {
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { useState } from "react";
import { db } from "@/lib/firebase";

type TicketsProps = {
  tickets: any[];
};

export default function Tickets({
  tickets,
}: TicketsProps) {
  const [
    ticketCategoryFilter,
    setTicketCategoryFilter,
  ] = useState("All");

  const [
    ticketSearch,
    setTicketSearch,
  ] = useState("");

  const [
    ticketRemarks,
    setTicketRemarks,
  ] = useState<Record<string, string>>(
    {}
  );

  const [
    ticketPage,
    setTicketPage,
  ] = useState(1);

  const ticketsPerPage = 5;

  const filteredTickets =
    tickets.filter((ticket) => {
      const categoryMatch =
        ticketCategoryFilter === "All"
          ? true
          : ticket.category ===
            ticketCategoryFilter;

      const searchText =
        ticketSearch
          .trim()
          .toLowerCase();

      const searchMatch =
        (ticket.ticketId || "")
          .toLowerCase()
          .includes(searchText) ||
        (ticket.userName || "")
          .toLowerCase()
          .includes(searchText) ||
        (ticket.userEmail || "")
          .toLowerCase()
          .includes(searchText) ||
        (ticket.subject || "")
          .toLowerCase()
          .includes(searchText) ||
        (ticket.userId || "")
          .toLowerCase()
          .includes(searchText);

      return (
        categoryMatch &&
        searchMatch
      );
    });

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

  const updateTicketStatus =
    async (
      ticketId: string,
      status: string
    ) => {
      try {
        await updateDoc(
          doc(
            db,
            "supportTickets",
            ticketId
          ),
          {
            status,
            updatedAt: new Date(),
          }
        );
      } catch (error) {
        console.error(
          "Unable to update ticket status:",
          error
        );

        alert(
          "Unable to update ticket status."
        );
      }
    };

  const markTicketResolved =
    async (ticketId: string) => {
      const confirmResolve =
        confirm(
          "Mark this ticket as resolved?"
        );

      if (!confirmResolve) {
        return;
      }

      try {
        await updateDoc(
          doc(
            db,
            "supportTickets",
            ticketId
          ),
          {
            status: "Resolved",
            resolvedAt: new Date(),
            updatedAt: new Date(),
          }
        );

        alert(
          "Ticket marked as resolved."
        );
      } catch (error) {
        console.error(
          "Unable to resolve ticket:",
          error
        );

        alert(
          "Unable to resolve ticket."
        );
      }
    };

  const saveTicketRemarks =
    async (ticket: any) => {
      try {
        await updateDoc(
          doc(
            db,
            "supportTickets",
            ticket.id
          ),
          {
            adminRemarks:
              ticketRemarks[
                ticket.id
              ] ??
              ticket.adminRemarks ??
              "",
            updatedAt: new Date(),
          }
        );

        alert(
          "Remarks Updated"
        );
      } catch (error) {
        console.error(
          "Unable to save remarks:",
          error
        );

        alert(
          "Unable to save remarks."
        );
      }
    };

  const deleteTicket =
    async (ticketId: string) => {
      const confirmDelete =
        confirm(
          "Are you sure you want to delete this ticket?"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        await deleteDoc(
          doc(
            db,
            "supportTickets",
            ticketId
          )
        );

        alert(
          "Ticket deleted successfully."
        );
      } catch (error) {
        console.error(
          "Unable to delete ticket:",
          error
        );

        alert(
          "Unable to delete ticket."
        );
      }
    };

  const showingFrom =
    filteredTickets.length === 0
      ? 0
      : (ticketPage - 1) *
          ticketsPerPage +
        1;

  const showingTo =
    Math.min(
      ticketPage *
        ticketsPerPage,
      filteredTickets.length
    );

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-8">

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">

          <h2 className="text-4xl font-bold">
            Support Tickets
          </h2>

          <select
            value={
              ticketCategoryFilter
            }
            onChange={(e) => {
              setTicketCategoryFilter(
                e.target.value
              );

              setTicketPage(1);
            }}
            className="border p-2 rounded-xl"
          >
            <option>
              All
            </option>

            <option>
              Booking Issue
            </option>

            <option>
              Payment Issue
            </option>

            <option>
              Refund Request
            </option>

            <option>
              Login Issue
            </option>

            <option>
              Listing Issue
            </option>

            <option>
              Complaint
            </option>

            <option>
              Technical Issue
            </option>
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
            className="border p-2 rounded-xl w-full lg:w-80"
          />

        </div>

        <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold w-fit">
          {tickets.length} Tickets
        </div>

      </div>

      {paginatedTickets.length ===
      0 ? (

        <div className="bg-gray-50 border rounded-3xl p-10 text-center">

          <h3 className="text-2xl font-bold text-gray-600">
            No support tickets found
          </h3>

        </div>

      ) : (

        <div className="grid gap-6">

          {paginatedTickets.map(
            (ticket) => (

              <div
                key={ticket.id}
                className="bg-gray-50 border rounded-3xl p-6"
              >

                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-5">

                  <div className="flex-1">

                    <h3 className="text-2xl font-bold">
                      {ticket.subject ||
                        "No Subject"}
                    </h3>

                    <p className="text-gray-500 mt-2">
                      Ticket ID:{" "}
                      {ticket.ticketId ||
                        "N/A"}
                    </p>

                    <p className="text-gray-500">
                      User:{" "}
                      {ticket.userName ||
                        "N/A"}
                    </p>

                    <p className="text-gray-500 break-all">
                      Email:{" "}
                      {ticket.userEmail ||
                        "N/A"}
                    </p>

                    <p className="text-gray-500">
                      Priority:{" "}
                      {ticket.priority ||
                        "Normal"}
                    </p>

                    <div className="mt-2">

                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                        {ticket.category ||
                          "General"}
                      </span>

                    </div>

                    <p className="mt-4 whitespace-pre-wrap">
                      {ticket.message ||
                        "No message provided."}
                    </p>

                    <div className="mt-5">

                      <h4 className="font-bold mb-2">
                        Admin Remarks
                      </h4>

                      <textarea
                        value={
                          ticketRemarks[
                            ticket.id
                          ] ??
                          ticket.adminRemarks ??
                          ""
                        }
                        onChange={(e) =>
                          setTicketRemarks(
                            (current) => ({
                              ...current,
                              [ticket.id]:
                                e.target
                                  .value,
                            })
                          )
                        }
                        className="w-full border p-3 rounded-xl h-24"
                        placeholder="Enter admin remarks..."
                      />

                    </div>

                  </div>

                  <select
                    value={
                      ticket.status ||
                      "Open"
                    }
                    onChange={(e) =>
                      updateTicketStatus(
                        ticket.id,
                        e.target.value
                      )
                    }
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
                    onClick={() =>
                      markTicketResolved(
                        ticket.id
                      )
                    }
                    disabled={
                      ticket.status ===
                      "Resolved"
                    }
                    className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mark Resolved
                  </button>

                  <button
                    onClick={() =>
                      saveTicketRemarks(
                        ticket
                      )
                    }
                    className="bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold"
                  >
                    Save Remarks
                  </button>

                  <button
                    onClick={() =>
                      deleteTicket(
                        ticket.id
                      )
                    }
                    className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold"
                  >
                    Delete Ticket
                  </button>

                </div>

              </div>

            )
          )}

        </div>

      )}

      {filteredTickets.length > 0 && (

        <div className="flex justify-center items-center gap-4 mt-8">

          <button
            disabled={
              ticketPage === 1
            }
            onClick={() =>
              setTicketPage(
                (current) =>
                  current - 1
              )
            }
            className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
          >
            Previous
          </button>

          <span className="font-bold">
            Showing {showingFrom}-
            {showingTo} of{" "}
            {filteredTickets.length}
          </span>

          <button
            disabled={
              ticketPage >=
              totalTicketPages
            }
            onClick={() =>
              setTicketPage(
                (current) =>
                  current + 1
              )
            }
            className="bg-gray-200 px-4 py-2 rounded-xl disabled:opacity-50"
          >
            Next
          </button>

        </div>

      )}

    </div>
  );
}