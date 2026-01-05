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

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/Form" element={<AddProperty />} />
      <Route path="/AdminViewPage" element={<AdminViewPage />} />
      <Route path="/AdminProperty/:id" element={<AdminPropertyPage />} />
      <Route path="/PrimaryMarket" element={<PrimaryMarket />} />
      <Route path="/Property/:id" element={<PropertyCard />} />

      <Route path="/Dashboard" element={<DashboardLayout />}>
        <Route index element={<ProfilePage />} />
        <Route path="transactions" element={<TransactionsPage/>} />
        <Route path="holdings" element={<h1>Hi this is holdings</h1>} />
        <Route path="properties" element={<h1>Hi this is properties</h1>} />
      </Route>
    </Routes>
  );
}

export default App;
