import axios from 'axios';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import { Skeleton } from "../components/Skeleton";
import DailyPriceCard from './DailyPriceCard';
import Footer from '../components/Footer';
import { printDailyPrices } from '../utils/printDailyPrice';
import Lottie from 'lottie-react';
import loadingAnim from "../assets/loadingAnim.json"; // Adjust the path as necessary

const DailyPrice = () => {
  const { t } = useTranslation();
  const [dailyPrices, setDailyPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const navigate = useNavigate();

  // Dropdown open state and ref for outside click
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/prices/by-date/${date}`);
      setDailyPrices(Array.isArray(response.data) ? response.data : []);
    } catch {
      setDailyPrices([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const typesTranslations = t("types", { returnObjects: true });

  const uiTranslations = {
    title: t("ui.title"),
    center: t("ui.center"),
    tel: t("ui.tel"),
    dateLabel: t("ui.dateLabel"),
    emailLabel: t("ui.emailLabel"),
    inquiry: t("ui.inquiry"),
    manager: t("ui.manager"),
    contact: t("ui.contact"),
    tableHeaders: {
      number: t("ui.tableHeaders.number"),
      item: t("ui.tableHeaders.item"),
      minPrice: t("ui.tableHeaders.minPrice"),
      maxPrice: t("ui.tableHeaders.maxPrice"),
    },
    noPrices: t("ui.noPrices"),
    popupBlocked: t("ui.popupBlocked"),
    uncategorized: t("ui.uncategorized"),
    allTypes: t("ui.allTypes", "All Types"),
  };

  const productNamesTranslations = {};
  dailyPrices.forEach(item => {
    const name = item.product?.name;
    if (name && !productNamesTranslations[name]) {
      productNamesTranslations[name] = t(name, name);
    }
  });

  const filteredPrices = dailyPrices.filter(item => {
    const matchesName = item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.product?.type === selectedType;
    return matchesName && matchesType;
  });

  const translatedPrices = filteredPrices.map(item => ({
    ...item,
    product: {
      ...item.product,
      name: productNamesTranslations[item.product?.name] || item.product?.name
    }
  }));

  const downloadPDF = () => {
    printDailyPrices({
      prices: translatedPrices,
      date,
      ui: uiTranslations,
      productNames: productNamesTranslations,
      types: typesTranslations
    });
  };

  // Dropdown options keys (excluding 'all' because we add it manually)
  const dropdownOptions = typesTranslations;

  // Label for currently selected type
  const selectedLabel = selectedType === 'all' ? uiTranslations.allTypes : dropdownOptions[selectedType];

  return (
    <div>
      <Navbar />
      <Toaster position="top-center" reverseOrder={false} />

      <div className="container mx-auto px-4 py-6">
        {/* Controls container */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap mb-6">
          <div className="flex flex-wrap items-center gap-4 flex-1 md:flex-initial">
            {/* Date picker */}
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Custom dropdown */}
            <div className="relative w-48" ref={dropdownRef}>
              <label className="block mb-1 font-medium text-gray-700">{uiTranslations.filterByType}</label>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="inline-flex justify-between w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-1 focus:ring-green-600 focus:border-green-600"
              >
                <span>{selectedLabel}</span>
                <svg className="ml-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dropdownOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>

              {dropdownOpen && (
                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white border border-gray-300 shadow-lg focus:outline-none">
                  <li
                    className={`cursor-pointer px-4 py-2 hover:bg-green-500 hover:text-white ${
                      selectedType === 'all' ? 'bg-green-600 text-white' : 'text-gray-900'
                    }`}
                    onClick={() => {
                      setSelectedType('all');
                      setDropdownOpen(false);
                    }}
                  >
                    {uiTranslations.allTypes}
                  </li>
                  {Object.entries(dropdownOptions).map(([key, label]) => (
                    <li
                      key={key}
                      className={`cursor-pointer px-4 py-2 hover:bg-green-500 hover:text-white ${
                        selectedType === key ? 'bg-green-600 text-white' : 'text-gray-900'
                      }`}
                      onClick={() => {
                        setSelectedType(key);
                        setDropdownOpen(false);
                      }}
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Search input */}
            <input
              type="text"
              placeholder={t("dailyPrices.searchPlaceholder", " 🔍︎ Search Products")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>

          {/* Download button */}
          {!loading && filteredPrices.length > 0 && (
            <button
              onClick={downloadPDF}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg shadow-md transition duration-200"
            >
              {t("dailyPrices.downloadPdf", "Download PDF")}
            </button>
          )}
        </div>

        {/* Product grid or loading/no data message */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} />
            ))}
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="text-center text-gray-500 mt-20 mb-25.5">
            <Lottie animationData={loadingAnim} loop className="w-30 h-30 mx-auto" />
            {t("dailyPrices.noDatal1")}
            <br />
            {t("dailyPrices.noDatal2")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPrices.map(item => (
              <DailyPriceCard key={item.id} item={item} navigate={navigate} t={t} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default DailyPrice;
