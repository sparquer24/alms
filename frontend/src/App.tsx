import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import AppRoutes from './routes';
import { JSX } from 'react';

// Create a wrapper component for conditional rendering of Header and Footer
const Layout = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login';
  return (
    <>
      {/* {!hideHeaderFooter && <Header />} */}
      {/* { <PrivateRoute>
        <NavigationHeader />
      </PrivateRoute>} */}
      {children}
      {/* {!hideHeaderFooter && <Footer />} */}
    </>
  );
};

function App() {
  return (
    // <Provider store={App}>
      <Router>
        {/* <ToastContainer /> */}
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
    // </Provider>
  );
}

export default App;