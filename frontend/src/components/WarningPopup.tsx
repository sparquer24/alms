import '../styles/WarningPopup.css';

interface Props {
  message: string;
  onClose: () => void;
  onConfirm: () => void;
}

function WarningPopup({ message, onClose, onConfirm }: Props) {
  return (
    <div className="warning-popup-overlay">
      <div className="warning-popup">
        <p>{message}</p>
        <div className="warning-popup-buttons">
          {message.includes('Are you sure you want to add it') ? ( 
            <>
              <button className="warning-popup-button" onClick={onConfirm}>Yes</button>
              <button className="warning-popup-button" onClick={onClose}>No</button>
            </>
          ) : (
            <button className="warning-popup-button" onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default WarningPopup;
