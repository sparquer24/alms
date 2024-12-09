import "../styles/dashboard.css";

const DashboardTable = ({ data }: { data: any[] }) => {
    return (
        <table className="dashboard-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item) => (
                    <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.name}</td>
                        <td>{item.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default DashboardTable;
