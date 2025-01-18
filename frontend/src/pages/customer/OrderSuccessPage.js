// src/pages/OrderSuccessPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrderStatus, getRestaurantPublicDetails } from '../../services/api';
import Footer from '../../components/Footer';
import TicTacToe from '../../components/TicTacToe';
import StatusIcon from '../../components/StatusIcon';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Row,
  Col,
  Button,
  Alert,
  Card,
  ListGroup,
  Badge,
  ProgressBar
} from 'react-bootstrap';
import {
  FaRedo,
  FaInfoCircle,
  FaUtensils,
  FaReceipt,
  FaCheck,
  FaClock,
  FaGamepad,
  FaArrowLeft
} from 'react-icons/fa';

const OrderSuccessPage = () => {
  const { t, i18n } = useTranslation();
  const { restaurantId, tableNumber, menuId } = useParams();
  const navigate = useNavigate();
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('Initial');
  const [restaurantBackground, setRestaurantBackground] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const response = await getRestaurantPublicDetails(restaurantId);
        setRestaurantBackground(response.data.background_image_url);
        setRestaurantName(response.data.name);
      } catch (error) {
        console.error('Error fetching restaurant details:', error);
      }
    };
    fetchRestaurantDetails();
  }, [restaurantId]);

  const fetchOrderStatus = async () => {
    try {
      const response = await getOrderStatus(restaurantId, tableNumber);
      if (response && response.length > 0) {
        setOrderStatus(response[0]);
        setCurrentStatus(response[0].status);
        setProgress(getProgressPercentage(response[0].status));
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

  const getProgressPercentage = (status) => {
    const stages = {
      'Initial': 0,
      'Received': 25,
      'Preparing': 50,
      'Ready': 75,
      'Delivered': 100
    };
    return stages[status] || 0;
  };

  useEffect(() => {
    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 10000);
    return () => clearInterval(interval);
  }, [restaurantId, tableNumber, t]);

  const handleOrderAgain = () => {
    const baseUrl = `/restaurant/${restaurantId}`;
    const path = menuId 
      ? `${baseUrl}/menu/${menuId}/table/${tableNumber}`
      : `${baseUrl}/table/${tableNumber}`;
    navigate(path);
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <div className="custom-spinner" />
        <p className="mt-3">{t('orderSuccessPage.loading')}</p>
      </Container>
    );
  }

  return (
    <div className="page-container" dir={i18n.dir()}>
      <div className="background-overlay"></div>
      {restaurantBackground && (
        <div
          className="background-image"
          style={{
            backgroundImage: `url(${restaurantBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            width: '100%',
            height: '100%',
            zIndex: -2,
          }}
        />
      )}

      <Container className="my-5">
        <Row className="justify-content-center">
          <Col lg={10} md={12}>
            <Card className="custom-card fade-in">
              <Card.Header className="bg-transparent border-0 text-center">
                <h1 className="display-6 mb-3">
                  <FaUtensils className="me-2" />
                  {restaurantName}
                </h1>
                <Badge bg="primary" className="px-3 py-2">
                  {t('orderSuccessPage.table')}: {tableNumber}
                </Badge>
              </Card.Header>

              <Card.Body>
                {error ? (
                  <Alert variant="danger" className="text-center">
                    <FaInfoCircle className="me-2" />
                    {error}
                  </Alert>
                ) : (
                  <>
                    <div className="text-center mb-4">
                      <StatusIcon status={currentStatus} />
                      <div className="mt-3">
                        <ProgressBar 
                          now={progress} 
                          variant="success" 
                          className="mb-2"
                          style={{ height: '10px' }}
                        />
                        <small className="text-muted">
                          <FaClock className="me-1" />
                          {t('orderSuccessPage.statusMessage', { status: currentStatus })}
                        </small>
                      </div>
                    </div>

                    {orderStatus && orderStatus.items && (
                      <Card className="custom-card mb-4">
                        <Card.Header className="bg-transparent">
                          <h5 className="mb-0">
                            <FaReceipt className="me-2" />
                            {t('orderSuccessPage.orderSummary')}
                          </h5>
                        </Card.Header>
                        <ListGroup variant="flush">
                          {orderStatus.items.map((item, index) => (
                            <ListGroup.Item key={index} className="bg-transparent">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                  <h6 className="mb-1">
                                    <FaCheck className="me-2 text-success" />
                                    {item.quantity}x {item.menu_item}
                                  </h6>
                                  {item.selected_options && item.selected_options.length > 0 && (
                                    <div className="small text-muted">
                                      {item.selected_options.map((option, idx) => (
                                        <Badge 
                                          key={idx} 
                                          bg="secondary" 
                                          className="me-2 mb-1"
                                        >
                                          {option.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <Badge bg="info">
                                  ${item.total_price}
                                </Badge>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </Card>
                    )}

                    <Card className="custom-card mb-4">
                      <Card.Header className="bg-transparent">
                        <h5 className="mb-0">
                          <FaGamepad className="me-2" />
                          {t('orderSuccessPage.whileYouWait')}
                        </h5>
                      </Card.Header>
                      <Card.Body>
                        <TicTacToe />
                      </Card.Body>
                    </Card>

                    <div className="d-flex flex-column flex-md-row gap-2">
                      <Button
                        variant="outline-light"
                        className="custom-button"
                        onClick={() => navigate(-1)}
                      >
                        <FaArrowLeft className="me-2" />
                        {t('orderSuccessPage.back')}
                      </Button>
                      <Button
                        variant="primary"
                        className="custom-button flex-grow-1"
                        onClick={handleOrderAgain}
                      >
                        <FaRedo className="me-2" />
                        {t('orderSuccessPage.orderAgain')}
                      </Button>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      <Footer />
    </div>
  );
};

export default OrderSuccessPage;
