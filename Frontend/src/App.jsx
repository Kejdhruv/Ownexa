import React from "react"
import { Routes , Route} from "react-router"
import AuthPage from "./Pages/Auth/Auth"
import AddProperty from "./Pages/Forms/AddProperty"
import AdminViewPage from "./Pages/Admin/AdminViewPage"
function App() {

  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/Form" element={<AddProperty />} /> 
      <Route path="/AdminViewPage" element={<AdminViewPage/>} /> 
  </Routes>
  )
}

export default App 
