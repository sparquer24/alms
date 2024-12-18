import jsCookie from 'js-cookie';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Inventory.css';
import Inventory from '../components/inventory/Inventory';

const inventoryTabs = [
    {
        label: "Inventory",
        value: "inventory"
    },
    {
        label: "Procurement Requests",
        value: "procurementRequests"
    },
]


const InventoryPage: React.FC = () => {
    const user = jsCookie.get('user') ? JSON.parse(jsCookie.get('user') as string) : null;
    const { tab } = useParams<{ tab: string }>();
    const navigate = useNavigate();
    const currentTab = tab || inventoryTabs[0].value; //setting to default first one
   
    const Tabs: React.FC = () => {
        return (
            <div className='tabs'>
                {inventoryTabs.map((tab) => (
                    <button className={`tab ${currentTab === tab.value ? 'active' : ''}`} key={tab.value} onClick={() => navigate(`/inventory/${tab.value}`)}>{tab.label}</button>
                ))}
            </div>
        );
    }
    return(
        <div className="inventory-page">
            {
                inventoryTabs.length && <Tabs />
            }
            {
              (currentTab === 'inventory') && <Inventory user={user}/>
            }
            {
                currentTab === 'procurementRequests' &&  <h1>This is Under Construction... </h1>
            }
        </div>
    );
}
export default InventoryPage;