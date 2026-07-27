import {
    Facebook,
    Instagram,
    Linkedin,
    Mail,
    Phone,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
    const { t } = useTranslation();

    return (
        <footer className="w-full bg-[#075824] text-white">
            {/* Main footer content */}
            <div className="w-full px-6 py-10 sm:px-10 lg:px-16">
                <div
                    className="
                        mx-auto grid w-full max-w-[1250px]
                        grid-cols-1 gap-10
                        md:grid-cols-2
                        lg:grid-cols-[1.35fr_0.8fr_0.8fr]
                        lg:gap-16
                    "
                >
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="flex shrink-0 items-center gap-3">
                                <img
                                    src="/images/Gov.png"
                                    alt="Government logo"
                                    className="h-[62px] w-auto object-contain"
                                />

                                <img
                                    src="/images/dmbulla_logo.svg"
                                    alt="Dambulla Economic Center logo"
                                    className="h-[62px] w-[62px] object-contain"
                                />
                            </div>

                            <h2 className="text-[20px] font-bold leading-tight sm:text-[22px]">
                                {t("footer.brandTitleLine1")}

                                <span className="block text-[#00ff19]">
                                    {t("footer.brandTitleLine2")}
                                </span>
                            </h2>
                        </div>

                        <p className="mt-4 max-w-[430px] text-sm leading-relaxed text-white/90 sm:text-[15px]">
                            {t("footer.description")}
                        </p>

                        <div className="mt-5 flex items-center gap-3">
                            <a
                                href="https://www.facebook.com/100027588023825"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 transition hover:bg-white hover:text-[#075824]"
                            >
                                <Facebook size={16} />
                            </a>

                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 transition hover:bg-white hover:text-[#075824]"
                            >
                                <Instagram size={16} />
                            </a>

                            <a
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="X"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 text-sm font-semibold transition hover:bg-white hover:text-[#075824]"
                            >
                                X
                            </a>

                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="LinkedIn"
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/70 transition hover:bg-white hover:text-[#075824]"
                            >
                                <Linkedin size={16} />
                            </a>
                        </div>
                    </div>

                    {/* Office details */}
                    <div>
                        <h3 className="text-[18px] font-bold text-[#00ff19] sm:text-[20px]">
                            {t("footer.officeDetails")}
                        </h3>

                        <div className="mt-4 text-sm leading-[1.25] text-white/95 sm:text-[15px]">
                            <p>{t("footer.managerName")}</p>
                            <p>{t("footer.managerRole")}</p>
                            <p>{t("footer.managementOffice")}</p>
                            <p>{t("footer.center")}</p>
                            <p>{t("footer.city")}</p>
                        </div>
                    </div>

                    {/* General inquiries */}
                    <div>
                        <h3 className="text-[18px] font-bold text-[#00ff19] sm:text-[20px]">
                            {t("footer.generalInquiries")}
                        </h3>

                        <div className="mt-4 space-y-2 text-sm text-white/95 sm:text-[15px]">
                            <a
                                href="tel:0662285181"
                                className="flex items-start gap-2 hover:text-[#00ff19]"
                            >
                                <Phone
                                    size={15}
                                    className="mt-[2px] shrink-0"
                                />

                                <span>
                                    {t("footer.phone")}:{" "}
                                    <span className="underline underline-offset-2">
                                        066 2285181
                                    </span>
                                </span>
                            </a>

                            <a
                                href="mailto:dambulladec@gmail.com"
                                className="flex items-start gap-2 hover:text-[#00ff19]"
                            >
                                <Mail
                                    size={15}
                                    className="mt-[2px] shrink-0"
                                />

                                <span>
                                    {t("footer.email")}:{" "}
                                    <span className="break-all underline underline-offset-2">
                                        dambulladec@gmail.com
                                    </span>
                                </span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer bottom bar */}
<div className="w-full bg-[#065421]">
    <div
        className="
            mx-auto flex min-h-[115px] w-full
            max-w-[1600px] flex-col
            items-center justify-center gap-5
            px-6 py-7 text-center
            sm:px-10
            md:flex-row md:justify-between
            md:text-left
            lg:px-10
        "
    >
        {/* Copyright */}
        <p className="text-sm font-normal text-white/90 sm:text-base lg:text-[17px]">
            © {new Date().getFullYear()}{" "}
            {t("footer.copyrightName", {
                defaultValue: "Dambulla Economic Center",
            })}
            .{" "}
            {t("footer.allRightsReserved", {
                defaultValue: "All Rights Reserved.",
            })}
        </p>

        {/* Pentarix branding SVG */}
        <a
            href="https://pentarix.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Crafted with care by Pentarix"
            className="
                flex shrink-0 items-center
                transition-opacity
                hover:opacity-80
            "
        >
            <img
                src="/images/Pentarix.svg"
                alt="Crafted with care by Pentarix"
                className="
                    h-auto w-[250px]
                    max-w-full object-contain
                "
            />
        </a>
    </div>
</div>
        </footer>
    );
};

export default Footer;