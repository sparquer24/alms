import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import '../styles/Popup.css';
import jsCookie from 'js-cookie';
import { postData } from '../api/axiosConfig';
import SpinnerComponent from './SpinnerComponent';
import { INDENT_CLOSE } from '../api/APIs';

const CloseModel = ({ item, onClose,itemModelCallback }) => {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([{ name: '', quantity: 0, maxQuantity: 0 }]);
    const [comment, setComment] = useState('');
    const [errors, setErrors] = useState({});
    const [dropdownItems, setDropdownItems] = useState([]); // This will now hold filtered items based on the selected row
    const [attachments, setAttachments] = useState([]);

    // Fetch items specific to the selected row (indent)
    useEffect(() => {
        if (item && item.items) {
            const filteredItems = item.items.map((item) => ({
                label: item.name,
                value: item.name,
                id: item.id,
                maxQuantity: item.quantity,
            }));
            setDropdownItems(filteredItems); // Set dropdown to only show items from the selected row
            setItems(filteredItems); // Set dropdown to only show items from the selected row
        }
        setLoading(false); // Stop spinner after data is set
    }, [item]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            setLoading(true);
            const userToken = jsCookie.get('user');
            if (!userToken) {
                console.error('User token not found');
                setLoading(false);
                toast.error('User authentication failed. Please log in again.');
                return;
            }

            let file_name = '';
            let content_type = '';
            let data = '';
            if (attachments.length > 0) {
                const currentFile = attachments[0];
                file_name = currentFile.name;
                content_type = currentFile.type;
                data = currentFile.data.split(',')[1];
            }
            const payload = {
                id: item.id,
                items: items.map((item) => ({
                    name: item.label,
                    id: item.id,
                    quantity: item.maxQuantity
                })),
                remarks: comment,
                attachments: [
                    {
                        file_name: file_name,
                        content_type: content_type,
                        data: data // The base64-encoded data from the attachment
                    }
                ]
            };

            try {
                const response = await postData(INDENT_CLOSE, payload, {
                    Authorization: `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                });
                if (response.isSuccess) {
                    toast.success('Closed successfully');
                    //itemModelCallback({ statusId: '', assignedRoleId: '', userId: '', comment, items }, 'Completed');
                    onClose();
                    itemModelCallback(true, 'Completed');
                } else {
                    toast.error('Failed to close indent. Please check the details and try again.');
                }
            } catch (error) {
                console.error('Error submitting close:', error);
                 toast.error('An error occurred while submitting the close.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSelectChange = (index, selectedOption) => {
        const updatedItems = [...items];
        if (selectedOption) {
            const selectedName = selectedOption.value;
            const maxQuantity = selectedOption.maxQuantity;

            updatedItems[index] = { ...updatedItems[index], name: selectedName, maxQuantity };
            setItems(updatedItems);
        }
    };

    const handleInputChange = (index, e) => {
        const { name, value } = e.target;
        const updatedItems = [...items];

        if (name === 'quantity') {
            updatedItems[index] = { ...updatedItems[index], quantity: Number(value) };
        }
        setItems(updatedItems);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const updatedItems = items.filter((_, i) => i !== index);
            setItems(updatedItems);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter((file) => {
            const isValidType = ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type);
            const isValidSize = file.size <= 1 * 1024 * 1024; // 1 MB
            return isValidType && isValidSize;
        });
        if (validFiles.length < files.length) {
            toast.warn('Some files were rejected due to invalid format or size.');
        }
        const filePromises = validFiles.map((file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve({ ...file, data: reader.result, type: file.type, name: file.name });
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        });

        Promise.all(filePromises).then((fileData) => {
            setAttachments([...attachments, ...fileData]);
        });
    };

    const validateForm = () => {
        let valid = true;
        const newErrors = {};
        items.forEach((item, index) => {
            if (item.name && !item.name.trim()) {
                valid = false;
                newErrors[index] = 'Name is required';
            }
            if ((isNaN(item.maxQuantity) || item.maxQuantity <= 0)&&(isNaN(item.quantity) || item.quantity <= 0)) {
                valid = false;
                newErrors[index] = 'Invalid quantity';
            }
        });
        if (!comment.trim()) {
            valid = false;
            newErrors[-1] = 'Comment is required';
        }
        if (comment.length > 2500) {
            valid = false;
            newErrors[-1] = 'Comment must be up to 2500 characters';
        }
        if(attachments.length === 0){
            valid = false;
            newErrors[-2] = 'Please Upload Challan';
        }
        setErrors(newErrors);
        return valid;
    };

    return (
        <div className="popup-overlay">
            <div className="popup">
            {loading ? <SpinnerComponent /> :
            <>
                <h4 className="modal-title">Close</h4>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="item-inputs">
                            {items.map((item, index) => (
                                <div key={index} className="item">
                                    <Select
                                        value={item}
                                        onChange={(selectedOption) => handleSelectChange(index, selectedOption)}
                                        className={` ${errors[index] ? 'error-input' : ''}`}
                                        placeholder="Select item"
                                        isClearable
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        name="quantity"
                                        value={item.maxQuantity}
                                        onChange={(e) => handleInputChange(index, e)}
                                        className={`form-input ${errors[index] ? 'error-input' : ''}`}
                                    />
                                    {items.length > 1 && (
                                        <button type="button" className="btn btn-danger remove-btn" onClick={() => removeItem(index)}>
                                            &#128465;
                                        </button>
                                    )}
                                    {errors[index] && <div className="error-message">{errors[index]}</div>}
                                </div>
                            ))}
                        </div>

                        <textarea
                            placeholder="Enter comments"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className={`form-textarea ${errors[-1] ? 'error-input' : ''}`}
                            maxLength={2500}
                        />
                        {errors[-1] && <div className="error-message">{errors[-1]}</div>}

                        <div className="file-input">
                            <label htmlFor="fileInput">Attach Files </label>
                            <br />
                            <input type="file" id="fileInput" onChange={handleFileChange} />
                        </div>
                        {errors[-2] && <div className="error-message">{errors[-2]}</div>}
                        <div className="button-group">
                            <button type="submit" className="subheader-button">Close Item</button>
                            <button type="button" className="subheader-button cancel" onClick={onClose}>Cancel</button>
                        </div>
                    </form>
                </div>
                </>}

            </div>
        </div>
    );
};

export default CloseModel;
