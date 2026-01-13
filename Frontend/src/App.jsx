import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthPage from "./Pages/Auth/Auth";
import AddProperty from "./Pages/Forms/AddProperty";
import AdminViewPage from "./Pages/Admin/AdminViewPage";
import AdminPropertyPage from "./Pages/Admin/AdminPropertyPage";
import PrimaryMarket from "./Pages/Market/Primary";
import PropertyCard from "./Pages/Market/PropertyCard";

import DashboardLayout from "./Layouts/Dashboard";
import ProfilePage from "./Pages/Profile/ProfilePage";
import TransactionsPage from "./Pages/Profile/Transaction";
import HoldingsPage from "./Pages/Profile/Holdings";
import SecondaryMarket from "./Pages/Market/Secondary";
import ListingsPage from "./Pages/Profile/Listings";
import MarketLayout from "./Layouts/Market";
import PropertiesPage from "./Pages/Profile/Properties";
import Home from "./Components/Home";
import AdminDashboardLayout from "./Layouts/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/Auth" element={<AuthPage />} />

      <Route path="/" element={<MarketLayout />}>
            <Route index element={<Home/>} />
        <Route path="/PrimaryMarket" element={<PrimaryMarket />} />
        <Route path="/SecondaryMarket" element={<SecondaryMarket />} />
        <Route path="/Property/:id" element={<PropertyCard />} />
      </Route>

      <Route path="/Dashboard" element={<DashboardLayout />}>
        <Route index element={<ProfilePage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="holdings" element={<HoldingsPage />} />
        <Route path="listings" element={<ListingsPage />} />
          <Route path="Form" element={<AddProperty />} />
        <Route path="properties" element={<PropertiesPage/>} />
      </Route> 

      <Route path="/AdminDashboard" element={<AdminDashboardLayout/>}>
        <Route path="Pending" element={<AdminViewPage />} />
        <Route path="Pending/Property/:id" element={<AdminPropertyPage />} />
        <Route path="Documents" element={<><h1>Hello this is Document</h1></>} />
      </Route>
    </Routes>
  );
}

export default App;
