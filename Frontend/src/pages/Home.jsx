import {
  BellAlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import { Helmet } from "react-helmet"; // <-- import Helmet
import EconomicCenterNews from "../components/EconomicCenterNews";
import FeatureCards from "../components/FeatureCards";
import Footer from "../components/Footer";
import MarketOperations from "../components/MarketOperations";
import Navbar from "../components/Navbar";
import NewsWidget from "../components/NewsWidget";
import ServiceSection from "../components/ServiceSection";
import VisionMission from "../components/VisionMission";
import WelcomeSection from "../components/WelcomeSection";

const Home = () => {
  const [isOpen, setIsOpen] = useState(false);
  const hasNews = true; // Your actual logic here

  return (
    <div>
      {/* Helmet for SEO */}
      <Helmet>
        <title>Dambulla Economic Center - Home</title>
        <meta
          name="description"
          content="Welcome to Dambulla Economic Center. Discover market operations, news, and services."
        />
        <meta
          name="keywords"
          content="Dambulla, Economic Center, Market Operations, News, Services"
        />
        <meta name="author" content="Dambulla Economic Center" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Add Open Graph tags for better social sharing */}
        <meta property="og:title" content="Dambulla Economic Center" />
        <meta
          property="og:description"
          content="Discover market operations, news, and services at Dambulla Economic Center."
        />
        <meta property="og:type" content="website" />
        {/* You can add favicon or other head elements here */}
      </Helmet>

      <Navbar />
      <WelcomeSection />

      <FeatureCards />
      <VisionMission />
      <ServiceSection />
      <MarketOperations />
      <EconomicCenterNews />
      <Footer />

      {/* Slide-out News Panel */}
      <div
        className={`fixed top-1/4 left-0 z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="bg-white shadow-2xl border-l-4 border-green-600 rounded-r-xl w-80 p-4">
          <div className="flex items-center gap-2 mb-2">
            <BellAlertIcon className="h-5 w-5 text-green-700 animate-bounce" />
            <h3 className="text-green-800 font-semibold text-lg">Center News</h3>
          </div>
          <NewsWidget />
        </div>
      </div>

      {/* Call Button */}
      <a
        href="tel:+066-2285181"
        className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 hover:bg-green-700 transition-all duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a2 2 0 011.94 1.52l.58 2.32a2 2 0 01-.45 1.86L8.1 10.9a11.05 11.05 0 005.01 5.01l2.2-2.2a2 2 0 011.86-.45l2.32.58A2 2 0 0121 17.72V21a2 2 0 01-2 2h-.28C9.95 23 1 14.05 1 3.28V3a2 2 0 012-2z"
          />
        </svg>
        Call Center
      </a>

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/3 left-0 z-50 bg-green-600 text-white p-2 rounded-r-lg shadow-md transition-all duration-300 hover:bg-green-700 ${
          hasNews && !isOpen ? "animate-pulse" : ""
        }`}
      >
        <div className="relative">
          {isOpen ? (
            <ChevronLeftIcon className="h-6 w-6" />
          ) : (
            <ChevronRightIcon className="h-6 w-6" />
          )}
          {/* Notification Dot */}
          {hasNews && !isOpen && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
          )}
        </div>
      </button>
    </div>
  );
};

export default Home;
