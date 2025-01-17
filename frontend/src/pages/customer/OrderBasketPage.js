// src/pages/OrderBasketPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { placeOrder, getRestaurantPublicDetails } from '../../services/api';
import Footer from '../../components/Footer';
import PropTypes from 'prop-types';
import '../../styles/Footer.css';
import '../../styles/CustomerPages.css';
import '../../App.css';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Image,
  Alert,
  Badge,
  InputGroup,
  Form,
} from 'react-bootstrap';
import {
  FaShoppingCart,
  FaCheckCircle,
  FaTimesCircle,
  FaDollarSign,
  FaPlusCircle,
  FaMinusCircle,
  FaArrowLeft,
  FaInfoCircle,
  FaReceipt,
  FaUtensils,
  FaTrashAlt
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const OrderBasketPage = ({
  basketItems,
  updateBasketItem,
  removeBasketItem,
  setBasketItems,
}) => {
  const { t, i18n } = useTranslation();
  const { restaurantId, tableNumber } = useParams();
  const navigate = useNavigate();
  const [totalPrice, setTotalPrice] = useState(0);
  const [restaurantBackground, setRestaurantBackground] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
        const restaurantData = restaurantResponse.data;
        setRestaurantBackground(restaurantData.background_image_url);
        setRestaurantName(restaurantData.name);
      } catch (error) {
        console.error(t('orderBasketPage.errors.fetchRestaurantDetails'), error);
        setError(t('orderBasketPage.errors.fetchRestaurantDetails'));
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) {
      fetchRestaurantDetails();
    }
  }, [restaurantId, t]);

  const groupedBasketItems = basketItems.reduce((acc, item) => {
    const existingItem = acc.find((groupedItem) => {
      return (
        groupedItem.id === item.id &&
        JSON.stringify(groupedItem.selectedOptions) ===
          JSON.stringify(item.selectedOptions)
      );
    });

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }

    return acc;
  }, []);

  useEffect(() => {
    const calculateTotalPrice = () => {
      const total = groupedBasketItems.reduce((sum, item) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);
      setTotalPrice(total);
    };

    calculateTotalPrice();
  }, [groupedBasketItems]);

  const handleQuantityChange = (item, quantity) => {
    if (quantity > 0) {
      updateBasketItem(item, quantity);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      if (!restaurantId || !tableNumber) {
        alert(t('orderBasketPage.errors.invalidRestaurantOrTable'));
        return;
      }

      const orderPayload = {
        restaurant: parseInt(restaurantId, 10),
        table_number: parseInt(tableNumber, 10),
        items: basketItems.map((item) => ({
          menu_item: item.id,
          quantity: item.quantity,
          selected_options: item.selectedOptions
            ? Object.values(item.selectedOptions).map((option) => option.id)
            : [],
          special_request: item.special_request || '',
        })),
      };

      const response = await placeOrder(orderPayload);

      if (response.status === 201) {
        setBasketItems([]);
        localStorage.removeItem('basket');
        navigate(`/restaurant/${restaurantId}/order-success/${tableNumber}`);
      } else {
        alert(t('orderBasketPage.errors.orderFailed'));
      }
    } catch (error) {
      console.error(t('orderBasketPage.errors.placeOrderError'), error);
      alert(t('orderBasketPage.errors.placeOrderError'));
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <div className="custom-spinner" />
        <p className="mt-3">{t('orderBasketPage.loading')}</p>
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
          aria-label={t('orderBasketPage.aria.backgroundImage')}
        />
      )}

      <Container className="my-5">
        <Row className="justify-content-center">
          <Col lg={10} md={12}>
            <Card className="custom-card fade-in">
              <Card.Header className="bg-transparent border-0">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="d-flex align-items-center mb-0">
                    <FaShoppingCart className="me-2 text-primary" />
                    {t('orderBasketPage.title')}
                  </h2>
                  <div className="d-flex align-items-center">
                    <FaUtensils className="me-2 text-primary" />
                    <span className="me-2">{restaurantName}</span>
                    <Badge bg="success" pill>
                      {t('orderBasketPage.table')}: {tableNumber}
                    </Badge>
                  </div>
                </div>
              </Card.Header>

              <Card.Body>
                {groupedBasketItems.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    <FaInfoCircle className="me-2" />
                    {t('orderBasketPage.emptyBasket')}
                  </Alert>
                ) : (
                  <>
                    <ListGroup variant="flush">
                      {groupedBasketItems.map((item, index) => (
                        <ListGroup.Item key={index} className="custom-card mb-3 fade-in">
                          <Row className="align-items-center">
                            <Col xs={12} md={3} className="mb-3 mb-md-0">
                              <div className="position-relative">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  className="w-100 rounded"
                                  style={{ maxHeight: '100px', objectFit: 'cover' }}
                                  loading="lazy"
                                />
                                <Badge 
                                  bg="primary" 
                                  className="position-absolute top-0 end-0 m-2"
                                >
                                  ${parseFloat(item.price).toFixed(2)}
                                </Badge>
                              </div>
                            </Col>

                            <Col xs={12} md={6}>
                              <h5 className="mb-2">
                                <FaCheckCircle className="me-2 text-success" />
                                {item.name}
                              </h5>
                              {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                                <div className="small text-muted mb-2">
                                  {Object.entries(item.selectedOptions).map(([optionName, choice], idx) => (
                                    <Badge 
                                      key={idx} 
                                      bg="secondary" 
                                      className="me-2 mb-1"
                                    >
                                      {optionName}: {choice.name}
                                      {choice.price_modifier > 0 && ` (+$${choice.price_modifier})`}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </Col>

                            <Col xs={12} md={3}>
                              <div className="d-flex flex-column align-items-center">
                                <InputGroup size="sm" className="mb-2 w-75">
                                  <Button
                                    variant="outline-primary"
                                    onClick={() => handleQuantityChange(item, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="custom-button"
                                  >
                                    <FaMinusCircle />
                                  </Button>
                                  <Form.Control
                                    type="text"
                                    readOnly
                                    value={item.quantity}
                                    className="text-center border-0 bg-transparent text-light"
                                  />
                                  <Button
                                    variant="outline-primary"
                                    onClick={() => handleQuantityChange(item, item.quantity + 1)}
                                    className="custom-button"
                                  >
                                    <FaPlusCircle />
                                  </Button>
                                </InputGroup>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => removeBasketItem(item)}
                                  className="custom-button w-75"
                                >
                                  <FaTrashAlt className="me-2" />
                                  {t('orderBasketPage.remove')}
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>

                    <div className="mt-4 p-3 custom-card">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="mb-0">
                          <FaDollarSign className="me-2 text-success" />
                          {t('orderBasketPage.totalPrice')}
                        </h4>
                        <h3 className="mb-0">${totalPrice.toFixed(2)}</h3>
                      </div>

                      <div className="d-flex flex-column flex-md-row gap-2 mt-4">
                        <Button
                          variant="outline-light"
                          onClick={() => navigate(-1)}
                          className="custom-button"
                        >
                          <FaArrowLeft className="me-2" />
                          {t('orderBasketPage.goBack')}
                        </Button>
                        <Button
                          variant="success"
                          onClick={handlePlaceOrder}
                          className="custom-button flex-grow-1"
                        >
                          <FaReceipt className="me-2" />
                          {t('orderBasketPage.placeOrder')}
                        </Button>
                      </div>
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

OrderBasketPage.propTypes = {
  basketItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      selectedOptions: PropTypes.object,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      image: PropTypes.string,
    })
  ).isRequired,
  updateBasketItem: PropTypes.func.isRequired,
  removeBasketItem: PropTypes.func.isRequired,
  setBasketItems: PropTypes.func.isRequired,
};

export default OrderBasketPage;
