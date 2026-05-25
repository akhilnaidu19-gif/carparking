export default async function ParkingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

    const parkingData: any = {
  1: {
    image:
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=1200&auto=format&fit=crop",
    title: "Covered Parking - Whitefield",
    location: "Whitefield, Bangalore",
    monthly: "₹3000/month",
    yearly: "₹30000/year",
  },

  2: {
    image:
  "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?q=80&w=1200&auto=format&fit=crop",
    title: "Apartment Parking Slot",
    location: "Marathahalli, Bangalore",
    monthly: "₹2500/month",
    yearly: "₹25000/year",
  },

  3: {
    image:
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop",
    title: "Secure Basement Parking",
    location: "Electronic City, Bangalore",
    monthly: "₹3500/month",
    yearly: "₹36000/year",
  },
};

const parking = parkingData[id];

  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* Hero Image */}
      <div
        className="h-[400px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${parking.image})`,
        }}
      ></div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        <h1 className="text-5xl font-bold mb-4">
          {parking.title}
        </h1>

        <p className="text-gray-600 text-xl mb-8">
          {parking.location}
        </p>

        {/* Pricing */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          
          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">
              Monthly Plan
            </h2>

            <p className="text-4xl font-bold text-green-600 mb-4">
              {parking.monthly}
            </p>

            <button className="bg-green-500 text-white px-6 py-3 rounded-2xl font-bold">
              Book Monthly
            </button>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg">
            <h2 className="text-2xl font-bold mb-4">
              Yearly Plan
            </h2>

            <p className="text-4xl font-bold text-green-600 mb-4">
              {parking.yearly}
            </p>

            <button className="bg-black text-white px-6 py-3 rounded-2xl font-bold">
              Book Yearly
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white p-8 rounded-3xl shadow-lg mb-10">
          <h2 className="text-3xl font-bold mb-6">
            Parking Features
          </h2>

          <div className="grid md:grid-cols-2 gap-4 text-lg">
            <p>✔ CCTV Security</p>
            <p>✔ Covered Parking</p>
            <p>✔ 24/7 Access</p>
            <p>✔ Security Guard</p>
            <p>✔ EV Charging</p>
            <p>✔ Reserved Slot</p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-8 rounded-3xl shadow-lg">
          <h2 className="text-3xl font-bold mb-6">
            Description
          </h2>

          <p className="text-gray-700 leading-relaxed text-lg">
            Secure and spacious covered parking available in Whitefield,
            Bangalore. Ideal for monthly and yearly parking needs with
            CCTV surveillance, 24/7 security and easy accessibility.
          </p>
        </div>
      </div>
    </div>
  );
}