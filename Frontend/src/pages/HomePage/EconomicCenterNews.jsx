import axios from "axios";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useTranslation } from "react-i18next";

import NewsCard from "./NewsCard";

const EconomicCenterNews = () => {
    const { t } = useTranslation();

    const [publications, setPublications] = useState([]);
    const [activeCategory, setActiveCategory] =
        useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState([]);

    const categories = [
        {
            key: "all",
            label: t("news.categories.all"),
        },
        {
            key: "notice",
            label: t("news.categories.notice"),
        },
        {
            key: "announcement",
            label: t("news.categories.announcement"),
        },
        {
            key: "event",
            label: t("news.categories.event"),
        },
        {
            key: "news",
            label: t("news.categories.news"),
        },
    ];

    const autoplay = useMemo(
        () =>
            Autoplay({
                delay: 4500,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
            }),
        []
    );

    const [emblaRef, emblaApi] = useEmblaCarousel(
        {
            align: "start",
            loop: false,
            containScroll: "trimSnaps",
        },
        [autoplay]
    );

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/publications`
            );

            setPublications(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );
        } catch (requestError) {
            console.error(
                "Failed to load publications:",
                requestError
            );

            setError("loadFailed");
            setPublications([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const filteredPublications = useMemo(() => {
        if (activeCategory === "all") {
            return publications;
        }

        return publications.filter(
            (item) =>
                item.type?.toLowerCase() === activeCategory
        );
    }, [activeCategory, publications]);

    const updateCarouselState = useCallback(() => {
        if (!emblaApi) {
            return;
        }

        setSelectedIndex(emblaApi.selectedScrollSnap());
        setScrollSnaps(emblaApi.scrollSnapList());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) {
            return;
        }

        updateCarouselState();

        emblaApi.on("select", updateCarouselState);
        emblaApi.on("reInit", updateCarouselState);

        return () => {
            emblaApi.off("select", updateCarouselState);
            emblaApi.off("reInit", updateCarouselState);
        };
    }, [emblaApi, updateCarouselState]);

    useEffect(() => {
        if (!emblaApi) {
            return;
        }

        emblaApi.reInit();
        emblaApi.scrollTo(0);
        setSelectedIndex(0);
    }, [
        activeCategory,
        emblaApi,
        filteredPublications.length,
    ]);

    const scrollPrevious = useCallback(() => {
        emblaApi?.scrollPrev();
    }, [emblaApi]);

    const scrollNext = useCallback(() => {
        emblaApi?.scrollNext();
    }, [emblaApi]);

    const scrollTo = useCallback(
        (index) => {
            emblaApi?.scrollTo(index);
        },
        [emblaApi]
    );

    return (
        <section className="border-t-2 border-[#087b36] bg-white px-4 py-16 sm:px-6 lg:py-20">
            <div className="mx-auto max-w-[1320px]">
                {/* Header */}
                <div className="mx-auto max-w-[900px] text-center">
                    <h2 className="text-4xl font-extrabold tracking-tight text-[#087b36] sm:text-5xl lg:text-[72px]">
                        {t("news.title")}
                    </h2>

                    <p className="mt-4 text-lg text-[#7b7b7b] sm:text-xl">
                        {t("news.subtitle")}
                    </p>
                </div>

                {/* Filters */}
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    {categories.map((category) => {
                        const active =
                            activeCategory === category.key;

                        return (
                            <button
                                key={category.key}
                                type="button"
                                onClick={() =>
                                    setActiveCategory(
                                        category.key
                                    )
                                }
                                className={`
                                    min-w-[88px] rounded-full
                                    border px-6 py-2
                                    text-sm font-medium
                                    transition-all duration-200
                                    ${
                                        active
                                            ? "border-green-100 bg-[#edf7e9] text-[#087b36] shadow-sm"
                                            : "border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-green-50 hover:text-[#087b36]"
                                    }
                                `}
                            >
                                {category.label}
                            </button>
                        );
                    })}
                </div>

                {loading && (
                    <div className="flex min-h-[390px] items-center justify-center">
                        <p className="text-gray-500">
                            {t("news.loading")}
                        </p>
                    </div>
                )}

                {!loading && error && (
                    <div className="mt-12 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
                        <p className="text-red-700">
                            {t(`news.${error}`)}
                        </p>

                        <button
                            type="button"
                            onClick={fetchNotifications}
                            className="mt-4 rounded-md bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700"
                        >
                            {t("news.retry")}
                        </button>
                    </div>
                )}

                {!loading &&
                    !error &&
                    filteredPublications.length === 0 && (
                        <div className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-12 text-center text-gray-500">
                            {t("news.noPublications")}
                        </div>
                    )}

                {!loading &&
                    !error &&
                    filteredPublications.length > 0 && (
                        <>
                            <div className="relative mt-8 px-0 sm:px-14">
                                <button
                                    type="button"
                                    onClick={scrollPrevious}
                                    aria-label={t(
                                        "news.previous"
                                    )}
                                    className="
                                        absolute left-0 top-1/2 z-20
                                        hidden h-11 w-11
                                        -translate-y-1/2
                                        items-center justify-center
                                        rounded-full bg-[#e4e4e4]
                                        text-[#087b36]
                                        transition-colors
                                        hover:bg-green-100
                                        sm:flex
                                    "
                                >
                                    <ChevronLeft
                                        size={28}
                                        strokeWidth={2}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={scrollNext}
                                    aria-label={t("news.next")}
                                    className="
                                        absolute right-0 top-1/2 z-20
                                        hidden h-11 w-11
                                        -translate-y-1/2
                                        items-center justify-center
                                        rounded-full bg-[#e4e4e4]
                                        text-[#087b36]
                                        transition-colors
                                        hover:bg-green-100
                                        sm:flex
                                    "
                                >
                                    <ChevronRight
                                        size={28}
                                        strokeWidth={2}
                                    />
                                </button>

                                <div
                                    ref={emblaRef}
                                    className="overflow-hidden"
                                >
                                    <div className="-ml-4 flex touch-pan-y">
                                        {filteredPublications.map(
                                            (item) => (
                                                <div
                                                    key={
                                                        item._id ||
                                                        item.id
                                                    }
                                                    className="
                                                        min-w-0 flex-[0_0_100%]
                                                        pl-4
                                                        sm:flex-[0_0_50%]
                                                        lg:flex-[0_0_33.333333%]
                                                    "
                                                >
                                                    <NewsCard
                                                        item={item}
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>

                            {scrollSnaps.length > 1 && (
                                <div className="mt-7 flex items-center justify-center gap-2">
                                    {scrollSnaps.map(
                                        (_, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() =>
                                                    scrollTo(index)
                                                }
                                                aria-label={t(
                                                    "news.goToSlide",
                                                    {
                                                        number:
                                                            index +
                                                            1,
                                                    }
                                                )}
                                                className={`
                                                    rounded-full
                                                    transition-all duration-200
                                                    ${
                                                        selectedIndex ===
                                                        index
                                                            ? "h-3 w-3 bg-[#087b36]"
                                                            : "h-2.5 w-2.5 bg-gray-300 hover:bg-gray-400"
                                                    }
                                                `}
                                            />
                                        )
                                    )}
                                </div>
                            )}
                        </>
                    )}
            </div>
        </section>
    );
};

export default EconomicCenterNews;