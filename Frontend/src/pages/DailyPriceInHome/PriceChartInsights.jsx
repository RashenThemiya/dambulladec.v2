import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
    CalendarDays,
    CircleDollarSign,
    TrendingDown,
    TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const formatPrice = (value) => {
    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
        return value ?? "-";
    }

    return new Intl.NumberFormat("en-LK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(numericValue);
};

const PriceChartInsights = ({
    data = [],
    productName = "Product",
}) => {
    const { t } = useTranslation();

    if (!Array.isArray(data) || data.length === 0) {
        return null;
    }

    const sortedData = [...data].sort(
        (first, second) =>
            new Date(first.date) - new Date(second.date)
    );

    const latestRecord =
        sortedData[sortedData.length - 1];

    const previousRecord =
        sortedData.length > 1
            ? sortedData[sortedData.length - 2]
            : null;

    const latestMin = Number(latestRecord.min_price);
    const latestMax = Number(latestRecord.max_price);

    const latestAverage =
        (latestMin + latestMax) / 2;

    const previousAverage = previousRecord
        ? (Number(previousRecord.min_price) +
              Number(previousRecord.max_price)) /
          2
        : latestAverage;

    const isUpward =
        latestAverage >= previousAverage;

    const TrendIcon = isUpward
        ? TrendingUp
        : TrendingDown;

    const translatedProductName = t(productName, {
        defaultValue: productName,
    });

    const cards = [
        {
            id: "range",
            icon: CircleDollarSign,
            title: t("priceInsights.priceRange", {
                defaultValue: "Price Range",
            }),
            value: `Rs. ${formatPrice(
                latestMin
            )} - ${formatPrice(latestMax)}`,
            description: t(
                "priceInsights.minMaxPrice",
                {
                    defaultValue: "MIN - MAX Price",
                }
            ),
        },
        {
            id: "date",
            icon: CalendarDays,
            title: t("priceInsights.latestUpdate", {
                defaultValue: "Latest Update",
            }),
            value: format(
                parseISO(latestRecord.date),
                "dd MMM yyyy"
            ),
            description: t(
                "priceInsights.mostRecentData",
                {
                    defaultValue:
                        "Most Recent Data",
                }
            ),
        },
        {
            id: "trend",
            icon: TrendIcon,
            title: t("priceInsights.trendAnalysis", {
                defaultValue: "Trend Analysis",
            }),
            value: isUpward
                ? t("priceInsights.upward", {
                      defaultValue: "Upward",
                  })
                : t("priceInsights.downward", {
                      defaultValue: "Downward",
                  }),
            description: t(
                "priceInsights.marketMovements",
                {
                    defaultValue:
                        "Market Movements",
                }
            ),
        },
    ];

    return (
        <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white px-4 pb-10 pt-12 sm:px-6 lg:px-8"
        >
            <div
                className="
                    mx-auto grid w-full max-w-[1320px]
                    grid-cols-1 gap-10
                    xl:grid-cols-[1.15fr_2fr]
                    xl:items-center
                "
            >
                {/* Overview */}
                <div>
                    <h1
                        className="
                            text-[34px] font-extrabold
                            leading-[1.08] text-black
                            sm:text-[42px]
                        "
                    >
                        <span className="block text-[#087b36]">
                            {translatedProductName}
                        </span>

                        {t(
                            "priceInsights.overviewTitle",
                            {
                                defaultValue:
                                    "Market Price Overview",
                            }
                        )}
                    </h1>

                    <p
                        className="
                            mt-4 max-w-[520px]
                            text-[15px] leading-relaxed
                            text-[#777777]
                            sm:text-[16px]
                        "
                    >
                        {t(
                            "priceInsights.overviewDescription",
                            {
                                defaultValue:
                                    "Monitor daily minimum and maximum market prices to identify trends, compare historical data, and make informed trading decisions.",
                            }
                        )}
                    </p>
                </div>

                {/* Statistic cards */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {cards.map((card, index) => {
                        const Icon = card.icon;

                        return (
                            <motion.article
                                key={card.id}
                                initial={{
                                    opacity: 0,
                                    y: 15,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    duration: 0.4,
                                    delay:
                                        index * 0.08,
                                }}
                                className="
                                    min-h-[175px]
                                    rounded-[9px]
                                    border border-[#dce9df]
                                    bg-white px-5 py-4
                                    shadow-[0_2px_8px_rgba(0,0,0,0.08)]
                                    transition-all duration-300
                                    hover:-translate-y-1
                                    hover:shadow-md
                                "
                            >
                                <div
                                    className="
                                        flex h-[60px] w-[60px]
                                        items-center justify-center
                                        rounded-full bg-[#edf7ea]
                                        text-[#087b36]
                                    "
                                >
                                    <Icon
                                        size={31}
                                        strokeWidth={2}
                                    />
                                </div>

                                <h2 className="mt-4 text-[15px] font-semibold text-[#222222]">
                                    {card.title}
                                </h2>

                                <p className="mt-1 text-[20px] font-extrabold leading-tight text-[#087b36]">
                                    {card.value}
                                </p>

                                <p className="mt-1 text-[13px] text-[#777777]">
                                    {card.description}
                                </p>
                            </motion.article>
                        );
                    })}
                </div>
            </div>
        </motion.section>
    );
};

export default PriceChartInsights;