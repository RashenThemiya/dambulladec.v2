import axios from "axios";
import {
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    TimeScale,
    Tooltip,
} from "chart.js";
import "chartjs-adapter-date-fns";
import zoomPlugin from "chartjs-plugin-zoom";
import { format, parseISO } from "date-fns";
import {
    CalendarDays,
    Eye,
    EyeOff,
    RotateCcw,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import PriceChartInsights from "./PriceChartInsights";

ChartJS.register(
    LineElement,
    PointElement,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

const TIME_RANGES = [
    "5D",
    "10D",
    "1M",
    "1Y",
    "5Y",
    "ALL",
];

const ProductPriceChart = () => {
    const { t } = useTranslation();
    const { id } = useParams();

    const chartRef = useRef(null);

    const [priceData, setPriceData] =
        useState([]);
    const [loading, setLoading] =
        useState(true);
    const [error, setError] = useState("");
    const [productName, setProductName] =
        useState("");

    const [timeRange, setTimeRange] =
        useState("5D");

    const [showMinPrice, setShowMinPrice] =
        useState(true);

    const [showMaxPrice, setShowMaxPrice] =
        useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            if (!id) {
                setError(
                    t("priceChart.missingProduct", {
                        defaultValue:
                            "Product ID is missing.",
                    })
                );
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");

            try {
                const response = await axios.get(
                    `${
                        import.meta.env
                            .VITE_API_BASE_URL
                    }/api/prices/product/${id}/chart`
                );

                const result = Array.isArray(
                    response.data
                )
                    ? response.data
                    : [];

                const sortedResult = [...result].sort(
                    (first, second) =>
                        new Date(first.date) -
                        new Date(second.date)
                );

                setPriceData(sortedResult);

                setProductName(
                    sortedResult[0]?.Product?.name ||
                        sortedResult[0]?.product
                            ?.name ||
                        "Product"
                );
            } catch (requestError) {
                console.error(
                    "Error fetching price chart:",
                    requestError
                );

                setError(
                    requestError.response?.data
                        ?.message ||
                        t("priceChart.loadError", {
                            defaultValue:
                                "Failed to load price history.",
                        })
                );
            } finally {
                setLoading(false);
            }
        };

        fetchChartData();
    }, [id, t]);

    const filteredData = useMemo(() => {
        if (priceData.length === 0) {
            return [];
        }

        if (timeRange === "ALL") {
            return priceData;
        }

        const latestRecord =
            priceData[priceData.length - 1];

        const latestDate = new Date(
            `${latestRecord.date}T00:00:00`
        );

        const startDate = new Date(latestDate);

        switch (timeRange) {
            case "5D":
                startDate.setDate(
                    latestDate.getDate() - 4
                );
                break;

            case "10D":
                startDate.setDate(
                    latestDate.getDate() - 9
                );
                break;

            case "1M":
                startDate.setMonth(
                    latestDate.getMonth() - 1
                );
                break;

            case "1Y":
                startDate.setFullYear(
                    latestDate.getFullYear() - 1
                );
                break;

            case "5Y":
                startDate.setFullYear(
                    latestDate.getFullYear() - 5
                );
                break;

            default:
                return priceData;
        }

        return priceData.filter(
            (item) =>
                new Date(
                    `${item.date}T00:00:00`
                ) >= startDate
        );
    }, [priceData, timeRange]);

    const chartData = useMemo(() => {
        const datasets = [];

        if (showMinPrice) {
            datasets.push({
                label: t("priceChart.minPrice", {
                    defaultValue:
                        "Min Price (Rs)",
                }),
                data: filteredData.map((item) => ({
                    x: parseISO(item.date),
                    y: Number(item.min_price),
                })),
                borderColor: "#65c20a",
                backgroundColor:
                    "rgba(101, 194, 10, 0.08)",
                pointBackgroundColor: "#65c20a",
                pointBorderColor: "#65c20a",
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBorderWidth: 1,
                borderWidth: 2,
                tension: 0.15,
                fill: false,
            });
        }

        if (showMaxPrice) {
            datasets.push({
                label: t("priceChart.maxPrice", {
                    defaultValue:
                        "Max Price (Rs)",
                }),
                data: filteredData.map((item) => ({
                    x: parseISO(item.date),
                    y: Number(item.max_price),
                })),
                borderColor: "#096b34",
                backgroundColor:
                    "rgba(9, 107, 52, 0.07)",
                pointBackgroundColor: "#096b34",
                pointBorderColor: "#096b34",
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBorderWidth: 1,
                borderWidth: 2,
                tension: 0.15,
                fill: true,
            });
        }

        return { datasets };
    }, [
        filteredData,
        showMinPrice,
        showMaxPrice,
        t,
    ]);

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false,
            },

            layout: {
                padding: {
                    top: 18,
                    right: 16,
                    bottom: 0,
                    left: 4,
                },
            },

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 30,
                        color: "#555555",
                        font: {
                            size: 13,
                            weight: "500",
                        },
                    },
                },

                tooltip: {
                    backgroundColor: "#ffffff",
                    titleColor: "#1f2937",
                    bodyColor: "#374151",
                    borderColor: "#e5e7eb",
                    borderWidth: 1,
                    cornerRadius: 9,
                    padding: 14,
                    displayColors: true,
                    boxPadding: 5,

                    callbacks: {
                        title: (items) => {
                            if (!items.length) {
                                return "";
                            }

                            return format(
                                new Date(
                                    items[0].parsed.x
                                ),
                                "MMM dd, yyyy"
                            );
                        },

                        label: (context) =>
                            `${context.dataset.label}: ${context.parsed.y}`,
                    },
                },

                zoom: {
                    pan: {
                        enabled: true,
                        mode: "x",
                    },

                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true,
                        },
                        mode: "x",
                    },
                },
            },

            scales: {
                x: {
                    type: "time",

                    time: {
                        unit:
                            timeRange === "5Y"
                                ? "year"
                                : timeRange === "1Y"
                                  ? "month"
                                  : "day",
                        tooltipFormat:
                            "MMM dd, yyyy",
                    },

                    ticks: {
                        color: "#303030",
                        maxRotation: 0,
                        autoSkip: true,
                        font: {
                            size: 12,
                            weight: "600",
                        },
                    },

                    grid: {
                        color:
                            "rgba(0,0,0,0.06)",
                        drawBorder: false,
                    },

                    border: {
                        display: false,
                    },
                },

                y: {
                    title: {
                        display: true,
                        text: t(
                            "priceChart.priceAxis",
                            {
                                defaultValue:
                                    "Price (Rs)",
                            }
                        ),
                        color: "#555555",
                        font: {
                            size: 12,
                            weight: "600",
                        },
                    },

                    ticks: {
                        color: "#555555",
                        font: {
                            size: 11,
                        },
                    },

                    grid: {
                        color:
                            "rgba(0,0,0,0.07)",
                        borderDash: [4, 4],
                    },

                    border: {
                        display: false,
                    },
                },
            },
        }),
        [t, timeRange]
    );

    const resetZoom = () => {
        chartRef.current?.resetZoom();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <div className="text-center">
                    <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-[#087b36]" />

                    <p className="mt-4 font-medium text-[#087b36]">
                        {t("priceChart.loading", {
                            defaultValue:
                                "Loading price chart...",
                        })}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white px-4">
                <div className="rounded-lg border border-red-200 bg-red-50 px-8 py-10 text-center">
                    <p className="font-semibold text-red-600">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    if (priceData.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white">
                <p className="font-medium text-gray-500">
                    {t("priceChart.noData", {
                        defaultValue:
                            "No price data available.",
                    })}
                </p>
            </div>
        );
    }

    const translatedProductName = t(productName, {
        defaultValue: productName,
    });

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Navbar />

            <main className="flex-1">
                <PriceChartInsights
                    data={priceData}
                    productName={productName}
                />

                <section className="bg-white px-4 pb-16 sm:px-6 lg:px-8">
                    <div
                        className="
                            mx-auto w-full max-w-[1320px]
                            rounded-[9px]
                            border border-[#d9d9d9]
                            bg-white
                            px-4 py-4
                            sm:px-6 sm:py-5
                        "
                    >
                        {/* Chart control row */}
                        <div
                            className="
                                flex flex-col gap-4
                                xl:flex-row
                                xl:items-center
                                xl:justify-between
                            "
                        >
                            {/* Range controls */}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="mr-2 flex items-center gap-2 font-semibold text-[#087b36]">
                                    <CalendarDays
                                        size={20}
                                    />

                                    <span className="text-sm">
                                        {t(
                                            "priceChart.selectTimeRange",
                                            {
                                                defaultValue:
                                                    "Select Time Range",
                                            }
                                        )}
                                    </span>
                                </div>

                                {TIME_RANGES.map(
                                    (range) => (
                                        <button
                                            key={range}
                                            type="button"
                                            onClick={() =>
                                                setTimeRange(
                                                    range
                                                )
                                            }
                                            className={`
                                                min-w-[66px]
                                                rounded-[4px]
                                                border px-4 py-2
                                                text-sm font-semibold
                                                transition-colors
                                                ${
                                                    timeRange ===
                                                    range
                                                        ? "border-[#2e8b13] bg-[#2e8b13] text-white"
                                                        : "border-[#5d9e48] bg-white text-[#087b36] hover:bg-green-50"
                                                }
                                            `}
                                        >
                                            {range === "ALL"
                                                ? t(
                                                      "priceChart.all",
                                                      {
                                                          defaultValue:
                                                              "All",
                                                      }
                                                  )
                                                : range}
                                        </button>
                                    )
                                )}
                            </div>

                            {/* Visibility controls */}
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowMinPrice(
                                            (current) =>
                                                !current
                                        )
                                    }
                                    className={`
                                        inline-flex items-center
                                        gap-2 rounded-[4px]
                                        border px-4 py-2
                                        text-sm font-semibold
                                        transition-colors
                                        ${
                                            showMinPrice
                                                ? "border-[#d9d9d9] bg-white text-[#087b36] hover:bg-green-50"
                                                : "border-[#087b36] bg-[#087b36] text-white"
                                        }
                                    `}
                                >
                                    {showMinPrice ? (
                                        <EyeOff
                                            size={18}
                                        />
                                    ) : (
                                        <Eye size={18} />
                                    )}

                                    {showMinPrice
                                        ? t(
                                              "priceChart.hideMinPrice",
                                              {
                                                  defaultValue:
                                                      "Hide Min Price",
                                              }
                                          )
                                        : t(
                                              "priceChart.showMinPrice",
                                              {
                                                  defaultValue:
                                                      "Show Min Price",
                                              }
                                          )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowMaxPrice(
                                            (current) =>
                                                !current
                                        )
                                    }
                                    className={`
                                        inline-flex items-center
                                        gap-2 rounded-[4px]
                                        border px-4 py-2
                                        text-sm font-semibold
                                        transition-colors
                                        ${
                                            showMaxPrice
                                                ? "border-[#087b36] bg-[#087b36] text-white"
                                                : "border-[#d9d9d9] bg-white text-[#087b36] hover:bg-green-50"
                                        }
                                    `}
                                >
                                    {showMaxPrice ? (
                                        <EyeOff
                                            size={18}
                                        />
                                    ) : (
                                        <Eye size={18} />
                                    )}

                                    {showMaxPrice
                                        ? t(
                                              "priceChart.hideMaxPrice",
                                              {
                                                  defaultValue:
                                                      "Hide Max Price",
                                              }
                                          )
                                        : t(
                                              "priceChart.showMaxPrice",
                                              {
                                                  defaultValue:
                                                      "Show Max Price",
                                              }
                                          )}
                                </button>
                            </div>
                        </div>

                        {/* Chart heading */}
                        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-[21px] font-bold text-[#1e1e1e]">
                                {translatedProductName}{" "}
                                {t(
                                    "priceChart.trendTitle",
                                    {
                                        defaultValue:
                                            "Price Trend",
                                    }
                                )}
                            </h2>

                            <button
                                type="button"
                                onClick={resetZoom}
                                className="
                                    inline-flex w-fit items-center
                                    gap-2 rounded-[4px]
                                    border border-gray-200
                                    bg-white px-4 py-2
                                    text-sm font-semibold
                                    text-[#087b36]
                                    transition-colors
                                    hover:bg-green-50
                                "
                            >
                                <RotateCcw size={17} />

                                {t(
                                    "priceChart.resetZoom",
                                    {
                                        defaultValue:
                                            "Reset Zoom",
                                    }
                                )}
                            </button>
                        </div>

                        {/* Chart */}
                        <div className="mt-5 h-[420px] w-full sm:h-[500px]">
                            {filteredData.length > 0 &&
                            (showMinPrice ||
                                showMaxPrice) ? (
                                <Line
                                    ref={chartRef}
                                    data={chartData}
                                    options={
                                        chartOptions
                                    }
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center text-center text-gray-500">
                                    {filteredData.length ===
                                    0
                                        ? t(
                                              "priceChart.noRangeData",
                                              {
                                                  defaultValue:
                                                      "No data is available for the selected time range.",
                                              }
                                          )
                                        : t(
                                              "priceChart.enableDataset",
                                              {
                                                  defaultValue:
                                                      "Enable at least one price line to display the chart.",
                                              }
                                          )}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ProductPriceChart;