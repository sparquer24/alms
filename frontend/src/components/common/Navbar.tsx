import React from 'react';

const Navbar: React.FC = () => {
    return (
        <nav className="bg-gradient-to-r from-blue-800 to-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <div className="font-bold text-lg">Arms License</div>
            <div className="text-xl">Telangana Police</div>
            <div className="rounded-full bg-white text-blue-800 p-2 cursor-pointer hover:shadow-md">
                <i className="fas fa-user"></i>
            </div>
        </nav>
    );
};

export default Navbar;