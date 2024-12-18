import React from 'react';

interface ModalProps {
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ModalProps> = ({ message, onConfirm, onCancel }) => (
    <div className="modal-overlay">
        <div className="modal">
            <p>{message}</p>
            <button onClick={onConfirm}>Yes</button>
            <button onClick={onCancel}>No</button>
        </div>
    </div>
);

export default ConfirmationModal;
