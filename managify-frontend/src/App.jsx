import { BrowserRouter as Router, HashRouter, Routes, Route, BrowserRouter } from "react-router-dom";

import Login from "./components/login/Login";
import Register from "./components/register/Register";
import Dashboard from "./components/dashboard/Dashboard";
import ManagifyLandingPage from "./components/main/home";
import CreateProject from "./components/project/CreateProject";
import PlanCards from "./components/plan/PlanCards";

import { AuthProvider } from "./content/AuthContent";
import ProtectedRoute from "./content/ProtectedRoute";
import PublicRoute from "./content/PublicRoute";

import { Toaster } from "react-hot-toast";
import ProjectDetail from "./components/project/DetailProject";

const isElectron = window?.process?.versions?.electron;

export default function App() {
  const RouterComponent = isElectron ? HashRouter : BrowserRouter;

  return (
    <AuthProvider>
      <RouterComponent>
        <Routes>
          <Route path="/" element={<ManagifyLandingPage />} />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-project"
            element={
              <ProtectedRoute>
                <CreateProject />
              </ProtectedRoute>
            }
          />
          <Route
            path="/plans"
            element={
              <ProtectedRoute>
                <PlanCards />
              </ProtectedRoute>
            }
          />
        </Routes>
      </RouterComponent>

      <Toaster position="top-right" reverseOrder={false} />
    </AuthProvider>
  );
}
