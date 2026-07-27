import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
    House,
    ChartNoAxesColumnIncreasing,
    Phone,
    Menu,
    X,
} from "lucide-react";

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const currentLanguage =
        i18n.language?.split("-")[0] || "si";

    const navigationLinks = [
        {
            translationKey: "navbar.home",
            path: "/",
            icon: House,
        },
        {
            translationKey: "navbar.dailyPrice",
            path: "/home-dailyprice",
            icon: ChartNoAxesColumnIncreasing,
        },
        {
            translationKey: "navbar.contact",
            path: "/contact",
            icon: Phone,
        },
    ];

    const handleLanguageChange = async (language) => {
        await i18n.changeLanguage(language);

        localStorage.setItem("language", language);

        setIsMenuOpen(false);
    };

    const getTitle = () => {
        switch (currentLanguage) {
            case "en":
                return "Dambulla Dedicated Economic Center";

            case "ta":
                return "தம்புள்ள விசேட பொருளாதார மையம்";

            default:
                return "දඹුල්ල විශේෂිත ආර්ථික මධ්‍යස්ථානය";
        }
    };

    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    const closeMobileMenu = () => {
        setIsMenuOpen(false);
    };

    const getLanguageButtonClass = (language) => {
        const isSelected =
            currentLanguage === language;

        return `
            rounded-md px-3 py-1.5
            text-sm font-semibold
            transition-all duration-200
            ${
                isSelected
                    ? "bg-[#145c2d] text-white shadow-sm"
                    : "text-[#145c2d] hover:bg-green-100"
            }
        `;
    };

    return (
        <header className="sticky top-0 z-50 bg-white p-[6px]">
            <nav className="w-full">
                {/* Top ribbon — unchanged */}
                <div
                    className="
                        mb-[6px] flex min-h-[38px]
                        items-center justify-between
                        rounded-md bg-lime-300
                        px-3 py-1.5
                        text-sm font-medium text-gray-900
                        shadow-sm sm:px-4
                    "
                >
                    <a
                        href="tel:0662285181"
                        className="
                            flex items-center gap-2
                            transition-colors
                            hover:text-green-900
                        "
                    >
                        <Phone
                            size={15}
                            strokeWidth={2}
                        />

                        <span className="hidden sm:inline">
                            {t("navbar.hotline")}
                        </span>

                        <span className="font-bold">
                            066 2285181
                        </span>
                    </a>

                    {/* Language changer — unchanged */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                handleLanguageChange("en")
                            }
                            className={getLanguageButtonClass(
                                "en"
                            )}
                            aria-label="Change language to English"
                        >
                            EN
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleLanguageChange("si")
                            }
                            className={getLanguageButtonClass(
                                "si"
                            )}
                            aria-label="භාෂාව සිංහලට වෙනස් කරන්න"
                        >
                            සිං
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                handleLanguageChange("ta")
                            }
                            className={getLanguageButtonClass(
                                "ta"
                            )}
                            aria-label="தமிழ் மொழிக்கு மாற்றவும்"
                        >
                            தமிழ்
                        </button>
                    </div>
                </div>

                {/* Main navbar */}
                <div
                    className="
                        flex h-[86px] w-full
                        overflow-hidden rounded-[6px]
                        bg-white
                        shadow-[0_4px_12px_rgba(0,0,0,0.18)]
                        max-sm:h-[70px]
                    "
                >
                    {/* SVG logo */}
                    <Link
                        to="/"
                        onClick={closeMobileMenu}
                        title={getTitle()}
                        className="
                            h-full w-[430px]
                            shrink-0 overflow-hidden
                            xl:w-[430px]
                            lg:w-[400px]
                            md:w-[350px]
                            max-md:min-w-0
                            max-md:flex-1
                        "
                    >
                        <img
                            src="/images/navLogo.svg"
                            alt={getTitle()}
                            className="
                                block h-full w-full
                                object-fill
                            "
                        />
                    </Link>

                    {/* Desktop navigation */}
                    <div
                        className="
                            hidden h-full flex-1
                            items-center justify-end
                            gap-5 px-7
                            md:flex
                            lg:gap-8 lg:px-9
                            xl:gap-10 xl:px-11
                        "
                    >
                        {navigationLinks.map((link) => {
                            const IconComponent =
                                link.icon;

                            const active =
                                isActiveLink(link.path);

                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`
                                        flex min-h-[46px]
                                        items-center gap-2.5
                                        whitespace-nowrap
                                        rounded-[9px]
                                        px-3.5 py-2.5
                                        text-[18px]
                                        font-semibold
                                        transition-all
                                        duration-200
                                        lg:text-[19px]
                                        xl:text-[20px]
                                        ${
                                            active
                                                ? "bg-[#eef9f0] text-[#00a63d]"
                                                : "text-[#444444] hover:bg-[#eef9f0] hover:text-[#00a63d]"
                                        }
                                    `}
                                >
                                    <IconComponent
                                        size={19}
                                        strokeWidth={1.8}
                                    />

                                    <span>
                                        {t(
                                            link.translationKey
                                        )}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex h-full shrink-0 items-center px-3 md:hidden">
                        <button
                            type="button"
                            onClick={() =>
                                setIsMenuOpen(
                                    (currentState) =>
                                        !currentState
                                )
                            }
                            className="
                                rounded-lg p-2.5
                                text-[#444444]
                                transition-colors
                                duration-200
                                hover:bg-[#eef9f0]
                                hover:text-[#00a63d]
                            "
                            aria-label="Toggle navigation menu"
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? (
                                <X size={27} />
                            ) : (
                                <Menu size={27} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                {isMenuOpen && (
                    <div
                        className="
                            mt-2 rounded-md
                            bg-white p-3
                            shadow-lg md:hidden
                        "
                    >
                        <div className="flex flex-col gap-1">
                            {navigationLinks.map(
                                (link) => {
                                    const IconComponent =
                                        link.icon;

                                    const active =
                                        isActiveLink(
                                            link.path
                                        );

                                    return (
                                        <Link
                                            key={
                                                link.path
                                            }
                                            to={link.path}
                                            onClick={
                                                closeMobileMenu
                                            }
                                            className={`
                                                flex items-center
                                                gap-3 rounded-lg
                                                px-4 py-3
                                                font-semibold
                                                transition-colors
                                                duration-200
                                                ${
                                                    active
                                                        ? "bg-[#eef9f0] text-[#00a63d]"
                                                        : "text-[#444444] hover:bg-[#eef9f0] hover:text-[#00a63d]"
                                                }
                                            `}
                                        >
                                            <IconComponent
                                                size={19}
                                                strokeWidth={
                                                    1.8
                                                }
                                            />

                                            <span>
                                                {t(
                                                    link.translationKey
                                                )}
                                            </span>
                                        </Link>
                                    );
                                }
                            )}
                        </div>

                        {/* Mobile language changer — unchanged */}
                        <div className="mt-3 border-t border-gray-200 pt-3">
                            <p
                                className="
                                    mb-2 text-xs
                                    font-semibold uppercase
                                    tracking-wide
                                    text-gray-400
                                "
                            >
                                {t("navbar.language")}
                            </p>

                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleLanguageChange(
                                            "en"
                                        )
                                    }
                                    className={getLanguageButtonClass(
                                        "en"
                                    )}
                                >
                                    EN
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleLanguageChange(
                                            "si"
                                        )
                                    }
                                    className={getLanguageButtonClass(
                                        "si"
                                    )}
                                >
                                    සිං
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleLanguageChange(
                                            "ta"
                                        )
                                    }
                                    className={getLanguageButtonClass(
                                        "ta"
                                    )}
                                >
                                    தமிழ்
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Navbar;