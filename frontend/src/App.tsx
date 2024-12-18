import { BrowserRouter as Router, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css'; // Import the CSS
import NavigationHeader from './components/common/NavigationHeader';
import AppRoutes from './routes';
import store from './store';
import { PrivateRoute } from './routes';

// Create a wrapper component for conditional rendering of Header and Footer
const Layout = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  const hideHeaderFooter = location.pathname === '/login';
  const shouldDisplaySubHeader = location.pathname.startsWith('/indentdetails') || location.pathname.startsWith('/inventorydetails') || location.pathname.startsWith('/login');
  
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
    <Provider store={store}>
      <Router>
        {/* <ToastContainer /> */}
        <Layout>
          <AppRoutes />
        </Layout>
      </Router>
    </Provider>
  );
}

export default App;