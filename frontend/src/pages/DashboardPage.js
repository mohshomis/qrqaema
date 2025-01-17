// src/pages/DashboardPage.js

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode'; // Corrected import
import { 
    getQrCodes, 
    addTable, 
    removeTable, 
    getOrders, 
    fetchHelpRequests, 
    acceptHelpRequest, 
    declineHelpRequest, 
    deleteHelpRequest 
} from '../services/api';
import RestaurantManagementHeader from '../components/RestaurantManagementHeader';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import 'bootstrap-icons/font/bootstrap-icons.css';
import './DashboardPage.css'; 
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form } from 'react-bootstrap';
import Joyride, { STATUS } from 'react-joyride'; // Imported Joyride

const BASE_URL = '';

const DashboardPage = () => {
    const { t } = useTranslation();
    const [userRole, setUserRole] = useState('');
    const [restaurantId, setRestaurantId] = useState(null);
    const [qrCodes, setQrCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalTables, setTotalTables] = useState(0);
    const [orders, setOrders] = useState([]);
    const [helpRequests, setHelpRequests] = useState([]);
    const [error, setError] = useState(null);
    const [restaurantName, setRestaurantName] = useState(''); 
    const [username, setUsername] = useState('');
    const [showHelpDetailsModal, setShowHelpDetailsModal] = useState(false);
    const [selectedHelpRequest, setSelectedHelpRequest] = useState(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [currentAction, setCurrentAction] = useState(null); // 'accept' or 'decline'
    const [currentHelpRequestId, setCurrentHelpRequestId] = useState(null);
    const [responseText, setResponseText] = useState('');

    // Tour state
    const [runTour, setRunTour] = useState(false);

    const navigate = useNavigate();
    const { restaurantId: routeRestaurantId } = useParams(); // Assuming restaurantId is part of the route

    // Define tour steps
    const steps = [
        {
            target: '[data-tour="header"]',
            content: t('tour.header'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="header-logout"]',
            content: t('tour.headerLogout'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="header-manage-employees"]',
            content: t('tour.headerManageEmployees'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="header-manage-menu"]',
            content: t('tour.headerManageMenu'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="header-manage-categories"]',
            content: t('tour.headerManageCategories'),
            placement: 'right',
        },
        {
            target: '[data-tour="header-manage-menu-items"]',
            content: t('tour.headerManageMenuItems'),
            placement: 'right',
        },
        {
            target: '[data-tour="header-profile"]',
            content: t('tour.headerProfile'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="header-language-selector"]',
            content: t('tour.headerLanguageSelector'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="header-brand"]',
            content: t('tour.headerBrand'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="header-view-menu"]', // New step
            content: t('tour.headerViewMenu'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="completed-orders-card"]',
            content: t('tour.completedOrdersCard'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="in-progress-orders-card"]',
            content: t('tour.inProgressOrdersCard'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="pending-orders-card"]',
            content: t('tour.pendingOrdersCard'),
            placement: 'bottom',
        },
        {
            target: '[data-tour="help-request-section"]',
            content: t('tour.helpRequestSection'),
            placement: 'right',
        },
        {
            target: '[data-tour="help-request-item"]',
            content: t('tour.helpRequestItem'),
            placement: 'right',
        },
        {
            target: '[data-tour="add-table-button"]',
            content: t('tour.addTableButton'),
            placement: 'top',
        },
        {
            target: '[data-tour="table-card"]',
            content: t('tour.tableCard'),
            placement: 'top',
        },
        {
            target: '[data-tour="recent-orders-table"]',
            content: t('tour.recentOrdersTable'),
            placement: 'top',
        },
    ];

    // Handle Joyride callbacks
    const handleJoyrideCallback = (data) => {
        const { status } = data;
        const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status)) {
            setRunTour(false);
            localStorage.setItem('hasSeenTour', true);
        }
    };

    // Check if the user has already completed the tour
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
            setRunTour(true);
        }
    }, []);

    // Helper function to determine badge color based on status
    const getBadgeColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'danger';
            case 'Accepted':
                return 'primary';
            case 'Resolved':
                return 'success';
            case 'Declined':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    // Decode the token and set the user state
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                const { restaurant_id, is_owner, is_staff, username, restaurant_name } = decodedToken;

                setUsername(username);
                setRestaurantName(restaurant_name);
                setRestaurantId(restaurant_id || routeRestaurantId); // Use routeRestaurantId if available

                if (is_owner) setUserRole('owner');
                else if (is_staff) setUserRole('staff');
                else navigate('/login');

            } catch (error) {
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate, routeRestaurantId]);

    // Define fetch functions using useCallback to include them as dependencies
    const fetchQrCodesCallback = useCallback(async (restaurantId) => {
        try {
            setLoading(true);
            const response = await getQrCodes(restaurantId);
            console.log(response);
            setQrCodes(response.data.qr_codes);
            setTotalTables(response.data.total_tables);
            setLoading(false);
        } catch (error) {
            setError(t('errors.loadDataFailed'));
            setLoading(false);
        }
    }, [t]);

    const fetchOrdersCallback = useCallback(async (restaurantId) => {
        try {
            const response = await getOrders(restaurantId);
            setOrders(response.data || []);
        } catch (error) {
            console.error(t('errors.fetchOrdersError'), error);
        }
    }, [t]);

    const loadHelpRequestsCallback = useCallback(async (restaurantId) => {
        try {
            const response = await fetchHelpRequests(restaurantId);
            setHelpRequests(response.data || []);
        } catch (error) {
            console.error(t('errors.fetchHelpRequestsError'), error);
        }
    }, [t]);

    // Fetch QR Codes, Orders, and Help Requests when restaurantId is available
    useEffect(() => {
        if (restaurantId) {
            fetchQrCodesCallback(restaurantId);
            fetchOrdersCallback(restaurantId);
            loadHelpRequestsCallback(restaurantId);
        }
    }, [restaurantId, fetchQrCodesCallback, fetchOrdersCallback, loadHelpRequestsCallback]);

    // Get the number of orders in each status
    const getOrderCountByStatus = (status) => {
        return orders.filter(order => order.status === status).length;
    };

    // Check if the table has a new pending order
    const isTableBouncing = (tableNumber) => {
        return orders.some(order => order.table_number === tableNumber && order.status === 'Pending');
    };

    // Get the color for the table's status
    const getTableStatusColor = (tableNumber) => {
        const order = orders.find(order => order.table_number === tableNumber);
        switch (order?.status) {
            case 'Pending':
                return '#dc3545'; // Bootstrap 'danger' color
            case 'In Progress':
                return '#ffc107'; // Bootstrap 'warning' color
            case 'Completed':
                return '#28a745'; // Bootstrap 'success' color
            default:
                return '#6c757d'; // Bootstrap 'secondary' color
        }
    };

    // Handle adding a table
    const handleAddTable = async () => {
        try {
            await addTable(restaurantId);
            fetchQrCodesCallback(restaurantId);
        } catch (error) {
            console.error(t('errors.addTableError'), error);
        }
    };

    // Handle removing a table
    const handleRemoveTable = async () => {
        try {
            await removeTable(restaurantId);
            fetchQrCodesCallback(restaurantId);
        } catch (error) {
            console.error(t('errors.removeTableError'), error);
        }
    };

    // Handle deleting a help request
    const handleDeleteHelpRequest = async (helpRequestId) => {
        if (window.confirm(t('helpRequest.deleteConfirmation'))) {
            try {
                await deleteHelpRequest(helpRequestId);
                alert(t('helpRequest.deleted'));
                loadHelpRequestsCallback(restaurantId);
            } catch (error) {
                console.error(t('errors.deleteHelpRequestError'), error);
                alert(`${t('errors.deleteHelpRequestError')}: ${error}`);
            }
        }
    };

    // New handler to respond to help requests (Accept or Decline)
    const handleRespondHelpRequest = (helpRequest, action) => {
        setSelectedHelpRequest(helpRequest);
        setCurrentHelpRequestId(helpRequest.id);
        setCurrentAction(action); // 'accept' or 'decline'
        setResponseText(''); // Clear previous response
        setShowResponseModal(true);
    };

    // Handle submitting the response
    const handleSubmitResponse = async () => {
        if (!responseText.trim()) {
            alert(t('helpRequest.enterResponseValidation'));
            return;
        }

        try {
            if (currentAction === 'accept') {
                await acceptHelpRequest(currentHelpRequestId, responseText);
                alert(t('helpRequest.accepted'));
            } else if (currentAction === 'decline') {
                await declineHelpRequest(currentHelpRequestId, responseText);
                alert(t('helpRequest.declined'));
            }
            setShowResponseModal(false);
            setResponseText('');
            loadHelpRequestsCallback(restaurantId);
        } catch (error) {
            console.error(`Error during ${currentAction}ing help request:`, error);
            alert(`${t('errors.respondHelpRequestError')}: ${error}`);
        }
    };

    // Memoized filtered help requests (exclude accepted and older than 2 hours)
    const filteredHelpRequests = useMemo(() => {
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); // Current time minus 2 hours
        return helpRequests.filter(request => {
            if (request.status === 'Accepted') {
                const createdAt = new Date(request.created_at);
                return createdAt >= twoHoursAgo; // Include only if created within the last 2 hours
            }
            return true; // Include all other requests
        });
    }, [helpRequests]);

    // Render loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('loading')}</span>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="alert alert-danger text-center" role="alert">
                {error}
            </div>
        );
    }

    // Function to handle opening help request details
    const handleOpenHelpDetails = (helpRequest) => {
        setSelectedHelpRequest(helpRequest);
        setCurrentHelpRequestId(helpRequest.id);
        setShowHelpDetailsModal(true);
    };

    // Function to handle closing help request details
    const handleCloseHelpDetails = () => {
        setSelectedHelpRequest(null);
        setShowHelpDetailsModal(false);
    };

    return (
        <div className="dashboard-page">
            {/* React Joyride */}
            <Joyride
                steps={steps}
                continuous={true}
                showSkipButton={true}
                showProgress={true}
                run={runTour}
                callback={handleJoyrideCallback}
                styles={{
                    options: {
                        zIndex: 10000,
                    },
                }}
            />

            {/* Restaurant management header */}
            <RestaurantManagementHeader />

            <div className="container mt-5" dir="rtl">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="mb-0"><i className="bi bi-shop-window"></i> {restaurantName}</h1>
                </div>

                {/* Order statistics */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div 
                            className="card text-white bg-success mb-3 shadow-sm cursor-pointer" 
                            onClick={() => navigate(`/orders/${restaurantId}?status=Completed`)}
                            data-tour="completed-orders-card" // Added data-tour attribute
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-check-circle-fill fs-3 me-3"></i>
                                    <div>
                                        <h5 className="card-title">{t('orders.completed')}</h5>
                                        <p className="card-text display-6">{getOrderCountByStatus('Completed')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className="card text-white bg-warning mb-3 shadow-sm cursor-pointer" 
                            onClick={() => navigate(`/orders/${restaurantId}?status=In Progress`)}
                            data-tour="in-progress-orders-card" // Added data-tour attribute
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-hourglass-split fs-3 me-3"></i>
                                    <div>
                                        <h5 className="card-title">{t('orders.inProgress')}</h5>
                                        <p className="card-text display-6">{getOrderCountByStatus('In Progress')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div 
                            className="card text-white bg-danger mb-3 shadow-sm cursor-pointer" 
                            onClick={() => navigate(`/orders/${restaurantId}?status=Pending`)}
                            data-tour="pending-orders-card" // Added data-tour attribute
                        >
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    <i className="bi bi-exclamation-triangle-fill fs-3 me-3"></i>
                                    <div>
                                        <h5 className="card-title">{t('orders.pending')}</h5>
                                        <p className="card-text display-6">{getOrderCountByStatus('Pending')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Help Requests Section */}
                <div className="mb-5">
                    <h2 data-tour="help-request-section"><i className="bi bi-question-circle fs-4 me-2"></i> {t('helpRequests')}</h2>
                    {filteredHelpRequests.length > 0 ? (
                        <div className="list-group mt-3">
                            {filteredHelpRequests.map((request) => (
                                <div key={request.id} className="list-group-item" data-tour="help-request-item">
                                    <div className="d-flex w-100 justify-content-between align-items-center">
                                        <div 
                                            onClick={() => handleOpenHelpDetails(request)} 
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <strong>{t('tableNumber')}: {request.table_number}</strong>
                                            <p className="mb-1">
                                                {request.description 
                                                    ? (request.description.length > 50 
                                                        ? `${request.description.substring(0, 50)}...` 
                                                        : request.description)
                                                    : t('noDescription')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className={`badge bg-${getBadgeColor(request.status)}`}>
                                                {t(`statuses.${request.status.toLowerCase()}`)}
                                            </span>
                                            {(userRole === 'owner' || userRole === 'staff') && request.status === 'Pending' ? (
                                                <div className="mt-2 d-flex gap-2">
                                                    <Button 
                                                        variant="success" 
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent triggering parent onClick
                                                            handleRespondHelpRequest(request, 'accept');
                                                        }}
                                                    >
                                                        {t('accept')}
                                                    </Button>
                                                    <Button 
                                                        variant="danger" 
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent triggering parent onClick
                                                            handleRespondHelpRequest(request, 'decline');
                                                        }}
                                                    >
                                                        {t('decline')}
                                                    </Button>
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent triggering parent onClick
                                                            handleDeleteHelpRequest(request.id);
                                                        }}
                                                    >
                                                        {t('delete')}
                                                    </Button>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="alert alert-info text-center mt-3" role="alert">
                            {t('helpRequest.noHelpRequests')}
                        </div>
                    )}
                </div>

                {/* Table management */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0" data-tour="tables-section"><i className="bi bi-table fs-4 me-2"></i> {t('tables')}</h2>
                    {userRole === 'owner' && (
                        <div className="d-flex gap-2">
                            <button className="btn btn-primary flex-fill" onClick={handleAddTable} data-tour="add-table-button">
                                <i className="bi bi-plus-circle me-1"></i> {t('addTable')}
                            </button>
                            <button className="btn btn-danger flex-fill" onClick={handleRemoveTable} data-tour="remove-table-button">
                                <i className="bi bi-dash-circle me-1"></i> {t('removeTable')}
                            </button>
                        </div>
                    )}
                </div>

                {/* Render tables */}
                <div className="row">
                    {totalTables > 0 ? (
                        [...Array(totalTables)].map((_, index) => {
                            const tableNumber = index + 1;
                            const order = orders.find(order => order.table_number === tableNumber);
                            const statusColor = getTableStatusColor(tableNumber);
                            const hasPendingOrder = isTableBouncing(tableNumber);
                            const hasHelpRequest = helpRequests.some(hr => hr.table_number === tableNumber && hr.status === 'Pending');

                            return (
                                <div 
                                    className={`col-md-3 mb-4 ${hasPendingOrder ? 'bouncing' : ''}`} 
                                    key={index}
                                    onClick={() => (order || hasHelpRequest) && navigate(`/orders/${restaurantId}`)} 
                                    style={{ cursor: (order || hasHelpRequest) ? 'pointer' : 'default' }}
                                    data-tour="table-card"
                                >
                                    <div className="card h-100 shadow-sm position-relative">
                                        {/* Status color circle */}
                                        <div
                                            className="status-circle position-absolute"
                                            style={{ backgroundColor: statusColor }}
                                            title={`${t('tableStatus')}: ${t(`statuses.${order?.status.toLowerCase()}`) || t('statuses.empty')}`}
                                        ></div>

                                        {/* Help Request Indicator */}
                                        {hasHelpRequest && (
                                            <div 
                                                className="help-request-indicator position-absolute"
                                                title={t('helpRequest.indicatorTitle')}
                                            >
                                                <i className="bi bi-question-circle-fill text-warning"></i>
                                            </div>
                                        )}

                                        <div className="card-body text-center">
                                            <h5 className="card-title mb-4">{t('table')} {tableNumber}</h5>
                                            {qrCodes[index] && (
                                                <>
                                                    <img
                                                        src={`${BASE_URL}${qrCodes[index]}`}
                                                        alt={`${t('qrCodeFor')} ${t('table')} ${tableNumber}`}
                                                        className="img-fluid mb-3 rounded"
                                                        style={{ maxHeight: '150px' }}
                                                    />
                                                    <a
                                                        href={`${BASE_URL}${qrCodes[index]}`}
                                                        className="btn btn-outline-dark btn-sm"
                                                        download
                                                    >
                                                        <i className="bi bi-download me-2"></i> {t('downloadQr')}
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-12">
                            <div className="alert alert-info text-center" role="alert">
                                {t('noTablesAvailable')}
                            </div>
                        </div>
                    )}
                </div>

                {/* Optional: Additional Features like Recent Orders */}
                <div className="mt-5">
                    <h2 data-tour="recent-orders-table"><i className="bi bi-clock-history fs-4 me-2"></i> {t('recentOrders')}</h2>
                    {orders.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped table-hover mt-3">
                                <thead className="table-dark">
                                    <tr>
                                        <th scope="col">#</th>
                                        <th scope="col">{t('tableNumber')}</th>
                                        <th scope="col">{t('customerName')}</th>
                                        <th scope="col">{t('status')}</th>
                                        <th scope="col">{t('time')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.slice(0, 5).map((order, idx) => (
                                        <tr 
                                            key={order.id} 
                                            onClick={() => navigate(`/orders/${restaurantId}/${order.id}`)} 
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <th scope="row">{idx + 1}</th>
                                            <td>{order.table_number}</td>
                                            <td>{order.customer_name}</td>
                                            <td>
                                                <span className={`badge bg-${getBadgeColor(order.status)}`}>
                                                    {t(`statuses.${order.status.toLowerCase()}`)}
                                                </span>
                                            </td>
                                            <td>{new Date(order.created_at).toLocaleTimeString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="alert alert-warning text-center" role="alert">
                            {t('noOrdersCurrently')}
                        </div>
                    )}
                </div>
            </div>

            {/* Help Request Details Modal */}
            <Modal show={showHelpDetailsModal} onHide={handleCloseHelpDetails} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t('helpRequest.details')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedHelpRequest && (
                        <>
                            <p><strong>{t('tableNumber')}:</strong> {selectedHelpRequest.table_number}</p>
                            <p><strong>{t('username')}:</strong> {selectedHelpRequest.user || t('anonymous')}</p>
                            <p><strong>{t('description')}:</strong> {selectedHelpRequest.description || t('noDescription')}</p>
                            <p><strong>{t('status')}:</strong> {t(`statuses.${selectedHelpRequest.status.toLowerCase()}`)}</p>
                            {selectedHelpRequest.response && (
                                <p><strong>{t('helpRequest.response')}:</strong> {selectedHelpRequest.response}</p>
                            )}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseHelpDetails}>
                        {t('close')}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Response Modal */}
            <Modal show={showResponseModal} onHide={() => setShowResponseModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {currentAction === 'accept' ? t('helpRequest.respondToAccept') : t('helpRequest.respondToDecline')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="responseText">
                        <Form.Label>{t('helpRequest.yourResponse')}</Form.Label>
                        <Form.Control 
                            as="textarea" 
                            rows={3} 
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder={t('helpRequest.enterResponse')}
                            required
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowResponseModal(false)}>
                        {t('cancel')}
                    </Button>
                    <Button 
                        variant={currentAction === 'accept' ? 'success' : 'danger'} 
                        onClick={handleSubmitResponse}
                    >
                        {currentAction === 'accept' ? t('accept') : t('decline')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );

};

export default DashboardPage;
