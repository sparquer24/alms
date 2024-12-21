import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('New Requests');
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const navigate = useNavigate();
    const data = [
        {
            id: '203241008',
            applicantName: 'Lorem Ipsum',
            superintendentName: 'Lorem Ipsum',
            dateTime: '25.07.2018 14:14:09',
            status: 'Approved',
        },
        {
            id: '203241008',
            applicantName: 'Lorem Ipsum',
            superintendentName: 'Lorem Ipsum',
            dateTime: '25.07.2018 14:14:09',
            status: 'Approved',
        },
        {
            id: '203241009',
            applicantName: 'Lorem Ipsum',
            superintendentName: 'Lorem Ipsum',
            dateTime: '25.07.2018 14:14:09',
            status: 'Pending',
        },
        {
            id: '203241010',
            applicantName: 'Lorem Ipsum',
            superintendentName: 'Lorem Ipsum',
            dateTime: '25.07.2018 14:14:09',
            status: 'Rejected',
        }
    ];

    const toggleRowSelection = (id: string) => {
        setSelectedRows((prevSelectedRows) => {
            if (prevSelectedRows.includes(id)) {
                return prevSelectedRows.filter((rowId) => rowId !== id);
            } else {
                return [...prevSelectedRows, id];
            }
        });
    };

    const isRowSelected = (id: string) => selectedRows.includes(id);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Tabs */}
            <div className="container mx-auto px-4">
                <div className="flex border-b border-gray-200">
                    {['New Requests', 'Approved Requests', 'Rejected Requests', 'Pending Requests', 'Cancelled Requests'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-2 px-4 focus:outline-none ${activeTab === tab
                                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                                : 'text-gray-500 hover:text-blue-600'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Data Table */}
            <div className="container mx-auto px-4 py-6 overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                            <th className="py-3 px-6 text-left">
                                <input
                                    type="checkbox"
                                    onChange={(e: any) =>
                                        setSelectedRows(e.target.checked ? data.map((row) => row.id) : [])
                                    }
                                    checked={
                                        selectedRows.length > 0 && selectedRows.length === data.length
                                    }
                                />
                            </th>
                            <th className="py-3 px-6 text-left">ID</th>
                            <th className="py-3 px-6 text-left">Applicant Name</th>
                            <th className="py-3 px-6 text-left">Zonal Superintendent Name</th>
                            <th className="py-3 px-6 text-left">Date & Time</th>
                            <th className="py-3 px-6 text-left">Status</th>
                            <th className="py-3 px-6 text-left">Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row) => (
                            <tr
                                key={row.id}
                                className={`${isRowSelected(row.id) ? 'bg-blue-50' : 'hover:bg-gray-100'
                                    } border-t border-dotted`}
                            >
                                <td className="py-3 px-6">
                                    <input
                                        type="checkbox"
                                        onChange={() => toggleRowSelection(row.id)}
                                        checked={isRowSelected(row.id)}
                                    />
                                </td>
                                <td className="py-3 px-6">{row.id}</td>
                                <td className="py-3 px-6">{row.applicantName}</td>
                                <td className="py-3 px-6">{row.superintendentName}</td>
                                <td className="py-3 px-6">{row.dateTime}</td>
                                <td className="py-3 px-6">
                                    <span
                                        className={`px-2 py-1 rounded-full text-white text-xs ${row.status === 'Approved'
                                            ? 'bg-green-500'
                                            : row.status === 'Pending'
                                                ? 'bg-yellow-500'
                                                : 'bg-red-500'
                                            }`}
                                    >
                                        {row.status}
                                    </span>
                                </td>
                                <td className="py-3 px-6">
                                    <i className="fas fa-eye hover:text-gray-600 cursor-pointer" title="View comments"></i>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;

