import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const normalizeText = (value) =>
    String(value || "")
        .trim()
        .toLowerCase();

const DailyPriceTable = ({ items = [] }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const translateProductName = (name) => {
        if (!name) {
            return "-";
        }

        return t(name, {
            defaultValue: name,
        });
    };

    const translateProductType = (type) => {
        if (!type) {
            return t("dailyPrices.categories.other", {
                defaultValue: "Other",
            });
        }

        const normalizedType = normalizeText(type);

        const categoryKeys = {
            fruit: "dailyPrices.categories.fruit",
            vegetable: "dailyPrices.categories.vegetable",
            rice: "dailyPrices.categories.rice",
            potatoes: "dailyPrices.categories.potatoes",
            "leaf vegetable":
                "dailyPrices.categories.leafVegetable",
            grain: "dailyPrices.categories.grain",
        };

        const translationKey =
            categoryKeys[normalizedType];

        return translationKey
            ? t(translationKey, {
                  defaultValue: type,
              })
            : type;
    };

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

    const formatPriceRange = (minPrice, maxPrice) => {
        return `${formatPrice(minPrice)} - ${formatPrice(
            maxPrice
        )}`;
    };

    const handleViewHistory = (productId) => {
        if (!productId) {
            return;
        }

        navigate(`/product/${productId}/chart`);
    };

    if (!items.length) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-500">
                {t("dailyPrices.noData", {
                    defaultValue:
                        "No daily price data available.",
                })}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Mobile card layout */}
            <div className="space-y-4 md:hidden">
                {items.map((item) => {
                    const productId = item.product?.id;

                    return (
                        <article
                            key={item.id}
                            className="
                                overflow-hidden rounded-xl
                                border border-emerald-200
                                bg-white shadow-sm
                                transition-shadow
                                hover:shadow-md
                            "
                        >
                            {/* Card header */}
                            <div className="flex items-center justify-between gap-3 bg-[#087b36] px-4 py-3 text-white">
                                <h3 className="min-w-0 truncate text-base font-semibold">
                                    {translateProductName(
                                        item.product?.name
                                    )}
                                </h3>

                                <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                                    {translateProductType(
                                        item.product?.type
                                    )}
                                </span>
                            </div>

                            {/* Card content */}
                            <div className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
                                    <span className="text-sm text-gray-500">
                                        {t(
                                            "dailyPrices.priceRange",
                                            {
                                                defaultValue:
                                                    "Price Range (LKR)",
                                            }
                                        )}
                                    </span>

                                    <span className="text-right text-sm font-bold text-gray-800">
                                        Rs.{" "}
                                        {formatPriceRange(
                                            item.min_price,
                                            item.max_price
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-start justify-between gap-4">
                                    <span className="text-sm text-gray-500">
                                        {t("dailyPrices.date", {
                                            defaultValue:
                                                "Date",
                                        })}
                                    </span>

                                    <span className="text-right text-sm font-medium text-gray-700">
                                        {item.date || "-"}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleViewHistory(
                                            productId
                                        )
                                    }
                                    disabled={!productId}
                                    className="
                                        mt-2 w-full rounded-lg
                                        bg-[#008a3b] px-4 py-2.5
                                        text-sm font-semibold text-white
                                        transition-colors
                                        hover:bg-[#006f30]
                                        focus:outline-none
                                        focus:ring-2
                                        focus:ring-emerald-500
                                        focus:ring-offset-2
                                        disabled:cursor-not-allowed
                                        disabled:opacity-50
                                    "
                                >
                                    {t(
                                        "dailyPrices.viewHistory",
                                        {
                                            defaultValue:
                                                "View Price History",
                                        }
                                    )}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* Tablet and desktop table layout */}
            <div className="hidden overflow-hidden rounded-xl border border-emerald-200 md:block">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse bg-white">
                        <thead>
                            <tr className="bg-[#087b36] text-white">
                                <th className="px-4 py-4 text-center text-sm font-semibold lg:px-5">
                                    {t(
                                        "dailyPrices.category",
                                        {
                                            defaultValue:
                                                "Category",
                                        }
                                    )}
                                </th>

                                <th className="px-4 py-4 text-center text-sm font-semibold lg:px-5">
                                    {t("dailyPrices.name", {
                                        defaultValue:
                                            "Name",
                                    })}
                                </th>

                                <th className="px-4 py-4 text-center text-sm font-semibold lg:px-5">
                                    {t(
                                        "dailyPrices.priceRange",
                                        {
                                            defaultValue:
                                                "Price Range (LKR)",
                                        }
                                    )}
                                </th>

                                <th className="px-4 py-4 text-center text-sm font-semibold lg:px-5">
                                    {t("dailyPrices.date", {
                                        defaultValue:
                                            "Date",
                                    })}
                                </th>

                                <th className="px-4 py-4 text-center text-sm font-semibold lg:px-5">
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
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    className="
                                        border-b
                                        border-emerald-200
                                        transition-colors
                                        last:border-b-0
                                        hover:bg-green-50
                                    "
                                >
                                    <td className="px-4 py-4 text-center text-sm font-medium text-gray-700 lg:px-5">
                                        {translateProductType(
                                            item.product
                                                ?.type
                                        )}
                                    </td>

                                    <td className="px-4 py-4 text-center text-sm font-semibold text-gray-800 lg:px-5">
                                        {translateProductName(
                                            item.product
                                                ?.name
                                        )}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-semibold text-gray-800 lg:px-5">
                                        {formatPriceRange(
                                            item.min_price,
                                            item.max_price
                                        )}
                                    </td>

                                    <td className="whitespace-nowrap px-4 py-4 text-center text-sm font-medium text-gray-700 lg:px-5">
                                        {item.date || "-"}
                                    </td>

                                    <td className="px-4 py-4 text-center lg:px-5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleViewHistory(
                                                    item
                                                        .product
                                                        ?.id
                                                )
                                            }
                                            disabled={
                                                !item.product
                                                    ?.id
                                            }
                                            className="
                                                whitespace-nowrap
                                                font-medium
                                                text-[#008a3b]
                                                underline
                                                underline-offset-4
                                                transition-colors
                                                hover:text-[#00662b]
                                                focus:outline-none
                                                focus:ring-2
                                                focus:ring-emerald-500
                                                focus:ring-offset-2
                                                disabled:cursor-not-allowed
                                                disabled:opacity-50
                                            "
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
            </div>
        </div>
    );
};

export default DailyPriceTable;