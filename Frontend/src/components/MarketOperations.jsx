import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Import background images
import background1 from '/images/f1.jpg';
import background2 from '/images/f2.jpg';
import background3 from '/images/f3.jpg';
import background4 from '/images/f4.jpg';

const MarketOperations = () => {
  const { t } = useTranslation();
  const backgroundImages = [background1, background2, background3, background4];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cycle through foreground images every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Static Background Image with filter */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center filter brightness-25 saturate-115"
        style={{ backgroundImage: `url(${background1})` }} // Static background - first image
      />

      {/* Dark Overlay for Clarity */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0" />

      {/* Foreground Content */}
      <div className="relative z-10 px-6 py-12 md:px-16 lg:px-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Text Column */}
          <div>
            <h2 className="text-4xl font-extrabold text-white mb-6">
  {t('marketOperations.title')}
</h2>

            {[1, 2, 3, 4].map((n) => (
              <p
                key={n}
                className="text-gray-100 text-lg leading-relaxed mb-6 whitespace-pre-line text-justify"
              >
                {t(`marketOperations.para${n}`)}
              </p>
            ))}
          </div>

          {/* Foreground Image Column with Filters */}
          <div className="relative w-full h-full flex items-center justify-center min-h-[500px]">
            <div className="relative w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentIndex}
                  src={backgroundImages[currentIndex]}
                  alt={t('marketOperations.imageAlt')}
                  className="object-cover w-full h-full filter brightness-95 contrast-110 saturate-125"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.8 }}
                />
              </AnimatePresence>
              {/* Optional gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketOperations;
