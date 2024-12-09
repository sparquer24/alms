import { useEffect, useState } from "react";
import DashboardTable from "../components/DashboardTable";
import { fetchDashboardData } from "../api/dashboard";

const DashboardPage = () => {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const result = await fetchDashboardData();
            setData(result);
        };

        fetchData();
    }, []);

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <DashboardTable data={data} />
        </div>
    );
};

export default DashboardPage;
