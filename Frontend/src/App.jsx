import React from "react"
import { Routes , Route} from "react-router"
import AuthPage from "./Pages/Auth/Auth"
function App() {

  return (
    <Routes>
       <Route path="/" element={<AuthPage/>} />
  </Routes>
  )
}

export default App
