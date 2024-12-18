import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify'; // Import toastify
import 'react-toastify/dist/ReactToastify.css'; // Import toastify styles
import SpinnerComponent from './SpinnerComponent'; // Import SpinnerComponent
import '../styles/ItemModel.css'; // Import the CSS file
import jsCookie from 'js-cookie'; // Assuming jsCookie is used for token management
import { postData, fetchData } from '../api/axiosConfig'; // Import the postData function

const ForwardModel = ({ item, onClose, onSave, itemModelCallback }) => {

    const [formData, setFormData] = useState({ ...item, role_id: '', remarks: ''  }); // Added role_id to formData
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]); // For dropdown options
    const [errors, setErrors] = useState({});
    useEffect(() => {
        const fetchRoles = async () => {
            if (!item.statusId) {
                toast.error('Status ID not available.');
                return; // Exit early if status_id is null or undefined
            }
            setLoading(true);
            try {
                const response = await fetchData(`/roles/getByStatusId?status_id=${item.statusId}`);
                if (response.isSuccess) {
                    setRoles(response.data.next_roles); // Set roles for dropdown
                } else {
                    toast.error('Failed to load roles.');
                }
            } catch (error) {
                toast.error('Error fetching roles.');
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, [item]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.remarks) {
            newErrors.remarks = 'Remarks are required.';
        }
        if (!formData.role_id) {
            newErrors.role_id = 'Please select a role.';
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
            role_id: formData.role_id, // Add selected role_id from dropdown
        };
        try {
            const response = await postData('/mms/indent/forward', payload);
            if (response.isSuccess) {
                toast.success('Forwarded successfully');
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
                toast.error(`Failed to forward. ${response.error?.errorDescription || 'Please check the details and try again.'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content1">
                <h4>Forward</h4>
                <hr />
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                    <label>
                        Role:
                        <select
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">Select Role</option>
                            {roles.map((role) => (
                                <option key={role.role_id} value={role.role_id}>
                                    {role.role}
                                </option>
                            ))}
                        </select>
                        {errors.role_id && <p className="error-text">{errors.role_id}</p>}
                    </label>
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
                            {loading ? 'Forwarding...' : 'Forward'}
                        </button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForwardModel;

