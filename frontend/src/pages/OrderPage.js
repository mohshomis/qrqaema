// src/pages/OrderPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { getOrders, updateOrderStatus, deleteOrder, getRestaurantPublicDetails } from '../services/api'; // Ensure all necessary APIs are imported
import 'bootstrap/dist/css/bootstrap.min.css';
import { FaTrashAlt, FaCheckCircle, FaHourglassHalf, FaArrowLeft } from 'react-icons/fa'; // Added FaArrowLeft for Back Button
import './OrderPage.css';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Container, Button, Alert, Spinner, Badge } from 'react-bootstrap';

const OrderPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Extract 'status' from query parameters
    const queryParams = new URLSearchParams(location.search);
    const statusFilter = queryParams.get('status');

    // Fetch orders for the restaurant
    useEffect(() => {
        if (restaurantId) {
            fetchOrders();
        }
    }, [restaurantId]);

    // Fetch the orders from the API
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getOrders(restaurantId);
            console.log('Fetched orders:', response.data); // For debugging
            setOrders(response.data || []);
        } catch (error) {
            setError(t('orderPage.errors.fetchOrders'));
            console.error(t('orderPage.errors.fetchOrders'), error);
        } finally {
            setLoading(false);
        }
    };

    // Update order status
    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, { status: newStatus });
            alert(t('orderPage.success.statusUpdated', { status: newStatus }));
            fetchOrders(); // Refresh the list after update
        } catch (error) {
            console.error(t('orderPage.errors.updateStatus'), error);
            alert(t('orderPage.errors.updateStatusError', { error: error.response?.status || error.message }));
        }
    };

    // Delete an order
    const handleDeleteOrder = async (orderId) => {
        const confirmDelete = window.confirm(t('orderPage.confirmDelete'));
        if (confirmDelete) {
            try {
                await deleteOrder(orderId);
                alert(t('orderPage.success.orderDeleted'));
                fetchOrders(); // Refresh the list after deletion
            } catch (error) {
                console.error(t('orderPage.errors.deleteOrder'), error);
                alert(t('orderPage.errors.deleteOrderError', { error: error.response?.status || error.message }));
            }
        }
    };

    // Filter orders based on status if statusFilter is present
    const filteredOrders = statusFilter
        ? orders.filter(order => order.status === statusFilter)
        : orders;

    // Helper function to get badge color based on status
    const getBadgeColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'danger';
            case 'In Progress':
                return 'warning';
            case 'Completed':
                return 'success';
            default:
                return 'secondary';
        }
    };

    return (
        <div className="container mt-5" dir={i18n.dir()}>
            {/* Back Button */}
            <Button className="mb-3" onClick={() => navigate(-1)}>
                <FaArrowLeft /> {t('orderPage.goBack')}
            </Button>

            <h1 className="text-center mb-4">{t('orderPage.title')}</h1>

            {/* Show loading state */}
            {loading && (
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">{t('orderPage.loading')}</span>
                    </Spinner>
                </div>
            )}

            {/* Show error message */}
            {error && (
                <Alert variant="danger" className="text-center" role="alert">
                    {error}
                </Alert>
            )}

            {/* Display orders */}
            {!loading && !error && (
                <>
                    {filteredOrders.length > 0 ? (
                        <div className="row">
                            {filteredOrders.map((order) => (
                                <div className="col-md-6 col-lg-4 mb-4" key={order.id}>
                                    <div className="card h-100 shadow-sm">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <span>{t('orderPage.table')}: {order.table_number}</span>
                                            <Badge bg={getBadgeColor(order.status)}>
                                                {t(`orderPage.status.${order.status.toLowerCase().replace(' ', '_')}`)}
                                            </Badge>
                                        </div>
                                        <div className="card-body">
                                            {/* Order Items */}
                                            <h5 className="card-title text-center mb-3">{t('orderPage.orderDetails')}</h5>
                                            <div className="order-details">
                                                {order.items && order.items.length > 0 ? (
                                                    <ul className="list-group mb-3">
                                                        {order.items.map((item, index) => (
                                                            <li className="list-group-item" key={index}>
                                                                <strong>{item.quantity}x {item.menu_item_name}</strong>
                                                                <p>{t('orderPage.price')}: {item.total_price} {t('orderPage.currency')}</p>
                                                                {item.special_request && (
                                                                    <p className="text-muted">
                                                                        <strong>{t('orderPage.specialRequest')}:</strong> {item.special_request}
                                                                    </p>
                                                                )}
                                                                {item.selected_options_details && item.selected_options_details.length > 0 && (
                                                                    <div>
                                                                        <strong>{t('orderPage.selectedOptions')}:</strong>
                                                                        <ul className="options-list">
                                                                            {item.selected_options_details.map((option, idx) => (
                                                                                <li key={idx}>
                                                                                    {option.name}: {option.price_modifier} {t('orderPage.currency')}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>{t('orderPage.noItemsInOrder')}</p>
                                                )}

                                                {/* Additional Info */}
                                                {order.additional_info && (
                                                    <div className="mb-3">
                                                        <strong>{t('orderPage.additionalInfo')}:</strong>
                                                        <p>{order.additional_info}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="card-footer d-flex justify-content-between">
                                            {/* Status Buttons */}
                                            <div>
                                                {order.status === 'Pending' && (
                                                    <Button
                                                        className="btn btn-warning btn-sm me-2"
                                                        onClick={() => handleStatusUpdate(order.id, 'In Progress')}
                                                        title={t('orderPage.startExecution')}
                                                    >
                                                        <FaHourglassHalf /> {t('orderPage.startExecution')}
                                                    </Button>
                                                )}
                                                {order.status === 'In Progress' && (
                                                    <Button
                                                        className="btn btn-success btn-sm me-2"
                                                        onClick={() => handleStatusUpdate(order.id, 'Completed')}
                                                        title={t('orderPage.completeOrder')}
                                                    >
                                                        <FaCheckCircle /> {t('orderPage.completeOrder')}
                                                    </Button>
                                                )}
                                            </div>
                                            {/* Delete Order Button */}
                                            <Button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDeleteOrder(order.id)}
                                                title={t('orderPage.deleteOrder')}
                                            >
                                                <FaTrashAlt /> {t('orderPage.delete')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="alert alert-info text-center" role="alert">
                            {t('orderPage.noOrders')}
                        </div>
                    )}
                </>
            )}
        </div>
    ); // Properly closed return statement
}; // Added missing closing brace here

export default OrderPage;
