import { useState } from "react";
import { useTranslation } from "react-i18next";

const FeatureCards = () => {
    const [clickedIndex, setClickedIndex] = useState(null);
    const { t } = useTranslation();

    const handleCardClick = (index) => {
        setClickedIndex(index);
    };

    const features = [
        {
            icon: "👨‍🌾",
            value: t("featureCards.tradersValue"),
            label: t("featureCards.tradersLabel"),
        },
        {
            icon: "🚗",
            value: t("featureCards.vehiclesValue"),
            label: t("featureCards.vehiclesLabel"),
        },
        {
            icon: "🥦",
            value: t("featureCards.vegetablesValue"),
            label: t("featureCards.vegetablesLabel"),
        },
        {
            icon: "🌱",
            value: t("featureCards.marketShareValue"),
            label: t("featureCards.marketShareLabel"),
        },
    ];

    return (
        <div className="bg-gradient-to-br from-green-100 via-green-50 to-green-200 py-20 relative overflow-hidden">
            {/* Decorative circles for depth */}
            <div className="absolute -top-10 -left-10 w-72 h-72 bg-green-200 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-300 rounded-full opacity-10 blur-3xl"></div>

            <div className="container mx-auto px-6 text-center relative z-10">
                {/* Open Time Highlight */}
                <div className="mb-14 flex justify-center">
                    <button className="bg-green-600 text-white text-lg font-semibold px-8 py-4 rounded-full shadow-lg hover:bg-green-700 transition">
                        🕔 {t("featureCards.openTime")}
                    </button>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
                    {features.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => handleCardClick(index)}
                            className={`cursor-pointer bg-white p-8 rounded-3xl border-2 shadow-md hover:shadow-xl transition duration-300 transform hover:scale-105 ${clickedIndex === index
                                ? "bg-green-100 border-green-500"
                                : "border-gray-200"
                                }`}
                        >
                            <div
                                className={`text-6xl mb-5 transition-all ${clickedIndex === index ? "text-green-700" : "text-green-800"
                                    }`}
                            >
                                {item.icon}
                            </div>
                            <h3 className="text-3xl font-extrabold text-green-900 mb-2">
                                {item.value}
                            </h3>
                            <p className="text-base text-gray-700 font-medium">{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeatureCards;
