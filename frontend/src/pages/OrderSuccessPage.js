// src/pages/OrderSuccessPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderStatus } from '../services/api'; // API service to fetch order status
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo } from '@fortawesome/free-solid-svg-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './OrderSuccessPage.css'; // Custom styles for this page
import TicTacToe from '../components/TicTacToe'; // Import the TicTacToe component
import StatusIcon from '../components/StatusIcon'; // Import the StatusIcon component
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Container, Button, Alert, Spinner, Card, ListGroup } from 'react-bootstrap';

const OrderSuccessPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { restaurantId, tableNumber } = useParams();
    const navigate = useNavigate();
    const [orderStatus, setOrderStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentStatus, setCurrentStatus] = useState('Initial'); // 'Initial', 'Waiting', 'Cancelled'

    // Function to fetch the order status
    const fetchOrderStatus = async () => {
        try {
            const response = await getOrderStatus(restaurantId, tableNumber);
            if (response && response.length > 0) {
                setOrderStatus(response[0]); // Set the first order in the array
                setCurrentStatus(response[0].status); // Update the current status
                setError(null);
            } else {
                setError(t('orderSuccessPage.errors.noOrdersForTable'));
                setOrderStatus(null);
            }
        } catch (error) {
            console.error(t('orderSuccessPage.errors.fetchOrderStatus'), error);
            setError(t('orderSuccessPage.errors.fetchOrderStatus'));
            setOrderStatus(null);
        } finally {
            setLoading(false);
        }
    };

    // Refresh the order status every 10 seconds
    useEffect(() => {
        fetchOrderStatus(); // Fetch the order status when the page loads
        const interval = setInterval(() => {
            fetchOrderStatus(); // Fetch the latest status every 10 seconds
        }, 10000); // Set the refresh interval to 10 seconds
        return () => clearInterval(interval); // Clear the interval when the component unmounts
    }, [restaurantId, tableNumber, t]); // Added 't' as dependency for proper translations

    // Handle "Order Again" button click
    const handleOrderAgain = () => {
        navigate(`/restaurant/${restaurantId}/table/${tableNumber}`);
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">{t('orderSuccessPage.loading')}</span>
                </Spinner>
                <p className="mt-3">{t('orderSuccessPage.loading')}</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5 text-center">
                <Alert variant="danger">
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="mt-4 order-success-page" dir={i18n.dir()}>
            <div className="order-success-content text-center">
                {/* StatusIcon now handles both the icon and the status message */}
                <StatusIcon status={currentStatus} />
                <p>{t('orderSuccessPage.table')}: {tableNumber}</p>

                {orderStatus && orderStatus.items ? (
                    <>
                        <div className="order-summary mt-4">
                            <h4>{t('orderSuccessPage.orderSummary')}</h4>
                            <ListGroup variant="flush">
                                {orderStatus.items.map((item, index) => (
                                    <ListGroup.Item key={index}>
                                        <strong>{item.quantity}x {item.menu_item}</strong>
                                        <p>{t('orderSuccessPage.price')}: {item.total_price} {t('orderSuccessPage.currency')}</p>
                                        {item.special_request && (
                                            <p className="text-muted">
                                                <strong>{t('orderSuccessPage.specialRequest')}:</strong> {item.special_request}
                                            </p>
                                        )}
                                        {item.selected_options && item.selected_options.length > 0 && (
                                            <div>
                                                <strong>{t('orderSuccessPage.selectedOptions')}:</strong>
                                                <ul className="options-list">
                                                    {item.selected_options.map((option, idx) => (
                                                        <li key={idx}>
                                                            {option.name}: {option.price_modifier} {t('orderSuccessPage.currency')}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>

                        {/* Attractive Phrase and Tic-Tac-Toe Game */}
                        <div className="mt-5">
                            <TicTacToe />
                        </div>
                    </>
                ) : (
                    <p>{t('orderSuccessPage.noOrderDetails')}</p>
                )}

                <div className="action-buttons mt-4">
                    <Button variant="primary" size="lg" onClick={handleOrderAgain}>
                        <FontAwesomeIcon icon={faRedo} /> {t('orderSuccessPage.orderAgain')}
                    </Button>
                </div>
            </div>
        </Container>
    );
};

export default OrderSuccessPage;
