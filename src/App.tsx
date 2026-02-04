import { BrowserRouter, Route, Routes } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ServiceUnavailablePage from "./pages/ServiceUnavailablePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected Routes (Main Layout) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chatbot" element={<ServiceUnavailablePage />} />
          <Route path="/profile" element={<ServiceUnavailablePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
