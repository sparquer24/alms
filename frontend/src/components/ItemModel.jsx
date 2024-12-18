import React, { useState } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SpinnerComponent from './SpinnerComponent';
import '../styles/ItemModel.css';
import jsCookie from 'js-cookie';
import { postData } from '../api/axiosConfig';

const Modal = ({ item, onClose, onSave, itemModelCallback }) => {
    const [formData, setFormData] = useState({ ...item, remarks: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const token = localStorage.getItem('token');
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const validateForm = () => {
        const newErrors = {};
        if (!formData.remarks) {
            newErrors.remarks = 'Remarks are required.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleSave = async () => {
        setLoading(true);
        const userToken = jsCookie.get('user');
        if (!userToken) {
            setLoading(false);
            toast.error('User authentication failed. Please log in again.');
            return;
        }
        // Validate form before making the API call
        if (!validateForm()) {
            setLoading(false);
            toast.error('Please fill in all required fields.');
            return;
        }
        // Prepare payload
        const payload = {
            remarks: formData.remarks,
            id: item.id,
        };
        try {
            const response = await postData('/mms/indent/verify', payload);
            if (response.isSuccess) {
                toast.success('Verified successfully');
                if (onSave) {
                    onSave({
                        remarks: formData.remarks,
                        id: item.id,
                    });
                }
                onClose();
                itemModelCallback(true);
            } else {
                toast.error(`Failed to verify. ${response.error?.errorDescription || 'Please check the details and try again.'}`);
            }
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="modal-overlay">
            <div className="modal-content1">
                <h3>Verify</h3>
                <hr />
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <label>
                        Remarks:
                        <textarea
                            name="remarks"
                            value={formData.remarks || ''}
                            onChange={handleChange}
                            rows="4"
                            cols="50"
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        />
                        {errors.remarks && <p className="error-text">{errors.remarks}</p>}
                    </label>
                    <div className="modal-buttons">
                        <button type="button" onClick={handleSave} disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify'}
                        </button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default Modal;
