import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosInstance";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { toast } from "react-hot-toast";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useAuth } from "../../context/AuthContext";

const ViewProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/api/products");
        setProducts(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDeleteProduct = async (productId) => {
    try {
      await api.delete(`/api/products/${productId}`);
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      toast.success("Product deleted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete product.");
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Product ID",
        cell: (info) => (
          <button
            onClick={() => navigate(`/product-summary/${info.row.original.id}`)}
            className="text-blue-600 underline hover:text-blue-800 text-sm"
          >
            {highlight(info.getValue(), globalFilter)}
          </button>
        ),
      },
      {
        accessorKey: "name",
        header: "Product Name",
        cell: (info) => (
          <span className="text-sm">{highlight(info.getValue(), globalFilter)}</span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: (info) => <span className="capitalize text-sm">{info.getValue()}</span>,
      },
      {
        accessorKey: "image",
        header: "Image",
        cell: (info) =>
          info.getValue() ? (
            <img
              src={info.getValue()}
              alt="Product"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/default-product.png";
              }}
              className="w-16 h-16 object-cover rounded"
            />
          ) : (
            <span className="text-gray-400 italic text-sm">No Image</span>
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const product = info.row.original;
          return (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/edit-product/${product.id}`)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Edit
              </button>
              <ConfirmWrapper
                message={`Are you sure you want to delete product "${product.name}" with ID "${product.id}"?`}
                onConfirm={() => handleDeleteProduct(product.id)}
              >
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
                  Delete
                </button>
              </ConfirmWrapper>
            </div>
          );
        },
      }

    ],
    [navigate, globalFilter]
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 py-8 relative">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-6xl p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">View All Products</h2>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by ID or Name"
            value={globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-700"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-center text-gray-500 py-10">No products found.</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg">
              <table className="min-w-full">
                <thead className="bg-teal-600 text-white">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="px-6 py-3 text-left text-sm font-medium">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-6 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-6 gap-4">
              <button
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <button
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>

      {/* Floating "Back to Management" Button */}
      <button
        onClick={() => navigate("/product-management")}
        className="fixed bottom-8 right-8 bg-gray-800 text-white py-3 px-6 rounded-full shadow-lg hover:bg-gray-900 transition duration-200"
      >
        Back to Management
      </button>
    </div>
  );
};

// Helper to highlight search text
function highlight(text, query) {
  if (!query) return text;
  const parts = text.toString().split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-yellow-200">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default ViewProducts;
