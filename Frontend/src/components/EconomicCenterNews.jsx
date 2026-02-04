import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Calendar,
  Megaphone,
  Newspaper,
  Bell,
  ArrowRight,
  List,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { toDriveDownloadUrl } from "../utils/driveDownloard";

/* ------------------ Categories ------------------ */
const categories = [
  { key: "all", label: "All", icon: List },
  { key: "notice", label: "Notice", icon: Megaphone },
  { key: "announcement", label: "Announcement", icon: Bell },
  { key: "news", label: "News", icon: Newspaper },
  { key: "event", label: "Event", icon: Calendar },
];

/* ------------------ Card Component ------------------ */
function NotificationCard({ item }) {
  const badgeColors = {
    news: "bg-blue-500",
    event: "bg-purple-500",
    notice: "bg-yellow-400 text-black",
    announcement: "bg-green-500",
  };

  const badgeText = {
    notice: "Notice",
    news: "News",
    announcement: "Announcement",
    event: "Event",
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        relative rounded-2xl overflow-hidden bg-green-25 shadow-xlg
        border-2 border-gray-200 hover:border-green-500
        transition-all duration-300
        w-full max-w-[450px]
        min-h-[400px]
        flex flex-col mt-6
      "
    >
{/* Top Overlay */}
<div className="absolute top-3 left-3 right-3 flex flex-col gap-2 z-10">
  {/* Badge (unchanged) */}
  <span
    className={`w-fit px-3 py-1 text-sm rounded-full ${badgeColors[item.type]}`}
  >
    {badgeText[item.type]}
  </span>

  {/* Topic (CENTERED) */}
  <div
    className="
      mx-auto
      px-3 py-1
      text-sm font-bold
      rounded-full
      bg-white text-gray-800
      border border-gray-300
      max-w-full
      truncate
      text-center
    "
    title={item.topic}
  >
    {item.topic}
  </div>
</div>



      {/* Image */}
      <div className="relative w-full aspect-square sm:aspect-[4/3] bg-gray-100 mt-12">
        <img
          src={item.image}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-lg">{item.title}</h3>

        <p className="text-sm mt-2 text-gray-500 line-clamp-3">
          {item.description}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
          <button
            onClick={() => window.open(item.fileUrl, "_blank")}
            className="
             w-full sm:w-auto
  min-w-0
  px-4 py-2
  flex items-center justify-center gap-1
  bg-blue-600 text-white font-medium rounded-lg
  shadow hover:bg-blue-800 hover:shadow-lg
  active:scale-95 transition duration-200 cursor-pointer
            "
          >
            View <ArrowRight size={16} className="inline ml-1" />
          </button>

          <a
            href={toDriveDownloadUrl(item.fileUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="
              w-full sm:w-auto
  min-w-0
  px-4 py-2
  flex items-center justify-center gap-2
  bg-green-600 text-white font-medium rounded-lg
  shadow hover:bg-green-700 hover:shadow-lg
  active:scale-95 transition duration-200
            "
          >
            Download <Download size={18} strokeWidth={2.2} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------ Page Component ------------------ */
export default function EconomicCenterNews() {
  const [data, setData] = useState([]);
  const [active, setActive] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: false },
    [Autoplay({ delay: 4500, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => {
    emblaApi && emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi && emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/publications`
      );
      setData(res.data);
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    active === "all" ? data : data.filter((d) => d.type === active);

  return (
    <div className="p-6 sm:p-10 bg-green-50 min-h-screen">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto ">
        <span className="inline-block px-4 py-1 text-sm bg-green-100 text-green-700 rounded-full">
          Latest Updates
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold mt-4">
          Economic Center <span className="text-green-600">News</span>
        </h1>
        <p className="mt-3 text-gray-500">
          Stay informed with the latest announcements and events.
        </p>
      </div>

      {/* Filters */}
      <div className="flex justify-center gap-3 mt-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActive(cat.key)}
            className={`px-4 py-2 rounded-full border border-gray-400 flex items-center gap-2 text-sm transition cursor-pointer ${
              active === cat.key
                ? "bg-green-600 text-white"
                : "bg-white hover:bg-green-50"
            }`}
          >
            <cat.icon size={16} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && <p className="text-center mt-10">Loading...</p>}
      {error && <p className="text-center text-red-500 mt-10">{error}</p>}

      {!loading && !error && (
        <div className="relative mt-12">
          {/* Navigation */}
          <button
            onClick={scrollPrev}
            className="absolute -left-4 sm:-left-6 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-green-50"
          >
            <ChevronLeft />
          </button>

          <button
            onClick={scrollNext}
            className="absolute -right-4 sm:-right-6 top-1/2 -translate-y-1/2 z-10 bg-white shadow rounded-full p-2 hover:bg-green-50"
          >
            <ChevronRight />
          </button>

          {/* Slider */}
          <div className="overflow-hidden px-2 sm:px-6" ref={emblaRef}>
            <div className="flex gap-2">
              {filtered.map((item) => (
                <div
                  key={item._id || item.id}
                  className="
                    flex-shrink-0
                    w-full
                    sm:w-1/2
                    md:w-1/3
                    lg:w-1/4
                    px-2
                  "
                >
                  <NotificationCard item={item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
