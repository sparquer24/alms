import React, { useState } from 'react';
import '../styles/MultiSelectDropdown.css'; // Import your custom styles here

interface Option {
    value: string;
    label: string;
}

interface MultiSelectDropdownProps {
    options: Option[];
    selectedValues: Set<string>;
    onChange: (selectedValues: Set<string>) => void;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ options, selectedValues, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleCheckboxChange = (value: string) => {
        const updatedSelections = new Set(selectedValues);
        if (selectedValues.has(value)) {
            updatedSelections.delete(value);
        } else {
            updatedSelections.add(value);
        }
        onChange(updatedSelections);
    };

    return (
        <div className="multi-select-dropdown">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
                Select Items
            </button>
            {isOpen && (
                <div className="dropdown-menu">
                    {options.map((option) => (
                        <div key={option.value} className="dropdown-item">
                            <input
                                type="checkbox"
                                checked={selectedValues.has(option.value)}
                                onChange={() => handleCheckboxChange(option.value)}
                            />
                            <span>{option.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
