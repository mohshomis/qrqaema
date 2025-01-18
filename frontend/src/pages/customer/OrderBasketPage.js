// src/pages/OrderBasketPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { placeOrder, getRestaurantPublicDetails } from '../../services/api';
import Footer from '../../components/Footer';
import PropTypes from 'prop-types';
import '../../styles/Footer.css';
import '../../styles/CustomerPages.css';
import '../../styles/OrderBasketPage.css';
import '../../App.css';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Image,
  Alert,
  Badge,
} from 'react-bootstrap';
import {
  FaShoppingCart,
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
  const { restaurantId, tableNumber, menuId } = useParams();
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
        menu: menuId,
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
        const baseUrl = `/restaurant/${restaurantId}`;
        const path = menuId 
          ? `${baseUrl}/menu/${menuId}/order-success/${tableNumber}`
          : `${baseUrl}/order-success/${tableNumber}`;
        navigate(path);
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

      <Container fluid className="py-4 px-md-5">
        <Row>
          {/* Restaurant Info Header */}
          <Col xs={12} className="mb-4">
            <Card className="bg-white border-0 shadow-lg">
              <Card.Body className="d-flex justify-content-between align-items-center py-3">
                <div className="d-flex align-items-center">
                  <FaUtensils className="me-3 fs-3 text-primary" />
                  <div>
                    <h4 className="mb-0">{restaurantName}</h4>
                    <Badge bg="primary" pill className="mt-1">
                      {t('orderBasketPage.table')}: {tableNumber}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => navigate(-1)}
                  className="rounded-pill px-3"
                >
                  <FaArrowLeft className="me-2" />
                  {t('orderBasketPage.goBack')}
                </Button>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content */}
          <Col lg={8} className="mb-4 mb-lg-0">
            <h4 className="mb-4 text-white d-flex align-items-center">
              <FaShoppingCart className="me-2 text-primary" />
              {t('orderBasketPage.title')}
            </h4>

            {groupedBasketItems.length === 0 ? (
              <Card className="shadow border-0">
                <Card.Body className="text-center py-5">
                  <FaInfoCircle className="text-muted mb-3" style={{ fontSize: '2rem' }} />
                  <h5 className="text-muted">{t('orderBasketPage.emptyBasket')}</h5>
                </Card.Body>
              </Card>
            ) : (
              <div className="basket-items-container bg-white rounded-3 shadow">
                {groupedBasketItems.map((item, index) => (
                  <div key={index} className="basket-item-row fade-in">
                    <Row className="align-items-center py-3 px-3">
                      {/* Item Image */}
                      <Col xs={3} sm={2}>
                        <div className="basket-item-image">
                          <Image
                            src={item.image}
                            alt={item.name}
                            className="rounded-3"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            loading="lazy"
                          />
                        </div>
                      </Col>

                      {/* Item Details */}
                      <Col xs={9} sm={5}>
                        <h6 className="mb-1 fw-bold">{item.name}</h6>
                        {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                          <div className="mb-1">
                            {Object.entries(item.selectedOptions).map(([optionName, choice], idx) => (
                              <Badge 
                                key={idx} 
                                bg="light"
                                text="dark"
                                className="me-1 mb-1"
                                style={{ fontSize: '0.7rem' }}
                              >
                                {optionName}: {choice.name}
                                {choice.price_modifier > 0 && (
                                  <span className="text-primary ms-1">
                                    +${choice.price_modifier.toFixed(2)}
                                  </span>
                                )}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="text-primary fw-bold">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </div>
                      </Col>

                      {/* Quantity Controls */}
                      <Col xs={12} sm={3} className="mt-2 mt-sm-0">
                        <div className="d-flex align-items-center justify-content-start justify-content-sm-center">
                          <div className="quantity-control bg-light rounded-pill p-1">
                            <Button
                              variant="link"
                              className="text-dark p-0"
                              onClick={() => handleQuantityChange(item, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <FaMinusCircle />
                            </Button>
                            <span className="mx-3 fw-bold">{item.quantity}</span>
                            <Button
                              variant="link"
                              className="text-dark p-0"
                              onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            >
                              <FaPlusCircle />
                            </Button>
                          </div>
                        </div>
                      </Col>

                      {/* Remove Button */}
                      <Col xs={12} sm={2} className="mt-2 mt-sm-0">
                        <Button
                          variant="link"
                          className="text-danger p-0"
                          onClick={() => removeBasketItem(item)}
                        >
                          <FaTrashAlt />
                        </Button>
                      </Col>
                    </Row>
                    {index < groupedBasketItems.length - 1 && <hr className="my-0" />}
                  </div>
                ))}
              </div>
            )}
          </Col>

          {/* Order Summary */}
          <Col lg={4}>
            <div className="position-sticky" style={{ top: '2rem' }}>
              <Card className="shadow border-0">
                <Card.Body>
                  <h5 className="mb-4">{t('orderBasketPage.orderSummary')}</h5>
                  
                  <div className="d-flex justify-content-between mb-3">
                    <span className="text-muted">{t('orderBasketPage.subtotal')}</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div className="d-flex justify-content-between mb-4">
                    <h5 className="mb-0">{t('orderBasketPage.total')}</h5>
                    <h5 className="mb-0 text-primary">${totalPrice.toFixed(2)}</h5>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-100 rounded-pill"
                    onClick={handlePlaceOrder}
                    disabled={groupedBasketItems.length === 0}
                  >
                    <FaReceipt className="me-2" />
                    {t('orderBasketPage.placeOrder')}
                  </Button>
                </Card.Body>
              </Card>
            </div>
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
      menu: PropTypes.string, // Menu ID
    })
  ).isRequired,
  updateBasketItem: PropTypes.func.isRequired,
  removeBasketItem: PropTypes.func.isRequired,
  setBasketItems: PropTypes.func.isRequired,
};

export default OrderBasketPage;
