import {
    Clock3,
    Mail,
    MapPin,
    Phone,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const ContactDetails = () => {
    const { t } = useTranslation();

    const contactItems = [
        {
            id: "location",
            icon: MapPin,
            title: t("contact.locationTitle", {
                defaultValue: "Our Location",
            }),
            content: t("contact.location", {
                defaultValue:
                    "Kandy - Jaffna Highway, Dambulla, Sri Lanka",
            }),
        },
        {
            id: "phone",
            icon: Phone,
            title: t("contact.phone", {
                defaultValue: "Phone",
            }),
            content: "066 2285181",
            href: "tel:0662285181",
        },
        {
            id: "email",
            icon: Mail,
            title: t("contact.email", {
                defaultValue: "Email",
            }),
            content: "dambulladec@gmail.com",
            href: "mailto:dambulladec@gmail.com",
        },
        {
            id: "hours",
            icon: Clock3,
            title: t("contact.workingHours", {
                defaultValue: "Working Hours",
            }),
            content: t("contact.openingTime", {
                defaultValue: "4.30 A.M onwards",
            }),
        },
    ];

    return (
        <section className="bg-white px-4 pb-12 sm:px-6 lg:pb-16">
            <div
                className="
                    mx-auto grid w-full max-w-[1320px]
                    grid-cols-1 gap-6
                    lg:grid-cols-[360px_minmax(0,1fr)]
                "
            >
                {/* Contact cards */}
                <div className="space-y-3">
                    {contactItems.map((item) => {
                        const Icon = item.icon;

                        const content = item.href ? (
                            <a
                                href={item.href}
                                className="
                                    break-words text-[14px]
                                    text-[#666666]
                                    transition-colors
                                    hover:text-[#08772f]
                                "
                            >
                                {item.content}
                            </a>
                        ) : (
                            <p className="text-[14px] leading-relaxed text-[#666666]">
                                {item.content}
                            </p>
                        );

                        return (
                            <article
                                key={item.id}
                                className="
                                    flex min-h-[100px]
                                    items-center
                                    rounded-[8px]
                                    border border-[#dce9df]
                                    bg-white
                                    px-4 py-3
                                    shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                                    transition-all duration-200
                                    hover:-translate-y-0.5
                                    hover:border-green-300
                                    hover:shadow-md
                                "
                            >
                                <div
                                    className="
                                        flex h-[58px] w-[58px]
                                        shrink-0 items-center
                                        justify-center
                                        rounded-full
                                        bg-[#edf7ea]
                                        text-[#08772f]
                                    "
                                >
                                    <Icon
                                        size={29}
                                        strokeWidth={1.9}
                                    />
                                </div>

                                <div className="mx-4 h-[62px] w-px shrink-0 bg-[#e4e4e4]" />

                                <div className="min-w-0">
                                    <h2 className="mb-2 text-[16px] font-bold text-[#08772f]">
                                        {item.title}
                                    </h2>

                                    {content}
                                </div>
                            </article>
                        );
                    })}
                </div>

                {/* Map */}
                <div
                    className="
                        min-h-[410px] overflow-hidden
                        rounded-[8px]
                        border border-[#dce9df]
                        bg-white p-3
                        shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                    "
                >
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.277423359984!2d80.64919217568517!3d7.8660103061068485!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3afca5432c8b3317%3A0x7def86b17389191e!2sDambulla%20Dedicated%20Economic%20Center!5e0!3m2!1sen!2slk!4v1745987171143!5m2!1sen!2slk"
                        title={t("contact.mapTitle", {
                            defaultValue:
                                "Dambulla Dedicated Economic Center Map",
                        })}
                        width="100%"
                        height="100%"
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="h-[410px] w-full rounded-[6px] border-0"
                    />
                </div>
            </div>
        </section>
    );
};

export default ContactDetails;