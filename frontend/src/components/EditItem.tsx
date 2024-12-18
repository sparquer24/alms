import React, { useEffect, useState } from 'react';
import SpinnerComponent from './SpinnerComponent';
import { Item } from './types';
import jsCookie from 'js-cookie';
import { useParams } from 'react-router-dom'; // Import useParams
import '../styles/EditModel.css';

interface EditItemModalProps {
    isOpen: boolean;
    item: Item | null;
    onClose: () => void;
    onSave: (updatedItem: any) => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, item, onClose, onSave }) => {
    const [loading, setLoading] = useState<boolean>(false); // Changed initial loading state to false
    const [name, setName] = useState<string>(item ? item.name : '');
    const [quantity, setQuantity] = useState<number>(item ? item.quantity : 0);
    const { id } = useParams<{ id: string }>(); // Ensure to type it correctly

    useEffect(() => {
        if (item) {
            setName(item.name);
            setQuantity(item.quantity);
        }
    }, [item]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Prepare the API request body
        const requestBody = {
            items: [
                {
                    name,
                    quantity,
                    id:(item??{}).id ? item?.id : ''
                }
            ]
        };
        const userToken = jsCookie.get('user'); // Get the access token from cookies
        const token = jsCookie.get('token'); // Get the access token from cookies
        console.log('token:', token);
        if (userToken) {
            setLoading(true); // Set loading to true while waiting for the response
            try {
                // Make the API call to update the item
                const response = await fetch(`https://api-dev.sparquer.com/indent/update?indent_id=${id}`, {
                    method: 'PUT', // Use PUT method for updates
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });
                if (!response.ok) {
                    throw new Error('Failed to update item'); // Handle API error
                }
                const updatedItem = await response.json(); // Parse the response if needed
                // Call onSave with the updated item
                onSave({
                    ...item,
                    name,
                    quantity
                });
                onClose();
                // window.location.reload();
            } catch (error) {
                console.error('Error updating item:', error);
                // Optionally handle the error, such as showing a message to the user
            } finally {
                setLoading(false); // Reset loading state
            }
        }
    };

    if (!isOpen || !item) return null;

    return (
        <div className="popup-overlay">
            <div className="popup">
                {loading ? <SpinnerComponent /> :
                 <>
                    <button
                    onClick={onClose}
                    style={{
                        background: '#f44336',
                        border: 'none',
                        color: 'white',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '1.2em',
                        padding: '0 10px',
                        height: '40px',
                        width: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        float: 'right'
                    }}
                >
                    <span>&times;</span>
                </button>
                <h4 className="modal-title">Edit Item</h4>
              <div className="modal-body">
                    <form onSubmit={handleSubmit} className="edit-form">
                        <div className="form-group1">
                            <label>Item </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group1">
                            <label>Quantity </label>
                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="form-input"
                            />
                        </div>
                        <div className="button-group">
                            <button type="submit" className="subheader-button">
                                Update
                            </button>
                            <button type="button" className="subheader-button cancel" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
                </>}
            </div>
        </div>
    );
};

export default EditItemModal;

