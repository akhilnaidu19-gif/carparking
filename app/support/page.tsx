"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
    const email = localStorage.getItem("userEmail");

    if (!email) return;

    const q = query(
      collection(db, "supportTickets"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((ticket: any) => ticket.userEmail === email);

    setTickets(data);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const submitTicket = async () => {
    const email = localStorage.getItem("userEmail");
    const name =
      localStorage.getItem("userName") || "User";

    if (!email) {
      alert("Please Login");
      return;
    }

    if (!subject || !message) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const ticketId =
        "TKT-" +
        Math.floor(
          100000 + Math.random() * 900000
        );

      await addDoc(
        collection(db, "supportTickets"),
        {
          ticketId,
          userName: name,
          userEmail: email,
          subject,
          message,

          status: "Open",
          priority: "Medium",

          adminRemarks: "",

          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );

      alert(
        `Ticket Created Successfully\nTicket ID: ${ticketId}`
      );

      setSubject("");
      setMessage("");

      loadTickets();
    } catch (error) {
      console.error(error);
      alert("Failed to create ticket");
    }

    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-yellow-500";

      case "In Progress":
        return "bg-blue-500";

      case "Waiting For Customer":
        return "bg-purple-500";

      case "Resolved":
        return "bg-green-500";

      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">

      <div className="max-w-5xl mx-auto">

        {/* CREATE TICKET */}

        <div className="bg-white p-8 rounded-3xl shadow-xl mb-10">

          <h1 className="text-4xl font-bold mb-6">
            Support Center
          </h1>

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            className="w-full border p-4 rounded-2xl mb-4"
          />

          <textarea
            placeholder="Describe your issue"
            value={message}
            onChange={(e) =>
              setMessage(e.target.value)
            }
            className="w-full border p-4 rounded-2xl h-40 mb-4"
          />

          <button
            onClick={submitTicket}
            disabled={loading}
            className="bg-green-500 text-white px-8 py-4 rounded-2xl font-bold"
          >
            {loading
              ? "Submitting..."
              : "Submit Ticket"}
          </button>

        </div>

        {/* MY TICKETS */}

        <div className="bg-white p-8 rounded-3xl shadow-xl">

          <h2 className="text-3xl font-bold mb-6">
            My Tickets
          </h2>

          {tickets.length === 0 ? (
            <p>No tickets found.</p>
          ) : (
            <div className="space-y-4">

              {tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="border rounded-2xl p-5"
                >

                  <div className="flex justify-between items-center mb-3">

                    <div>
                      <h3 className="font-bold text-xl">
                        {ticket.subject}
                      </h3>

                      <p className="text-sm text-gray-500">
                        Ticket ID :
                        {" "}
                        {ticket.ticketId}
                      </p>
                    </div>

                    <span
                      className={`${getStatusColor(
                        ticket.status
                      )} text-white px-4 py-2 rounded-xl`}
                    >
                      {ticket.status}
                    </span>

                  </div>

                  <p className="mb-3">
                    {ticket.message}
                  </p>

                  <div className="bg-gray-100 p-3 rounded-xl">

                    <h4 className="font-bold mb-1">
                      Admin Remarks
                    </h4>

                    <p>
                      {ticket.adminRemarks ||
                        "No updates yet"}
                    </p>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}