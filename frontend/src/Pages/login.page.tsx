import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsCookie from 'js-cookie';
import armsLogo from '../assets/passport-img.png';
import policeLogo from '../assets/ps_logo.png';
import { ToastContainer, toast } from 'react-toastify';
import { setAuthToken } from '../../src/api/axiosConfig';
import { postData } from '../../src/api/axiosConfig';
import axios from 'axios';

const Login = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        redirectLoggedInUser();
    }, []);

    const redirectLoggedInUser = () => {
        const token = jsCookie.get('token');
        if (token && location.pathname.startsWith('/login')) {
            navigate('/dashboard');
        }
    };

    const fetchData = async (url: string, token: string) => {
        try {
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return { data: response.data, isSuccess: true, error: null };
        } catch (error: any) {
            return {
                data: null,
                isSuccess: false,
                error: error.response?.data || { message: 'Unexpected error' },
            };
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await postData(`/login`, {
                username,
                password,
            });

            if (!response.isSuccess) {
                toast.error('Invalid credentials!');
                return;
            }

            const data_res = JSON.parse(response.body);
            console.log(data_res);
            jsCookie.set('user', JSON.stringify(data_res?.data), { expires: 1 });

            const accessToken = data_res?.data.accessToken;
            console.log({ accessToken });
            jsCookie.set('token', accessToken, { expires: 1 });
            setAuthToken(accessToken);
            toast.success('Successfully logged in!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError('An unexpected error occurred');
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div
                className="min-h-screen bg-cover bg-center flex flex-col justify-center items-center overflow-hidden bg-black bg-opacity-10"
                style={{
                    backgroundImage: `url('src/assets/backgroundIMGALMS.jpeg')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                }}
            >
                <div className="flex flex-col md:flex-row justify-center items-center gap-10">
                    {/* Left Section */}
                    <div className="flex justify-center items-center flex-grow">
                        <img src={policeLogo} alt="Telangana Police Badge" className="h-[400px] w-[400px] md:h-[500px] md:w-[500px]" />
                    </div>

                    {/* Right Section */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4 w-full max-w-lg bg-white p-20 rounded-lg shadow-md shadow-[0px_0px_10px_0px_#00000040]"
                        style={{ margin: '10px 0' }}
                    >
                        <div className="flex items-center justify-center bg-gray-50 gap-2 ">
                            <img src={armsLogo} alt="Telangana Police" className="h-16 mr-4" />
                            <h3 className="text-3xl text-violet-900 font-bold">Telangana Police</h3>
                        </div>
                        <h4 className="text-gray-600 text-2xl font-bold">Login</h4>

                        <div className="flex flex-col">
                            <label htmlFor="userId" className="text-gray-700 font-bold">User Name</label>
                            <input
                                type="text"
                                id="userName"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your name"
                                className="mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex items-center relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="mt-3 p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            />
                            <span
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {/* {showPassword ? '👁️' : '🙈'} */}
                            </span>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className="bg-[#31208A] text-white font-bold py-2 rounded-lg hover:bg-blue-700 focus:outline-none"
                        >
                            {loading ? 'Signing In...' : 'Submit'}
                        </button>
                    </form>
                </div>
            </div>


        </>
    );
};

export default Login;
