import { Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const ContactCenters = () => {
    const { t } = useTranslation();

    const mainCenters = [
        {
            name: t("footer.thambuththegama", {
                defaultValue: "Thambuththegama",
            }),
            phone: "0252 275 171",
        },
        {
            name: t("footer.nuwaraEliya", {
                defaultValue:
                    "Nuwara Eliya Dedicated Economic Center",
            }),
            phone: "0522 223 176",
        },
        {
            name: t("footer.narahenpita", {
                defaultValue:
                    "Narahenpita Dedicated Economic Center",
            }),
            phone: "0112 369 626",
        },
        {
            name: t("footer.welisara", {
                defaultValue:
                    "Welisara Dedicated Economic Center",
            }),
            phone: "0112 981 896",
        },
        {
            name: t("footer.veyangoda", {
                defaultValue:
                    "Veyangoda Dedicated Economic Center",
            }),
            phone: "0332 296 914",
        },
    ];

    const regionalCenters = [
        {
            name: t("footer.ratmalana", {
                defaultValue:
                    "Ratmalana Dedicated Economic Center",
            }),
            phone: "0112 709 800",
        },
        {
            name: t("footer.meegoda", {
                defaultValue:
                    "Meegoda Dedicated Economic Center",
            }),
            phone: "0112 830 816",
        },
        {
            name: t("footer.kandeketiya", {
                defaultValue:
                    "Kandehandiya Dedicated Economic Center",
            }),
            phone: "0717 453 193",
        },
        {
            name: t("footer.kepptipola", {
                defaultValue:
                    "Keppetipola Economic Center",
            }),
            phone: "0572 280 208",
        },
    ];

    const CenterList = ({ title, centers }) => {
        return (
            <section>
                <h2
                    className="
                        bg-[#0b8135]
                        px-5 py-3
                        text-[17px] font-bold
                        text-white
                    "
                >
                    {title}
                </h2>

                <div className="px-3 py-4 sm:px-4">
                    <ul className="space-y-3">
                        {centers.map((center) => (
                            <li
                                key={`${center.name}-${center.phone}`}
                                className="
                                    flex flex-col gap-1
                                    text-[14px]
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-between
                                    sm:gap-5
                                "
                            >
                                <span className="leading-relaxed text-[#333333]">
                                    {center.name}
                                </span>

                                <a
                                    href={`tel:${center.phone.replace(
                                        /\s/g,
                                        ""
                                    )}`}
                                    className="
                                        inline-flex shrink-0
                                        items-center gap-1.5
                                        font-bold
                                        text-[#078637]
                                        transition-colors
                                        hover:text-[#056629]
                                    "
                                >
                                    <Phone
                                        size={14}
                                        className="sm:hidden"
                                    />

                                    {center.phone}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        );
    };

    return (
        <section className="border-t border-gray-100 bg-white px-4 pb-16 pt-4 sm:px-6 lg:pb-20">
            <div
                className="
                    mx-auto grid w-full
                    max-w-[1320px]
                    grid-cols-1 gap-10
                    lg:grid-cols-2
                    lg:gap-14
                "
            >
                <CenterList
                    title={t("footer.mainCenters", {
                        defaultValue: "Main Centers",
                    })}
                    centers={mainCenters}
                />

                <CenterList
                    title={t("footer.regionalCenters", {
                        defaultValue: "Regional Centers",
                    })}
                    centers={regionalCenters}
                />
            </div>
        </section>
    );
};

export default ContactCenters;