// src/pages/PasswordResetConfirmPage.js

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset } from '../../services/api'; // Import the API function
import { useTranslation } from 'react-i18next'; // Import useTranslation

const PasswordResetConfirmPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { uidb64, token } = useParams();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handlePasswordResetConfirm = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!newPassword || !confirmPassword) {
            setError(t('passwordResetConfirm.errors.requiredFields'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t('passwordResetConfirm.errors.passwordMismatch'));
            return;
        }

        try {
            setLoading(true);
            const response = await confirmPasswordReset(uidb64, token, newPassword, confirmPassword); // Pass both passwords
            setMessage(t('passwordResetConfirm.success.passwordReset'));
            // Redirect to login after a short delay
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.non_field_errors) {
                // Assuming the backend sends error codes like 'invalidToken', 'userAlreadyActive', etc.
                const errorCode = err.response.data.non_field_errors[0];
                setError(t(`passwordResetConfirm.errors.${errorCode}`) || t('passwordResetConfirm.errors.unexpectedError'));
            } else {
                setError(t('passwordResetConfirm.errors.unexpectedError'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="password-reset-confirm-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <div className="password-reset-confirm-box p-5 shadow" style={{ backgroundColor: '#fff', borderRadius: '10px', width: '400px' }}>
                <h2 className="text-center mb-4">{t('passwordResetConfirm.title')}</h2>
                {message && <p className="text-success text-center">{message}</p>}
                {error && <p className="text-danger text-center">{error}</p>}

                <form onSubmit={handlePasswordResetConfirm} className="text-right" dir={i18n.dir()}>
                    <div className="form-group">
                        <label htmlFor="newPassword">{t('passwordResetConfirm.labels.newPassword')}</label>
                        <input
                            type="password"
                            id="newPassword"
                            className="form-control"
                            placeholder={t('passwordResetConfirm.placeholders.newPassword')}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">{t('passwordResetConfirm.labels.confirmPassword')}</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-control"
                            placeholder={t('passwordResetConfirm.placeholders.confirmPassword')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="text-center mt-4">
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? t('passwordResetConfirm.buttons.resetting') : t('passwordResetConfirm.buttons.resetPassword')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordResetConfirmPage;
