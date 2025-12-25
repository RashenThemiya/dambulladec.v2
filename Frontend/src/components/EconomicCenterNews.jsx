import {
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  List,
  Megaphone,
  Newspaper,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import api from "../utils/axiosInstance";

// Icon mapping
const icons = {
  all: <List className="w-5 h-5" />,
  notice: <Megaphone className="w-5 h-5" />,
  announcement: <Bell className="w-5 h-5" />,
  news: <Newspaper className="w-5 h-5" />,
  event: <Calendar className="w-5 h-5" />,
};

// Color mappings for border accents and background
const typeColors = {
  notice: "border-yellow-400 bg-yellow-50 text-yellow-800",
  announcement: "border-green-400 bg-green-50 text-green-800",
  news: "border-green-400 bg-green-50 text-green-800", // Green theme for news
  event: "border-green-400 bg-green-50 text-green-800", // Green theme for event
  default: "border-green-300 bg-green-50 text-green-700", // Default green theme
};

// ✅ Helper to make URLs clickable
const linkify = (text) => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.split(urlRegex).map((part, index) =>
    urlRegex.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
};

const EconomicCenterNews = () => {
  const [publications, setPublications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const sliderRef = useRef(null);

  const getUniquePublications = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  useEffect(() => {
    const fetchPublications = async () => {
      try {
        const res = await api.get("/api/publications");
        const uniquePubs = getUniquePublications(res.data);
        setPublications(uniquePubs);
        setFiltered(uniquePubs);
      } catch (err) {
        console.error("Failed to fetch publications", err);
      }
    };

    fetchPublications();
  }, []);

  useEffect(() => {
    if (activeTab === "all") {
      setFiltered(publications);
    } else {
      const filteredData = publications.filter((pub) => pub.type === activeTab);
      setFiltered(getUniquePublications(filteredData));
    }
  }, [activeTab, publications]);

  const sliderSettings = {
    dots: false,
    infinite: filtered.length > 3,
    speed: 500,
    slidesToShow: Math.min(filtered.length, 3),
    slidesToScroll: 1,
    autoplay: filtered.length > 1,
    autoplaySpeed: 3000,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 640,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  const getCardClasses = (type) => {
    return typeColors[type] || typeColors.default;
  };

  const PostCard = ({ pub }) => (
    <div
      className={`rounded-xl p-5 border shadow-md w-full flex flex-col justify-between transition transform hover:scale-105 hover:shadow-xl hover:bg-gray-100 cursor-pointer duration-300 ${getCardClasses(
        pub.type
      )}`}
    >
      {pub.image && (
        <img
          src={pub.image}
          alt={pub.topic}
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
      )}
      <div className="flex items-center gap-2 mb-2">
        {icons[pub.type] || icons["all"]}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{pub.topic}</h3>
      <p className="text-gray-700 text-sm">{linkify(pub.description)}</p>
    </div>
  );

  return (
    <section className="bg-green-100 py-10 px-4 md:px-12">
      <h2 className="text-4xl font-bold text-center mb-8 text-green-800">
        Economic Center News
      </h2>

      {/* Filter Tabs */}
      <div className="flex justify-center gap-2 flex-wrap mb-6">
        {["all", "notice", "announcement", "news", "event"].map((type) => (
          <button
            key={type}
            onClick={() => setActiveTab(type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition ${
              activeTab === type
                ? "bg-green-600 text-white border-green-600 shadow-md"
                : "bg-white text-green-700 border-green-300 hover:bg-green-100"
            }`}
          >
            {icons[type]}
            <span className="capitalize">{type}</span>
          </button>
        ))}
      </div>

      {/* Navigation Arrows */}
      {filtered.length > 1 && (
        <div className="flex justify-end items-center mb-4 gap-2 pr-4">
          <button
            onClick={() => sliderRef.current?.slickPrev()}
            className="p-2 rounded-full bg-white shadow hover:bg-green-100"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-green-600" />
          </button>
          <button
            onClick={() => sliderRef.current?.slickNext()}
            className="p-2 rounded-full bg-white shadow hover:bg-green-100"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-green-600" />
          </button>
        </div>
      )}

      {/* Publications */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">No publications found.</p>
      ) : filtered.length === 1 ? (
        <div className="flex justify-center">
          <div className="max-w-sm w-full">
            <PostCard pub={filtered[0]} />
          </div>
        </div>
      ) : (
        <Slider {...sliderSettings} ref={sliderRef}>
          {filtered.map((pub) => (
            <div key={pub.id} className="px-2">
              <PostCard pub={pub} />
            </div>
          ))}
        </Slider>
      )}
    </section>
  );
};

export default EconomicCenterNews;
