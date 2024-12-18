// src/components/ProgressBar.js
import React from 'react';

interface ProgressBarProps {
    progress: number; // Progress value should be between 0 and 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    const containerStyle: React.CSSProperties = {
        width: '100%',
        backgroundColor: '#f3f3f3',
        borderRadius: '4px',
        overflow: 'hidden',
        height: '20px',
        border: '1px solid #ddd',
    };

    const fillerStyle: React.CSSProperties = {
        height: '100%',
        width: `${progress}%`,
        backgroundColor: progress < 100 ? '#2196F3' : '#4CAF50',
        transition: 'width 0.5s ease-in-out',
    };

    return (
        <div style={containerStyle}>
            <div style={fillerStyle}></div>
        </div>
    );
};

export default ProgressBar;
