// src/pages/LoginPage.js

import React, { useState, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginPage.css';
import { AuthContext } from '../../AuthContext';
import { useTranslation } from 'react-i18next';
import { login as apiLogin } from '../../services/api';

const LoginPage = () => {
    const { t, i18n } = useTranslation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { login: authLogin } = useContext(AuthContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError(t('login.errors.requiredFields'));
            return;
        }

        try {
            setLoading(true);
            console.log("Attempting to login with:", { username, password });

            const response = await apiLogin({ username, password });
            console.log("Login response:", response);

            // Let AuthContext handle token storage and decoding
            authLogin(response.data.access);

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
            setLoading(false);
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
