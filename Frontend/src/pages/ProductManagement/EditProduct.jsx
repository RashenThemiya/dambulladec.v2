import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../utils/axiosInstance";
import ConfirmWrapper from "../../components/ConfirmWrapper";
import { FiEdit3 } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState({
    name: "",
    type: "fruit",
    image: null,
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { name, role } = useAuth();

  console.log("Logged in user:", name, "Role:", role);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/api/products/${id}`);
        setProduct({
          name: response.data.name,
          type: response.data.type,
          image: null,
        });
        setPreview(response.data.image || null);
      } catch {
        setError("❌ Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProduct((prev) => ({ ...prev, image: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("type", product.type);
      if (product.image) {
        formData.append("image", product.image);
      }

      await api.put(`/api/products/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("✅ Product updated successfully! Redirecting...");
      setTimeout(() => {
        navigate("/view-products");
      }, 2000);
    } catch {
      setError("❌ Failed to update product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Editing Product ID: {id}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center">
            {success}
          </div>
        )}

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()} encType="multipart/form-data">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product Name</label>
            <input
              type="text"
              name="name"
              value={product.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Product Type</label>
            <select
              name="type"
              value={product.type}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="fruit">Fruit</option>
              <option value="vegetable">Vegetable</option>
              <option value="rice">Rice</option>
              <option value="potatoes">Potatoes</option>
              <option value="Leaf Vegetable">Leaf Vegetable</option>
              <option value="Grain">Grain</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mt-2 w-32 h-32 object-cover rounded border"
              />
            )}
          </div>

          <ConfirmWrapper
            open={showConfirm}
            message={`Update Confirmation for Product ID: ${id}`}
            additionalInfo={`Are you sure you want to update "${product.name}" (Product ID: ${id})? Changes will be saved.`}
            confirmText="Yes, Update Product"
            cancelText="No, Cancel"
            onConfirm={() => {
              setShowConfirm(false);
              handleUpdate();
            }}
            onCancel={() => setShowConfirm(false)}
            icon={<FiEdit3 />}
          >
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition duration-300"
              disabled={saving}
            >
              {saving ? "Updating..." : "Update Product"}
            </button>
          </ConfirmWrapper>

          <button
            type="button"
            onClick={() => navigate("/view-products")}
            className="w-full mt-2 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-300"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
