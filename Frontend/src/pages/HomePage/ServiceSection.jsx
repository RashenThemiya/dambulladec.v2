import { useTranslation } from "react-i18next";
import {
    BadgeDollarSign,
    Building2,
    ShieldCheck,
    Sprout,
} from "lucide-react";

const ServiceSection = () => {
    const { t } = useTranslation();

    const translatedServices =
        t("ServiceSection.services", {
            returnObjects: true,
        }) || [];

    const serviceIcons = [
        BadgeDollarSign,
        Sprout,
        Building2,
        ShieldCheck,
    ];

    const services = Array.isArray(translatedServices)
        ? translatedServices.map((service, index) => ({
              ...service,
              icon: serviceIcons[index] || Sprout,
          }))
        : [];

    return (
        <section className="border-y-2 border-[#0A6F32] bg-white">
            {/* Main Container */}
            <div className="mx-auto w-full max-w-[1512px] px-5 py-20 sm:px-8 lg:px-10 xl:px-12">

                {/* Heading */}
                <div className="mx-auto max-w-[1150px] text-center">
                    <h2
                        className="
                            text-[42px]
                            font-extrabold
                            leading-tight
                            text-[#08772F]
                            sm:text-[68px]
                        "
                    >
                        {t("ServiceSection.sectionTitle")}
                    </h2>

                    <p
                        className="
                            mx-auto
                            mt-6
                            max-w-[1050px]
                            text-center
                            text-[18px]
                            leading-normal
                            text-[#7B7B7B]
                            sm:text-[20px]
                            lg:text-[24px]
                        "
                    >
                        {t("ServiceSection.sectionDescription")}
                    </p>
                </div>

                {/* Cards */}
                {services.length > 0 ? (
                    <div
                        className="
                            mx-auto
                            mt-16
                            grid
                            w-full
                            max-w-[1325px]
                            grid-cols-1
                            gap-7
                            xl:grid-cols-2
                        "
                    >
                        {services.map((service, index) => {
                            const Icon = service.icon;

                            return (
                                <article
                                    key={index}
                                    className="
                                        flex
                                        w-full
                                        items-start
                                        gap-5
                                        rounded-xl
                                        border
                                        border-[#DDEBDD]
                                        bg-white
                                        p-5
                                        shadow-sm
                                        transition-all
                                        duration-300
                                        hover:-translate-y-1
                                        hover:shadow-lg
                                    "
                                >
                                    {/* Icon */}
                                    <div
                                        className="
                                            flex
                                            h-[92px]
                                            w-[92px]
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-lg
                                            bg-[#EDF7EA]
                                            text-[#08772F]
                                        "
                                    >
                                        <Icon
                                            size={42}
                                            strokeWidth={1.8}
                                        />
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden h-[92px] w-px bg-[#E4E4E4] lg:block" />

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h3
                                            className="
                                                text-[22px]
                                                font-bold
                                                text-[#08772F]
                                            "
                                        >
                                            {service.title}
                                        </h3>

                                        <p
                                            className="
                                                mt-3
                                                text-[16px]
                                                leading-[1.45]
                                                text-[#666666]
                                            "
                                        >
                                            {service.description}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="mt-14 rounded-xl border border-gray-200 bg-gray-50 p-10 text-center text-gray-500">
                        {t("ServiceSection.noServices")}
                    </div>
                )}
            </div>
        </section>
    );
};

export default ServiceSection;