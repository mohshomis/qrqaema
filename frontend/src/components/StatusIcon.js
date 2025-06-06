// src/components/StatusIcon.js

import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faHourglassHalf, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import './StatusIcon.css'; // Custom styles for the status icon

const StatusIcon = ({ status }) => {
    const { t } = useTranslation();
    const [displayIcon, setDisplayIcon] = useState('Initial'); // 'Initial' for green check, 'Waiting' for hourglass
    const [displayMessage, setDisplayMessage] = useState(''); // Message corresponding to the current icon
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        // Initially display the green check icon and its message
        setDisplayIcon('Initial');
        setDisplayMessage(t('statusIcon.orderReceived'));
        setIsTransitioning(true);

        // After 5 seconds, switch to the yellow hourglass icon and its message
        const timer = setTimeout(() => {
            if (status === 'Completed') {
                setDisplayIcon('Waiting');
                setDisplayMessage(t('statusIcon.orderWaiting'));
            } else if (status === 'Cancelled') {
                setDisplayIcon('Cancelled');
                setDisplayMessage(t('statusIcon.orderCancelled'));
            }
            setIsTransitioning(false);
        }, 5000); // 5000 milliseconds = 5 seconds

        return () => clearTimeout(timer);
    }, [status, t]); // Re-run if the status prop changes or translations change

    const getIcon = (currentStatus) => {
        switch (currentStatus) {
            case 'Initial':
                return (
                    <FontAwesomeIcon icon={faCheckCircle} className="text-success fa-4x fade-in" />
                );
            case 'Waiting':
                return (
                    <FontAwesomeIcon icon={faHourglassHalf} className="text-warning fa-4x fade-in" />
                );
            case 'Cancelled':
                return (
                    <FontAwesomeIcon icon={faTimesCircle} className="text-danger fa-4x fade-in" />
                );
            default:
                return null;
        }
    };

    return (
        <div className={`status-icon-container ${isTransitioning ? 'transitioning' : ''}`}>
            {getIcon(displayIcon)}
            <p className="status-message mt-2">
                {displayMessage}
            </p>
        </div>
    );
};

export default StatusIcon;
