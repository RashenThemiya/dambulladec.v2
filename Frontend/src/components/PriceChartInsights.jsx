import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarDays, Info, TrendingUp, ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import insightBackground from '/images/f2.jpg'; // Reuse consistent themed image

const PriceChartInsights = ({ data = [], productName }) => {
  const { t } = useTranslation();

  if (!data.length) return null;

  const prices = data.map((d) => [d.min_price, d.max_price]).flat();
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const latest = data[data.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden p-8 mb-12 shadow-2xl"
    >
      {/* Blurred Background */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `url(${insightBackground})`,
          filter: 'blur(2px) brightness(0.4)',
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-black/60 mix-blend-overlay z-0" />

      {/* Content */}
      <div className="relative z-10 text-white">
        <h3 className="text-3xl font-extrabold mb-5 flex items-center gap-3 text-green-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          <TrendingUp className="w-7 h-7 text-emerald-300 animate-pulse" />
          {t(productName)} {t('priceInsights.title')}
        </h3>

        <ul className="text-[17px] space-y-4 leading-relaxed text-emerald-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
          <li className="flex items-start gap-3">
            <Info className="mt-1 text-emerald-400 w-5 h-5" />
            <span>
              <strong className="text-white">{t(productName)}</strong> {t('priceInsights.range')}
              <span className="font-semibold text-emerald-100"> Rs. {min.toFixed(2)}</span> – 
              <span className="font-semibold text-emerald-100"> Rs. {max.toFixed(2)}</span>.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <CalendarDays className="mt-1 text-emerald-400 w-5 h-5" />
            <span>
              {t('priceInsights.latest')}
              <span className="font-medium text-white ml-1">
                {format(new Date(latest.date), 'dd MMM yyyy')}
              </span>.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <TrendingUp className="mt-1 text-emerald-400 w-5 h-5" />
            {t('priceInsights.trends')}
          </li>

          <li className="flex items-start gap-3">
            <ZoomIn className="mt-1 text-emerald-400 w-5 h-5" />
            {t('priceInsights.zoom')}
          </li>
        </ul>
      </div>
    </motion.div>
  );
};

export default PriceChartInsights;
