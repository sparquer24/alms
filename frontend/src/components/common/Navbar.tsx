import React from 'react';
import { postData } from '../../api/axiosConfig';
import jsCookie from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
    const navigate = useNavigate();

    // Function to handle logout
    const handleLogout = async () => {
        try {
            const response = await postData('/logout', {
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
        <>
            <nav className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="text-lg font-bold">Arms License</div>
                    <div className="text-xl font-semibold">Telangana Police</div>
                    <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                        Logout
                    </button>
                </div>
            </nav>
        </>
    );
};

export default Navbar;