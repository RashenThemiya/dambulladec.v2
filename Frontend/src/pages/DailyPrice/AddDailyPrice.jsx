import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const getLocalDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const AddDailyPrice = () => {
  const navigate = useNavigate();
  const { name, role } = useAuth();

  const [products, setProducts] = useState([]);
  const [date, setDate] = useState(getLocalDate());

  const [prices, setPrices] = useState({});
  const [existingProductIds, setExistingProductIds] = useState(
    new Set()
  );

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [globalError, setGlobalError] = useState("");
  const [success, setSuccess] = useState("");

  console.log("Logged in user:", name, "Role:", role);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setGlobalError("");

    try {
      const response = await api.get("/api/products");

      setProducts(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Failed to load products:", error);
      setGlobalError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchExistingPrices = useCallback(async () => {
    if (!date) {
      return;
    }

    setLoadingPrices(true);
    setGlobalError("");
    setSuccess("");

    try {
      const response = await api.get(
        `/api/prices/by-date/${date}`
      );

      const existingPrices = Array.isArray(response.data)
        ? response.data
        : [];

      const priceValues = {};
      const savedProductIds = new Set();

      existingPrices.forEach((priceItem) => {
        const productId =
          priceItem.product?.id || priceItem.product_id;

        if (!productId) {
          return;
        }

        priceValues[productId] = {
          min_price:
            priceItem.min_price !== null &&
            priceItem.min_price !== undefined
              ? String(priceItem.min_price)
              : "",
          max_price:
            priceItem.max_price !== null &&
            priceItem.max_price !== undefined
              ? String(priceItem.max_price)
              : "",
        };

        savedProductIds.add(String(productId));
      });

      setPrices(priceValues);
      setExistingProductIds(savedProductIds);
      setErrors({});

      if (existingPrices.length > 0) {
        setSuccess(
          `${existingPrices.length} previously saved price records loaded for ${date}.`
        );
      }
    } catch (error) {
      console.error(
        "Failed to load existing prices:",
        error
      );

      setPrices({});
      setExistingProductIds(new Set());

      setGlobalError(
        "Failed to load previously saved prices."
      );
    } finally {
      setLoadingPrices(false);
    }
  }, [date]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchExistingPrices();
  }, [fetchExistingPrices]);

  const validateProductPrices = (productId, values) => {
    const minValue = values.min_price;
    const maxValue = values.max_price;

    const minPrice =
      minValue === "" || minValue === undefined
        ? null
        : Number(minValue);

    const maxPrice =
      maxValue === "" || maxValue === undefined
        ? null
        : Number(maxValue);

    let errorMessage = "";

    const onlyOneValueEntered =
      (minPrice !== null && maxPrice === null) ||
      (minPrice === null && maxPrice !== null);

    if (onlyOneValueEntered) {
      errorMessage =
        "Both minimum and maximum prices are required.";
    } else if (
      minPrice !== null &&
      maxPrice !== null &&
      (Number.isNaN(minPrice) || Number.isNaN(maxPrice))
    ) {
      errorMessage = "Please enter valid price values.";
    } else if (
      minPrice !== null &&
      maxPrice !== null &&
      (minPrice < 0 || maxPrice < 0)
    ) {
      errorMessage = "Prices cannot be negative.";
    } else if (
      minPrice !== null &&
      maxPrice !== null &&
      minPrice > maxPrice
    ) {
      errorMessage =
        "Minimum price cannot exceed maximum price.";
    }

    setErrors((previousErrors) => ({
      ...previousErrors,
      [productId]: errorMessage,
    }));

    return errorMessage;
  };

  const handlePriceChange = (
    productId,
    field,
    value
  ) => {
    setSuccess("");
    setGlobalError("");

    setPrices((previousPrices) => {
      const updatedProductPrice = {
        min_price:
          previousPrices[productId]?.min_price || "",
        max_price:
          previousPrices[productId]?.max_price || "",
        [field]: value,
      };

      validateProductPrices(
        productId,
        updatedProductPrice
      );

      return {
        ...previousPrices,
        [productId]: updatedProductPrice,
      };
    });
  };

  const clearProductPrice = (productId) => {
    setPrices((previousPrices) => {
      const updatedPrices = {
        ...previousPrices,
      };

      delete updatedPrices[productId];

      return updatedPrices;
    });

    setErrors((previousErrors) => {
      const updatedErrors = {
        ...previousErrors,
      };

      delete updatedErrors[productId];

      return updatedErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setGlobalError("");
    setSuccess("");

    const currentErrors = {};
    const dataToSubmit = [];

    Object.entries(prices).forEach(
      ([productId, productPrice]) => {
        const minValue =
          productPrice.min_price?.trim?.() || "";
        const maxValue =
          productPrice.max_price?.trim?.() || "";

        if (!minValue && !maxValue) {
          return;
        }

        const validationError =
          validateProductPrices(
            productId,
            productPrice
          );

        if (validationError) {
          currentErrors[productId] =
            validationError;
          return;
        }

        dataToSubmit.push({
          product_id: productId,
          min_price: Number(minValue),
          max_price: Number(maxValue),
          date,
        });
      }
    );

    if (Object.keys(currentErrors).length > 0) {
      setErrors((previousErrors) => ({
        ...previousErrors,
        ...currentErrors,
      }));

      setGlobalError(
        "Please fix the validation errors before submitting."
      );

      setSubmitting(false);
      return;
    }

    if (dataToSubmit.length === 0) {
      setGlobalError(
        "Please enter at least one product price range."
      );

      setSubmitting(false);
      return;
    }

    try {
      const response = await api.post(
        "/api/prices/update-multiple",
        dataToSubmit
      );

      setSuccess(
        response.data?.message ||
          "Prices added or updated successfully."
      );

      await fetchExistingPrices();

      setTimeout(() => {
        navigate("/daily-price");
      }, 2000);
    } catch (error) {
      console.error("Failed to update prices:", error);

      setGlobalError(
        error.response?.data?.message ||
          "Failed to update prices."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">
          Loading products...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl rounded-xl bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-6">
          <h2 className="text-center text-2xl font-bold text-gray-900">
            Add Daily Price Ranges
          </h2>

          <p className="mt-2 text-center text-sm text-gray-500">
            Previously saved prices for the selected date
            will be loaded automatically.
          </p>
        </div>

        {success && (
          <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center text-sm text-green-700">
            {success}
          </div>
        )}

        {globalError && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
            {globalError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="max-w-sm">
            <label
              htmlFor="price-date"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Date
            </label>

            <input
              id="price-date"
              type="date"
              value={date}
              onChange={(event) =>
                setDate(event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              required
            />

            {loadingPrices && (
              <p className="mt-2 text-sm text-gray-500">
                Loading existing prices...
              </p>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full table-auto">
              <thead className="bg-[#087b36] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Product
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Type
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Min Price (Rs.)
                  </th>

                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Max Price (Rs.)
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">
                    Clear
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 bg-white text-sm">
                {products.map((product) => {
                  const productId = String(product.id);

                  const errorMessage =
                    errors[product.id] ||
                    errors[productId];

                  const hasError =
                    Boolean(errorMessage);

                  const wasPreviouslySaved =
                    existingProductIds.has(
                      productId
                    );

                  return (
                    <tr
                      key={product.id}
                      className={
                        wasPreviouslySaved
                          ? "bg-green-50/50"
                          : "hover:bg-gray-50"
                      }
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {product.name}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {product.type}
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            prices[product.id]
                              ?.min_price ??
                            prices[productId]
                              ?.min_price ??
                            ""
                          }
                          onChange={(event) =>
                            handlePriceChange(
                              product.id,
                              "min_price",
                              event.target.value
                            )
                          }
                          className={`w-full min-w-32 rounded-lg border p-2 outline-none focus:ring-2 ${
                            hasError
                              ? "border-red-500 focus:ring-red-100"
                              : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                          }`}
                          placeholder="0.00"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            prices[product.id]
                              ?.max_price ??
                            prices[productId]
                              ?.max_price ??
                            ""
                          }
                          onChange={(event) =>
                            handlePriceChange(
                              product.id,
                              "max_price",
                              event.target.value
                            )
                          }
                          className={`w-full min-w-32 rounded-lg border p-2 outline-none focus:ring-2 ${
                            hasError
                              ? "border-red-500 focus:ring-red-100"
                              : "border-gray-300 focus:border-green-600 focus:ring-green-100"
                          }`}
                          placeholder="0.00"
                        />

                        {hasError && (
                          <p className="mt-1 text-xs text-red-500">
                            {errorMessage}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {wasPreviouslySaved ? (
                          <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Previously saved
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                            New
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            clearProductPrice(
                              product.id
                            )
                          }
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                        >
                          Clear
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                navigate("/daily-price")
              }
              className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting || loadingPrices
              }
              className="rounded-lg bg-[#087b36] px-6 py-3 font-semibold text-white transition hover:bg-[#06682d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving..."
                : "Save All Price Ranges"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDailyPrice;