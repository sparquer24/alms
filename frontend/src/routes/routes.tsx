import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import jsCookie from "js-cookie";
import Header from "../components/navbar/header";
import Login from "../pages/Login";
import DashboardPage from "../pages/Dashboard";
import NewApplicationForm from "../pages/Applications/NewApplicationForm";
import RenewalApplicationForm from "../pages/Applications/RenewalApplicationForm";
import NotFound from "../pages/NotFound";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  const token = jsCookie.get("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {location.pathname !== "/login" && <Header />}
      {children}
    </>
  );
};

const routes = [
  {
    path: "/login",
    element: <Login />,
    isPrivate: false,
  },
  {
    path: "/dashboard",
    element: (
      <AuthenticatedLayout>
        <DashboardPage />
      </AuthenticatedLayout>
    ),
    isPrivate: true,
  },
  {
    path: "/new-application-form",
    element: (
      <AuthenticatedLayout>
        <NewApplicationForm />
      </AuthenticatedLayout>
    ),
    isPrivate: true,
  },
  {
    path: "/renewal-application-form",
    element: (
      <AuthenticatedLayout>
        <RenewalApplicationForm />
      </AuthenticatedLayout>
    ),
    isPrivate: true,
  },
  {
    path: "/",
    element: <Navigate to={jsCookie.get("token") ? "/dashboard" : "/login"} replace />,
    isPrivate: false,
  },
  {
    path: "*",
    element: <NotFound />,
    isPrivate: false,
  },
];

const AppRoutes = () => {
  return (
    <Routes>
      {routes.map(({ path, element, isPrivate }, index) => {
        const token = jsCookie.get("token");

        if (isPrivate && !token) {
          return <Route key={index} path={path} element={<Navigate to="/login" replace />} />;
        }
        return <Route key={index} path={path} element={element} />;
      })}
    </Routes>
  );
};

export default AppRoutes;
