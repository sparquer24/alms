import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import Select from 'react-select';
import { toast } from 'react-toastify';
import '../styles/Popup.css';
import jsCookie from 'js-cookie';
import { postData, fetchData } from '../api/axiosConfig';
import SpinnerComponent from './SpinnerComponent';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { capitalieWords } from '../utils/stringUtils';


interface OptionType {
  label: string;
  value: string;
  id: string;
}

interface Item {
  name: string;
  quantity: number;
  id?: string;
}

interface DataObject {
  id: string;
  statusId: string;
  status: string;
  assignedRoleId: string;
  userId: string;
  comment: string;
  items: Item[];
  createdDate: string;
  closeDate: string;
  actionTakenBy: string;
};

interface Indent {
  id: string;
  name: string;
  items: Item[];
}

interface PopupProps {
  onClose: () => void;
  onSubmit: (formState: FormState) => void;
  indentData?: Indent[];
  tableData?: DataObject[];
  currentUserId: string;
  inprogressInfo?:any[];
}

interface FormState {
  statusId: string;
  assignedRoleId: string;
  userId: string;
  comment: string;
  items: Item[];
}

const categoryByRole = {
  "SHO": [
    "infrastructure"
  ],
  "CADO": [
    "infrastructure",
    "consumables"
  ],
  "DCP": [
    "infrastructure"
  ],
  "ACP": [
    "infrastructure"
  ],
  "STORE": [
    "infrastructure",
    "consumables"
  ],
  "T&L": [
    "infrastructure",
    "consumables"
  ],
  "CP": [
    "infrastructure"
  ],
  "CAO": [
    "infrastructure",
    "consumables"
  ],
  "JTCP": [
    "infrastructure",
    "consumables"
  ]
}

const Popup: React.FC<PopupProps> = ({ onClose, onSubmit, indentData, tableData = [],currentUserId,inprogressInfo  }) => {

  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<Item[]>([{ name: '', quantity: 0, id: '' }]);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<{ [key: number]: string }>({});
  const [createErrors, setCreateErrors] = useState<{ [key: string]: string }>({});
  const [dropdownItems, setDropdownItems] = useState<OptionType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [modalMessage, setModalMessage] = useState('');
  const [currentIndex, setCurrentIndex] = useState<number | undefined>();
  // const userRole = jsCookie.get('role');
  type UserRole = keyof typeof categoryByRole;

  const userRole = jsCookie.get('role') as UserRole | undefined;




  // Fetch dropdown items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Check if userRole exists and is a valid key in categoryByRole
        if (userRole && userRole in categoryByRole) {
          const categories = categoryByRole[userRole];
          const response = await fetchData(`https://api-dev.sparquer.com/items?categories=${JSON.stringify(categories)}`);
          const data = response.data;

          const formattedData = data.map((item: { name: string, id: string }) => ({
            label: capitalieWords(item.name),
            value: item.name,
            id: item.id
          }));
          setDropdownItems(formattedData);
        } else {
          console.warn("User role is undefined or not recognized. No categories to fetch.");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [userRole]);


  useEffect(() => {
    if (indentData) {
      const extractedItems = indentData.flatMap(indent => indent.items);
      setItems(extractedItems);
    }
  }, [indentData]);


  const messages = {
    error: "Error",
    warn: "Warning!"
    // Add more messages as needed
  };

  const handleShow = (message: string, isError = false) => {
    setModalMessage(message);
    setShowModal(true);
    setShowErrorModal(isError)
  };

  const handleClose = () => {
    setShowModal(false)
  }

  const handleCancel = () => {
    const arr = structuredClone(items);
    if (currentIndex) {
      arr[currentIndex] = { name: '', quantity: 0, id: '' }
    }
    setItems(arr)
    setShowModal(false)
  }



  const handleSubmit = async (e: FormEvent) => {
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

      const payload = {
        headers: { Authorization: `Bearer ${userToken}` },
        body: { items, comment }
      };

      try {
        const response = await postData('/mms/indent/create', payload.body, payload.headers);

        if (response.isSuccess) {
          toast.success('Indent created successfully');
          onSubmit({ statusId: '', assignedRoleId: '', userId: '', comment, items });

        } else {
          toast.error('Failed to create indent. Please check the details and try again.');
        }
      } catch (error) {
        console.error('Error submitting indent:', error);
        toast.error('An error occurred while submitting the indent.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getItemsByName = (name = '') => {
    if (!currentUserId || !inprogressInfo) return [];
    
    return inprogressInfo?.filter((obj:any) => {
            return (obj?.items ?? []).some((item:any) => item.name === name);
        return false;
    });
};


  const handleSelectChange = (index: number, selectedOption: OptionType | null) => {
    const updatedItems = [...items];
    if (selectedOption) {
      const selectedName = selectedOption.value;
      const selectedId = selectedOption.id;
  
      // First, check if the item has already been selected in the current `items` list.
      const existingItemNames = updatedItems.map(item => item.name);
      if (existingItemNames.includes(selectedName)) {
        toast.warn(`The item ${selectedName} has already been selected. You cannot select it again.`);
        return; 
      }
  
      // Now check if the item is part of any pending items using `getItemsByName`
      const matchingItems = getItemsByName(selectedName); // This uses the `getItemsByName` function
  
      setCurrentIndex(index);
  
      // Handle the case where the item has already been added twice and is pending
      if (matchingItems.length > 1) {
        handleShow(`The item ${selectedName} has already been added twice and is pending. Please add a different item if needed.`, true);
        return;
      } else if (matchingItems.length === 1) {
        // Handle the case where the item is already pending (but only once)
        handleShow(`The item ${selectedName} is already pending. Do you want to continue adding?`);
      }
  
      // Now check if the item exists in any pending indent (based on `tableData`)
      const pendingItems = indentData?.flatMap(indent => indent.items) || [];
      const pendingItemNames = new Set(pendingItems.map(item => item.name));
  
      if (pendingItemNames.has(selectedName)) {
        toast.warn(`Item ${selectedName} is already selected in another pending indent.`);
        return; // Prevent selecting if already pending in other indent
      }
  
      // Update the items array with the new selection
      updatedItems[index] = { ...updatedItems[index], name: selectedName, id: selectedId };
      setItems(updatedItems);
  
    } else {
      // Handle the case where no item is selected (null)
      updatedItems[index] = { ...updatedItems[index], name: '', id: '' };
      setItems(updatedItems);
    }
  };
  

  // Handle quantity input change
  const handleInputChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const updatedItems = [...items];

    if (name === 'quantity') {
      const quantity = Math.max(0, Math.min(99999, Number(value)));
      updatedItems[index] = { ...updatedItems[index], quantity };
    }

    setItems(updatedItems);
  };

  // Add a new item
  const addItem = () => {
    if (items.length < 5) {
      setItems([...items, { name: '', quantity: 0, id: '' }]);
    } else {
      const errors = { ...createErrors, 'quantity': 'Maximum 5 item are allowed' };
      setCreateErrors(errors);
    }
  };

  // Remove an item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const updatedItems = items.filter((_, i) => i !== index);
      setItems(updatedItems);
    }

    if (items.length > 4) {
      const { quantity, ...restErrors } = createErrors;
      setCreateErrors(restErrors);
    }
  };



  const validateForm = () => {
    let valid = true;
    const newErrors: { [key: number]: string } = {};

    // Validate each item in the list
    items.forEach((item, index) => {
      if (!item.name.trim()) {
        valid = false;
        newErrors[index] = 'Name is required';
      }

      if (isNaN(item.quantity) || item.quantity <= 0 || item.quantity > 99999) {
        valid = false;
        newErrors[index] = 'Quantity is required';
      }
    });

    // Check if the comment field is empty
    if (!comment.trim()) {
      valid = false;
      newErrors[-1] = 'Comment is required';
    }

    // Check if the comment exceeds 2500 characters
    if (comment.length > 2500) {
      valid = false;
      newErrors[-1] = 'Comment must be up to 2500 characters';
    }

    setErrors(newErrors);
    return valid;
  };

  return (
    <div className="popup-overlay">
      <div className="popup">
      {loading ? <SpinnerComponent /> :
        <>
        <h4 className="modal-title">Create Indent</h4>
        {/* {showWarning && <p>This item is already pending</p>} */}
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="item-inputs">
              {items.map((item, index) => (
                <div key={index} className="item">
                  <Select
                    options={dropdownItems}
                    value={
                      dropdownItems.find(
                        (option) => option.value === item.name
                      ) || null
                    }
                    onChange={(selectedOption) =>
                      handleSelectChange(index, selectedOption)
                    }
                    className={` ${errors[index] ? "error-input" : ""}`}
                    placeholder="Select item"
                    isClearable
                  />
                  <div className='qty-cont'>
                  <input
                    type="number"
                    placeholder="Qty"
                    name="quantity"
                    value={item.quantity}
                    onChange={(e) => handleInputChange(index, e)}
                    className={`form-input quantity ${errors[index] ? "error-input" : ""
                      }`}
                  />
                  {errors[index] && (
                    <p className="error-text">{errors[index]}</p>
                  )}
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger remove-btn"
                      onClick={() => removeItem(index)}
                    >
                      &#128465;
                    </button>
                  )}
                  
                </div>
              ))}
              {createErrors.quantity ? <p className="error-text">{createErrors.quantity}</p> : ''}
              <button
                type="button"
                className="subheader-button"
                onClick={addItem}
              >
                Add Item
              </button>
            </div>
            <textarea
              name="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comment (up to 2500 characters)"
              className="form-input"
            />
            {/* Display the error message for comment field if present */}
            {errors[-1] && <p className="error-text">{errors[-1]}</p>}

            <div className="button-group">
              <button type="submit" className="subheader-button">
                Submit
              </button>
              <button
                type="button"
                className="subheader-button cancel"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>



            {showModal && <div className="popup-overlay">
              <div className="popup">

                <div className="modal-body">
                  {showErrorModal && <label className='error'>{messages.error}</label>}
                  {!showErrorModal && <label className='warning'>{messages.warn}</label>}

                  <p>{modalMessage}</p>


                  <div className="button-group">
                    {showErrorModal ?
                      <Button variant='primary' onClick={handleClose} className='nested-popup'>
                        Ok
                      </Button> :
                      <>
                        <Button variant='danger' onClick={handleClose} className='nested-popup'>
                          Yes
                        </Button>
                        <Button variant="primary" onClick={handleCancel} className='nested-popup'>
                          No
                        </Button>
                      </>}
                  </div>
                </div>
              </div>
            </div>
            }
          </form>
        </div>
        </>
}
      </div>
    </div>
  );
};

export default Popup;
