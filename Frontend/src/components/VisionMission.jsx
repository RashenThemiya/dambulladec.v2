import { AnimatePresence, motion } from 'framer-motion';
import Lottie from 'lottie-react';
import {
  DollarSign,
  Eye,
  Leaf,
  Repeat,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import treeAnimation from '../assets/Animation - 1746479551878.json';
import useIsLargeScreen from '../hook/useIsLargeScreen.js';
import backgroundImage1 from '/images/f1.jpg';
import backgroundImage2 from '/images/f2.jpg';
import backgroundImage3 from '/images/f3.jpg';
import backgroundImage4 from '/images/f4.jpg';

const VisionMission = () => {
  const { t } = useTranslation();
  const isLargeScreen = useIsLargeScreen();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const items = [
    { icon: <Target className="w-6 h-6" />, text: t('mission.1'), bg: backgroundImage1 },
    { icon: <DollarSign className="w-6 h-6" />, text: t('mission.2'), bg: backgroundImage2 },
    { icon: <Leaf className="w-6 h-6" />, text: t('mission.3'), bg: backgroundImage3 },
    { icon: <Repeat className="w-6 h-6" />, text: t('mission.4'), bg: backgroundImage4 },
    { icon: <TrendingUp className="w-6 h-6" />, text: t('mission.5'), bg: backgroundImage1 },
    { icon: <Users className="w-6 h-6" />, text: t('mission.6'), bg: backgroundImage2 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentItemIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <section
      className="relative max-w-full px-4 py-16 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/images/vissionmisson.jpg')` }} // <- your background image here
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-emerald-900/70 backdrop-blur-sm z-0" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Vision Card */}
         {/* Vision Card */}
<motion.div
  className="relative overflow-hidden rounded-3xl p-8 lg:w-1/2 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 hover:scale-105"
  initial={isLargeScreen ? { x: -50, opacity: 0 } : {}}
  animate={isLargeScreen ? { x: 0, opacity: 1 } : {}}
  transition={{ duration: 0.8 }}
>
  {/* Background Image */}
  <div
    className="absolute inset-0 bg-cover bg-center opacity-40"
    style={{ backgroundImage: `url(${backgroundImage3})` }} // <-- or use any of the 4 images
  />
  {/* Optional Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-green-900/60" />

  {/* Foreground Content */}
  <div className="relative z-10 text-white">
    <div className="flex items-center gap-4 mb-6">
      <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
        <Eye className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-bold">{t('vision.title')}</h2>
    </div>

    <p className="text-lg leading-relaxed mb-8 text-emerald-50">
      {t('vision.text')}
    </p>

    <div className="flex justify-center">
      <Lottie
        animationData={treeAnimation}
        loop={true}
        className="w-48 h-48 drop-shadow-2xl"
      />
    </div>
  </div>
</motion.div>


          {/* Mission Card */}
          <motion.div
            className="relative overflow-hidden rounded-3xl p-8 lg:w-1/2 backdrop-blur-xl bg-white/10 border border-emerald-200/30 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 hover:scale-105"
            initial={isLargeScreen ? { x: 50, opacity: 0 } : {}}
            animate={isLargeScreen ? { x: 0, opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Dynamic Background */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-70"
              style={{ backgroundImage: `url(${items[currentItemIndex].bg})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-green-900/60" />

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-500/30 rounded-full backdrop-blur-sm">
                  <Target className="w-8 h-8 text-emerald-300" />
                </div>
                <h2 className="text-3xl font-bold text-white">{t('mission.title')}</h2>
              </div>

              <div className="min-h-[100px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentItemIndex}
                    className="flex gap-4 items-start text-white"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-300">
                      {items[currentItemIndex].icon}
                    </div>
                    <span className="text-xl font-semibold leading-relaxed">
                      {items[currentItemIndex].text}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dots */}
              <div className="flex gap-2 justify-center mt-8">
                {items.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentItemIndex
                        ? 'w-8 bg-emerald-400 shadow-lg shadow-emerald-400/50'
                        : 'w-2 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default VisionMission;
