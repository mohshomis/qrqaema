// src/pages/LoginPage.js

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link, useLocation } from 'react-router-dom'; // useLocation added for redirecting back after login
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap for styling
import './LoginPage.css'; // Add a custom CSS file for any additional styles
import { AuthContext } from '../AuthContext'; // Import AuthContext
import { useTranslation } from 'react-i18next'; // Import useTranslation

const LoginPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false); // Loading state
    const navigate = useNavigate();
    const location = useLocation(); // Get the location object to handle redirect after login
    const { login } = useContext(AuthContext); // Access login via Context

    // Check if user is already logged in (i.e., if a token exists in localStorage)
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // Clear previous error message
        setError('');

        // Basic validation
        if (!username || !password) {
            setError(t('login.errors.requiredFields'));
            return;
        }

        try {
            setLoading(true); // Start loading
            console.log("Attempting to login with:", { username, password });

            // Send login request to backend
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/token/`, {
                username,
                password,
            });

            console.log("Login response:", response);

            // Store JWT token in localStorage
            const { access } = response.data;
            localStorage.setItem('token', access);

            // Call the login function to set authentication state
            login(access);

            // Redirect to the page the user wanted to visit or dashboard
            const redirectPath = location.state?.from?.pathname || '/dashboard';
            navigate(redirectPath);
        } catch (err) {
            console.log("Login error:", err);

            if (err.response) {
                if (err.response.data && err.response.data.detail) {
                    setError(t(`login.errors.${err.response.data.detail}`) || t('login.errors.invalidCredentials'));
                } else {
                    setError(t('login.errors.invalidCredentials'));
                }
            } else {
                setError(t('login.errors.unexpectedError'));
            }
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <div className="login-page-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="login-box p-5 shadow" style={{ backgroundColor: '#fff', borderRadius: '10px', width: '400px' }}>
                <h2 className="text-center mb-4">{t('login.title')}</h2>

                {error && <p className="text-danger text-center">{error}</p>}

                <form onSubmit={handleLogin} className="text-right" dir={i18n.dir()}>
                    <div className="form-group">
                        <label htmlFor="username">{t('login.username')}</label>
                        <input
                            type="text"
                            id="username"
                            className="form-control"
                            placeholder={t('login.placeholders.enterUsername')}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading} // Disable input while loading
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">{t('login.password')}</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            placeholder={t('login.placeholders.enterPassword')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading} // Disable input while loading
                        />
                    </div>

                    <div className="text-center mt-4">
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? t('login.buttons.loggingIn') : t('login.buttons.login')}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-3">
                    <Link to="/" className="text-muted">{t('login.links.returnHome')}</Link>
                </div>

                <div className="text-center mt-3">
                    <p>{t('login.links.noAccount')} <Link to="/register" className="text-primary">{t('login.links.register')}</Link></p>
                </div>

                {/* Recovery Links */}
                <div className="text-center mt-3">
                    <Link to="/password-reset" className="text-primary">{t('login.links.forgotPassword')}</Link>
                </div>
                <div className="text-center mt-2">
                    <Link to="/username-recovery" className="text-primary">{t('login.links.recoverUsername')}</Link>
                </div>
            </div>
        </div>
    );

};

export default LoginPage;
