import { Bell, Calendar, List, Megaphone, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

const icons = {
  notice: <Megaphone className="w-4 h-4 text-yellow-500" />,
  announcement: <Bell className="w-4 h-4 text-green-500" />,
  news: <Newspaper className="w-4 h-4 text-blue-500" />,
  event: <Calendar className="w-4 h-4 text-purple-500" />,
  all: <List className="w-4 h-4 text-gray-500" />,
};

// 🔗 Helper to make URLs clickable
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

const NewsWidget = () => {
  const [news, setNews] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get("/api/publications");
        setNews(res.data.slice(0, 5)); // Show latest 5 items
      } catch (err) {
        console.error("Failed to fetch widget news", err);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedItem(null);
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleClose = () => {
    setSelectedItem(null);
    setIsExpanded(false);
  };

  const isLongText = selectedItem?.description?.length > 200;

  return (
    <div className="text-sm relative">
      {news.length === 0 ? (
        <p className="text-gray-500">No recent news.</p>
      ) : (
        <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {news.map((item) => (
            <li
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="cursor-pointer flex items-start gap-3 border-b pb-2 hover:bg-gray-50 p-2 rounded"
            >
              {/* Thumbnail Image */}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.topic}
                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}

              {/* Text and icon */}
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
                  {icons[item.type] || icons["all"]}
                  <span className="capitalize font-medium">{item.type}</span>
                </div>
                <div className="font-medium text-gray-800 line-clamp-2 text-sm">
                  {item.topic}
                </div>
                <p className="text-gray-500 text-xs line-clamp-2">
                  {linkify(item.description)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white max-w-lg w-full rounded-xl shadow-xl p-6 relative">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
              onClick={handleClose}
            >
              &times;
            </button>

            {/* Image */}
            <div className="mb-4">
              {selectedItem.image ? (
                <img
                  src={selectedItem.image}
                  alt={selectedItem.topic}
                  className="w-full h-48 object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
              {icons[selectedItem.type] || icons["all"]}
              <span className="capitalize font-semibold">
                {selectedItem.type}
              </span>
            </div>

            {/* Topic */}
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {selectedItem.topic}
            </h2>

            {/* Description */}
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {isExpanded || !isLongText
                ? linkify(selectedItem.description)
                : linkify(selectedItem.description.slice(0, 200) + "...")}
            </p>

            {/* Read More */}
            {isLongText && (
              <div className="mt-2 text-right">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-blue-600 hover:underline text-xs font-medium"
                >
                  {isExpanded ? "Show Less" : "Read More"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsWidget;
