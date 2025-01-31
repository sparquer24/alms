import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from "@mui/material/styles";
import 'react-toastify/dist/ReactToastify.css'; 
import AppRoutes from './routes/routes';
import { Provider } from 'react-redux';
import store from './store';
import theme from './components/common/styles/ThemeProvider';


function App() {
  return (
    <ThemeProvider theme={theme}>
    <Provider store={store}>
    <Router>
    <AppRoutes />
  </Router>
  </Provider>
  </ThemeProvider>
  );
}

export default App;