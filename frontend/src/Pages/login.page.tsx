import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/login.css';
import jsCookie from 'js-cookie';
import axios from 'axios';
import { toast } from 'react-toastify';
import ps_logo from '../assets/ps_logo.png';
import arms_logo from '../assets/passport-img.png';
import { setAuthToken } from '../../src/api/axiosConfig';
import { useAppDispatch } from '../features/store.hook';
import { postData } from '../../src/api/axiosConfig';

const Login: React.FC = () => {
    const dispatch = useAppDispatch();
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
            console.log({ response });
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
        <div className='main'>
            <div className='container'>
                <div className='login_logo'>
                    <img src={ps_logo} alt='PS Logo' />
                </div>
                <form className='form-container' onSubmit={handleSubmit}>
                    <div className='arms-logo'>
                        <img src={arms_logo} alt='PS Logo' />
                        <h1>Arms License</h1>
                    </div>
                    <h5 className='form-title'>Login</h5>
                    <table className="login-input">
                        <tr>
                            <td>
                                <label htmlFor="username" className="form-label">User Name</label>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your user name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <label htmlFor="password" className="form-label">Password</label>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div className="password-wrapper">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <span
                                        className="toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? '👁️' : '🙈'}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    </table>
                    <button type='submit' disabled={loading}>
                        {loading ? 'Signing In...' : 'Submit'}
                    </button>
                </form>


            </div>
        </div>
    );
};

export default Login;
