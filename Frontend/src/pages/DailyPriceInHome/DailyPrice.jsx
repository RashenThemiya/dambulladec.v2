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

const GRID_PAGE_SIZE = 12;
const TABLE_PAGE_SIZE = 25;
const PDF_PAGE_SIZE = 100;
const MAXIMUM_FALLBACK_DAYS = 60;
const SEARCH_DELAY = 400;

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

const EMPTY_PAGINATION = {
    currentPage: 1,
    pageSize: TABLE_PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
};

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

    const dropdownRef = useRef(null);

    const today = getLocalDateValue();
    const querySearch =
        searchParams.get("search") || "";

    const [dailyPrices, setDailyPrices] =
        useState([]);

    const [pagination, setPagination] =
        useState(EMPTY_PAGINATION);

    const [loading, setLoading] = useState(true);
    const [resolvingDate, setResolvingDate] =
        useState(true);
    const [downloadingPdf, setDownloadingPdf] =
        useState(false);
    const [error, setError] = useState("");

    const [selectedDate, setSelectedDate] =
        useState(today);

    const [
        displayedPriceDate,
        setDisplayedPriceDate,
    ] = useState(today);

    const [
        showingLatestAvailable,
        setShowingLatestAvailable,
    ] = useState(false);

    const [
        isManualDateSelection,
        setIsManualDateSelection,
    ] = useState(false);

    const [selectedDateHasNoData, setSelectedDateHasNoData] =
        useState(false);

    const [searchTerm, setSearchTerm] =
        useState(querySearch);

    const [debouncedSearch, setDebouncedSearch] =
        useState(querySearch);

    const [selectedType, setSelectedType] =
        useState("all");

    const [dropdownOpen, setDropdownOpen] =
        useState(false);

    // Table is the default view.
    const [viewMode, setViewMode] =
        useState("list");

    const [currentPage, setCurrentPage] =
        useState(1);

    const pageSize =
        viewMode === "grid"
            ? GRID_PAGE_SIZE
            : TABLE_PAGE_SIZE;

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

    /*
     * Request one paginated page.
     *
     * Search and type values are sent to the backend,
     * so the backend filters before applying pagination.
     */
    const requestPricePage = useCallback(
        async ({
            date,
            page = 1,
            limit = TABLE_PAGE_SIZE,
            search = "",
            type = "all",
        }) => {
            const response = await axios.get(
                `${
                    import.meta.env
                        .VITE_API_BASE_URL
                }/api/prices/by-date/${date}`,
                {
                    params: {
                        page,
                        limit,
                        ...(search.trim()
                            ? {
                                  search:
                                      search.trim(),
                              }
                            : {}),
                        ...(type !== "all"
                            ? { type }
                            : {}),
                    },
                }
            );

            /*
             * Supports the new paginated response.
             * The array fallback prevents an immediate crash
             * while the backend is being updated.
             */
            if (Array.isArray(response.data)) {
                return {
                    data: response.data,
                    pagination: {
                        currentPage: 1,
                        pageSize:
                            response.data.length,
                        totalItems:
                            response.data.length,
                        totalPages:
                            response.data.length > 0
                                ? 1
                                : 0,
                        hasPreviousPage: false,
                        hasNextPage: false,
                    },
                };
            }

            return {
                data: Array.isArray(
                    response.data?.data
                )
                    ? response.data.data
                    : [],

                pagination: {
                    ...EMPTY_PAGINATION,
                    ...(response.data
                        ?.pagination || {}),
                },
            };
        },
        []
    );

    /*
     * Checks whether a date contains any price records.
     *
     * Search and category filters are intentionally omitted.
     * Otherwise a valid date could be incorrectly treated as
     * empty merely because the user's search has no matches.
     */
    const dateHasPrices = useCallback(
        async (dateValue) => {
            const result = await requestPricePage({
                date: dateValue,
                page: 1,
                limit: 1,
                search: "",
                type: "all",
            });

            return (
                result.pagination.totalItems > 0 ||
                result.data.length > 0
            );
        },
        [requestPricePage]
    );

    /*
     * Resolves which date should be displayed.
     *
     * Automatic page load:
     * - today when today's prices exist
     * - otherwise latest available historical date
     *
     * Manual date selection:
     * - exact selected date only
     * - no automatic fallback
     */
    const resolveDisplayedDate =
        useCallback(async () => {
            setResolvingDate(true);
            setLoading(true);
            setError("");
            setDailyPrices([]);
            setPagination(EMPTY_PAGINATION);
            setSelectedDateHasNoData(false);
            setShowingLatestAvailable(false);

            try {
                const requestedDateHasPrices =
                    await dateHasPrices(
                        selectedDate
                    );

                if (requestedDateHasPrices) {
                    setDisplayedPriceDate(
                        selectedDate
                    );
                    setShowingLatestAvailable(
                        false
                    );
                    return;
                }

                if (isManualDateSelection) {
                    setDisplayedPriceDate(
                        selectedDate
                    );
                    setSelectedDateHasNoData(
                        true
                    );
                    return;
                }

                for (
                    let dayOffset = 1;
                    dayOffset <=
                    MAXIMUM_FALLBACK_DAYS;
                    dayOffset += 1
                ) {
                    const previousDate =
                        getPreviousDate(
                            today,
                            dayOffset
                        );

                    const previousDateHasPrices =
                        await dateHasPrices(
                            previousDate
                        );

                    if (
                        previousDateHasPrices
                    ) {
                        setDisplayedPriceDate(
                            previousDate
                        );
                        setShowingLatestAvailable(
                            true
                        );
                        return;
                    }
                }

                setDisplayedPriceDate(today);
                setSelectedDateHasNoData(true);
            } catch (requestError) {
                console.error(
                    "Failed to resolve price date:",
                    requestError
                );

                setError(
                    t("dailyPrices.loadError", {
                        defaultValue:
                            "Unable to load daily prices.",
                    })
                );
            } finally {
                setResolvingDate(false);
            }
        }, [
            dateHasPrices,
            isManualDateSelection,
            selectedDate,
            t,
            today,
        ]);

    useEffect(() => {
        resolveDisplayedDate();
    }, [resolveDisplayedDate]);

    /*
     * Debounce the search box so the API is not called
     * for every individual key press.
     */
    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, SEARCH_DELAY);

        return () => {
            window.clearTimeout(timer);
        };
    }, [searchTerm]);

    /*
     * Fetch the selected backend page after the displayed
     * date has been resolved.
     */
    useEffect(() => {
        if (
            resolvingDate ||
            selectedDateHasNoData
        ) {
            setLoading(false);
            return;
        }

        let ignoreResult = false;

        const fetchPage = async () => {
            setLoading(true);
            setError("");

            try {
                const result =
                    await requestPricePage({
                        date: displayedPriceDate,
                        page: currentPage,
                        limit: pageSize,
                        search: debouncedSearch,
                        type: selectedType,
                    });

                if (ignoreResult) {
                    return;
                }

                setDailyPrices(result.data);
                setPagination(
                    result.pagination
                );
            } catch (requestError) {
                if (ignoreResult) {
                    return;
                }

                console.error(
                    "Failed to fetch daily prices:",
                    requestError
                );

                setDailyPrices([]);
                setPagination(
                    EMPTY_PAGINATION
                );

                setError(
                    t("dailyPrices.loadError", {
                        defaultValue:
                            "Unable to load daily prices.",
                    })
                );
            } finally {
                if (!ignoreResult) {
                    setLoading(false);
                }
            }
        };

        fetchPage();

        return () => {
            ignoreResult = true;
        };
    }, [
        currentPage,
        debouncedSearch,
        displayedPriceDate,
        pageSize,
        requestPricePage,
        resolvingDate,
        selectedDateHasNoData,
        selectedType,
        t,
    ]);

    // Keep search state synchronized with the URL.
    useEffect(() => {
        setSearchTerm(querySearch);
    }, [querySearch]);

    // Reset backend page whenever query settings change.
    useEffect(() => {
        setCurrentPage(1);
    }, [
        debouncedSearch,
        selectedType,
        displayedPriceDate,
        viewMode,
    ]);

    // Close dropdown when clicking outside.
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

                if (productName) {
                    translations[productName] =
                        t(productName, {
                            defaultValue:
                                productName,
                        });
                }
            });

            return translations;
        }, [dailyPrices, t]);

    const translatedCurrentPage = useMemo(
        () =>
            dailyPrices.map((item) => ({
                ...item,
                product: item.product
                    ? {
                          ...item.product,
                          name:
                              productNamesTranslations[
                                  item.product
                                      .name
                              ] ||
                              item.product.name,
                      }
                    : null,
            })),
        [
            dailyPrices,
            productNamesTranslations,
        ]
    );

    const selectedProductType =
        PRODUCT_TYPES.find(
            (productType) =>
                productType.value ===
                selectedType
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
                      defaultValue:
                          selectedType,
                  }
              );

    const visiblePageNumbers = useMemo(
        () =>
            getVisiblePageNumbers(
                pagination.currentPage,
                pagination.totalPages
            ),
        [
            pagination.currentPage,
            pagination.totalPages,
        ]
    );

    const firstItemNumber =
        pagination.totalItems === 0
            ? 0
            : (pagination.currentPage - 1) *
                  pagination.pageSize +
              1;

    const lastItemNumber = Math.min(
        pagination.currentPage *
            pagination.pageSize,
        pagination.totalItems
    );

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

    const typesTranslations = t("types", {
        returnObjects: true,
    });

    const handleSearchChange = (event) => {
        const value = event.target.value;

        setSearchTerm(value);

        const nextParams =
            new URLSearchParams(searchParams);

        if (value.trim()) {
            nextParams.set("search", value);
        } else {
            nextParams.delete("search");
        }

        setSearchParams(nextParams, {
            replace: true,
        });
    };

    const clearSearch = () => {
        setSearchTerm("");
        setDebouncedSearch("");

        const nextParams =
            new URLSearchParams(searchParams);

        nextParams.delete("search");

        setSearchParams(nextParams, {
            replace: true,
        });
    };

    /*
     * PDF export retrieves every backend page matching the
     * current date, search and category.
     */
    const downloadPDF = async () => {
        setDownloadingPdf(true);

        try {
            const firstResult =
                await requestPricePage({
                    date: displayedPriceDate,
                    page: 1,
                    limit: PDF_PAGE_SIZE,
                    search: debouncedSearch,
                    type: selectedType,
                });

            let allPrices = [
                ...firstResult.data,
            ];

            for (
                let page = 2;
                page <=
                firstResult.pagination
                    .totalPages;
                page += 1
            ) {
                const nextResult =
                    await requestPricePage({
                        date: displayedPriceDate,
                        page,
                        limit: PDF_PAGE_SIZE,
                        search:
                            debouncedSearch,
                        type: selectedType,
                    });

                allPrices = [
                    ...allPrices,
                    ...nextResult.data,
                ];
            }

            const translatedProducts =
                allPrices.map((item) => ({
                    ...item,
                    product: item.product
                        ? {
                              ...item.product,
                              name: t(
                                  item.product
                                      .name,
                                  {
                                      defaultValue:
                                          item
                                              .product
                                              .name,
                                  }
                              ),
                          }
                        : null,
                }));

            printDailyPrices({
                prices: translatedProducts,
                date: displayedPriceDate,
                ui: uiTranslations,
                productNames: {},
                types: typesTranslations,
            });
        } catch (requestError) {
            console.error(
                "Failed to prepare PDF:",
                requestError
            );

            setError(
                t("dailyPrices.pdfError", {
                    defaultValue:
                        "Unable to prepare the PDF.",
                })
            );
        } finally {
            setDownloadingPdf(false);
        }
    };

    const changePage = (page) => {
        if (
            page < 1 ||
            page >
                pagination.totalPages ||
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

    const hasResults =
        dailyPrices.length > 0;

    const noFilteredResults =
        !loading &&
        !error &&
        !selectedDateHasNoData &&
        pagination.totalItems === 0;

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
                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                            {/* View buttons */}
                            <div className="flex overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setViewMode(
                                            "list"
                                        )
                                    }
                                    aria-pressed={
                                        viewMode ===
                                        "list"
                                    }
                                    className={`flex h-10 w-11 items-center justify-center ${
                                        viewMode ===
                                        "list"
                                            ? "bg-green-100 text-[#087b36]"
                                            : "text-gray-500 hover:bg-gray-50"
                                    }`}
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
                                    aria-pressed={
                                        viewMode ===
                                        "grid"
                                    }
                                    className={`flex h-10 w-11 items-center justify-center border-l border-gray-200 ${
                                        viewMode ===
                                        "grid"
                                            ? "bg-green-100 text-[#087b36]"
                                            : "text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    <Grid2X2
                                        size={17}
                                    />
                                </button>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-[220px]">
                                    <CalendarDays
                                        size={18}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#08772f]"
                                    />

                                    <input
                                        type="date"
                                        value={
                                            displayedPriceDate
                                        }
                                        max={today}
                                        onChange={(
                                            event
                                        ) => {
                                            const chosenDate =
                                                event
                                                    .target
                                                    .value;

                                            setIsManualDateSelection(
                                                true
                                            );
                                            setSelectedDate(
                                                chosenDate
                                            );
                                            setDisplayedPriceDate(
                                                chosenDate
                                            );
                                            setCurrentPage(
                                                1
                                            );
                                        }}
                                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-12 pr-4 shadow-sm outline-none focus:border-[#08772f] focus:ring-4 focus:ring-green-100"
                                    />
                                </div>

                                {!isManualDateSelection &&
                                    (showingLatestAvailable ? (
                                        <span className="whitespace-nowrap rounded-full bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-700">
                                            {t(
                                                "dailyPrices.latestAvailable",
                                                {
                                                    defaultValue:
                                                        "Latest Available",
                                                }
                                            )}
                                        </span>
                                    ) : displayedPriceDate ===
                                          today &&
                                      hasResults ? (
                                        <span className="whitespace-nowrap rounded-full bg-green-100 px-3 py-2 text-xs font-semibold text-green-700">
                                            {t(
                                                "dailyPrices.today",
                                                {
                                                    defaultValue:
                                                        "Today",
                                                }
                                            )}
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
                                            (open) =>
                                                !open
                                        )
                                    }
                                    className="flex h-10 min-w-[170px] items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm"
                                >
                                    <span>
                                        {
                                            selectedTypeLabel
                                        }
                                    </span>

                                    <ChevronDown
                                        size={17}
                                        className={
                                            dropdownOpen
                                                ? "rotate-180"
                                                : ""
                                        }
                                    />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute left-0 top-full z-40 mt-2 min-w-[210px] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
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
                                            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-green-50"
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
                                                    className="block w-full px-4 py-2.5 text-left text-sm hover:bg-green-50"
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
                                    className="h-10 w-full rounded-md border border-gray-200 bg-white px-4 pr-10 text-sm shadow-sm outline-none focus:border-[#087b36] focus:ring-2 focus:ring-green-100"
                                />

                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    {searchTerm ? (
                                        <button
                                            type="button"
                                            onClick={
                                                clearSearch
                                            }
                                        >
                                            <X
                                                size={
                                                    17
                                                }
                                                className="text-gray-400 hover:text-red-500"
                                            />
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

                        {pagination.totalItems > 0 && (
                            <button
                                type="button"
                                onClick={downloadPDF}
                                disabled={
                                    downloadingPdf
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#087b36] px-5 text-sm font-semibold text-white hover:bg-[#06682d] disabled:opacity-60"
                            >
                                {downloadingPdf
                                    ? t(
                                          "dailyPrices.preparingPdf",
                                          {
                                              defaultValue:
                                                  "Preparing PDF...",
                                          }
                                      )
                                    : t(
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

                    {/* Date notice */}
                    {!loading &&
                        !error &&
                        hasResults && (
                            <div
                                className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                                    showingLatestAvailable
                                        ? "border-amber-200 bg-amber-50 text-amber-800"
                                        : "border-green-200 bg-green-50 text-green-800"
                                }`}
                            >
                                <Clock3
                                    size={19}
                                    className="shrink-0"
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
                        )}

                    {/* Loading */}
                    {loading && (
                        <div
                            className={
                                viewMode === "grid"
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
                                        key={index}
                                    />
                                )
                            )}
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
                                onClick={
                                    resolveDisplayedDate
                                }
                                className="mt-4 rounded-md bg-red-600 px-5 py-2.5 font-semibold text-white"
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
                        (selectedDateHasNoData ||
                            noFilteredResults) && (
                            <div className="py-20 text-center text-gray-500">
                                <Lottie
                                    animationData={
                                        loadingAnim
                                    }
                                    loop
                                    className="mx-auto h-32 w-32"
                                />

                                <p className="mt-4 font-semibold">
                                    {selectedDateHasNoData
                                        ? t(
                                              "dailyPrices.noPricesForSelectedDate",
                                              {
                                                  date: formatDisplayDate(
                                                      displayedPriceDate
                                                  ),
                                                  defaultValue:
                                                      "No price information is available for {{date}}.",
                                              }
                                          )
                                        : t(
                                              "dailyPrices.noSearchResults",
                                              {
                                                  defaultValue:
                                                      "No products match the selected filters.",
                                              }
                                          )}
                                </p>

                                {isManualDateSelection &&
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
                                                setCurrentPage(
                                                    1
                                                );
                                            }}
                                            className="mt-5 rounded-md bg-[#087b36] px-5 py-2.5 text-sm font-semibold text-white"
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

                    {/* Results */}
                    {!loading &&
                        !error &&
                        hasResults && (
                            <>
                                {viewMode ===
                                "grid" ? (
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {dailyPrices.map(
                                            (item) => (
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
                                ) : (
                                    <div className="overflow-hidden rounded-md bg-white">
                                        <DailyPriceTable
                                            items={
                                                translatedCurrentPage
                                            }
                                        />
                                    </div>
                                )}

                                {/* Backend pagination for both views */}
                                {pagination.totalPages >
                                    1 && (
                                    <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
                                        <p className="text-sm text-gray-500">
                                            {t(
                                                "pagination.showing",
                                                {
                                                    defaultValue:
                                                        "Showing",
                                                }
                                            )}{" "}
                                            <strong>
                                                {
                                                    firstItemNumber
                                                }
                                            </strong>{" "}
                                            {t(
                                                "pagination.to",
                                                {
                                                    defaultValue:
                                                        "to",
                                                }
                                            )}{" "}
                                            <strong>
                                                {
                                                    lastItemNumber
                                                }
                                            </strong>{" "}
                                            {t(
                                                "pagination.of",
                                                {
                                                    defaultValue:
                                                        "of",
                                                }
                                            )}{" "}
                                            <strong>
                                                {
                                                    pagination.totalItems
                                                }
                                            </strong>
                                        </p>

                                        <nav className="flex flex-wrap items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changePage(
                                                        currentPage -
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    !pagination.hasPreviousPage
                                                }
                                                className="flex h-10 items-center rounded-md border border-gray-300 px-3 disabled:opacity-40"
                                            >
                                                <ChevronLeft
                                                    size={
                                                        17
                                                    }
                                                />
                                            </button>

                                            {visiblePageNumbers.map(
                                                (
                                                    page
                                                ) =>
                                                    typeof page ===
                                                    "number" ? (
                                                        <button
                                                            key={
                                                                page
                                                            }
                                                            type="button"
                                                            onClick={() =>
                                                                changePage(
                                                                    page
                                                                )
                                                            }
                                                            className={`h-10 min-w-10 rounded-md px-3 text-sm font-semibold ${
                                                                page ===
                                                                pagination.currentPage
                                                                    ? "bg-[#087b36] text-white"
                                                                    : "border border-gray-300 text-gray-600 hover:bg-green-50"
                                                            }`}
                                                        >
                                                            {
                                                                page
                                                            }
                                                        </button>
                                                    ) : (
                                                        <span
                                                            key={
                                                                page
                                                            }
                                                            className="px-1 text-gray-400"
                                                        >
                                                            …
                                                        </span>
                                                    )
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changePage(
                                                        currentPage +
                                                            1
                                                    )
                                                }
                                                disabled={
                                                    !pagination.hasNextPage
                                                }
                                                className="flex h-10 items-center rounded-md border border-gray-300 px-3 disabled:opacity-40"
                                            >
                                                <ChevronRight
                                                    size={
                                                        17
                                                    }
                                                />
                                            </button>
                                        </nav>
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