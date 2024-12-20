import React from 'react';

type TabsProps = {
    tabs: string[];
    activeTab: string;
    onTabClick: (tab: string) => void;
};

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => {
    return (
        <div className="flex border-b">
            {tabs.map((tab, index) => (
                <button
                    key={index}
                    className={`px-4 py-2 focus:outline-none ${activeTab === tab ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                        }`}
                    onClick={() => onTabClick(tab)}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default Tabs;