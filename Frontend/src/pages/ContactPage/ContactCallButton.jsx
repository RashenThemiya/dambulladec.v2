import { Phone } from "lucide-react";
import { useTranslation } from "react-i18next";

const ContactCallButton = () => {
    const { t } = useTranslation();

    return (
        <a
            href="tel:0662285181"
            aria-label={t("callCenter.callNow", {
                defaultValue:
                    "Call Dambulla Economic Center",
            })}
            className="
                group fixed bottom-5 right-4
                z-[9999]
                inline-flex items-center gap-2
                rounded-full
                bg-[#087b36]
                px-3 py-2.5
                text-white
                shadow-[0_6px_20px_rgba(8,123,54,0.28)]
                transition-all duration-200
                hover:-translate-y-0.5
                hover:bg-[#06652d]
                focus:outline-none
                focus-visible:ring-4
                focus-visible:ring-green-200
                sm:bottom-6 sm:right-6
                sm:px-4
            "
        >
            <span
                className="
                    flex h-9 w-9
                    items-center justify-center
                    rounded-full
                    bg-white/15
                "
            >
                <Phone size={18} strokeWidth={2.2} />
            </span>

            <span className="hidden text-left sm:block">
                <span className="block text-[11px] font-medium text-white/75">
                    {t("callCenter.label", {
                        defaultValue: "Call Center",
                    })}
                </span>

                <span className="block text-[13px] font-bold">
                    066 2285181
                </span>
            </span>
        </a>
    );
};

export default ContactCallButton;