import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { SessionProvider, useSession } from "./context/SessionContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import AuditsListPage from "./pages/AuditsListPage.jsx";
import AuditDetailPage from "./pages/AuditDetailPage.jsx";
import OrganizationsPage from "./pages/OrganizationsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import RiskTemplatesPage from "./pages/RiskTemplatesPage.jsx";

function LoginRoute() {
  const { currentUser } = useSession();
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <LoginPage />;
}

function ProtectedLayout() {
  const { currentUser } = useSession();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/audits" element={<AuditsListPage />} />
          <Route path="/audits/:auditId" element={<AuditDetailPage />} />
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/risk-templates" element={<RiskTemplatesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SessionProvider>
  );
}
