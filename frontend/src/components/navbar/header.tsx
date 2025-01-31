import React from "react";
import { AppBar, Toolbar, Typography, Button, IconButton } from "@mui/material";
import { postData } from "../../api/axiosConfig";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import logo from "@assets/ARMS_&_AMMUNITAION_LICENSE_LOGO.svg"
import { useNavigate } from "react-router-dom";
import jsCookie from "js-cookie";
import "./style.css"

const Header = () => {

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await postData('/logout', {});
      if (response.isSuccess) {
        jsCookie.remove('token');
        jsCookie.remove('user');
        console.log('Logout successful');
        navigate('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AppBar position="static" color="primary" className="header-background">
      <Toolbar>
      <img src={logo} alt="Logo" style={{ height: '40px', marginRight: '16px' }}/>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Arms License
        </Typography>
        <Button color="inherit">Home</Button>
        <IconButton color="inherit" onClick={handleLogout}>
          <AccountCircleIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
