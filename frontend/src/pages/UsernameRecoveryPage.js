import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import the useTranslation hook
import { recoverUsername } from '../services/api'; // Import the API function

const UsernameRecoveryPage = () => {
    const { t } = useTranslation(); // Using useTranslation hook for localization
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUsernameRecovery = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!email) {
            setError(t('usernameRecovery.emailRequired')); // Use localized message
            return;
        }

        try {
            setLoading(true);
            const response = await recoverUsername(email); // Use the API function
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.email?.[0] || t('usernameRecovery.errorSending'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="username-recovery-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
            <div className="username-recovery-box p-5 shadow" style={{ backgroundColor: '#fff', borderRadius: '10px', width: '400px' }}>
                <h2 className="text-center mb-4">{t('usernameRecovery.title')}</h2> {/* Localized title */}
                {message && <p className="text-success text-center">{message}</p>}
                {error && <p className="text-danger text-center">{error}</p>}

                <form onSubmit={handleUsernameRecovery} className="text-right" dir="rtl">
                    <div className="form-group">
                        <label htmlFor="email">{t('usernameRecovery.emailLabel')}</label> {/* Localized label */}
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            placeholder={t('usernameRecovery.emailPlaceholder')} // Localized placeholder
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />

                    </div>

                    <div className="text-center mt-4">
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? t('usernameRecovery.sending') : t('usernameRecovery.sendButton')} {/* Localized button */}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UsernameRecoveryPage;
