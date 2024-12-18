import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import '../../styles/Inventory.css';
import SimpleTable from '../common/SimpleTable';
import { GET_INVENTORY } from '../../api/APIs';
import { fetchData } from '../../api/axiosConfig';
import SpinnerComponent from '../SpinnerComponent';
import { Inventory } from '../../interfaces/Inventory';

const InventoryItemDetail: FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(false);
    const [inventory, setInventory] = useState<Inventory>();
    const { id } = useParams();

    const fetchInventory = async () => {
        setLoading(true);
        try {
          const response = await fetchData(`${GET_INVENTORY}?id=${id}`);
          if (response.isSuccess) {
            setInventory(response.data);
          } 
        } catch (error) {
            console.log(error);
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        if (id) fetchInventory();
      }, [id]);
    
    const headers = ["Change Type", "Old Quantity", "Updated To Quantity"];
    const valueKeys = ["changed_type", "old_quantity", "updated_quantity"];

    return(
        <>
            {
                loading ? (
                    <SpinnerComponent />
                ) : (
                    <div className="dashboard-indent-page inventory-detail">
                        <button
                            onClick={() => navigate("/inventory/inventory")}
                            className='back-btn'
                        >
                            Back
                        </button>
                        <p>
                            <strong>Item:</strong> {inventory?.item_name}
                        </p>
                        <p>
                            <strong>category:</strong> {inventory?.category}
                        </p>
                        <p>
                            <strong>Available Quantity:</strong> {inventory?.available_quantity}
                        </p>
                        <div className='simple-table-wrapper'>
                            <SimpleTable data={inventory?.tracker || []} headers={headers} valueKeys={valueKeys} />
                        </div>
                    </div>
                )
            }
        </>
            
    );
}

export default InventoryItemDetail;