
import { access } from 'fs';
import { postData } from '../api/axiosConfig';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import jsCookie from 'js-cookie';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    // Function to handle logout
    const handleLogout = async () => {
        try {
            const response = await postData('http://localhost:3001/logout ', {
                accessToken: jsCookie.get('token'),
            });

            if (response.isSuccess) {
                jsCookie.remove('token');
                jsCookie.remove('user');
                console.log('Logout successful');
                // Redirect to login page after successful logout
                navigate('/login');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    return (
        <div className="main">
            <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    Logout
                </button>
            </div>

            <h3>Dashboard</h3>
            <h6>(under construction)</h6>
        </div>
    );
};

export default DashboardPage;

