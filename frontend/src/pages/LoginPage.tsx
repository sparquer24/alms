import LoginForm from "../components/LoginForm";
import { login } from "../api/auth";

const LoginPage = () => {
    const handleLogin = async (username: string, password: string) => {
        try {
            const response = await login(username, password);
            console.log("Login successful:", response);
            // Navigate to the dashboard or handle login success
            window.location.href = "/dashboard"; // Simple navigation for now
        } catch (error) {
            console.error("Login failed:", error);
            alert("Invalid credentials. Please try again.");
        }
    };

    return (
        <div>
            <LoginForm onLogin={handleLogin} />
        </div>
    );
};

export default LoginPage;
