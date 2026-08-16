"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DashboardProps = {
  parkings: any[];
  bookings: any[];
  users: any[];
  payments: any[];
  tickets: any[];
};

export default function Dashboard({
  parkings,
  bookings,
  users,
  payments,
  tickets,
}: DashboardProps) {
  const totalCustomerPayments =
    payments.reduce(
      (total, payment) =>
        total +
        Number(
          payment.customerPaidAmount || 0
        ),
      0
    );

  const totalPlatformRevenue =
    payments.reduce(
      (total, payment) =>
        total +
        Number(
          payment.platformFeeAmount || 0
        ),
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

  const completedOwnerPayout =
    payments
      .filter(
        (payment) =>
          payment.ownerPayoutStatus ===
          "Paid"
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

  const availableCount =
    parkings.filter(
      (parking) =>
        parking.availability ===
        "Available"
    ).length;

  const occupiedCount =
    parkings.filter(
      (parking) =>
        parking.availability ===
        "Occupied"
    ).length;

  const pendingCount =
    parkings.filter(
      (parking) =>
        parking.status === "Pending"
    ).length;

  const approvedCount =
    parkings.filter(
      (parking) =>
        parking.status === "Approved"
    ).length;

  const featuredCount =
    parkings.filter(
      (parking) =>
        parking.featured === true
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
        ticket.status === "In Progress"
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
        ticket.status === "Resolved"
    ).length;

  const resolutionRate =
    tickets.length > 0
      ? Math.round(
          (resolvedTickets /
            tickets.length) *
            100
        )
      : 0;

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
    <>
      {/* PLATFORM OVERVIEW */}

      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-6">
          📊 Platform Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
          <DashboardCard
            title="Listings"
            value={parkings.length}
            className="from-green-500 to-green-600"
          />

          <DashboardCard
            title="Pending"
            value={pendingCount}
            className="from-orange-500 to-orange-600"
          />

          <DashboardCard
            title="Approved"
            value={approvedCount}
            className="from-blue-500 to-blue-600"
          />

          <DashboardCard
            title="Featured"
            value={featuredCount}
            className="from-purple-500 to-purple-600"
          />

          <DashboardCard
            title="Users"
            value={users.length}
            className="from-pink-500 to-pink-600"
          />
        </div>

        <h2 className="text-2xl font-bold mb-6">
          💳 Financial Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
          <DashboardCard
            title="Customer Payments"
            value={`₹${totalCustomerPayments.toLocaleString(
              "en-IN"
            )}`}
            className="from-black to-gray-800"
          />

          <DashboardCard
            title="Platform Revenue"
            value={`₹${totalPlatformRevenue.toLocaleString(
              "en-IN"
            )}`}
            className="from-emerald-600 to-emerald-700"
          />

          <DashboardCard
            title="Pending Payout"
            value={`₹${pendingOwnerPayments.toLocaleString(
              "en-IN"
            )}`}
            className="from-yellow-500 to-yellow-600"
          />

          <DashboardCard
            title="Owners Paid"
            value={`₹${completedOwnerPayout.toLocaleString(
              "en-IN"
            )}`}
            className="from-indigo-600 to-indigo-700"
          />
        </div>
      </div>

      {/* PLATFORM ANALYTICS */}

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
              <BarChart data={chartData}>
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
                  nameKey="name"
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-4xl font-bold">
            🎫 Support Analytics
          </h2>

          <div className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold w-fit">
            {tickets.length} Tickets
          </div>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          <SupportCard
            title="Open"
            value={openTickets}
            className="bg-yellow-500"
          />

          <SupportCard
            title="In Progress"
            value={progressTickets}
            className="bg-blue-500"
          />

          <SupportCard
            title="Waiting"
            value={waitingTickets}
            className="bg-orange-500"
          />

          <SupportCard
            title="Resolved"
            value={resolvedTickets}
            className="bg-green-600"
          />
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
                {resolutionRate}%
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
            <table className="w-full min-w-[750px]">
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
                        {ticket.ticketId ||
                          "N/A"}
                      </td>

                      <td className="p-4">
                        {ticket.userName ||
                          "N/A"}
                      </td>

                      <td className="p-4">
                        {ticket.subject ||
                          "No Subject"}
                      </td>

                      <td className="p-4">
                        {ticket.priority ||
                          "Normal"}
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

          {tickets.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No support tickets found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

type DashboardCardProps = {
  title: string;
  value: string | number;
  className: string;
};

function DashboardCard({
  title,
  value,
  className,
}: DashboardCardProps) {
  return (
    <div
      className={`bg-gradient-to-r ${className} text-white p-8 rounded-3xl shadow-xl`}
    >
      <p className="text-lg mb-3">
        {title}
      </p>

      <h2 className="text-4xl font-bold break-words">
        {value}
      </h2>
    </div>
  );
}

type SupportCardProps = {
  title: string;
  value: number;
  className: string;
};

function SupportCard({
  title,
  value,
  className,
}: SupportCardProps) {
  return (
    <div
      className={`${className} text-white p-6 rounded-3xl`}
    >
      <p className="text-lg">
        {title}
      </p>

      <h2 className="text-5xl font-bold">
        {value}
      </h2>
    </div>
  );
}