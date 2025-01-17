// src/pages/PasswordResetRequestPage.js

import React, { useState } from 'react';
import { requestPasswordReset } from '../../services/api'; // Import the API function
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Link } from 'react-router-dom'; // Import Link for navigation

const PasswordResetRequestPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email) {
            setError(t('passwordResetRequest.errors.requiredEmail'));
            return;
        }

        try {
            setLoading(true);
            const response = await requestPasswordReset(email); // Use API function
            setMessage(t('passwordResetRequest.messages.success'));
        } catch (err) {
            setError(
                err.response?.data?.email?.[0]
                    ? t(`passwordResetRequest.errors.${err.response.data.email[0]}`)
                    : t('passwordResetRequest.errors.unexpectedError')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="password-reset-request-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="password-reset-request-box p-5 shadow" style={{ backgroundColor: '#fff', borderRadius: '10px', width: '400px' }}>
                <h2 className="text-center mb-4">{t('passwordResetRequest.title')}</h2>
                {message && <p className="text-success text-center">{message}</p>}
                {error && <p className="text-danger text-center">{error}</p>}

                <form onSubmit={handlePasswordReset} className="text-right" dir={i18n.dir()}>
                    <div className="form-group">
                        <label htmlFor="email">{t('passwordResetRequest.labels.email')}</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            placeholder={t('passwordResetRequest.placeholders.enterEmail')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="text-center mt-4">
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? t('passwordResetRequest.buttons.sending') : t('passwordResetRequest.buttons.sendResetLink')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordResetRequestPage;
