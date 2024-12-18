import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams  } from "react-router-dom";
import { fetchData } from "../api/axiosConfig";
import { Data, Item } from "./types";
import "../styles/IndentHistory.css";
import SpinnerComponent from "./SpinnerComponent";
import { FaEdit } from "react-icons/fa";
import EditItemModal from "./EditItem";
import jsCookie from "js-cookie";

function IndentHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stateParam = searchParams.get('state');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [filter, setFilter] = useState('');
  const userRole = jsCookie.get("role");


  const fetchMyIndents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchData(`/getindentbyid?id=${id}`);
      if (response.isSuccess) {
        setData(response.data);
      } else {
        setError("Failed to fetch indent details");
      }
    } catch (error) {
      setError("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  
  useEffect(() => {
    if (id) fetchMyIndents();
  }, [id]);

  useEffect(()=>{
      setFilter('Pending')
  },[filter])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString(
      "en-GB",
      { hour: "2-digit", minute: "2-digit", second: "2-digit" }
    )}`;
  };

  const handleEditClick = (item: Item) => {
    setSelectedItem(item);
    setIsModalOpen(true); // Open the modal
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  };
  const handleSave = (updatedItem: Item) => {
    setData((prevData) => {
      if (!prevData) return null;
      return {
        ...prevData,
        items: prevData.items.map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      };
    });
    setIsModalOpen(false); // Close the modal after saving
    document.body.style.overflow = "unset"; // Restore background scrolling
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = "unset"; // Restore background scrolling
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <SpinnerComponent />
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!data) {
    return <div>No data available.</div>;
  }

  const sortedTracker = [...data.tracker].sort(
    (a, b) =>
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  );

  

  return (
    <div className="dashboard-indent-page">
      <div
        style={{
          marginBottom: "0px",
          paddingLeft: "30px",
          paddingRight: "30px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            marginBottom: "10px",
            marginTop: "25px",
          }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "#E52F2F",
              border: "none",
              color: "white",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "1em",
              padding: "10px 20px",
            }}
          >
            Back
          </button>
        </div>
        <p>
          <strong>Indent Number:</strong> {data.id}
        </p>
        <p>
          <strong>Date:</strong> {formatDate(data.createdDate)}
        </p>
      </div>
      {/* Items Table */}
      <div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
        {data.items && data.items.length > 0 ? (
          <div style={{ marginTop: "20px" }}>
            <h5 style={{ fontSize: "1.1em", color: "#555" }}>Items</h5>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      textAlign: "left",
                      backgroundColor: "#f4f4f4",
                    }}
                  >
                    Item
                  </th>
                  <th
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                      textAlign: "left",
                      backgroundColor: "#f4f4f4",
                    }}
                  >
                    Quantity
                  </th>
                  {(userRole === "JTCP" ||
                    userRole === "CP" ||
                    userRole === "STORE") && (
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "10px",
                        textAlign: "left",
                        backgroundColor: "#f4f4f4",
                      }}
                    >
                      StockAvailability
                    </th>
                  )}
                  
                  {(userRole === "JTCP" || userRole === "CP") && stateParam === 'Pending' && (
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "10px",
                        textAlign: "left",
                        backgroundColor: "#f4f4f4",
                      }}
                    >
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index}>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                      {item.name}
                    </td>
                    <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                      {item.quantity}
                    </td>
                    {(userRole === "JTCP" ||
                      userRole === "CP" ||
                      userRole === "STORE") && (
                      <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                        {item?.stockAvailability}
                      </td>
                    )}
                    {(userRole === "JTCP" || userRole === "CP") && stateParam === "Pending" &&(
                      <td
                        style={{
                          borderBottom: "1px solid #dee2e6",
                          padding: "10px",
                        }}
                      >
                        <FaEdit
                          style={{ cursor: "pointer", color: "#007bff" }}
                          onClick={() => handleEditClick(item)} // Call the edit handler
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{ marginTop: "20px", fontStyle: "italic", color: "#888" }}
          >
            No items found
          </div>
        )}
      </div>

      {/* Dispatch Table */}
      {data.dispatchedItems?.length > 0 && (
        <div style={{ paddingLeft: "30px", paddingRight: "30px" }}>
          {data.items && data.items.length > 0 ? (
            <div style={{ marginTop: "20px" }}>
              <h5 style={{ fontSize: "1.1em", color: "#555" }}>
                Dispatched Items
              </h5>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginTop: "10px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "10px",
                        textAlign: "left",
                        backgroundColor: "#f4f4f4",
                      }}
                    >
                      Item
                    </th>
                    <th
                      style={{
                        border: "1px solid #ddd",
                        padding: "10px",
                        textAlign: "left",
                        backgroundColor: "#f4f4f4",
                      }}
                    >
                      Quantity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.dispatchedItems.map((item, index) => (
                    <tr key={index}>
                      <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                        {item.name}
                      </td>
                      <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              style={{ marginTop: "20px", fontStyle: "italic", color: "#888" }}
            >
              No items found
            </div>
          )}
        </div>
      )}

      {/* Edit Item Modal */}
      {isModalOpen && selectedItem && (
        <EditItemModal
          isOpen={isModalOpen}
          item={selectedItem}
          onClose={handleCloseModal} // Close the modal correctly
          onSave={handleSave}
        />
      )}
      {/* Tracker Table */}
      <div
        style={{ marginTop: "20px", paddingLeft: "30px", paddingRight: "30px" }}
      >
        <h5 style={{ fontSize: "1.1em", color: "#555" }}>Tracker</h5>
        <div style={{ maxHeight: "150px", overflowY: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "10px",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "#f4f4f4",
                    zIndex: 1,
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  Action Taken By
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "#f4f4f4",
                    zIndex: 1,
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "#f4f4f4",
                    zIndex: 1,
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  Action Date
                </th>
                <th
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "#f4f4f4",
                    zIndex: 1,
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                  }}
                >
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTracker.map((tracker, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {tracker.actionTakenBy}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {tracker.status}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {formatDate(tracker.createdDate)}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {tracker.remarks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default IndentHistory;
