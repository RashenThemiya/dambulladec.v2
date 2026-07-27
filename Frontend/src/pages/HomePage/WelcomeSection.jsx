import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    BarChart3,
    Clock3,
    Phone,
    Search,
    Sprout,
    Users,
} from "lucide-react";
import openTimeIcon from "../../assets/open-time.svg";

const WelcomeSection = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState("");

    const handleSearch = (event) => {
    event.preventDefault();

    const trimmedSearch = searchText.trim();

    if (!trimmedSearch) {
        navigate("/home-dailyprice");
        return;
    }

    navigate(
        `/home-dailyprice?search=${encodeURIComponent(
            trimmedSearch
        )}`
    );
};

    const statistics = [
        {
            value: t("featureCards.tradersValue"),
            label: t("featureCards.tradersLabel"),
            icon: Users,
        },
        {
            value: t("featureCards.vegetablesValue"),
            label: t("featureCards.vegetablesLabel"),
            icon: Sprout,
        },
        {
            value: t("featureCards.marketShareValue"),
            label: t("featureCards.marketShareLabel"),
            icon: BarChart3,
        },
    ];

    return (
        <>
            <Helmet>
                <title>
                    Dambulla Dedicated Economic Center | Welcome
                </title>

                <meta
                    name="description"
                    content="Welcome to the Dambulla Dedicated Economic Center, Sri Lanka's hub for wholesale vegetable trading and daily agricultural prices."
                />

                <meta
                    name="keywords"
                    content="Dambulla Economic Center, daily vegetable prices, Sri Lanka vegetables, wholesale market, farmers market"
                />

                <link
                    rel="canonical"
                    href="https://dambulladec.com/"
                />

                <meta
                    property="og:title"
                    content="Dambulla Dedicated Economic Center"
                />

                <meta
                    property="og:description"
                    content="Explore daily agricultural prices and services at the Dambulla Dedicated Economic Center."
                />

                <meta
                    property="og:image"
                    content="https://dambulladec.com/images/welcome-hero.png"
                />

                <meta
                    property="og:url"
                    content="https://dambulladec.com/"
                />

                <meta
                    name="twitter:card"
                    content="summary_large_image"
                />
            </Helmet>

            <section className="relative overflow-hidden bg-white">
                {/* Background image */}
                <div
                    className="
                        absolute inset-0
                        bg-[url('/images/welcome-hero.png')]
                        bg-cover bg-center bg-no-repeat
                        max-lg:bg-[position:58%_center]
                        max-md:bg-[position:64%_center]
                    "
                />

                {/* Mobile overlay for text readability */}
                <div
                    className="
                        absolute inset-0
                        bg-gradient-to-r
                        from-white
                        via-white/95
                        to-white/10
                        lg:via-white/80
                        lg:to-transparent
                    "
                />

                {/* Hero content */}
                <div
    className="
        relative z-10
        mx-auto  w-[80%]
        px-3 pb-10 pt-6
        sm:px-4
        md:px-6 md:pb-12
        lg:min-h-[610px]
        lg:px-8 lg:pb-14 lg:pt-5
    "
>
                    {/* Opening Time Badge */}
<div className="flex justify-center mb-8">
    <div
        className="
            inline-flex
            items-center
            gap-5
            rounded-full
            border
            border-[#D9D9D9]
            bg-white
            px-8
            py-3
            shadow-[0_4px_14px_rgba(0,0,0,0.12)]
        "
    >
        <img
            src={openTimeIcon}
            alt="Open Time"
            className="w-10 h-10"
        />

        <p className="text-[18px] font-medium text-[#4A4A4A]">
            {t("featureCards.openDaily")}{" "}
            <span className="font-bold text-[#08772F]">
                {t("featureCards.openTime")}
            </span>
        </p>
    </div>
</div>

                    <div
                        className="
                            grid grid-cols-1
                            lg:grid-cols-2
                            lg:items-center
                        "
                    >
                        {/* Left content */}
                        <div
                            className="
                                max-w-[650px]
                                pt-10
                                sm:pt-14
                                lg:pt-8
                            "
                        >
                           <p
    className="
        mb-3 text-base
        font-semibold text-[#075f2a]
        sm:text-lg
    "
>
    {t("home.welcomePrefix")}
</p>

<h1
    className="
        text-[38px] font-extrabold
        leading-[1.08] tracking-tight
        text-black
        sm:text-[50px]
        lg:text-[58px]
        xl:text-[64px]
    "
>
    <span className="block">
        {t("home.titlePrimary")}
    </span>

    <span className="mt-1 block text-[#007f32]">
        {t("home.titleSecondary")}
    </span>
</h1>

                            <div
                                className="
                                    mt-4 h-[4px] w-14
                                    rounded-full bg-[#00a63d]
                                "
                            />

                            <p
                                className="
                                    mt-6 max-w-[610px]
                                    text-sm leading-[1.45]
                                    text-gray-600
                                    sm:text-base
                                    lg:max-w-[560px]
                                "
                            >
                                {t("home.description")}
                            </p>

                            {/* Search form */}
                            {/* Search form */}
<form
    onSubmit={handleSearch}
    className="
        mt-7 flex max-w-[570px]
        items-center gap-2
        rounded-lg border
        border-[#cfe4d5]
        bg-white p-1.5
        shadow-sm
        transition
        focus-within:border-[#008738]
        focus-within:ring-2
        focus-within:ring-green-100
    "
>
    <Search
        size={18}
        className="ml-2 shrink-0 text-[#008738]"
    />

    <input
        type="search"
        value={searchText}
        onChange={(event) =>
            setSearchText(event.target.value)
        }
        placeholder={t(
            "dailyPrices.searchPlaceholder",
            {
                defaultValue: "Search Products",
            }
        )}
        aria-label={t(
            "dailyPrices.searchPlaceholder",
            {
                defaultValue: "Search Products",
            }
        )}
        className="
            min-w-0 flex-1
            bg-transparent px-2 py-2.5
            text-sm text-gray-700
            outline-none
            placeholder:text-gray-400
        "
    />

    {searchText && (
        <button
            type="button"
            onClick={() => setSearchText("")}
            aria-label={t("dailyPrices.clearSearch", {
                defaultValue: "Clear search",
            })}
            className="
                shrink-0 rounded-md
                px-2 py-2
                text-gray-400
                transition-colors
                hover:bg-gray-100
                hover:text-gray-700
            "
        >
            ×
        </button>
    )}

    <button
        type="submit"
        className="
            shrink-0 rounded-md
            bg-[#007f32]
            px-5 py-3
            text-xs font-semibold
            text-white
            transition-colors
            hover:bg-[#006627]
            sm:px-6
        "
    >
        {t("dailyPrices.searchButton", {
            defaultValue: "Search",
        })}
    </button>
</form>

                            {/* Action buttons */}
                            <div
                                className="
                                    mt-5 flex flex-wrap
                                    items-center gap-4
                                "
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/home-dailyprice")
                                    }
                                    className="
                                        inline-flex items-center gap-2
                                        rounded-md bg-[#007f32]
                                        px-5 py-3
                                        font-semibold text-white
                                        shadow-sm
                                        transition-all duration-200
                                        hover:bg-[#006627]
                                        hover:shadow-md
                                    "
                                >
                                    <BarChart3 size={18} />

                                    <span>
                                        {t(
                                            "navbar.dailyPrice",
                                            "Daily Price"
                                        )}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/contact")
                                    }
                                    className="
                                        inline-flex items-center gap-2
                                        rounded-md border
                                        border-[#008738]
                                        bg-white/80 px-5 py-3
                                        font-semibold text-[#007f32]
                                        backdrop-blur-sm
                                        transition-all duration-200
                                        hover:bg-green-50
                                    "
                                >
                                    <Phone size={18} />

                                    <span>
                                        {t(
                                            "navbar.contact",
                                            "Contact"
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Empty right column lets the background image show */}
                        <div
                            className="
                                hidden min-h-[430px]
                                lg:block
                            "
                            aria-hidden="true"
                        />
                    </div>
                </div>
                  </section>

                {/* Statistics area */}
               <section className="relative z-20 bg-white px-3 py-6 sm:px-5 lg:py-7">
    <div className="mx-auto w-[80%]">
        <div
            className="
                grid grid-cols-1
                overflow-hidden rounded-lg
                border border-gray-200
                bg-white shadow-md
                sm:grid-cols-3
            "
        >
            {statistics.map((statistic, index) => {
                const StatisticIcon = statistic.icon;

                return (
                    <div
                        key={statistic.label}
                        className={`
                            flex min-h-[82px]
                            items-center gap-4
                            px-6 py-4
                            ${
                                index !== statistics.length - 1
                                    ? "border-b border-gray-200 sm:border-b-0 sm:border-r"
                                    : ""
                            }
                        `}
                    >
                        <div
                            className="
                                flex h-12 w-12 shrink-0
                                items-center justify-center
                                rounded-full bg-[#f0f9f2]
                                text-[#008738]
                            "
                        >
                            <StatisticIcon
                                size={21}
                                strokeWidth={1.9}
                            />
                        </div>

                        <div className="min-w-0">
                            <p className="whitespace-nowrap text-2xl font-bold text-[#007f32]">
                                {statistic.value}
                            </p>

                            <p className="mt-1 text-xs leading-tight text-gray-500">
                                {statistic.label}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
</section>
        </>
    );
};

export default WelcomeSection;