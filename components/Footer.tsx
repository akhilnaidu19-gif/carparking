import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-12 px-6">

      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">

        <div>
          <h3 className="text-xl font-bold mb-4">
            CarParking Bangalore
          </h3>

          <p className="text-gray-400">
            Smart parking marketplace for customers and owners.
          </p>
        </div>

        <div>
          <h4 className="font-bold mb-4">
            Quick Links
          </h4>

          <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-gray-400">

            <li>
              <Link href="/">Home</Link>
            </li>

            <li>
              <Link href="/bookings">Bookings</Link>
            </li>

            <li>
              <Link href="/dashboard">Dashboard</Link>
            </li>

            <li>
              <Link href="/wishlist">Wishlist</Link>
            </li>

            <li>
  <Link href="/support">Support</Link>
</li>

<li>
  <Link href="/contact">Contact</Link>
</li>



          </ul>

        </div>

        <div>

          <h4 className="font-bold mb-4">
            Contact
          </h4>

          <ul className="space-y-2 text-gray-400">

            <li>Bangalore, India</li>

            <li>
              akhilnaidu19@gmail.com
            </li>

            <li>
              +91 9206687300
            </li>

          </ul>

        </div>

        <div>

  <h4 className="font-bold mb-4">
    Follow Us
  </h4>

  <ul className="space-y-2 text-gray-400">

    <li>Instagram</li>

    <li>Facebook</li>

    <li>LinkedIn</li>

  </ul>

</div>

      </div>

      <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500">

        <div className="flex flex-col md:flex-row justify-between items-center gap-3">

  <p>
    © 2026 CarParking Bangalore
  </p>

  <div className="flex gap-6">

    <Link href="/privacy">
      Privacy Policy
    </Link>

    <Link href="/terms">
      Terms & Conditions
    </Link>

  </div>

</div>

      </div>

    </footer>
  );
}