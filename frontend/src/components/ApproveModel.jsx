import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Import toastify
import 'react-toastify/dist/ReactToastify.css'; // Import toastify styles
import SpinnerComponent from './SpinnerComponent'; // Import SpinnerComponent
import '../styles/ItemModel.css'; // Import the CSS file
import jsCookie from 'js-cookie'; // Assuming jsCookie is used for token management
import { postData, fetchData } from '../api/axiosConfig'; // Import the postData function

const ApproveModel = ({ item, onClose, onSave, itemModelCallback }) => {
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]); // For dropdown options
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({ ...item, remarks: '' });

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
        return Object.keys(newErrors).length === 0; // Return true if no errors
    };

    const handleSave = async () => {
        setLoading(true);

        // Fetch the token
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

        // Prepare payload for POST API
        const payload = {
            id: item.id,
            remarks: formData.remarks,
        };

        try {
            const response = await postData('/mms/indent/approve', payload);

            if (response.isSuccess) {
                toast.success('Approved successfully');

                // If onSave is passed, call it with data
                if (onSave) {
                    onSave({
                        remarks: formData.remarks,
                        id: item.id,
                    });
                }
                onClose(); // Close modal after successful forwarding
                itemModelCallback(true);
            } else {
                toast.error(`Failed to approve. ${response.error?.errorDescription || 'Please check the details and try again.'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content1">
                <h4>Approve</h4>
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
                            {loading ? 'Approving...' : 'Approve'}
                        </button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApproveModel;

