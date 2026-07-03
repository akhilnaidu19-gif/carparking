type DashboardProps = {
  parkings: any[];
  users: any[];
  bookings: any[];
  tickets: any[];
  pendingCount: number;
  approvedCount: number;
  featuredCount: number;
  totalCustomerPayments: number;
  totalPlatformRevenue: number;
  pendingOwnerPayout: number;
  completedOwnerPayout: number;
  chartData: any[];
  pieData: any[];
};

export default function Dashboard({
  parkings,
  users,
  bookings,
  tickets,
  pendingCount,
  approvedCount,
  featuredCount,
  totalCustomerPayments,
  totalPlatformRevenue,
  pendingOwnerPayout,
  completedOwnerPayout,
}: DashboardProps) {
  return (
    <div>

      <h2 className="text-4xl font-bold mb-8">
        Dashboard
      </h2>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <p className="text-gray-500">Listings</p>
          <h2 className="text-5xl font-bold mt-3">
            {parkings.length}
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <p className="text-gray-500">Pending Listings</p>
          <h2 className="text-5xl font-bold mt-3">
            {pendingCount}
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <p className="text-gray-500">Approved Listings</p>
          <h2 className="text-5xl font-bold mt-3">
            {approvedCount}
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <p className="text-gray-500">Featured Listings</p>
          <h2 className="text-5xl font-bold mt-3">
            {featuredCount}
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <p className="text-gray-500">Users</p>
          <h2 className="text-5xl font-bold mt-3">
            {users.length}
          </h2>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <p className="text-gray-500">Bookings</p>
          <h2 className="text-5xl font-bold mt-3">
            {bookings.length}
          </h2>
        </div>

      </div>

      <h2 className="text-3xl font-bold mt-10 mb-6">
        Financial Overview
      </h2>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

        <div className="bg-black text-white rounded-3xl p-6">
          <p>Customer Payments</p>
          <h2 className="text-4xl font-bold mt-3">
            ₹{totalCustomerPayments}
          </h2>
        </div>

        <div className="bg-green-600 text-white rounded-3xl p-6">
          <p>Platform Revenue</p>
          <h2 className="text-4xl font-bold mt-3">
            ₹{totalPlatformRevenue}
          </h2>
        </div>

        <div className="bg-yellow-500 text-white rounded-3xl p-6">
          <p>Pending Payout</p>
          <h2 className="text-4xl font-bold mt-3">
            ₹{pendingOwnerPayout}
          </h2>
        </div>

        <div className="bg-blue-600 text-white rounded-3xl p-6">
          <p>Owners Paid</p>
          <h2 className="text-4xl font-bold mt-3">
            ₹{completedOwnerPayout}
          </h2>
        </div>

      </div>

    </div>
  );
}