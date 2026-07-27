import axios from "axios";
import Lottie from "lottie-react";
import {
    CalendarDays,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Download,
    Grid2X2,
    List,
    Search,
    X,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import loadingAnim from "../../assets/loadingAnim.json";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import { Skeleton } from "../../components/Skeleton";
import { printDailyPrices } from "../../utils/printDailyPrice";
import DailyPriceCard from "./DailyPriceCard";
import DailyPriceTable from "./DailyPriceTable";

const GRID_ITEMS_PER_PAGE = 12;
const MAXIMUM_FALLBACK_DAYS = 60;

const PRODUCT_TYPES = [
    {
        value: "Fruit",
        translationKey: "dailyPrices.categories.fruit",
    },
    {
        value: "Vegetable",
        translationKey: "dailyPrices.categories.vegetable",
    },
    {
        value: "Rice",
        translationKey: "dailyPrices.categories.rice",
    },
    {
        value: "Potatoes",
        translationKey: "dailyPrices.categories.potatoes",
    },
    {
        value: "Leaf Vegetable",
        translationKey:
            "dailyPrices.categories.leafVegetable",
    },
    {
        value: "Grain",
        translationKey: "dailyPrices.categories.grain",
    },
];

const getLocalDateValue = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");
    const day = String(today.getDate()).padStart(
        2,
        "0"
    );

    return `${year}-${month}-${day}`;
};

const getPreviousDate = (dateValue, daysBefore) => {
    const date = new Date(`${dateValue}T00:00:00`);

    date.setDate(date.getDate() - daysBefore);

    const year = date.getFullYear();
    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");
    const day = String(date.getDate()).padStart(
        2,
        "0"
    );

    return `${year}-${month}-${day}`;
};

const normalizeValue = (value) => {
    return String(value || "")
        .trim()
        .toLowerCase();
};

const getVisiblePageNumbers = (
    currentPage,
    totalPages
) => {
    if (totalPages <= 7) {
        return Array.from(
            { length: totalPages },
            (_, index) => index + 1
        );
    }

    const pages = [1];

    const startPage = Math.max(
        2,
        currentPage - 1
    );

    const endPage = Math.min(
        totalPages - 1,
        currentPage + 1
    );

    if (startPage > 2) {
        pages.push("start-ellipsis");
    }

    for (
        let page = startPage;
        page <= endPage;
        page += 1
    ) {
        pages.push(page);
    }

    if (endPage < totalPages - 1) {
        pages.push("end-ellipsis");
    }

    pages.push(totalPages);

    return pages;
};

const DailyPrice = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [searchParams, setSearchParams] =
        useSearchParams();

    const today = getLocalDateValue();
    const querySearch =
        searchParams.get("search") || "";

    const [dailyPrices, setDailyPrices] =
        useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Date selected in the date input.
    const [selectedDate, setSelectedDate] =
        useState(today);

    // Actual date of the displayed price records.
    const [
        displayedPriceDate,
        setDisplayedPriceDate,
    ] = useState(today);

    // True when today's data is unavailable and
    // an earlier date is being displayed.
    const [
        showingLatestAvailable,
        setShowingLatestAvailable,
    ] = useState(false);

    // True only after the user manually chooses a date.
    // Automatic initial loading keeps this false.
    const [
        isManualDateSelection,
        setIsManualDateSelection,
    ] = useState(false);

    const [searchTerm, setSearchTerm] =
        useState(querySearch);

    const [selectedType, setSelectedType] =
        useState("all");

    const [dropdownOpen, setDropdownOpen] =
        useState(false);

    // Table view is shown by default.
    const [viewMode, setViewMode] =
        useState("list");

    // Pagination is used only in grid view.
    const [currentPage, setCurrentPage] =
        useState(1);

    const dropdownRef = useRef(null);

    const formatDisplayDate = useCallback(
        (dateValue) => {
            if (!dateValue) {
                return "";
            }

            const date = new Date(
                `${dateValue}T00:00:00`
            );

            if (Number.isNaN(date.getTime())) {
                return dateValue;
            }

            const language =
                i18n.language?.split("-")[0] ||
                "en";

            const localeMap = {
                en: "en-LK",
                si: "si-LK",
                ta: "ta-LK",
            };

            return new Intl.DateTimeFormat(
                localeMap[language] || "en-LK",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }
            ).format(date);
        },
        [i18n.language]
    );

    const fetchPricesForDate = useCallback(
        async (dateValue) => {
            const response = await axios.get(
                `${
                    import.meta.env
                        .VITE_API_BASE_URL
                }/api/prices/by-date/${dateValue}`
            );

            return Array.isArray(response.data)
                ? response.data
                : [];
        },
        []
    );

    const fetchPrices = useCallback(async () => {
        setLoading(true);
        setError("");
        setDailyPrices([]);
        setShowingLatestAvailable(false);
        setDisplayedPriceDate(selectedDate);

        try {
            const selectedDatePrices =
                await fetchPricesForDate(selectedDate);

            // If the requested date has data, display that exact date.
            if (selectedDatePrices.length > 0) {
                setDailyPrices(selectedDatePrices);
                setDisplayedPriceDate(selectedDate);
                setShowingLatestAvailable(false);
                return;
            }

            // A manually selected date must never fall back.
            if (isManualDateSelection) {
                setDailyPrices([]);
                setDisplayedPriceDate(selectedDate);
                setShowingLatestAvailable(false);
                return;
            }

            // Automatic loading starts from today. If today has no data,
            // search backwards until the latest available date is found.
            for (
                let dayOffset = 1;
                dayOffset <= MAXIMUM_FALLBACK_DAYS;
                dayOffset += 1
            ) {
                const previousDate = getPreviousDate(
                    today,
                    dayOffset
                );

                const previousDatePrices =
                    await fetchPricesForDate(previousDate);

                if (previousDatePrices.length > 0) {
                    setDailyPrices(previousDatePrices);
                    setDisplayedPriceDate(previousDate);
                    setShowingLatestAvailable(true);
                    return;
                }
            }

            setDailyPrices([]);
            setDisplayedPriceDate(today);
            setShowingLatestAvailable(false);
        } catch (requestError) {
            console.error(
                "Failed to fetch daily prices:",
                requestError
            );

            setDailyPrices([]);
            setShowingLatestAvailable(false);

            setError(
                t("dailyPrices.loadError", {
                    defaultValue:
                        "Unable to load daily prices.",
                })
            );
        } finally {
            setLoading(false);
        }
    }, [
        fetchPricesForDate,
        isManualDateSelection,
        selectedDate,
        t,
        today,
    ]);

    useEffect(() => {
        fetchPrices();
    }, [fetchPrices]);

    // Keep the page search synchronized with the URL.
    useEffect(() => {
        setSearchTerm(querySearch);
    }, [querySearch]);

    // Close category dropdown after clicking outside.
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(
                    event.target
                )
            ) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    const productNamesTranslations =
        useMemo(() => {
            const translations = {};

            dailyPrices.forEach((item) => {
                const productName =
                    item.product?.name;

                if (
                    productName &&
                    !translations[productName]
                ) {
                    translations[productName] =
                        t(productName, {
                            defaultValue:
                                productName,
                        });
                }
            });

            return translations;
        }, [dailyPrices, t]);

    const filteredPrices = useMemo(() => {
        const normalizedSearch =
            normalizeValue(searchTerm);

        return dailyPrices.filter((item) => {
            const rawProductName =
                item.product?.name || "";

            const translatedProductName =
                productNamesTranslations[
                    rawProductName
                ] || rawProductName;

            const productType =
                item.product?.type || "";

            const selectedCategory =
                PRODUCT_TYPES.find(
                    (type) =>
                        normalizeValue(
                            type.value
                        ) ===
                        normalizeValue(
                            productType
                        )
                );

            const translatedProductType =
                selectedCategory
                    ? t(
                          selectedCategory.translationKey,
                          {
                              defaultValue:
                                  productType,
                          }
                      )
                    : productType;

            const matchesSearch =
                !normalizedSearch ||
                normalizeValue(
                    rawProductName
                ).includes(normalizedSearch) ||
                normalizeValue(
                    translatedProductName
                ).includes(normalizedSearch) ||
                normalizeValue(
                    productType
                ).includes(normalizedSearch) ||
                normalizeValue(
                    translatedProductType
                ).includes(normalizedSearch);

            const matchesType =
                selectedType === "all" ||
                normalizeValue(productType) ===
                    normalizeValue(selectedType);

            return matchesSearch && matchesType;
        });
    }, [
        dailyPrices,
        productNamesTranslations,
        searchTerm,
        selectedType,
        t,
    ]);

    // Reset grid pagination after filtering or date changes.
    useEffect(() => {
        setCurrentPage(1);
    }, [
        searchTerm,
        selectedType,
        selectedDate,
    ]);

    const totalGridPages = Math.max(
        1,
        Math.ceil(
            filteredPrices.length /
                GRID_ITEMS_PER_PAGE
        )
    );

    useEffect(() => {
        if (currentPage > totalGridPages) {
            setCurrentPage(totalGridPages);
        }
    }, [currentPage, totalGridPages]);

    const paginatedGridPrices = useMemo(() => {
        const startIndex =
            (currentPage - 1) *
            GRID_ITEMS_PER_PAGE;

        return filteredPrices.slice(
            startIndex,
            startIndex + GRID_ITEMS_PER_PAGE
        );
    }, [filteredPrices, currentPage]);

    const visiblePageNumbers = useMemo(
        () =>
            getVisiblePageNumbers(
                currentPage,
                totalGridPages
            ),
        [currentPage, totalGridPages]
    );

    // PDF receives all filtered rows.
    const translatedPrices = useMemo(() => {
        return filteredPrices.map((item) => ({
            ...item,
            product: {
                ...item.product,
                name:
                    productNamesTranslations[
                        item.product?.name
                    ] || item.product?.name,
            },
        }));
    }, [
        filteredPrices,
        productNamesTranslations,
    ]);

    const selectedProductType =
        PRODUCT_TYPES.find(
            (productType) =>
                productType.value === selectedType
        );

    const selectedTypeLabel =
        selectedType === "all"
            ? t("ui.allTypes", {
                  defaultValue: "All Types",
              })
            : t(
                  selectedProductType
                      ?.translationKey ||
                      "dailyPrices.categories.other",
                  {
                      defaultValue: selectedType,
                  }
              );

    const typesTranslations = t("types", {
        returnObjects: true,
    });

    const uiTranslations = {
        title: t("ui.title"),
        center: t("ui.center"),
        tel: t("ui.tel"),
        dateLabel: t("ui.dateLabel"),
        emailLabel: t("ui.emailLabel"),
        inquiry: t("ui.inquiry"),
        manager: t("ui.manager"),
        contact: t("ui.contact"),

        tableHeaders: {
            number: t(
                "ui.tableHeaders.number"
            ),
            item: t("ui.tableHeaders.item"),
            minPrice: t(
                "ui.tableHeaders.minPrice"
            ),
            maxPrice: t(
                "ui.tableHeaders.maxPrice"
            ),
        },

        noPrices: t("ui.noPrices"),
        popupBlocked: t("ui.popupBlocked"),
        uncategorized: t(
            "ui.uncategorized"
        ),

        allTypes: t("ui.allTypes", {
            defaultValue: "All Types",
        }),
    };

    const handleSearchChange = (event) => {
        const value = event.target.value;

        setSearchTerm(value);

        const nextSearchParams =
            new URLSearchParams(searchParams);

        if (value.trim()) {
            nextSearchParams.set(
                "search",
                value
            );
        } else {
            nextSearchParams.delete("search");
        }

        setSearchParams(nextSearchParams, {
            replace: true,
        });
    };

    const clearSearch = () => {
        setSearchTerm("");

        const nextSearchParams =
            new URLSearchParams(searchParams);

        nextSearchParams.delete("search");

        setSearchParams(nextSearchParams, {
            replace: true,
        });
    };

    const downloadPDF = () => {
        printDailyPrices({
            prices: translatedPrices,

            // Use the actual date of the displayed records.
            date: displayedPriceDate,

            ui: uiTranslations,
            productNames:
                productNamesTranslations,
            types: typesTranslations,
        });
    };

    const changeGridPage = (page) => {
        if (
            page < 1 ||
            page > totalGridPages ||
            page === currentPage
        ) {
            return;
        }

        setCurrentPage(page);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const firstGridItem =
        filteredPrices.length === 0
            ? 0
            : (currentPage - 1) *
                  GRID_ITEMS_PER_PAGE +
              1;

    const lastGridItem = Math.min(
        currentPage * GRID_ITEMS_PER_PAGE,
        filteredPrices.length
    );

    const selectedDateHasNoData =
        !loading &&
        !error &&
        dailyPrices.length === 0 &&
        selectedDate !== today;

    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Navbar />

            <Toaster
                position="top-center"
                reverseOrder={false}
            />

            <main className="flex-1">
                <div className="mx-auto w-full max-w-[1512px] px-4 py-6 sm:px-6 lg:px-8">
                    {/* Controls */}
                    <div
                        className="
                            mb-6 flex flex-col gap-4
                            lg:flex-row
                            lg:items-center
                            lg:justify-between
                        "
                    >
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                            {/* View mode */}
                            <div className="flex overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setViewMode(
                                            "list"
                                        )
                                    }
                                    aria-label={t(
                                        "dailyPrices.tableView",
                                        {
                                            defaultValue:
                                                "Table view",
                                        }
                                    )}
                                    aria-pressed={
                                        viewMode ===
                                        "list"
                                    }
                                    className={`
                                        flex h-10 w-11
                                        items-center
                                        justify-center
                                        transition-colors
                                        ${
                                            viewMode ===
                                            "list"
                                                ? "bg-green-100 text-[#087b36]"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    <List size={18} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setViewMode(
                                            "grid"
                                        )
                                    }
                                    aria-label={t(
                                        "dailyPrices.gridView",
                                        {
                                            defaultValue:
                                                "Grid view",
                                        }
                                    )}
                                    aria-pressed={
                                        viewMode ===
                                        "grid"
                                    }
                                    className={`
                                        flex h-10 w-11
                                        items-center
                                        justify-center
                                        border-l
                                        border-gray-200
                                        transition-colors
                                        ${
                                            viewMode ===
                                            "grid"
                                                ? "bg-green-100 text-[#087b36]"
                                                : "text-gray-500 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    <Grid2X2 size={17} />
                                </button>
                            </div>

                            <div className="flex items-center gap-3">
  <div className="relative w-[220px]">
    <CalendarDays
      size={18}
      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#08772f]"
    />

    <input
      type="date"
      value={displayedPriceDate}
      max={today}
      onChange={(event) => {
        const chosenDate = event.target.value;

        setIsManualDateSelection(true);
        setSelectedDate(chosenDate);
        setDisplayedPriceDate(chosenDate);
      }}
      className="
        w-full
        rounded-xl
        border border-gray-300
        bg-white
        py-3
        pl-12
        pr-4
        shadow-sm
        focus:border-[#08772f]
        focus:ring-4
        focus:ring-green-100
        outline-none
      "
    />
  </div>

  {!isManualDateSelection &&
    (showingLatestAvailable ? (
      <span className="whitespace-nowrap rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">
        {t("dailyPrices.latestAvailable", {
          defaultValue: "Latest Available",
        })}
      </span>
    ) : displayedPriceDate === today && dailyPrices.length > 0 ? (
      <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-2 text-xs font-semibold text-green-700">
        {t("dailyPrices.today", {
          defaultValue: "Today",
        })}
      </span>
    ) : null)}
</div>

                            {/* Type dropdown */}
                            <div
                                ref={dropdownRef}
                                className="relative"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setDropdownOpen(
                                            (current) =>
                                                !current
                                        )
                                    }
                                    aria-expanded={
                                        dropdownOpen
                                    }
                                    className="
                                        flex h-10
                                        min-w-[170px]
                                        items-center
                                        justify-between
                                        gap-3 rounded-md
                                        border border-gray-200
                                        bg-white px-3
                                        text-sm text-gray-700
                                        shadow-sm outline-none
                                        transition
                                        hover:border-green-300
                                        focus:border-[#087b36]
                                        focus:ring-2
                                        focus:ring-green-100
                                    "
                                >
                                    <span className="truncate">
                                        {
                                            selectedTypeLabel
                                        }
                                    </span>

                                    <ChevronDown
                                        size={17}
                                        className={`
                                            shrink-0
                                            transition-transform
                                            duration-200
                                            ${
                                                dropdownOpen
                                                    ? "rotate-180"
                                                    : ""
                                            }
                                        `}
                                    />
                                </button>

                                {dropdownOpen && (
                                    <div
                                        className="
                                            absolute left-0
                                            top-full z-40
                                            mt-2 w-full
                                            min-w-[210px]
                                            overflow-hidden
                                            rounded-lg
                                            border border-gray-200
                                            bg-white py-1
                                            shadow-xl
                                        "
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedType(
                                                    "all"
                                                );

                                                setDropdownOpen(
                                                    false
                                                );
                                            }}
                                            className={`
                                                block w-full
                                                px-4 py-2.5
                                                text-left text-sm
                                                transition-colors
                                                ${
                                                    selectedType ===
                                                    "all"
                                                        ? "bg-green-50 font-semibold text-[#087b36]"
                                                        : "text-gray-700 hover:bg-gray-50"
                                                }
                                            `}
                                        >
                                            {t(
                                                "ui.allTypes",
                                                {
                                                    defaultValue:
                                                        "All Types",
                                                }
                                            )}
                                        </button>

                                        {PRODUCT_TYPES.map(
                                            (
                                                productType
                                            ) => (
                                                <button
                                                    key={
                                                        productType.value
                                                    }
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedType(
                                                            productType.value
                                                        );

                                                        setDropdownOpen(
                                                            false
                                                        );
                                                    }}
                                                    className={`
                                                        block w-full
                                                        px-4 py-2.5
                                                        text-left text-sm
                                                        transition-colors
                                                        ${
                                                            selectedType ===
                                                            productType.value
                                                                ? "bg-green-50 font-semibold text-[#087b36]"
                                                                : "text-gray-700 hover:bg-gray-50"
                                                        }
                                                    `}
                                                >
                                                    {t(
                                                        productType.translationKey,
                                                        {
                                                            defaultValue:
                                                                productType.value,
                                                        }
                                                    )}
                                                </button>
                                            )
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Search */}
                            <div className="relative min-w-[220px] flex-1 lg:max-w-[420px]">
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={
                                        handleSearchChange
                                    }
                                    placeholder={t(
                                        "dailyPrices.searchPlaceholder",
                                        {
                                            defaultValue:
                                                "Search Products",
                                        }
                                    )}
                                    aria-label={t(
                                        "dailyPrices.searchPlaceholder",
                                        {
                                            defaultValue:
                                                "Search Products",
                                        }
                                    )}
                                    className="
                                        h-10 w-full
                                        rounded-md border
                                        border-gray-200
                                        bg-white px-4 pr-10
                                        text-sm text-gray-700
                                        shadow-sm outline-none
                                        transition
                                        placeholder:text-gray-400
                                        focus:border-[#087b36]
                                        focus:ring-2
                                        focus:ring-green-100
                                    "
                                />

                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {searchTerm ? (
                                        <button
                                            type="button"
                                            onClick={
                                                clearSearch
                                            }
                                            aria-label={t(
                                                "dailyPrices.clearSearch",
                                                {
                                                    defaultValue:
                                                        "Clear search",
                                                }
                                            )}
                                            className="
                                                flex h-7 w-7
                                                items-center
                                                justify-center
                                                rounded-full
                                                text-gray-400
                                                transition-colors
                                                hover:bg-red-50
                                                hover:text-red-500
                                            "
                                        >
                                            <X size={17} />
                                        </button>
                                    ) : (
                                        <Search
                                            size={18}
                                            className="text-gray-500"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Download PDF */}
                        {!loading &&
                            filteredPrices.length >
                                0 && (
                                <button
                                    type="button"
                                    onClick={
                                        downloadPDF
                                    }
                                    className="
                                        inline-flex h-10
                                        shrink-0 items-center
                                        justify-center gap-2
                                        rounded-md
                                        bg-[#087b36]
                                        px-5 text-sm
                                        font-semibold
                                        text-white shadow-sm
                                        transition-colors
                                        hover:bg-[#06682d]
                                    "
                                >
                                    {t(
                                        "dailyPrices.downloadPdf",
                                        {
                                            defaultValue:
                                                "Download PDF",
                                        }
                                    )}

                                    <Download
                                        size={17}
                                    />
                                </button>
                            )}
                    </div>

                    {/* Displayed date notice */}
                    {!loading &&
                        !error &&
                        dailyPrices.length > 0 && (
                            <div
                                className={`
                                    mb-6 flex flex-col
                                    gap-2 rounded-lg
                                    border px-4 py-3
                                    text-sm
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                    ${
                                        showingLatestAvailable
                                            ? "border-amber-200 bg-amber-50 text-amber-800"
                                            : "border-green-200 bg-green-50 text-green-800"
                                    }
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <Clock3
                                        size={19}
                                        className="mt-0.5 shrink-0"
                                    />

                                    <p className="font-medium">
                                        {showingLatestAvailable
                                            ? t(
                                                  "dailyPrices.latestFallbackMessage",
                                                  {
                                                      date: formatDisplayDate(
                                                          displayedPriceDate
                                                      ),
                                                      defaultValue:
                                                          "Today's prices have not been updated yet. Showing the latest prices from {{date}}.",
                                                  }
                                              )
                                            : t(
                                                  "dailyPrices.currentPriceMessage",
                                                  {
                                                      date: formatDisplayDate(
                                                          displayedPriceDate
                                                      ),
                                                      defaultValue:
                                                          "Showing prices for {{date}}.",
                                                  }
                                              )}
                                    </p>
                                </div>

                                {showingLatestAvailable && (
                                    <span
                                        className="
                                            shrink-0
                                            rounded-full
                                            bg-amber-100
                                            px-3 py-1
                                            text-xs
                                            font-semibold
                                            text-amber-800
                                        "
                                    >
                                        {t(
                                            "dailyPrices.latestAvailable",
                                            {
                                                defaultValue:
                                                    "Latest available prices",
                                            }
                                        )}
                                    </span>
                                )}
                            </div>
                        )}

                    {/* Loading */}
                    {loading && (
                        <div>
                            <div className="mb-5 flex items-center justify-center gap-3 rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />

                                {t(
                                    "dailyPrices.findingLatest",
                                    {
                                        defaultValue:
                                            "Checking for the latest available prices...",
                                    }
                                )}
                            </div>

                            <div
                                className={
                                    viewMode ===
                                    "grid"
                                        ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                        : "space-y-4"
                                }
                            >
                                {Array.from({
                                    length:
                                        viewMode ===
                                        "grid"
                                            ? 8
                                            : 6,
                                }).map(
                                    (_, index) => (
                                        <Skeleton
                                            key={
                                                index
                                            }
                                        />
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-12 text-center">
                            <p className="font-semibold text-red-700">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={fetchPrices}
                                className="
                                    mt-4 rounded-md
                                    bg-red-600
                                    px-5 py-2.5
                                    font-semibold
                                    text-white
                                    hover:bg-red-700
                                "
                            >
                                {t(
                                    "dailyPrices.retry",
                                    {
                                        defaultValue:
                                            "Retry",
                                    }
                                )}
                            </button>
                        </div>
                    )}

                    {/* No data */}
                    {!loading &&
                        !error &&
                        filteredPrices.length ===
                            0 && (
                            <div className="py-20 text-center text-gray-500">
                                <Lottie
                                    animationData={
                                        loadingAnim
                                    }
                                    loop
                                    className="mx-auto h-32 w-32"
                                />

                                <p className="mt-4 font-semibold">
                                    {searchTerm
                                        ? t(
                                              "dailyPrices.noSearchResults",
                                              {
                                                  defaultValue:
                                                      "No products match your search.",
                                              }
                                          )
                                        : selectedDateHasNoData
                                          ? t(
                                                "dailyPrices.noPricesForSelectedDate",
                                                {
                                                    date: formatDisplayDate(
                                                        selectedDate
                                                    ),
                                                    defaultValue:
                                                        "No price information is available for {{date}}.",
                                                }
                                            )
                                          : t(
                                                "dailyPrices.noLatestPrices",
                                                {
                                                    defaultValue:
                                                        "No recent price information is available.",
                                                }
                                            )}
                                </p>

                                {!searchTerm &&
                                    selectedDateHasNoData && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsManualDateSelection(
                                                    false
                                                );
                                                setSelectedDate(
                                                    today
                                                );
                                                setDisplayedPriceDate(
                                                    today
                                                );
                                            }}
                                            className="
                                                mt-5 rounded-md
                                                bg-[#087b36]
                                                px-5 py-2.5
                                                text-sm
                                                font-semibold
                                                text-white
                                                transition-colors
                                                hover:bg-[#06682d]
                                            "
                                        >
                                            {t(
                                                "dailyPrices.showLatestPrices",
                                                {
                                                    defaultValue:
                                                        "Show Latest Prices",
                                                }
                                            )}
                                        </button>
                                    )}
                            </div>
                        )}

                    {/* Products */}
                    {!loading &&
                        !error &&
                        filteredPrices.length >
                            0 && (
                            <>
                                {viewMode ===
                                "grid" ? (
                                    <>
                                        <div
                                            className="
                                                grid
                                                grid-cols-1
                                                gap-5
                                                sm:grid-cols-2
                                                lg:grid-cols-3
                                                xl:grid-cols-4
                                            "
                                        >
                                            {paginatedGridPrices.map(
                                                (
                                                    item
                                                ) => (
                                                    <DailyPriceCard
                                                        key={
                                                            item.id
                                                        }
                                                        item={
                                                            item
                                                        }
                                                        navigate={
                                                            navigate
                                                        }
                                                        t={
                                                            t
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>

                                        {/* Grid pagination */}
                                        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
                                            <p className="text-sm text-gray-500">
                                                {t(
                                                    "pagination.showing",
                                                    {
                                                        defaultValue:
                                                            "Showing",
                                                    }
                                                )}{" "}
                                                <span className="font-semibold text-gray-700">
                                                    {
                                                        firstGridItem
                                                    }
                                                </span>{" "}
                                                {t(
                                                    "pagination.to",
                                                    {
                                                        defaultValue:
                                                            "to",
                                                    }
                                                )}{" "}
                                                <span className="font-semibold text-gray-700">
                                                    {
                                                        lastGridItem
                                                    }
                                                </span>{" "}
                                                {t(
                                                    "pagination.of",
                                                    {
                                                        defaultValue:
                                                            "of",
                                                    }
                                                )}{" "}
                                                <span className="font-semibold text-gray-700">
                                                    {
                                                        filteredPrices.length
                                                    }
                                                </span>{" "}
                                                {t(
                                                    "pagination.results",
                                                    {
                                                        defaultValue:
                                                            "results",
                                                    }
                                                )}
                                            </p>

                                            {totalGridPages >
                                                1 && (
                                                <nav
                                                    className="flex flex-wrap items-center justify-center gap-2"
                                                    aria-label={t(
                                                        "pagination.label",
                                                        {
                                                            defaultValue:
                                                                "Pagination",
                                                        }
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            changeGridPage(
                                                                currentPage -
                                                                    1
                                                            )
                                                        }
                                                        disabled={
                                                            currentPage ===
                                                            1
                                                        }
                                                        className="
                                                            inline-flex
                                                            h-10
                                                            items-center
                                                            gap-1
                                                            rounded-md
                                                            border
                                                            border-gray-300
                                                            px-3
                                                            text-sm
                                                            font-semibold
                                                            text-gray-600
                                                            transition-colors
                                                            hover:border-green-300
                                                            hover:bg-green-50
                                                            hover:text-[#087b36]
                                                            disabled:cursor-not-allowed
                                                            disabled:opacity-40
                                                        "
                                                    >
                                                        <ChevronLeft
                                                            size={
                                                                17
                                                            }
                                                        />

                                                        <span className="hidden sm:inline">
                                                            {t(
                                                                "pagination.previous",
                                                                {
                                                                    defaultValue:
                                                                        "Previous",
                                                                }
                                                            )}
                                                        </span>
                                                    </button>

                                                    {visiblePageNumbers.map(
                                                        (
                                                            page
                                                        ) => {
                                                            if (
                                                                typeof page !==
                                                                "number"
                                                            ) {
                                                                return (
                                                                    <span
                                                                        key={
                                                                            page
                                                                        }
                                                                        className="flex h-10 min-w-8 items-center justify-center text-gray-400"
                                                                    >
                                                                        …
                                                                    </span>
                                                                );
                                                            }

                                                            const active =
                                                                page ===
                                                                currentPage;

                                                            return (
                                                                <button
                                                                    key={
                                                                        page
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        changeGridPage(
                                                                            page
                                                                        )
                                                                    }
                                                                    aria-current={
                                                                        active
                                                                            ? "page"
                                                                            : undefined
                                                                    }
                                                                    className={`
                                                                        flex h-10 min-w-10
                                                                        items-center
                                                                        justify-center
                                                                        rounded-md
                                                                        px-3 text-sm
                                                                        font-semibold
                                                                        transition-colors
                                                                        ${
                                                                            active
                                                                                ? "bg-[#087b36] text-white shadow-sm"
                                                                                : "border border-gray-300 text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-[#087b36]"
                                                                        }
                                                                    `}
                                                                >
                                                                    {
                                                                        page
                                                                    }
                                                                </button>
                                                            );
                                                        }
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            changeGridPage(
                                                                currentPage +
                                                                    1
                                                            )
                                                        }
                                                        disabled={
                                                            currentPage ===
                                                            totalGridPages
                                                        }
                                                        className="
                                                            inline-flex
                                                            h-10
                                                            items-center
                                                            gap-1
                                                            rounded-md
                                                            border
                                                            border-gray-300
                                                            px-3
                                                            text-sm
                                                            font-semibold
                                                            text-gray-600
                                                            transition-colors
                                                            hover:border-green-300
                                                            hover:bg-green-50
                                                            hover:text-[#087b36]
                                                            disabled:cursor-not-allowed
                                                            disabled:opacity-40
                                                        "
                                                    >
                                                        <span className="hidden sm:inline">
                                                            {t(
                                                                "pagination.next",
                                                                {
                                                                    defaultValue:
                                                                        "Next",
                                                                }
                                                            )}
                                                        </span>

                                                        <ChevronRight
                                                            size={
                                                                17
                                                            }
                                                        />
                                                    </button>
                                                </nav>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    // Table receives every filtered record.
                                    <div className="overflow-hidden rounded-md bg-white">
                                        <DailyPriceTable
                                            items={
                                                filteredPrices
                                            }
                                        />
                                    </div>
                                )}
                            </>
                        )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default DailyPrice;