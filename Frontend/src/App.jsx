import 'font-awesome/css/font-awesome.min.css';
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from "./context/AuthContext";

import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from "./pages/AdminDashboard";
import Contact from './pages/ContactPage/Contact';
import SystemSetting from './pages/CorrectionManagement/SystemSetting';
import HomeDailyPrice from './pages/DailyPriceInHome/DailyPrice';
import AddDailyPrice from './pages/DailyPrice/AddDailyPrice';
import DailyPrice from './pages/DailyPrice/DailyPrice';
import EditDailyPrice from './pages/DailyPrice/EditDailyPrice';
import ViewDailyPrice from './pages/DailyPrice/ViewDailyPrice';
import Home from './pages/HomePage/Home';
import Invoice from './pages/Invoice/Invoice';
import Login from "./pages/Login";
import ManagerDashboard from "./pages/ManagerDashboard";
import CorrectPayment from './pages/Payment/CorrectPayment';
import MakePayment from './pages/Payment/makePayment';
import Payment from './pages/Payment/Payment';
import ViewPayments from './pages/Payment/ViewPayments';
import AddProduct from './pages/ProductManagement/AddProduct';
import EditProduct from './pages/ProductManagement/EditProduct';
import ProductManagement from './pages/ProductManagement/ProductManagement';
import ProductSummary from './pages/ProductManagement/ProductSummary';
import ViewProducts from './pages/ProductManagement/ViewProducts';
import ProductPriceChart from './pages/DailyPriceInHome/ProductPriceChart';
import AddPublication from './pages/Publications/AddPublication';
import Publication from './pages/Publications/PublicationManagement';
import ViewPublications from './pages/Publications/ViewPublications';
import Report from './pages/Report/Report';
import SanitationDashboard from './pages/Sanitation/SanitationDashboard';
import Sanitation from './pages/Sanitation/SanitationTickets';
import AdminPanel from './pages/SettingPage/AdminPanel';
import Setting from './pages/SettingPage/Setting';
import SystemLog from './pages/SettingPage/SystemLog';
import UpdateVATRate from './pages/SettingPage/UpdateVATRate';
import AddShop from './pages/ShopManagement/AddShop';
import EditShop from './pages/ShopManagement/EditShop';
import ShopManagement from './pages/ShopManagement/ShopManagement';
import ShopSummary from './pages/ShopManagement/ShopSummary';
import ViewShops from './pages/ShopManagement/ViewShop';
import AddTenant from './pages/TenantManagement/AddTenant';
import EditTenant from './pages/TenantManagement/EditTenant';
import TenantManagement from './pages/TenantManagement/TenantManagement';
import ViewTenants from './pages/TenantManagement/ViewTenants';
import VehicleTicket from './pages/VehicleTickets/VehicleTickets';
import VehicleDashboard from './pages/VehicleTickets/VehicleTicketDashboard';
import GateDailyTickets from './pages/VehicleTickets/GateDailyTickets';
import GateMonthlyTickets from './pages/VehicleTickets/GateMonthlyTickets';
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home-dailyprice" element={<HomeDailyPrice />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/product/:id/chart" element={<ProductPriceChart />} />

            {/* Protected routes */}
            <Route
              path="/admin-dashboard"
              element={<PrivateRoute><AdminDashboard /></PrivateRoute>}
            />
            <Route
              path="/manager-dashboard"
              element={<PrivateRoute><ManagerDashboard /></PrivateRoute>}
            />
            <Route
              path="/shop-management"
              element={<PrivateRoute><ShopManagement /></PrivateRoute>}
            />
            <Route
              path="/tenant-management"
              element={<PrivateRoute><TenantManagement /></PrivateRoute>}
            />
            <Route path="/invoices" element={<PrivateRoute><Invoice /></PrivateRoute>} />
            <Route path="/payments" element={<PrivateRoute><Payment /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><Report /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Setting /></PrivateRoute>} />
            <Route path="/add-shop" element={<PrivateRoute><AddShop /></PrivateRoute>} />
            <Route path="/edit-shop/:id" element={<PrivateRoute><EditShop /></PrivateRoute>} />
            <Route path="/view-shops" element={<PrivateRoute><ViewShops /></PrivateRoute>} />
            <Route path="/add-tenant" element={<PrivateRoute><AddTenant /></PrivateRoute>} />
            <Route path="/view-tenants" element={<PrivateRoute><ViewTenants /></PrivateRoute>} />
            <Route path="/edit-tenant/:id" element={<PrivateRoute><EditTenant /></PrivateRoute>} />
            <Route path="/make-payment" element={<PrivateRoute><MakePayment /></PrivateRoute>} />
            <Route path="/view-payments" element={<PrivateRoute><ViewPayments /></PrivateRoute>} />
            <Route path="/correct-payment" element={<PrivateRoute><CorrectPayment /></PrivateRoute>} />
            <Route path="/shop-summary/:shopId" element={<PrivateRoute><ShopSummary /></PrivateRoute>} />
            <Route path="/update-vat-rate" element={<PrivateRoute><UpdateVATRate /></PrivateRoute>} />
            <Route path="/system-logs" element={<PrivateRoute><SystemLog /></PrivateRoute>} />
            <Route path="/vehicle-ticketing" element={<PrivateRoute><VehicleTicket /></PrivateRoute>} />
            <Route path="/sanitation-ticketing" element={<PrivateRoute><Sanitation /></PrivateRoute>} />
            <Route path="/product-management" element={<PrivateRoute><ProductManagement /></PrivateRoute>} />
            <Route path="/add-product" element={<PrivateRoute><AddProduct /></PrivateRoute>} />
            <Route path="/edit-product/:id" element={<PrivateRoute><EditProduct /></PrivateRoute>} />
            <Route path="/view-products" element={<PrivateRoute><ViewProducts /></PrivateRoute>} />
            <Route path="/daily-price" element={<PrivateRoute><DailyPrice /></PrivateRoute>} />
            <Route path="/add-dailyprice" element={<PrivateRoute><AddDailyPrice /></PrivateRoute>} />
            <Route path="/view-dailyprices" element={<PrivateRoute><ViewDailyPrice /></PrivateRoute>} />
            <Route path="/edit-dailyprice/:date/:productId" element={<PrivateRoute><EditDailyPrice /></PrivateRoute>} />
            <Route path="/product-summary/:productId" element={<PrivateRoute><ProductSummary /></PrivateRoute>} />
            <Route path="/publication" element={<PrivateRoute><Publication /></PrivateRoute>} />
            <Route path="/add-publication" element={<PrivateRoute><AddPublication /></PrivateRoute>} />
            <Route path="/view-publications" element={<PrivateRoute><ViewPublications /></PrivateRoute>} />

            <Route path="/admin-panel" element={<PrivateRoute><AdminPanel /></PrivateRoute>} />

            <Route path="/system-setting" element={<PrivateRoute><SystemSetting /></PrivateRoute>} />
            <Route path="/SanitationDashboard" element={<PrivateRoute><SanitationDashboard /></PrivateRoute>} />
            <Route path="/VehicleTicketDashboard" element={<PrivateRoute><VehicleDashboard /></PrivateRoute>} />
            <Route 
  path="/gate/:gateNumber/daily" 
  element={<GateDailyTickets />} 
/>
<Route 
  path="/gate/:gateNumber/monthly" 
  element={<GateMonthlyTickets />} 
/>
          </Routes>
          <ToastContainer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
