import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const VisionMission = () => {
    const { t, i18n } = useTranslation();
    const [currentSlide, setCurrentSlide] = useState(0);

    const missionSlides = useMemo(
        () => [
            t("mission.1"),
            t("mission.2"),
            t("mission.3"),
            t("mission.4"),
            t("mission.5"),
            t("mission.6"),
        ],
        [t, i18n.language]
    );

    useEffect(() => {
        const interval = window.setInterval(() => {
            setCurrentSlide(
                (previousSlide) =>
                    (previousSlide + 1) % missionSlides.length
            );
        }, 5000);

        return () => window.clearInterval(interval);
    }, [missionSlides.length]);

    return (
        <section
    className="
        relative
        min-h-[640px]
        overflow-hidden
        bg-cover
        bg-center
        bg-no-repeat
        py-20
        text-white
        sm:min-h-[680px]
        lg:min-h-[720px]
    "
    style={{
        backgroundImage: "url('/images/vissionmisson.png')",
    }}
>
            {/* Green overlay */}
            <div className="absolute inset-0 bg-[#075d2d]/80" />

            <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
                {/* Main title */}
                <div className="text-center">
                    <h2 className="text-5xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                        {t("visionMission.title")}
                    </h2>

                    <p className="mt-3 text-base text-green-100 sm:text-xl">
                        {t("visionMission.subtitle")}
                    </p>
                </div>

                {/* Vision, logo and mission */}
                <div className="mt-14 grid items-center gap-10 lg:grid-cols-3 lg:gap-12">
                    {/* Vision */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <h3 className="text-4xl font-bold sm:text-4xl">
                            {t("vision.title")}
                        </h3>

                        <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-green-50 sm:text-xl">
                            {t("vision.text")}
                        </p>
                    </motion.div>

                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.6 }}
                        className="flex justify-center"
                    >
                        <img
                            src="/images/dmbulla_logo.svg"
                            alt="Dambulla Dedicated Economic Center logo"
                            className="
                                h-48 w-48 object-contain
                                sm:h-66 sm:w-66
                                lg:h-84 lg:w-84
                            "
                        />
                    </motion.div>

                    {/* Mission */}
                    <div className="flex flex-col text-center">
                        <h3 className="text-4xl font-bold sm:text-4xl">
                            {t("mission.title")}
                        </h3>

                        {/* Fixed-height animated text area */}
                        <div className="mt-6 flex min-h-[190px] items-center justify-center sm:min-h-[170px]">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentSlide}
                                    initial={{
                                        opacity: 0,
                                        x: 35,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        x: -35,
                                    }}
                                    transition={{
                                        duration: 0.45,
                                        ease: "easeInOut",
                                    }}
                                    className="mx-auto max-w-md text-lg leading-relaxed text-green-50 sm:text-xl"
                                >
                                    {missionSlides[currentSlide]}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* Mission dots */}
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {missionSlides.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() =>
                                        setCurrentSlide(index)
                                    }
                                    aria-label={`Show mission ${
                                        index + 1
                                    }`}
                                    aria-current={
                                        currentSlide === index
                                            ? "true"
                                            : undefined
                                    }
                                    className={`
                                        h-3 rounded-full
                                        transition-all duration-300
                                        ${
                                            currentSlide === index
                                                ? "w-7 bg-emerald-400"
                                                : "w-3 bg-white/80 hover:bg-white"
                                        }
                                    `}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VisionMission;