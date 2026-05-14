import Navbar from "../Components/Market/Navbar";
import { Outlet } from "react-router-dom";

export default function MarketLayout() {
  return (
    <div className="market-layout">
      <Outlet />
    </div>
  );
}