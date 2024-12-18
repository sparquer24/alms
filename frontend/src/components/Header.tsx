import React from 'react';
import '../styles/Header.css';
import jsCookie from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import hyd_logo from "../assets/hyd_logo.png"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import NavigationHeader from '../components/common/NavigationHeader';
import { PrivateRoute } from '../routes';

const Header: React.FC = () => {
  const navigate = useNavigate();

  // Get the user's name and role from the cookies, providing default values
  const user = jsCookie.get('user') ? JSON.parse(jsCookie.get('user') as string) : null;
  const userRole = jsCookie.get('role'); 
  const userName: string = user?.username || 'User';


  const shouldDisplaySubHeader = location.pathname.startsWith('/indentdetails') || location.pathname.startsWith('/inventorydetails') || location.pathname.startsWith('/login');


  const handleLogout = () => {
    try {
      // Remove cookies
      jsCookie.remove('token');
      jsCookie.remove('user');
      jsCookie.remove('role');

      // Optionally reset any global state here (e.g., Redux)
      // dispatch({ type: 'RESET_STATE' });

      // Navigate to login page
      navigate('/', { replace: true });

      // Force reload the entire application to clear out any cached data
      window.location.reload();
    } catch (err) {
      alert('Logout failed. Please try again.');
    }
  };

  const handleImage = () =>{
    navigate('/dashboard')
  }

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-logo">
          <img src = {hyd_logo} alt='PS Logo' onClick={handleImage}/>
          <span className='header-roles'> 
          {user?.state_name}
          {user?.district_name && ` > ${user?.district_name}`}
          {user?.wings_name && ['CADO', 'DCP', 'ACP', 'SHO'].includes(userRole??'') && ` > ${user?.wings_name}`}
          {user?.zone_name && ['DCP', 'ACP', 'SHO'].includes(userRole??'') && ` > ${user?.zone_name}`}
          {user?.division_name && ['ACP', 'SHO'].includes(userRole??'') && ` > ${user?.division_name}`}
          {user?.ps_name && ['SHO'].includes(userRole??'') && ` > ${user?.ps_name}`}
          {` > ${userName.toUpperCase()}`}
          </span>
        </div>
        <nav className="header-navigation">
          <div className="user-info">
            {!shouldDisplaySubHeader && <PrivateRoute>
        <NavigationHeader />
      </PrivateRoute>}
          </div>
          <a className="header-button" href="#" onClick={handleLogout} style={{ marginLeft: '20px' }}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Logout
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;

