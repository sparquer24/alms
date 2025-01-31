import { Navigate, useLocation } from "react-router-dom";
import jsCookie from "js-cookie";
import Header from "../components/navbar/header";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
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

export default PrivateRoute;
