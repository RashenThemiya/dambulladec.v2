import {
  Bell,
  CalendarDays,
  Megaphone,
  Newspaper,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../../utils/axiosInstance";

const categoryConfig = {
  notice: {
    icon: Megaphone,
    styles: "border-amber-200 bg-amber-50 text-amber-700",
  },
  announcement: {
    icon: Bell,
    styles: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  news: {
    icon: Newspaper,
    styles: "border-blue-200 bg-blue-50 text-blue-700",
  },
  event: {
    icon: CalendarDays,
    styles: "border-purple-200 bg-purple-50 text-purple-700",
  },
};

const linkify = (text) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split(urlRegex).map((part, index) => {
    const isUrl = /^https?:\/\/[^\s]+$/.test(part);

    if (!isUrl) {
      return <span key={index}>{part}</span>;
    }

    return (
      <a
        key={`${part}-${index}`}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-blue-600 underline underline-offset-2 hover:text-blue-800"
      >
        {part}
      </a>
    );
  });
};

const NewsWidget = () => {
  const { t, i18n } = useTranslation();

  const [news, setNews] = useState([]);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/api/publications");

        const latestItems = Array.isArray(response.data)
          ? response.data.slice(0, 5)
          : [];

        setNews(latestItems);
      } catch (requestError) {
        console.error("Failed to load news widget:", requestError);

        setError(
          t("newsWidget.loadError", {
            defaultValue: "Unable to load recent news.",
          })
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [t]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return;

      if (selectedItem) {
        setSelectedItem(null);
        setIsExpanded(false);
        return;
      }

      setIsWidgetOpen(false);
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem) return;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedItem]);

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const language = i18n.language?.split("-")[0] || "en";

    const localeMap = {
      en: "en-LK",
      si: "si-LK",
      ta: "ta-LK",
    };

    return new Intl.DateTimeFormat(localeMap[language] || "en-LK", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(date);
  };

  const getCategory = (type) => {
    return categoryConfig[type] || categoryConfig.news;
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setIsExpanded(false);
  };

  const closeDetails = () => {
    setSelectedItem(null);
    setIsExpanded(false);
  };

  const longDescription = selectedItem?.description?.length > 300;

  return (
    <>
      {/* Floating news button */}
      <button
        type="button"
        onClick={() => setIsWidgetOpen((current) => !current)}
        aria-label={t("newsWidget.title", {
          defaultValue: "Latest Updates",
        })}
        aria-expanded={isWidgetOpen}
        className="
          fixed bottom-5 left-4 z-[90]
          flex h-12 w-12 items-center justify-center
          rounded-full bg-[#087b36] text-white
          shadow-lg transition-colors duration-200
          hover:bg-[#06652d]
          focus:outline-none focus-visible:ring-4
          focus-visible:ring-green-300
          sm:bottom-6 sm:left-6
        "
      >
        {isWidgetOpen ? <X size={21} /> : <Bell size={21} />}

        {!isWidgetOpen && news.length > 0 && (
          <span
            className="
              absolute -right-1 -top-1
              flex h-5 min-w-5 items-center justify-center
              rounded-full border-2 border-white
              bg-red-500 px-1
              text-[10px] font-bold text-white
            "
          >
            {news.length}
          </span>
        )}
      </button>

      {/* News popup */}
      <div
        className={`
          fixed bottom-[82px] left-4 z-[80]
          w-[calc(100%-2rem)] max-w-[380px]
          origin-bottom-left
          rounded-2xl border border-gray-200
          bg-white shadow-2xl
          transition-all duration-200
          sm:bottom-[88px] sm:left-6 sm:w-[380px]
          ${
            isWidgetOpen
              ? "visible translate-y-0 scale-100 opacity-100"
              : "invisible translate-y-3 scale-95 opacity-0"
          }
        `}
      >
        {/* Popup header */}
        <div
          className="
            flex items-center justify-between
            rounded-t-2xl bg-[#087b36]
            px-5 py-4 text-white
          "
        >
          <div className="flex items-center gap-3">
            <span
              className="
                flex h-9 w-9 items-center justify-center
                rounded-full bg-white/15
              "
            >
              <Bell size={18} />
            </span>

            <div>
              <h3 className="font-bold">
                {t("newsWidget.title", {
                  defaultValue: "Latest Updates",
                })}
              </h3>

              <p className="mt-0.5 text-xs text-white/75">
                {t("newsWidget.subtitle", {
                  defaultValue:
                    "Recent notices, announcements, news and events.",
                })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWidgetOpen(false)}
            aria-label={t("newsWidget.closeWidget", {
              defaultValue: "Close latest updates",
            })}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-full text-white/80
              transition hover:bg-white/15 hover:text-white
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* Popup body */}
        <div className="p-3">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="
                    flex animate-pulse gap-3
                    rounded-xl border border-gray-100 p-3
                  "
                >
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-200" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-gray-200" />
                    <div className="h-4 w-full rounded bg-gray-200" />
                    <div className="h-3 w-4/5 rounded bg-gray-200" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <div
              className="
                rounded-xl border border-red-200
                bg-red-50 px-4 py-8
                text-center text-sm text-red-700
              "
            >
              {error}
            </div>
          )}

          {!loading && !error && news.length === 0 && (
            <div
              className="
                rounded-xl border border-dashed border-gray-300
                bg-gray-50 px-4 py-8
                text-center text-sm text-gray-500
              "
            >
              {t("newsWidget.noNews", {
                defaultValue: "No recent news.",
              })}
            </div>
          )}

          {!loading && !error && news.length > 0 && (
            <ul className="max-h-[410px] space-y-2 overflow-y-auto pr-1">
              {news.map((item) => {
                const category = getCategory(item.type);
                const CategoryIcon = category.icon;

                return (
                  <li key={item.id || item._id}>
                    <button
                      type="button"
                      onClick={() => openDetails(item)}
                      className="
                        group flex w-full items-start gap-3
                        rounded-xl border border-transparent
                        p-3 text-left
                        transition-colors duration-200
                        hover:border-green-100
                        hover:bg-green-50/70
                      "
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.topic || "News"}
                          className="
                            h-[72px] w-[72px] shrink-0
                            rounded-lg object-cover
                          "
                        />
                      ) : (
                        <div
                          className="
                            flex h-[72px] w-[72px] shrink-0
                            items-center justify-center
                            rounded-lg bg-gray-100
                            text-[11px] text-gray-400
                          "
                        >
                          {t("newsWidget.noImage", {
                            defaultValue: "No image",
                          })}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`
                              inline-flex items-center gap-1
                              rounded-full border
                              px-2 py-1 text-[10px] font-semibold
                              ${category.styles}
                            `}
                          >
                            <CategoryIcon size={12} />

                            {t(`news.categories.${item.type || "news"}`, {
                              defaultValue: item.type || "News",
                            })}
                          </span>

                          {(item.date || item.createdAt) && (
                            <span className="text-[10px] text-gray-400">
                              {formatDate(item.date || item.createdAt)}
                            </span>
                          )}
                        </div>

                        <h4
                          className="
                            mt-2 line-clamp-2
                            text-sm font-semibold leading-snug
                            text-gray-900
                            group-hover:text-[#087b36]
                          "
                        >
                          {item.topic}
                        </h4>

                        <p
                          className="
                            mt-1 line-clamp-2
                            text-xs leading-relaxed text-gray-500
                          "
                        >
                          {item.description}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* News details modal */}
      {selectedItem && (
        <div
          className="
            fixed inset-0 z-[120]
            flex items-center justify-center
            bg-black/60 p-4
            backdrop-blur-sm
          "
          onMouseDown={closeDetails}
        >
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-details-title"
            onMouseDown={(event) => event.stopPropagation()}
            className="
              relative max-h-[90vh] w-full max-w-2xl
              overflow-y-auto rounded-2xl
              bg-white shadow-2xl
            "
          >
            <button
              type="button"
              onClick={closeDetails}
              aria-label={t("newsWidget.close", {
                defaultValue: "Close news details",
              })}
              className="
                absolute right-4 top-4 z-10
                flex h-9 w-9 items-center justify-center
                rounded-full bg-black/55 text-white
                transition hover:bg-black/75
              "
            >
              <X size={20} />
            </button>

            {selectedItem.image ? (
              <img
                src={selectedItem.image}
                alt={selectedItem.topic || "News"}
                className="
                  h-[230px] w-full rounded-t-2xl
                  object-cover sm:h-[340px]
                "
              />
            ) : (
              <div
                className="
                  flex h-[230px] items-center justify-center
                  rounded-t-2xl bg-gray-100
                  text-gray-400 sm:h-[340px]
                "
              >
                {t("newsWidget.noImage", {
                  defaultValue: "No image",
                })}
              </div>
            )}

            <div className="p-5 sm:p-7">
              {(() => {
                const category = getCategory(selectedItem.type);
                const CategoryIcon = category.icon;

                return (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span
                      className={`
                        inline-flex items-center gap-2
                        rounded-full border px-3 py-1.5
                        text-xs font-semibold
                        ${category.styles}
                      `}
                    >
                      <CategoryIcon size={15} />

                      {t(
                        `news.categories.${selectedItem.type || "news"}`,
                        {
                          defaultValue: selectedItem.type || "News",
                        }
                      )}
                    </span>

                    {(selectedItem.date || selectedItem.createdAt) && (
                      <span className="text-sm text-gray-500">
                        {formatDate(
                          selectedItem.date || selectedItem.createdAt
                        )}
                      </span>
                    )}
                  </div>
                );
              })()}

              <h2
                id="news-details-title"
                className="mt-4 text-2xl font-bold leading-tight text-gray-900"
              >
                {selectedItem.topic}
              </h2>

              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {isExpanded || !longDescription
                  ? linkify(selectedItem.description)
                  : linkify(
                      `${selectedItem.description.slice(0, 300)}...`
                    )}
              </div>

              {longDescription && (
                <div className="mt-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setIsExpanded((currentValue) => !currentValue)
                    }
                    className="
                      text-sm font-semibold text-[#087b36]
                      hover:underline
                    "
                  >
                    {isExpanded
                      ? t("newsWidget.showLess", {
                          defaultValue: "Show less",
                        })
                      : t("newsWidget.readMore", {
                          defaultValue: "Read more",
                        })}
                  </button>
                </div>
              )}
            </div>
          </article>
        </div>
      )}
    </>
  );
};

export default NewsWidget;