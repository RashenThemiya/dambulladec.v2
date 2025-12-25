import axios from 'axios';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  TimeScale,
  Tooltip,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import zoomPlugin from 'chartjs-plugin-zoom';
import { format, parseISO } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PriceChartInsights from '../components/PriceChartInsights';
ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  zoomPlugin
);

const ProductPriceChart = () => {
  const { t } = useTranslation();

  const { id } = useParams();
  const [priceData, setPriceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('daily');
  const [productName, setProductName] = useState('');
  const [showMinPrice, setShowMinPrice] = useState(true);
  const [showMaxPrice, setShowMaxPrice] = useState(true);
  const [timeRange, setTimeRange] = useState('5D');
  const [chartRendered, setChartRendered] = useState(false);
  const chartRef = useRef(null);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/prices/product/${id}/chart`
        );
        console.log('Fetched price data:', res.data);
        setPriceData(res.data);
        setProductName(res.data?.[0]?.Product?.name || 'Product');
      } catch (error) {
        console.error('Error fetching price chart:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [id]);


  useEffect(() => {
    const groupData = () => {
      if (!priceData || priceData.length === 0) return [];

      let data = [...priceData];
      const now = new Date();
      let startDate = null;

      switch (timeRange) {
        case '5D':
          startDate = new Date(now.getTime() - 5 * 86400000);
          break;
        case '10D':
          startDate = new Date(now.getTime() - 10 * 86400000);
          break;
        case '1M':
          startDate = new Date();
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '1Y':
          startDate = new Date();
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case '5Y':
          startDate = new Date();
          startDate.setFullYear(now.getFullYear() - 5);
          break;
        default:
          break;
      }

      if (startDate) {
        data = data.filter((d) => new Date(d.date) >= startDate);
      }

      if (filter === 'weekly') {
        return data.filter((_, i) => i % 7 === 0);
      } else if (filter === 'monthly') {
        const map = new Map();
        data.forEach((d) => {
          const month = d.date.slice(0, 7);
          if (!map.has(month)) map.set(month, d);
        });
        return Array.from(map.values());
      }

      return data;
    };

    setChartRendered(false); // Reset render status before new data
    setFilteredData(groupData());
  }, [priceData, filter, timeRange]);

  const createHorizontalGradient = (ctx, area, colorStart, colorEnd) => {
    const gradient = ctx.createLinearGradient(area.left, 0, area.right, 0);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
  };

  const buildDatasets = () => {
    const ctx = chartRef.current?.ctx;
    const area = chartRef.current?.chartArea;
    const datasets = [];

    if (!ctx || !area) return datasets;

    if (showMinPrice) {
      datasets.push({
        label: 'Min Price (Rs)',
        data: filteredData.map((item) => ({
          x: parseISO(item.date),
          y: item.min_price,
        })),
        borderColor: '#10B981',
        backgroundColor: createHorizontalGradient(ctx, area, '#D1FAE5', '#FFFFFF'),
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0,
        fill: true,
      });
    }

    if (showMaxPrice) {
      datasets.push({
        label: 'Max Price (Rs)',
        data: filteredData.map((item) => ({
          x: parseISO(item.date),
          y: item.max_price,
        })),
        borderColor: '#064E3B',
        backgroundColor: createHorizontalGradient(ctx, area, '#064E3B', '#10B981'),
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0,
        fill: true,
      });
    }

    return datasets;
  };

  const chartData = {
    datasets: buildDatasets(),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          font: { size: 14 },
          color: '#14532d',
        },
      },
      tooltip: {
        callbacks: {
          title: (tooltipItems) => format(tooltipItems[0].parsed.x, 'PPP'),
        },
        backgroundColor: '#14532d',
        titleColor: '#fff',
        bodyColor: '#fff',
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'x',
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeRange === '5Y' ? 'year' : timeRange === '1Y' ? 'month' : 'day',
          tooltipFormat: 'PP',
        },
        ticks: {
          color: '#064e3b',
          maxRotation: 45,
          font: { size: 10 },
        },
        grid: { color: '#d1fae5' },
      },
      y: {
        ticks: {
          color: '#064e3b',
          font: { size: 10 },
        },
        grid: { color: '#d1fae5' },
      },
    },
    animation: {
      onComplete: () => {
        setTimeout(() => {
          chartRef.current?.update();
          setChartRendered(true); // ✅ Chart is ready
        }, 0);
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <p className="text-lg text-emerald-800 font-medium">Loading chart...</p>
      </div>
    );
  }

  if (!priceData.length || !filteredData.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <p className="text-lg text-red-500 font-medium">No price data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50">
      <Navbar />
       <PriceChartInsights data={filteredData} productName={productName} />

      <div className="max-w-5xl mx-auto px-4 py-8">

      
        {/* Time Range Buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {['5D', '10D', '1M', '1Y', '5Y', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 text-sm rounded-md transition-all w-[70px] sm:w-auto
                ${timeRange === range
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-white text-emerald-700 border border-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Toggle Price Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-4 w-full sm:w-auto px-2">
          <button
            onClick={() => setShowMinPrice((p) => !p)}
            className={`px-4 py-2 rounded-lg font-medium border text-sm transition
              ${showMinPrice
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-emerald-700 border-emerald-700 hover:bg-emerald-600 hover:text-white'}`}
          >
            {showMinPrice ? 'Hide Min Price' : 'Show Min Price'}
          </button>

          <button
            onClick={() => setShowMaxPrice((p) => !p)}
            className={`px-4 py-2 rounded-lg font-medium border text-sm transition
              ${showMaxPrice
                ? 'bg-lime-600 text-white'
                : 'bg-white text-lime-600 border-lime-600 hover:bg-lime-500 hover:text-white'}`}
          >
            {showMaxPrice ? 'Hide Max Price' : 'Show Max Price'}
          </button>
        </div>

        {/* Chart Area */}
        <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4 h-[400px] relative overflow-x-auto">
          <div className="min-w-[300px] w-full h-full relative">
            {/* Spinner while chart renders */}
            {!chartRendered && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                <svg
                  className="animate-spin h-8 w-8 text-emerald-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              </div>
            )}

            <Line ref={chartRef} data={chartData} options={options} />
            <button
              onClick={() => chartRef.current?.resetZoom()}
              className="absolute top-2 right-2 px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 z-20"
            >
              Reset Zoom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPriceChart;
