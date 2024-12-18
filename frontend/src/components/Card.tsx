import React from 'react';
// import Popup from './Popup';
import '../styles/Card.css';

interface Item {
  name: string;
  quantity: number;
}

interface Data {
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
}
interface FormState {
  statusId: string;
  assignedRoleId: string;
  userId: string;
  comment: string;
  items: Item[];
}

interface CardProps {
  item: Data;
  showPopup: boolean;
  togglePopup: () => void;
  addCard: (data: FormState) => void; 
}

const formatDateReadable = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  });
};

const Card: React.FC<CardProps> = ({
  item,
  // showPopup,
  // togglePopup,
  // addCard,
}) => {
  return (
    <div className="card">
      <div className="indent-items">
        <table>
          <thead>
            <tr>
              <th style={{ backgroundColor: '#111a48' }}>Name of the Items</th>
              <th style={{ backgroundColor: '#111a48' }}>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {item.items.map((item, index) => (
              <tr key={index}>
                <td className="item-name">{item.name}</td>
                <td className="item-quantity">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="indent-description">
        <p><strong>Comment:</strong> {item.comment}</p>
      </div>
      <div className="card-header">
        <p><strong>Action Taken By:</strong> {item.actionTakenBy}</p>
      </div>
      <div className="indent-dates">
        <p><strong>Created At:</strong> {formatDateReadable(item.createdDate)}</p>
        {/* <p><strong>Closed At:</strong> {formatDateReadable(item.closeDate)}</p> */}
      </div>
      <div className="card-status">
        <h5>Status: {item.status || 'unsubmitted'}</h5>
      </div>
      <div className="indent-actions">
        {/* {showPopup && <Popup onClose={togglePopup} onSubmit={addCard} />} */}
      </div>
    </div>
  );
};

export default Card;


