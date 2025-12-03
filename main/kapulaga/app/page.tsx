import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-zinc-200">
        <div className="container mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Image src="/logo.png" alt="Kapulaga" width={120} height={40} className="h-10 w-auto" />
            <div className="flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900">
                Features
              </a>
              <a href="#products" className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900">
                Products
              </a>
              <a href="#about" className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900">
                About
              </a>
              <button className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <section className="container mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-5xl font-bold leading-tight text-zinc-900 md:text-6xl">
              Modern ERP Solutions for Hotels & Cafes
            </h1>
            <p className="mb-10 text-xl text-zinc-600 md:text-2xl">
              Streamline your operations, boost efficiency, and grow your business with our powerful, intuitive ERP platform.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button className="rounded-lg bg-zinc-900 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:bg-zinc-800">
                Get Started
              </button>
              <button className="rounded-lg border-2 border-zinc-900 px-8 py-4 text-lg font-semibold text-zinc-900 transition-all hover:scale-105 hover:bg-zinc-50">
                Watch Demo
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-zinc-50 py-24">
          <div className="container mx-auto max-w-6xl px-6">
            <h2 className="mb-16 text-center text-4xl font-bold text-zinc-900">
              Everything You Need to Run Your Business
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 bg-white p-8 transition-all hover:scale-105 hover:shadow-lg">
                <h3 className="mb-3 text-xl font-semibold text-zinc-900">Hotel Management</h3>
                <p className="text-zinc-600">
                  Complete suite for reservations, front desk operations, housekeeping, and guest services.
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-8 transition-all hover:scale-105 hover:shadow-lg">
                <h3 className="mb-3 text-xl font-semibold text-zinc-900">Cafe & Restaurant</h3>
                <p className="text-zinc-600">
                  Point of sale, inventory management, kitchen operations, and menu planning all in one place.
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-white p-8 transition-all hover:scale-105 hover:shadow-lg">
                <h3 className="mb-3 text-xl font-semibold text-zinc-900">Analytics & Insights</h3>
                <p className="text-zinc-600">
                  Real-time reporting and data analytics to make informed business decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-24">
          {/* Hotel ERP - Image Left */}
          <div className="relative flex items-center overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-1/2">
              <div className="relative h-full w-full">
                <Image
                  src="/hotel.png "
                  alt="Hotel ERP"
                  fill
                  className="object-cover"
                />
                <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-white to-transparent"></div>
              </div>
            </div>
            <div className="container mx-auto max-w-6xl px-6">
              <div className="ml-auto w-full md:w-1/2">
                <div className="py-16">
                  <h3 className="mb-4 text-3xl font-bold text-zinc-900">Hotel ERP</h3>
                  <p className="mb-6 text-lg text-zinc-600">
                    Complete hotel management system covering front desk, housekeeping, reservations, guest services, and operations management.
                  </p>
                  <ul className="mb-8 space-y-3 text-zinc-600">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
                      Front Desk & Check-in/out
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
                      Housekeeping Management
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
                      Guest Services & Wake-up Calls
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
                      Lost & Found Tracking
                    </li>
                  </ul>
                  <button className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-zinc-800">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cafe & Restaurant ERP - Image Right */}
          <div className="relative mt-24 flex items-center overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-1/2">
              <div className="relative h-full w-full">
                <Image
                  src="/resto-erp.jpg"
                  alt="Cafe & Restaurant ERP"
                  fill
                  className="object-cover"
                />
                <div className="absolute left-0 top-0 h-full w-48 bg-gradient-to-r from-white to-transparent"></div>
              </div>
            </div>
            <div className="container mx-auto max-w-6xl px-6">
              <div className="w-full md:w-1/2">
                <div className="py-16">
                  <h3 className="mb-4 text-3xl font-bold text-zinc-900">Cafe & Restaurant ERP</h3>
                  <p className="mb-6 text-lg text-zinc-600">
                    Comprehensive restaurant management system with POS, kitchen operations, inventory, and staff management.
                  </p>
                  <ul className="mb-8 space-y-3 text-zinc-600">
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
                      Point of Sale System
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
                      Kitchen Order Management
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
                      Menu & Inventory Control
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
                      Staff Scheduling & Payroll
                    </li>
                  </ul>
                  <button className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-all hover:scale-105 hover:bg-zinc-800">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-4xl font-bold text-zinc-900">
              Ready to Transform Your Business?
            </h2>
            <p className="mb-8 text-xl text-zinc-600">
              Join hundreds of hotels and cafes already using Kapulaga.
            </p>
            <button className="rounded-lg bg-zinc-900 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:bg-zinc-800">
              Schedule a Demo
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="container mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Image src="/logo.png" alt="Kapulaga" width={120} height={40} className="mb-4 h-8 w-auto" />
              <p className="text-sm text-zinc-600">
                Modern ERP solutions for hospitality businesses.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-zinc-900">Product</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li><a href="#" className="hover:text-zinc-900">Features</a></li>
                <li><a href="#" className="hover:text-zinc-900">Pricing</a></li>
                <li><a href="#" className="hover:text-zinc-900">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-zinc-900">Company</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li><a href="#" className="hover:text-zinc-900">About</a></li>
                <li><a href="#" className="hover:text-zinc-900">Blog</a></li>
                <li><a href="#" className="hover:text-zinc-900">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-zinc-900">Support</h3>
              <ul className="space-y-2 text-sm text-zinc-600">
                <li><a href="#" className="hover:text-zinc-900">Help Center</a></li>
                <li><a href="#" className="hover:text-zinc-900">Contact</a></li>
                <li><a href="#" className="hover:text-zinc-900">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-600">
            <p>&copy; 2024 Kapulaga. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
