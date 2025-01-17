// src/pages/ActivateAccountPage.js

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activateAccount } from '../services/api'; // Import the API function
import { useTranslation } from 'react-i18next'; // Import useTranslation

const ActivateAccountPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { uidb64, token } = useParams();
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const activateAccountHandler = async () => {
            try {
                const response = await activateAccount(uidb64, token); // Use the API function
                setMessage(t('success.accountActivated'));
                // Redirect to login after a short delay
                setTimeout(() => navigate('/login'), 3000);
            } catch (error) {
                setMessage(error.response?.data?.error ? t(`errors.${error.response.data.error}`) : t('errors.activationFailed'));
            }
        };
        activateAccountHandler();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uidb64, token, navigate]);

    return (
        <div className="activation-page-container d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <div className="activation-box p-5 shadow text-center" style={{ backgroundColor: '#fff', borderRadius: '10px', width: '400px' }}>
                <h2>{t('activateAccount')}</h2>
                <p>{message}</p>
                {message === t('success.accountActivated') && <p>{t('redirectingToLogin')}</p>}
            </div>
        </div>
    );
};

export default ActivateAccountPage;
