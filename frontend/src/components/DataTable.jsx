import React, { useMemo, useState, useEffect } from 'react';
import {
    useTable,
    usePagination,
    useSortBy,
    useGlobalFilter,
} from 'react-table';
import '../styles/Datatable.css'
import { FaEdit, FaDownload } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCheck, faTimes, faEdit, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'; // Import the necessary icons
import { useNavigate } from 'react-router-dom';
import jsCookie from 'js-cookie';
import Modal from '../components/ItemModel'; // Assuming this is the modal component
import ForwardModel from '../components/ForwardModel';
import ApproveModel from './ApproveModel';
import RejectModel from './RejectModel';
import FulfilmentModel from './FulfilmentModel';
import axios from 'axios';
import CloseModel from './CloseModel';
import {DATATABLE_ROLE_CONFIG} from '../constants'

const DataTable = ({ apiResponse, data, filter, itemModelCallback }) => {
    const user = jsCookie.get('user') ? JSON.parse(jsCookie.get('user')) : null;
    const userRole = jsCookie.get('role'); // Get the user's role
    const navigate = useNavigate();
    const [globalFilter, setGlobalFilter] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [selectedIndent, setSelectedIndent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isFulfilmentModalOpen, setIsFulfilmentModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null); // State to track the item being edited
    const [forwardItem, setForwardItem] = useState(null); // State to track the item being edited
    const [closeItem, setCloseItem] = useState(null); // State to track the item being edited
    const [approveItem, setApproveItem] = useState(null); // State to track the item being edited
    const [rejectItem, setRejectItem] = useState(null); // State to track the item being edited
    const [fulfilmentItem, setFulfilmentItem] = useState(null); // State to track the item being edited
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    // const [apiResponse, setApiResponse] = useState(null); // State to store global response
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    };


        

    const columns = useMemo(() => {
        let columns = [
            {
                Header: 'Indent Number',
                accessor: 'id',
                Cell: ({ value, row }) => (
                    <span
                        className="indent-link"
                        onClick={() => handleIndentClick(row.original)}
                    >
                        {value}
                    </span>
                ),
            },
            {
                Header: 'Date',
                accessor: 'createdDate',
                Cell: ({ value }) => (value ? formatDate(value) : 'N/A'),
            },
            {
                Header: 'Status',
                accessor: 'status',
                Cell: ({ value }) => value || 'N/A',
            },
        ];
        // Conditionally add "District" column for 'DCP' role
        if(filter === 'Pending' && DATATABLE_ROLE_CONFIG.divisionRoles.includes(userRole)) {
            columns.push({
                Header: 'Division',
                accessor: 'division',
                Cell: ({ value,row}) => 
                    row?.original?.division?.name || 'N/A'                    
            });
        
        }
        // Conditionally add "Police Station" column for 'ACP' role
        if(filter === 'Pending' && DATATABLE_ROLE_CONFIG.policeStationRoles.includes(userRole)){
            columns.push({
                Header: 'Police Station',
                accessor: 'policestation.name',  // Fixed accessor to match the response structure
                Cell: ({ value }) => value || 'N/A',
            });
        }
        if(filter === 'Pending' && DATATABLE_ROLE_CONFIG.zoneRoles.includes(userRole)){
            columns.push({
                Header: 'Zone',
                accessor: 'zone',  // Fixed accessor to match the response structure
                Cell: ({ value,row }) => row?.original?.zone?.name || 'N/A',
            });
        }
        // Conditionally add "Remarks" column if userRole is not 'SHO'
        if (userRole !== 'SHO') {
            columns.push({
                Header: 'Remarks',
                accessor: 'remarks',
                Cell: ({ value }) => {
                    const limit = 30; // Set character limit for display
                    return (
                        <label title={value}>
                            {value && value.length > limit ? `${value.slice(0, limit)}...` : (value || 'N/A')}
                        </label>
                    );
                },
            });
        }

        if (filter === 'Pending' || filter === 'Completed') {
            columns.push({
                Header: 'Action',
                Cell: ({ row }) => {
                    const matchedResponse = apiResponse?.find(response => response.id === row.original.statusId);
                   
                    return (
                        <>
                            {matchedResponse && matchedResponse.id ? (
                                <>
                                    {/* Store user can see both Forward and Fulfillment buttons */}
                                    {(matchedResponse && matchedResponse.canForward === "TRUE") && (
                                        <button
                                            onClick={() => handleForwardClick(row.original)}
                                            title='Forward'
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: 'royalblue',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '10px',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faArrowRight} />
                                        </button>
                                    )}
                                    {(matchedResponse && matchedResponse.canApprove === "TRUE") && (
                                        <button
                                            onClick={() => handleApproveClick(row.original)}
                                            title='Approve'
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#1b8e5a',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '10px',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                    )}
                                    {(matchedResponse && matchedResponse.canReject === "TRUE") && (
                                        <button
                                            onClick={() => handleRejectClick(row.original)}
                                            title='Reject'
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: 'red',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '10px',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    )}
                                    {(matchedResponse && matchedResponse.canVerify === "TRUE") && (
                                        <button
                                            onClick={() => handleEditClick(row.original)}
                                            title='Verify'
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#007bff',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '10px',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                    )}
                                    {(matchedResponse && matchedResponse.canFulfillment === "TRUE") && (
                                        <button
                                            onClick={() => handleFulfillmentClick(row.original)}
                                            title='Fulfillment'
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: '#ffa500',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faClipboardCheck} />
                                        </button>
                                    )}
                                    {(matchedResponse && matchedResponse.canClose === "TRUE" || matchedResponse.isClosed === "TRUE") && (
                                        <button
                                            onClick={() => handleCloseClick(row.original)}
                                            title='Close'
                                            style={{
                                                padding: '5px 10px',
                                                backgroundColor: 'red',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginRight: '10px',
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    )}
                                </>
                            ) : null}
                        </>
                    );
                },
            });
        }
        return columns;
    }, [userRole, filter]);

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        gotoPage,
        canPreviousPage,
        canNextPage,
        pageOptions,
        previousPage,
        nextPage,
        setPageSize: setTablePageSize,
        setGlobalFilter: setTableGlobalFilter,
    } = useTable(
        {
            columns,
            data,
            initialState: { pageIndex: 0, pageSize },
        },
        useGlobalFilter,
        useSortBy,
        usePagination
    );

    const handleGlobalFilterChange = (e) => {
        const value = e.target.value || '';
        setGlobalFilter(value);
        setTableGlobalFilter(value);
    };

    const handlePageSizeChange = (event) => {
        const size = Number(event.target.value);
        setPageSize(size);
        setTablePageSize(size);
        gotoPage(0);
    };

    const handleIndentClick = (indent) => {
        setSelectedIndent(indent);
        navigate(`/indentdetails/${indent.id}?state=${filter}`);
    };

    const handleEditClick = (item) => {
        setEditItem(item); // Set the item for editing
        setIsModalOpen(true); // Open the modal
    };

    const handleForwardClick = (item) => {
        setForwardItem(item); // Set the item for editing
        setIsForwardModalOpen(true); // Open the modal
    };

    const handleCloseClick = (item) => {
        setCloseItem(item); // Set the item for editing
        setIsCloseModalOpen(true); // Open the modal
    };

    const handleApproveClick = (item) => {
        setApproveItem(item); // Set the item for editing
        setIsApproveModalOpen(true); // Open the modal
    };

    const handleRejectClick = (item) => {
        setRejectItem(item); // Set the item for editing
        setIsRejectModalOpen(true); // Open the modal
    };

    const handleFulfillmentClick = (item) => {
        setFulfilmentItem(item); // Set the item for editing
        setIsFulfilmentModalOpen(true); // Open the modal
    };

    const handleBackToTable = () => {
        setSelectedIndent(null);
    };

    const handleItemEdit = (editedItem) => {
        setIsModalOpen(false); // Close the modal after editing
        setTableData((prevData) => {
            const updatedData = prevData.filter(item => item.id !== editedItem.id);
            return [editedItem, ...updatedData]; // Place the updated item at the top
        });
    };

    const handleForwardEdit = (editedItem) => {
        setIsForwardModalOpen(false); // Close the modal after editing
    };

    const handleApproveEdit = (editedItem) => {
        setIsApproveModalOpen(false); // Close the modal after editing
    };

    const handleFulfilmentEdit = (editedItem) => {
        setIsFulfilmentModalOpen(false); // Close the modal after editing
    };
    const handleRejectEdit = (editedItem) => {
        setIsRejectModalOpen(false); // Close the modal after editing
    };
    const handleCloseEdit = (editedItem) => {
        setIsClosetModalOpen(false); // Close the modal after editing
    };

    const downloadCSV = () => {
        const headers = columns.map((col) => col.Header).join(',') + '\n';
        const rows = data.map((row) =>
            columns.map((col) => (row[col.accessor] ? row[col.accessor] : '')).join(',')
        ).join('\n');
        const csvData = headers + rows;
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'data.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="data-table-container">
            {!selectedIndent ? (
                <>
                    <div className="data-table-top">
                        <div className="data-table-show">
                            <select value={pageSize} onChange={handlePageSizeChange}>
                                {[10, 20, 30, 40, 50].map((size) => (
                                    <option key={size} value={size}>
                                        Show {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="data-table-search">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={globalFilter}
                                onChange={handleGlobalFilterChange}
                            />
                        </div>
                        <div className="data-table-download">
                            <button
                                onClick={downloadCSV}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#596DD9',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                Download
                                <span style={{ color: '#ff0000' }}>
                                    <FaDownload />
                                </span>
                            </button>
                        </div>
                    </div>
                    <table {...getTableProps()} className="data-table">
                        <thead>
                            {headerGroups.map((headerGroup) => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                    {headerGroup.headers.map((column) => (
                                        <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                                            {column.render('Header')}
                                            <span>
                                                {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody {...getTableBodyProps()}>
                            {page.map((row) => {
                                prepareRow(row);
                                return (
                                    <tr {...row.getRowProps()}>
                                        {row.cells.map((cell) => (
                                            <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div className="data-table-pagination">
                        <span>
                            Showing {page.length} of {data.length} rows
                        </span>
                        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                            First
                        </button>
                        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                            Prev
                        </button>
                        <button onClick={() => nextPage()} disabled={!canNextPage}>
                            Next
                        </button>
                        <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage}>
                            Last
                        </button>
                    </div>
                </>
            ) : (
                <div style={{
                    padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}>
                    <button
                        style={{
                            padding: '10px 15px',
                            border: 'none',
                            borderRadius: '4px',
                            backgroundColor: '#E52F2F',
                            color: '#ffffff',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                        onClick={handleBackToTable}
                    >
                        Back to Table
                    </button>
                </div>
            )}
            {isModalOpen && (
                <Modal
                    item={editItem}
                    onClose={() => setIsModalOpen(false)}
                    onEdit={handleItemEdit} // Pass handleItemEdit to Modal
                    itemModelCallback={itemModelCallback}
                />
            )}
            {isForwardModalOpen && (
                <ForwardModel
                    item={forwardItem}
                    onClose={() => setIsForwardModalOpen(false)}
                    onEdit={handleForwardEdit} // Pass handleItemEdit to Modal
                    itemModelCallback={itemModelCallback}
                />
            )}
            {isApproveModalOpen && (
                <ApproveModel
                    item={approveItem}
                    onClose={() => setIsApproveModalOpen(false)}
                    onEdit={handleApproveEdit} // Pass handleItemEdit to Modal
                    itemModelCallback={itemModelCallback}
                />
            )}
            {isRejectModalOpen && (
                <RejectModel
                    item={rejectItem}
                    onClose={() => setIsRejectModalOpen(false)}
                    onEdit={handleRejectEdit} // Pass handleItemEdit to Modal
                    itemModelCallback={itemModelCallback}
                />
            )}
            {isFulfilmentModalOpen && (
                <FulfilmentModel
                    item={fulfilmentItem}
                    onClose={() => setIsFulfilmentModalOpen(false)}
                    onEdit={handleFulfilmentEdit} // Pass handleItemEdit to Modal
                    itemModelCallback={itemModelCallback}
                />
            )}

            {isCloseModalOpen && (
                <CloseModel
                    item={closeItem}
                    onClose={() => setIsCloseModalOpen(false)}
                    onEdit={handleCloseEdit} // Pass handleItemEdit to Modal
                    itemModelCallback={itemModelCallback}
                />
            )}
        </div>
    );
};
export default DataTable;
