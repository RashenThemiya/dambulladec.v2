import {
    Apple,
    CalendarDays,
    Carrot,
    ChartNoAxesColumnIncreasing,
    ChevronRight,
    Leaf,
    Package,
    Sprout,
    Wheat,
} from "lucide-react";

const categoryConfig = {
    fruit: {
        icon: Apple,
        translationKey: "dailyPrices.categories.fruit",
    },
    vegetable: {
        icon: Carrot,
        translationKey: "dailyPrices.categories.vegetable",
    },
    rice: {
        icon: Sprout,
        translationKey: "dailyPrices.categories.rice",
    },
    potatoes: {
        icon: Package,
        translationKey: "dailyPrices.categories.potatoes",
    },
    "leaf vegetable": {
        icon: Leaf,
        translationKey: "dailyPrices.categories.leafVegetable",
    },
    grain: {
        icon: Wheat,
        translationKey: "dailyPrices.categories.grain",
    },
};

const DailyPriceCard = ({ item, navigate, t }) => {
    const productName =
        item.product?.name || "Unnamed Product";

    const rawProductType =
        item.product?.type || "";

    // Converts " Vegetable ", "VEGETABLE", etc. to "vegetable"
    const normalizedProductType = rawProductType
        .trim()
        .toLowerCase();

    const translatedProductName = t(productName, {
        defaultValue: productName,
    });

    const selectedCategory =
        categoryConfig[normalizedProductType] || {
            icon: Package,
            translationKey: "dailyPrices.categories.other",
        };

    const CategoryIcon = selectedCategory.icon;

    const translatedProductType = t(
        selectedCategory.translationKey,
        {
            defaultValue: rawProductType || "Other",
        }
    );

    const formatPrice = (price) => {
        const numericPrice = Number(price);

        if (Number.isNaN(numericPrice)) {
            return price ?? "-";
        }

        return new Intl.NumberFormat("en-LK", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numericPrice);
    };

    const formatDate = (dateValue) => {
        if (!dateValue) {
            return "-";
        }

        const date = new Date(`${dateValue}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
        }).format(date);
    };

    const handleViewHistory = () => {
        const productId = item.product?.id;

        if (!productId) {
            return;
        }

        navigate(`/product/${productId}/chart`);
    };

    return (
        <article
            className="
                group flex h-full w-full flex-col
                overflow-hidden rounded-[16px]
                border border-gray-200 bg-white
                shadow-[0_8px_24px_rgba(0,0,0,0.10)]
                transition-all duration-300
                hover:-translate-y-1
                hover:shadow-[0_14px_32px_rgba(0,0,0,0.16)]
            "
        >
            {/* Image section */}
            <div className="relative h-[220px] overflow-hidden bg-gray-100">
                {item.product?.image ? (
                    <img
                        src={item.product.image}
                        alt={translatedProductName}
                        className="
                            h-full w-full object-cover
                            transition-transform duration-500
                            group-hover:scale-105
                        "
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                        {t("dailyPrices.noImage", {
                            defaultValue: "No Image",
                        })}
                    </div>
                )}

                {/* Dynamic category badge */}
                <div
                    className="
                        absolute left-5 top-5 z-20
                        inline-flex items-center gap-2
                        rounded-full border-2 border-white
                        bg-[#176b32] px-4 py-1.5
                        text-white shadow-md
                    "
                >
                    <CategoryIcon
                        size={20}
                        strokeWidth={2}
                    />

                    <span className="text-base font-medium">
                        {translatedProductType}
                    </span>
                </div>

                {/* Curved edge */}
                <svg
                    viewBox="0 0 500 70"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                    className="
                        pointer-events-none
                        absolute -bottom-px left-0 z-10
                        h-[58px] w-full
                    "
                >
                    <path
                        d="M0 10 C130 55, 350 75, 500 12 L500 70 L0 70 Z"
                        fill="white"
                    />
                </svg>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col px-5 pb-6 pt-7 sm:px-6">
                <h2 className="text-center text-[24px] font-bold leading-tight text-black sm:text-[27px]">
                    {translatedProductName}
                </h2>

                <div className="mt-6">
                    <p className="text-[16px] font-semibold text-[#08772f]">
                        {t("dailyPrices.priceRange", {
                            defaultValue: "Price Range",
                        })}
                    </p>

                    <p className="mt-1 text-[36px] font-extrabold leading-none text-[#08772f] sm:text-[42px]">
                        Rs. {formatPrice(item.min_price)} -{" "}
                        {formatPrice(item.max_price)}
                    </p>
                </div>

                <div className="my-5 border-t border-gray-300" />

                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf8f0] text-[#08772f]">
                        <CalendarDays
                            size={19}
                            strokeWidth={2}
                        />
                    </div>

                    <p className="text-[15px] text-gray-500">
                        {t("dailyPrices.updated", {
                            defaultValue: "Updated:",
                        })}{" "}
                        <span className="font-semibold text-gray-700">
                            {formatDate(item.date)}
                        </span>
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleViewHistory}
                    disabled={!item.product?.id}
                    className="
                        mt-6 flex w-full items-center justify-between
                        rounded-[11px] bg-[#0b8a38]
                        px-5 py-4 text-[16px]
                        font-semibold text-white
                        transition-colors duration-200
                        hover:bg-[#08722f]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    <span className="flex items-center gap-3">
                        <ChartNoAxesColumnIncreasing
                            size={20}
                            strokeWidth={2}
                        />

                        {t("dailyPrices.history", {
                            defaultValue: "View Price History",
                        })}
                    </span>

                    <ChevronRight
                        size={23}
                        strokeWidth={2.4}
                    />
                </button>
            </div>
        </article>
    );
};

export default DailyPriceCard;