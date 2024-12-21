import React from 'react';
import { useNavigate } from 'react-router-dom';

type HeaderProps = {
    title: string;
    subtitle: string;
    buttonLabel: string;
    enableButton?: boolean;
    enableNavigation?: boolean;
    navigationPath?: string; // Path to navigate
};

const Header: React.FC<HeaderProps> = ({ 
    title, 
    subtitle, 
    buttonLabel, 
    enableButton = true, 
    enableNavigation = true, 
    navigationPath = '/form' // Default path
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (enableNavigation) {
            navigate(navigationPath);
        } else {
            console.log('Custom button action triggered!');
        }
    };

    return (
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-blue-700">{title}</h1>
                <p className="text-gray-600">{subtitle}</p>
            </div>
            {enableButton && (
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                    onClick={handleClick}
                >
                    <span className="mr-2">+</span> {buttonLabel}
                </button>
            )}
        </header>
    );
};

export default Header;
