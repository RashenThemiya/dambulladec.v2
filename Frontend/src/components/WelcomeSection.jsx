import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const images = [
  "/images/crops1.png",
  "/images/crops2.png",
  "/images/crops3.png",
  "/images/crops4.png"
];

const WelcomeSection = () => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
 const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* SEO Metadata */}
      <Helmet>
        <title>Dambulla Dedicated Economic Center | Welcome</title>
        <meta
          name="description"
          content="Welcome to the Dambulla Dedicated Economic Center, Sri Lanka’s hub for wholesale vegetable trading since 1999. Supporting local farmers and traders."
        />
        <meta
          name="keywords"
          content="Dambulla Economic Center, wholesale market, Sri Lanka vegetables, farmers market, crop prices"
        />
        <link rel="canonical" href="https://dambulladec.com/" />
        <meta property="og:title" content="Dambulla Dedicated Economic Center" />
        <meta
          property="og:description"
          content="Explore the heart of agricultural trade in Sri Lanka at the Dambulla Dedicated Economic Center."
        />
        <meta property="og:image" content="https://dambulladec.com/images/welcome.jpg" />
        <meta property="og:url" content="https://dambulladec.com/" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Blurred Background Image */}
      <div
        className="absolute inset-0 bg-[url('/images/welcome2.jpg')] bg-cover bg-center z-0"
        style={{ filter: "blur(2px) brightness(0.3)" }}
      ></div>

      {/* Foreground Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Text Section */}
          <div className="text-left space-y-6 pl-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-green-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              {t("home.welcomeMessage")}
            </h1>
            <p className="text-lg md:text-xl text-gray-100 text-justify leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              {t("home.description")}
            </p>


          <div className="flex space-x-4 mt-6">
            <button
              onClick={() => navigate("/home-dailyprice")}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded shadow"
            >
              Daily Price
            </button>

            <button
              onClick={() => navigate("/contact")}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded shadow"
            >
              Contact Page
            </button>
          </div>

          </div>

          {/* Image Slider */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={images[currentIndex]}
                alt={`Fresh produce slide ${currentIndex + 1}`}
                className="rounded-3xl w-full h-[350px] object-contain shadow-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.75 }}
              />
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-4">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentIndex === index ? "bg-green-400 scale-110" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeSection;
