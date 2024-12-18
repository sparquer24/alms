import React, { useEffect, useState } from 'react';
import '../styles/EditModel.css';
import { Item } from './types'; // Make sure to import the Item type

interface ModifyItemModalProps {
    isOpen: boolean;
    item: Item | null; // Allow item to be null if not provided
    onClose: () => void; // Function to call when closing the modal
    onSave: (updatedItem: Item) => void; // Function to call when saving the updated item
}

const ModifyModal: React.FC<ModifyItemModalProps> = ({ isOpen, item, onClose, onSave }) => {
    const [name, setName] = useState<string>('');
    const [quantity, setQuantity] = useState<number>(0);
    useEffect(() => {
        if (item) {
            setName(item.name);
            setQuantity(item.quantity);
        }
    }, [item]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (item) {
            onSave({ ...item, name, quantity });
            onClose();
        }
    };
    if (!isOpen || !item) return null;

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Edit Item</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Item Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Quantity:</label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>
                    <button type="submit">Save</button>
                    <button type="button" onClick={onClose}>Cancel</button>
                </form>
            </div>
        </div>
    );
};

export default ModifyModal;
