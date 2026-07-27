import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    CalendarDays,
    LoaderCircle,
    RefreshCw,
} from "lucide-react";

const DailyPricesPreview = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [dailyPrices, setDailyPrices] = useState([]);
    const [latestDate, setLatestDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const formatDateForApi = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const fetchLatestPrices = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const today = new Date();
            const maximumDaysBack = 30;

            let foundPrices = [];
            let foundDate = "";

            for (
                let daysBack = 0;
                daysBack <= maximumDaysBack;
                daysBack += 1
            ) {
                const requestDate = new Date(today);

                requestDate.setDate(today.getDate() - daysBack);

                const formattedDate = formatDateForApi(requestDate);

                try {
                    const response = await axios.get(
                        `${API_BASE_URL}/api/prices/by-date/${formattedDate}`
                    );

                    if (
                        Array.isArray(response.data) &&
                        response.data.length > 0
                    ) {
                        foundPrices = response.data;
                        foundDate = formattedDate;
                        break;
                    }
                } catch (requestError) {
                    console.error(
                        `Failed to load prices for ${formattedDate}:`,
                        requestError
                    );
                }
            }

            setDailyPrices(foundPrices.slice(0, 6));
            setLatestDate(foundDate);
        } catch (requestError) {
            console.error("Failed to load latest prices:", requestError);

            setError(
                t("dailyPrices.loadError", {
                    defaultValue: "Unable to load daily prices.",
                })
            );

            setDailyPrices([]);
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, t]);

    useEffect(() => {
        fetchLatestPrices();
    }, [fetchLatestPrices]);

    const translateProductName = (productName) => {
        if (!productName) {
            return "-";
        }

        return t(productName, {
            defaultValue: productName,
        });
    };

    const translateProductType = (productType) => {
        if (!productType) {
            return t("types.Uncategorized", {
                defaultValue: "Uncategorized",
            });
        }

        return t(`types.${productType}`, {
            defaultValue: productType,
        });
    };

    const formatPrice = (price) => {
        const numericPrice = Number(price);

        if (Number.isNaN(numericPrice)) {
            return price;
        }

        return new Intl.NumberFormat("en-LK", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numericPrice);
    };

    const getPriceRange = (minPrice, maxPrice) => {
        return `${formatPrice(minPrice)}-${formatPrice(maxPrice)}`;
    };

    const formatDisplayDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const language = i18n.language?.split("-")[0] || "en";

        const localeMap = {
            en: "en-LK",
            si: "si-LK",
            ta: "ta-LK",
        };

        const parsedDate = new Date(`${dateValue}T00:00:00`);

        if (Number.isNaN(parsedDate.getTime())) {
            return dateValue;
        }

        return new Intl.DateTimeFormat(
            localeMap[language] || "en-LK",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
            }
        ).format(parsedDate);
    };

    const handleViewHistory = (productId) => {
    if (!productId) return;

    navigate(`/product/${productId}/chart`);
};

    const handleSeeAllPrices = () => {
        navigate("/home-dailyprice");
    };

    return (
        <section className="bg-white px-2 py-10 sm:px-4 lg:px-5">
    <div className="mx-auto w-[80%]">
                {/* Heading */}
                <div className="mb-8 text-center">
                    <h2 className="text-4xl font-extrabold tracking-tight text-black sm:text-5xl">
                        {t("dailyPrices.previewTitle", {
                            defaultValue: "Daily Prices",
                        })}
                    </h2>

                    {latestDate && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
                            <CalendarDays size={16} />

                            <span>
                                {t("dailyPrices.latestDate", {
                                    defaultValue: "Latest prices:",
                                })}{" "}
                                {formatDisplayDate(latestDate)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex min-h-[260px] items-center justify-center">
                        <div className="flex items-center gap-3 text-[#087d35]">
                            <LoaderCircle
                                size={30}
                                className="animate-spin"
                            />

                            <span className="font-semibold">
                                {t("dailyPrices.loading", {
                                    defaultValue:
                                        "Loading daily prices...",
                                })}
                            </span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
                        <p className="font-medium text-red-700">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={fetchLatestPrices}
                            className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-red-700"
                        >
                            <RefreshCw size={17} />

                            {t("dailyPrices.retry", {
                                defaultValue: "Retry",
                            })}
                        </button>
                    </div>
                )}

                {/* No data */}
                {!loading &&
                    !error &&
                    dailyPrices.length === 0 && (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-14 text-center">
                            <p className="font-semibold text-gray-600">
                                {t("dailyPrices.noDatal1")}
                            </p>

                            <p className="mt-2 text-sm text-gray-500">
                                {t("dailyPrices.noDatal2")}
                            </p>
                        </div>
                    )}

                {/* Price content */}
                {!loading &&
                    !error &&
                    dailyPrices.length > 0 && (
                        <>
                            {/* Desktop table */}
                            <div className="hidden overflow-hidden md:block">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#128238] text-white">
                                            <th className="px-6 py-4 text-left text-sm font-semibold">
                                                {t(
                                                    "dailyPrices.category",
                                                    {
                                                        defaultValue:
                                                            "Category",
                                                    }
                                                )}
                                            </th>

                                            <th className="px-6 py-4 text-center text-sm font-semibold">
                                                {t(
                                                    "dailyPrices.name",
                                                    {
                                                        defaultValue:
                                                            "Name",
                                                    }
                                                )}
                                            </th>

                                            <th className="px-6 py-4 text-center text-sm font-semibold">
                                                {t(
                                                    "dailyPrices.priceRange",
                                                    {
                                                        defaultValue:
                                                            "Price Range (LKR)",
                                                    }
                                                )}
                                            </th>

                                            <th className="px-6 py-4 text-center text-sm font-semibold">
                                                {t(
                                                    "dailyPrices.date",
                                                    {
                                                        defaultValue:
                                                            "Date",
                                                    }
                                                )}
                                            </th>

                                            <th className="px-6 py-4 text-center text-sm font-semibold">
                                                {t(
                                                    "dailyPrices.action",
                                                    {
                                                        defaultValue:
                                                            "Action",
                                                    }
                                                )}
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {dailyPrices.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-emerald-300 transition-colors hover:bg-green-50"
                                            >
                                                <td className="px-6 py-4 font-semibold text-gray-700">
                                                    {translateProductType(
                                                        item.product?.type
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center font-semibold text-gray-800">
                                                    {translateProductName(
                                                        item.product?.name
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center font-semibold text-gray-800">
                                                    {getPriceRange(
                                                        item.min_price,
                                                        item.max_price
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center font-semibold text-gray-700">
                                                    {formatDisplayDate(
                                                        item.date
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleViewHistory(
                                                                item.product
                                                                    ?.id
                                                            )
                                                        }
                                                        disabled={
                                                            !item.product?.id
                                                        }
                                                        className="font-medium text-[#008a3b] underline decoration-1 underline-offset-4 transition-colors hover:text-[#00662b] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                                    >
                                                        {t(
                                                            "dailyPrices.viewHistory",
                                                            {
                                                                defaultValue:
                                                                    "View Price History",
                                                            }
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="space-y-4 md:hidden">
                                {dailyPrices.map((item) => (
                                    <article
                                        key={item.id}
                                        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-[#008a3b]">
                                                    {translateProductType(
                                                        item.product?.type
                                                    )}
                                                </p>

                                                <h3 className="mt-1 text-lg font-bold text-gray-900">
                                                    {translateProductName(
                                                        item.product?.name
                                                    )}
                                                </h3>
                                            </div>

                                            <p className="whitespace-nowrap text-lg font-bold text-[#087d35]">
                                                Rs.{" "}
                                                {getPriceRange(
                                                    item.min_price,
                                                    item.max_price
                                                )}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                                            <span className="text-sm text-gray-500">
                                                {formatDisplayDate(
                                                    item.date
                                                )}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleViewHistory(
                                                        item.product?.id
                                                    )
                                                }
                                                className="inline-flex items-center gap-1 font-semibold text-[#008a3b]"
                                            >
                                                {t(
                                                    "dailyPrices.viewHistory",
                                                    {
                                                        defaultValue:
                                                            "View History",
                                                    }
                                                )}

                                                <ArrowRight size={16} />
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>

                            {/* See all prices */}
                            <div className="mt-10 text-center ">
                                <button
                                    type="button"
                                    onClick={handleSeeAllPrices}
                                    className="inline-flex items-center gap-2 text-lg font-semibold text-blue-600 underline decoration-2 underline-offset-4 transition-colors hover:text-blue-800 cursor-pointer"
                                >
                                    {t(
                                        "dailyPrices.seeAllPrices",
                                        {
                                            defaultValue:
                                                "See All Prices ...",
                                        }
                                    )}

                                    <ArrowRight size={19} />
                                </button>
                            </div>
                        </>
                    )}
            </div>
        </section>
    );
};

export default DailyPricesPreview;