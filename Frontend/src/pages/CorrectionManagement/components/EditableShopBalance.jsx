import { useState } from "react";
import api from "../../../utils/axiosInstance";

const EditableShopBalance = ({ shop, onBalanceUpdate }) => {
  const [editingBalance, setEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(shop?.ShopBalance?.balance_amount || 0);
  const [loading, setLoading] = useState(false);

  const handleSaveBalance = async () => {
    if (!shop) return;

    try {
      setLoading(true);
      const res = await api.put(`/api/systemsetting/shop-balance/${shop.shop_id}`, {
        balance_amount: parseFloat(newBalance)
      });

      alert("Shop balance updated.");

      // Inform parent to update shop state
      onBalanceUpdate(parseFloat(newBalance));
      setEditingBalance(false);
    } catch (err) {
      console.error(err);
      alert("Failed to update balance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-green-100 text-green-800 text-center text-lg font-semibold py-3 rounded flex items-center justify-center gap-4">
      {editingBalance ? (
        <>
          <input
            type="number"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            className="border rounded px-2 py-1 text-black"
          />
          <button
            onClick={handleSaveBalance}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setEditingBalance(false)}
            className="text-red-500 hover:underline"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
           Shop Balance: LKR {Number(shop?.ShopBalance?.balance_amount || 0).toFixed(2)}
          <button
            onClick={() => {
              setEditingBalance(true);
              setNewBalance(shop?.ShopBalance?.balance_amount || 0);
            }}
            className="text-blue-600 underline hover:text-blue-800 text-sm"
          >
            Edit
          </button>
        </>
      )}
    </div>
  );
};

export default EditableShopBalance;
