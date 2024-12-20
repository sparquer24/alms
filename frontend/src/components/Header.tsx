import React from 'react';

type HeaderProps = {
    title: string;
    subtitle: string;
    buttonLabel: string;
};

const Header: React.FC<HeaderProps> = ({ title, subtitle, buttonLabel }) => {
    return (
        <div className="flex justify-between items-center px-6 py-4 bg-gray-100">
            <div>
                <h1 className="text-2xl font-bold text-blue-600">{title}</h1>
                <p>{subtitle}</p>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {buttonLabel}
            </button>
        </div>
    );
};

export default Header;