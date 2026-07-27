import { motion } from "framer-motion";
import { CalendarDays, Download, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toDriveDownloadUrl } from "../../utils/driveDownloard";

const badgeStyles = {
    notice: "border-[#B78300] bg-[#FFF1BE] text-[#8A6500]",
    announcement: "border-blue-500 bg-blue-50 text-blue-700",
    news: "border-green-500 bg-green-50 text-green-700",
    event: "border-purple-500 bg-purple-50 text-purple-700",
};

const NewsCard = ({ item }) => {
    const { t, i18n } = useTranslation();

    const category = item.type?.toLowerCase() || "news";

    const localeMap = {
        en: "en-LK",
        si: "si-LK",
        ta: "ta-LK",
    };

    const formatDate = (value) => {
        if (!value) {
            return "-";
        }

        const parsedDate = new Date(value);

        if (Number.isNaN(parsedDate.getTime())) {
            return value;
        }

        const currentLanguage =
            i18n.language?.split("-")[0] || "en";

        return new Intl.DateTimeFormat(
            localeMap[currentLanguage] || "en-LK",
            {
                year: "numeric",
                month: "short",
                day: "2-digit",
            }
        ).format(parsedDate);
    };

    const handleView = () => {
        if (!item.fileUrl) {
            return;
        }

        window.open(
            item.fileUrl,
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <motion.article
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="
                flex h-full min-h-[348px] w-full flex-col
                rounded-[8px] border border-green-100
                bg-white p-3
                shadow-[0_6px_22px_rgba(0,90,35,0.10)]
                transition-shadow duration-300
                hover:shadow-[0_10px_28px_rgba(0,90,35,0.16)]
            "
        >
            {/* Image */}
            <div className="h-[132px] overflow-hidden rounded-[7px] border border-green-300 bg-gray-100">
                <img
                    src={item.image}
                    alt={
                        item.title ||
                        t("news.cardImageAlt", {
                            defaultValue: "Publication image",
                        })
                    }
                    className="h-full w-full object-cover"
                />
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col pt-3">
                {item.title && (
                    <h3 className="text-[16px] font-semibold leading-snug text-gray-800">
                        {item.title}
                    </h3>
                )}

                <p className="mt-2 line-clamp-5 text-[14px] leading-[1.2] text-[#5f5f5f]">
                    {item.description}
                </p>

                {/* Date and category */}
                <div className="mt-auto flex items-center justify-between gap-3 border-y border-gray-200 py-3">
                    <div className="flex min-w-0 items-center gap-2 text-[12px] text-gray-700">
                        <CalendarDays
                            size={15}
                            strokeWidth={2}
                            className="shrink-0 text-[#00843d]"
                        />

                        <span className="truncate font-medium">
                            {formatDate(
                                item.date ||
                                    item.createdAt ||
                                    item.created_at
                            )}
                        </span>
                    </div>

                    <span
                        className={`
                            shrink-0 rounded-full border
                            px-3 py-1 text-[12px] font-medium
                            ${
                                badgeStyles[category] ||
                                badgeStyles.news
                            }
                        `}
                    >
                        {t(`news.categories.${category}`, {
                            defaultValue: category,
                        })}
                    </span>
                </div>

                {/* Buttons */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={handleView}
                        disabled={!item.fileUrl}
                        className="
                            inline-flex items-center justify-center gap-2
                            rounded-[7px] border-2 border-[#087b36]
                            bg-white px-3 py-2.5
                            text-sm font-semibold text-[#087b36]
                            transition-colors duration-200
                            hover:bg-green-50
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <Eye size={20} strokeWidth={2.2} />

                        {t("news.view", {
                            defaultValue: "View",
                        })}
                    </button>

                    <a
                        href={
                            item.fileUrl
                                ? toDriveDownloadUrl(item.fileUrl)
                                : undefined
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                            inline-flex items-center justify-center gap-2
                            rounded-[7px] bg-[#087b36]
                            px-3 py-2.5
                            text-sm font-semibold text-white
                            transition-colors duration-200
                            hover:bg-[#06672d]
                            ${
                                !item.fileUrl
                                    ? "pointer-events-none opacity-50"
                                    : ""
                            }
                        `}
                    >
                        <Download size={20} strokeWidth={2.2} />

                        {t("news.download", {
                            defaultValue: "Download",
                        })}
                    </a>
                </div>
            </div>
        </motion.article>
    );
};

export default NewsCard;