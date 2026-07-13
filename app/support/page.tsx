"use client";

import { useRouter } from "next/navigation";

import {
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";

import { app } from "@/lib/firebase";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import {
  db,
  storage,
} from "@/lib/firebase";



export default function SupportPage() {
  const router = useRouter();

const auth = getAuth(app);

const [pageLoading, setPageLoading] = useState(true);
useEffect(() => {

  const unsubscribe = onAuthStateChanged(auth, (user) => {

    if (!user) {

      router.replace("/login");

      return;

    }

    setPageLoading(false);

  });

  return () => unsubscribe();

}, [auth, router]);
const [subject, setSubject] = useState("");
const [message, setMessage] = useState("");

const [category, setCategory] =
  useState("");

  const [screenshot, setScreenshot] = useState<File | null>(null);

const [tickets, setTickets] = useState<any[]>([]);
const [loading, setLoading] = useState(false);

  const loadTickets = async () => {
const userId = localStorage.getItem("userId");
if (!userId) return;

    const q = query(
  collection(db, "supportTickets"),
  where("userId", "==", userId),
  orderBy("createdAt", "desc")
);

const snapshot = await getDocs(q);

const data = snapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

setTickets(data);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const submitTicket = async () => {
    const email = localStorage.getItem("userEmail");
    const name =
      localStorage.getItem("userName") || "User";
      const userId = localStorage.getItem("userId");

if (!userId) {
  alert("Please Login");
  return;
}

    if (

  !subject.trim() ||

  !message.trim() ||

  !category

) {

  alert("Please fill all required fields.");

  return;

}

if(subject.trim().length < 5){

alert("Subject should contain at least 5 characters.");

return;

}

if(message.trim().length < 20){

alert("Please describe your issue in at least 20 characters.");

return;

}

    setLoading(true);

    try {
const ticketId =

`TKT-${new Date()
.getFullYear()}-${Date.now()
.toString()
.slice(-6)}`;



        let priority = "Medium";

if (
  category === "Payment Issue" ||
  category === "Refund Request" ||
  category === "Complaint"
) {
  priority = "High";
}

if (
  category === "Technical Issue"
) {
  priority = "Low";
}

const duplicate = tickets.find(

(ticket:any)=>

ticket.subject.toLowerCase().trim()===subject.toLowerCase().trim()

&&

ticket.status !== "Resolved"

);

if(duplicate){

alert("You already have an open ticket with the same subject.");

setLoading(false);

return;

}

let screenshotURL = "";

if (screenshot) {

  const imageRef = ref(

    storage,

    `support-screenshots/${Date.now()}-${screenshot.name}`

  );

  await uploadBytes(
    imageRef,
    screenshot
  );

  screenshotURL =
    await getDownloadURL(imageRef);

}

await addDoc(
  collection(db, "supportTickets"),
  {
    ticketId,
    userName: name,
    userEmail: email,
    userId,

    category,

subject: subject.trim(),

message: message.trim(),
screenshot: screenshotURL,

          status: "Open",
          priority,

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
setScreenshot(null);
setCategory("");

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

if (pageLoading) {

  return (

    <div className="min-h-screen flex items-center justify-center">

      <h1 className="text-3xl font-bold">

        Loading...

      </h1>

    </div>

  );

}

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
  setSubject(
    e.target.value
      .replace(/[^A-Za-z0-9\s.,()\-]/g, "")
      .slice(0, 80)
  )
}
            className="w-full border p-4 rounded-2xl mb-4"
          />

          <select
  value={category}
  onChange={(e) =>
    setCategory(e.target.value)
  }
  className="w-full border p-4 rounded-2xl mb-4"
>

  <option value="">
    Select Category
  </option>

  <option value="Booking Issue">
    Booking Issue
  </option>

  <option value="Payment Issue">
    Payment Issue
  </option>

  <option value="Refund Request">
    Refund Request
  </option>

  <option value="Login Issue">
    Login Issue
  </option>

  <option value="Listing Issue">
    Listing Issue
  </option>

  <option value="Complaint">
    Complaint
  </option>

  <option value="Technical Issue">
    Technical Issue
  </option>

  <option value="Others">

Others

</option>

</select>

          <textarea
            placeholder="Describe your issue"
            value={message}
onChange={(e) => {

  if (e.target.value.length <= 1000) {

    setMessage(e.target.value);

    

  }

}}
            className="w-full border p-4 rounded-2xl h-40 mb-4"
          />

          <p className="text-sm text-gray-500 mt-2 text-right">

{message.length}/1000 Characters

</p>

          <div className="mt-5">

  <label className="block font-bold mb-2">

    Upload Screenshot (Optional)

  </label>

  <input
    type="file"
    accept="image/*"
    onChange={(e) => {

      const file = e.target.files?.[0];

      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {

        alert("Image should be below 5MB.");

        return;

      }

      if (!file.type.startsWith("image/")) {

        alert("Only image files are allowed.");

        return;

      }

      setScreenshot(file);

    }}
    className="w-full border p-4 rounded-2xl"
  />

</div>

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

                  {ticket.screenshot && (

  <div className="my-4">

    <img
      src={ticket.screenshot}
      alt="Support Screenshot"
      className="w-72 rounded-2xl border shadow"
    />

  </div>

)}

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