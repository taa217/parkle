import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import MapPage from "./pages/Map";
import { AdminGuard } from "./components/AdminGuard";
import { AdminLayout } from "./components/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminIssues from "./pages/admin/AdminIssues";
import AdminSensors from "./pages/admin/AdminSensors";

// Auth Guard Component
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("uz_parking_session");
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// Redirect if already logged in
function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem("uz_parking_session");

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectIfAuthenticated>
              <Login />
            </RedirectIfAuthenticated>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/map"
          element={
            <RequireAuth>
              <MapPage />
            </RequireAuth>
          }
        />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="issues" element={<AdminIssues />} />
            <Route path="sensors" element={<AdminSensors />} />
          </Route>
        </Route>
      </Routes>

    </BrowserRouter>
  );
}
