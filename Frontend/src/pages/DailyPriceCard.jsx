const DailyPriceCard = ({ item, navigate, t }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-200 ease-in-out">
      {item.product?.image ? (
        <img
          src={item.product.image}
          alt={item.product?.name || "Product"}
          className="h-32 w-full object-cover mb-4 rounded"
        />
      ) : (
        <div className="h-32 w-full bg-gray-100 flex items-center justify-center mb-4 rounded text-gray-400 text-sm">
          {t("dailyPrices.noImage", "No Image")}
        </div>
      )}

      {/* Product Name: Translated */}
      <h2 className="text-lg font-semibold text-gray-800 truncate">
        {t(item.product?.name, item.product?.name || "Unnamed Product")} {/* Use t() for translation */}
      </h2>

      <p className="text-gray-500 text-sm">{item.product?.type || "N/A"}</p>

      <p className="mt-2 font-bold text-green-700">
        {t("dailyPrices.priceRange", "Price Range")}: Rs. {item.min_price} - Rs. {item.max_price}
      </p>

      <p className="text-xs text-gray-400 mt-1">
        {t("dailyPrices.date", "Date")}: {item.date}
      </p>

      <button
  onClick={() => navigate(`/product/${item.product?.id}/chart`)}
  className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white font-medium px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M3 10l6 6L21 4" />
  </svg>
  {t("dailyPrices.history", "View Price History")}
</button>

    </div>
  );
};

export default DailyPriceCard;  // Add default export
