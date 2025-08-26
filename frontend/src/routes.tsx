import { FC, JSX, Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import jsCookie from 'js-cookie';
import { setAuthToken } from './api/axiosConfig';
import DashboardPage from './Pages/dashboard.page';
import Login from './Pages/login.page';
import NotFound from './Pages/NotFound';
import FormComponent from './Pages/Form.page';
import Navbar from './components/common/Navbar';
import Header from './components/Header';

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  // const dispatch = useAppDispatch();

  const token = jsCookie.get('auth');
  const user = token ? JSON.parse(jsCookie.get('user') as string) : null;
  const userGroup = user ? user["cognito:groups"]?.[0] : null;

  if (!token) {
    return <Navigate to="/login" />
  }
  setAuthToken(token);
  // dispatch(setUser({role: userGroup, username: user?.username}));

  return children;
};

const AppRoutes: FC = () => {
  return (<Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/dashboard"
      element={
        <PrivateRoute>
          <>
            <Navbar />
            <Header
              title="Zonal Superintendent Dashboard"
              subtitle="Requests Insights"
              buttonLabel="New Application Form"
              enableButton={true}
              enableNavigation={true}
              navigationPath="/form"
            />
            <DashboardPage />
          </>
        </PrivateRoute>
      }
      children
    />
    <Route
      path="/form"
      element={
        <PrivateRoute>
          <>
            <Navbar />
            {/* <Header
              title="Application Form"
              subtitle="Fill the form to apply for a new license"
              buttonLabel="Submit"
              enableButton={true}
              enableNavigation={false}
            /> */}
          <FormComponent />
          </>
        </PrivateRoute>
      }
    />
    {/* Redirect from root to the login or dashboard depending on token */}
    <Route
      path="/"
      element={<Navigate to={jsCookie.get('token') ? "/dashboard" : "/login"} replace />}
    />
    {/* This Route catches all unknown URLs and shows the NotFound page */}
    <Route path="*" element={<NotFound />} />
  </Routes>
  );
}

export default AppRoutes;
export {
  PrivateRoute
}