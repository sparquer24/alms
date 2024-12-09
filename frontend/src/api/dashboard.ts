import axios from "axios";

export const fetchDashboardData = async () => {
    const response = await axios.post("/api/login");
    return response.data;
};
