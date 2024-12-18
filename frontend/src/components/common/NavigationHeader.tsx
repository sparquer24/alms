import { useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../features/store.hook';
import { RootState } from '../../store';
import { createIndent } from '../../features/indents/indentSlice';
import '../../styles/Dashboard.css';
import { INVENTORY_ROLES } from '../../constants';

const NavigationHeader: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    const userRole = useAppSelector((state: RootState) => state.user.role);
    const openIndentPopup = () => {
        dispatch(createIndent());
    };

    const isOnDashboard = location.pathname === '/dashboard';

    
    return(
            <div className="subNav">
                <div className="subheader-buttons-right">
                {isOnDashboard && (
                <button className="subheader-button" onClick={openIndentPopup}>Create Indent</button>)}

                <div className="subheader-buttons-right">
                {!isOnDashboard && (
            <button className="subheader-button" onClick={() => navigate('/dashboard')}>
                Dashboard
            </button>
        )}
                    {INVENTORY_ROLES.includes(userRole) && <button className="subheader-button" onClick={() => navigate('/inventory')}>
                        Inventory
                    </button>}
                </div>
            </div>
        
        </div>
            
    );
}
export default NavigationHeader;