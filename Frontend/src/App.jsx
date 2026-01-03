import React from "react"
import { Routes , Route} from "react-router"
import AuthPage from "./Pages/Auth/Auth"
import AddProperty from "./Pages/Forms/AddProperty"
import AdminViewPage from "./Pages/Admin/AdminViewPage"
import AdminPropertyPage from "./Pages/Admin/AdminPropertyPage"
import PrimaryMarket from "./Pages/Market/Primary"
function App() {

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/Form" element={<AddProperty />} /> 
      <Route path="/AdminViewPage" element={<AdminViewPage/>} /> 
      <Route path="/AdminProperty/:id" element={<AdminPropertyPage />} /> 
       <Route path="/PrimaryMarket" element={<PrimaryMarket/>} /> 
  </Routes>
  )
}

export default App 
