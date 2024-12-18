import { useEffect, useState, useMemo } from "react";
import { useNavigate } from 'react-router-dom';
import { fetchData } from "../../api/axiosConfig";
import { toast } from "react-toastify";
import { GET_INVENTORIES } from "../../api/APIs";
//@ts-ignore
import DataTable from "../common/DataTable.jsx";
import { capitalieWords } from "../../utils/stringUtils.js";

interface Props {
  user: {
    district_id: string;
  };
}

interface Inventory {
  id: string;
  availableQuantity: string;
  category: string;
  name: string;
}
 
const Inventory: React.FC<Props> = ({ user: { district_id } }) => {
  const headers = [
    {
      Header: "Item",
      accessor: "name",
      Cell: ({ value, row }: {value: string; row: {original: Inventory}}) => (
        <span
            className="indent-link"
            onClick={() => handleItemClick(row.original)}
        >
            {capitalieWords(value)}
        </span>
      ),
    },
    {
      Header: "Categories",
      accessor: "category" // accessor is the "key" in the data
    },
    {
      Header: "Available Quantity",
      accessor: "availableQuantity"
    }
  ];

  const navigate = useNavigate();
  const columns = useMemo(() => headers,[]);
  const [inventories, setInventories] = useState<Inventory[]>([]);

  const handleItemClick = (item: Inventory) => {
    navigate(`/inventorydetails/${item.id}`);
  }

  const fetchInventories = async () => {
    try {
      const response = await fetchData(GET_INVENTORIES, { district_id });
      if (response.isSuccess) {
        setInventories(response.data.data);
      } else {
        toast.error("Failed to load roles.");
      }
    } catch (error) {
      toast.error("Error fetching roles.");
    }
  };
  useEffect(() => {
    fetchInventories();
  }, []);
  return( inventories && 
    <div className="table-container">
      <DataTable data={inventories} columns={columns} isPagination={false} isSearch={true} />
    </div>
  );
};

export default Inventory;
