import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
    const { i18n } = useTranslation();
    const location = useLocation();

    const handleLanguageChange = (lng) => {
        i18n.changeLanguage(lng);
    };

    const getTitle = () => {
        switch (i18n.language) {
            case 'en':
                return 'Dambulla Dedicated Economic Center';
            case 'ta':
                return 'தம்புள்ள விசேட பொருளாதார மையம்';
            default:
                return 'දඹුල්ල විශේෂිත ආර්ථික මධ්‍යස්ථානය';
        }
    };

    const navLinkClass = (path) => {
        const isExactMatch = location.pathname === path;
        return `
        relative px-4 py-1 rounded-full transition-all duration-300 ease-in-out transform 
        ${isExactMatch
                ? "bg-gradient-to-r from-lime-300 to-green-400 text-green-900 font-bold shadow-lg shadow-lime-300/60 animate-pulse"
                : "text-white hover:bg-white hover:text-green-800 hover:shadow-md hover:scale-105 active:bg-lime-100 active:text-green-800 active:scale-95"
            }
    `;
    };


    return (
        <div className="sticky top-0 z-50 shadow-lg text-base md:text-lg bg-white">
            {/* Top ribbon */}
            <div className="bg-lime-400 text-gray-900 text-sm md:text-base py-2 px-4 flex justify-between items-center font-medium">
                <div>
                    📢 DDEC Hotline Service: <span className="font-semibold">066 2285181</span>
                </div>
                <div className="space-x-4 flex">
                    <button onClick={() => handleLanguageChange('en')} className="hover:underline">EN</button>
                    <button onClick={() => handleLanguageChange('si')} className="hover:underline">සිං</button>
                    <button onClick={() => handleLanguageChange('ta')} className="hover:underline">தமிழ்</button>
                </div>
            </div>

            {/* Navbar */}
            <nav className="bg-green-800 text-white">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
                    {/* Logo & title */}
                    <div className="flex items-center space-x-4">
                        <img
                            src="/images/logo.jpg"
                            alt="Gov Logo"
                            className="w-12 h-12 rounded-full border border-white"
                        />
                        <Link to="/" className="text-xl md:text-2xl font-bold tracking-wide text-white leading-tight">
                            {getTitle()}
                        </Link>
                    </div>

                    {/* Menu — horizontal for all screens */}
                    <div className="flex flex-wrap justify-center md:justify-end items-center gap-3 font-medium text-base md:text-lg">
                        <Link to="/" className={navLinkClass("/")}>Home</Link>
                        <Link to="/home-dailyprice" className={navLinkClass("/home-dailyprice")}>Daily Price</Link>
                        <Link to="/contact" className={navLinkClass("/contact")}>Contact</Link>
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Navbar;
