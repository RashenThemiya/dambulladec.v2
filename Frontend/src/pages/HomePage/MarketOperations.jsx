import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import image1 from "/images/MarketOperations_Backgroung.png";
import image2 from "/images/MarketOperations_Grid_left.jpg";
import image3 from "/images/MarketOperations_Grid_right.png";
import image4 from "/images/MarketOperations_Grid_Bottom.png";

const MarketOperations = () => {
    const { t } = useTranslation();

    return (
        <section
            className="
                relative overflow-hidden
                bg-cover bg-center bg-no-repeat
                px-5 py-16 text-white
                sm:px-8
                lg:min-h-[720px]
                lg:px-12 lg:py-20
            "
            style={{
                backgroundImage: `url(${image1})`,
            }}
        >
            {/* Green overlay */}
            <div className="absolute inset-0 bg-[#005f2b]/90" />

            {/* Subtle dark layer */}
            <div className="absolute inset-0 bg-black/10" />

            <div className="relative z-10 mx-auto max-w-[1380px]">
                {/* Section title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="text-center"
                >
                    <h2
                        className="
                            text-4xl font-extrabold
                            tracking-tight text-white
                            sm:text-5xl
                            lg:text-6xl
                        "
                    >
                        {t("marketOperations.title")}
                    </h2>
                </motion.div>

                <div
                    className="
                        mt-12 grid grid-cols-1
                        items-center gap-12
                        lg:mt-16
                        lg:grid-cols-[1.05fr_0.95fr]
                        lg:gap-14
                    "
                >
                    {/* Text content */}
                    <motion.div
                        initial={{ opacity: 0, x: -35 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.7 }}
                        className="max-w-[690px]"
                    >
                        {[1, 2, 3, 4].map((number) => (
                            <p
                                key={number}
                                className="
                                    mb-6
                                    whitespace-pre-line
                                    text-left
                                    text-lg
                                    leading-[1.35]
                                    text-white
                                    sm:text-xl
                                    lg:text-[22px]
                                "
                            >
                                {t(`marketOperations.para${number}`)}
                            </p>
                        ))}
                    </motion.div>

                    {/* Image collage */}
                    <motion.div
                        initial={{ opacity: 0, x: 35 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="
                            relative mx-auto
                            h-[430px] w-full
                            max-w-[590px]
                            sm:h-[500px]
                            lg:h-[540px]
                        "
                    >
                        {/* Top-left image */}
                        <motion.img
                            src={image2}
                            alt={t("marketOperations.imageAlt", {
                                defaultValue:
                                    "Vegetable trading at Dambulla Economic Center",
                            })}
                            initial={{ opacity: 0, scale: 0.92 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="
                                absolute left-[5%] top-[5%]
                                z-20
                                h-[180px] w-[230px]
                                rounded-[14px]
                                object-cover
                                shadow-xl
                                sm:h-[220px] sm:w-[280px]
                            "
                        />

                        {/* Top-right image */}
                        <motion.img
                            src={image3}
                            alt={t("marketOperations.imageAlt", {
                                defaultValue:
                                    "Wholesale produce market",
                            })}
                            initial={{ opacity: 0, scale: 0.92 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="
                                absolute right-[3%] top-0
                                z-30
                                h-[145px] w-[170px]
                                rounded-[14px]
                                object-cover
                                shadow-xl
                                sm:h-[175px] sm:w-[195px]
                            "
                        />

                        {/* Large lower image */}
                        <motion.img
                            src={image4}
                            alt={t("marketOperations.imageAlt", {
                                defaultValue:
                                    "Dambulla wholesale market operations",
                            })}
                            initial={{ opacity: 0, y: 25 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.35 }}
                            className="
                                absolute bottom-[2%] right-[3%]
                                z-20
                                h-[265px] w-[67%]
                                rounded-[14px]
                                object-cover
                                shadow-2xl
                                sm:h-[330px]
                            "
                        />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default MarketOperations;