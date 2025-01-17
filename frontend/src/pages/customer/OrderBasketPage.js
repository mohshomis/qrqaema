// src/pages/OrderBasketPage.js

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { placeOrder, getRestaurantPublicDetails } from '../../services/api';
import Footer from '../../components/Footer';
import PropTypes from 'prop-types';
import '../../styles/Footer.css';
import '../../styles/OrderBasketPage.css';
import '../../App.css';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Image,
  Spinner,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch restaurant details and set background
  useEffect(() => {
    const fetchRestaurantDetails = async () => {
      try {
        const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
        const restaurantData = restaurantResponse.data;
        setRestaurantBackground(restaurantData.background_image_url);
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

  // Group items by checking if options are the same
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

  // Calculate total price whenever the grouped basket changes
  useEffect(() => {
    const calculateTotalPrice = () => {
      let total = 0;
      groupedBasketItems.forEach((item) => {
        let itemTotal = parseFloat(item.price);

        // Add price based on selected options
        if (item.selectedOptions) {
          Object.values(item.selectedOptions).forEach((option) => {
            if (option.price_modifier) {
              itemTotal += parseFloat(option.price_modifier);
            }
          });
        }

        // Multiply by the quantity
        itemTotal *= item.quantity;

        total += itemTotal;
      });
      setTotalPrice(total);
    };

    calculateTotalPrice();
  }, [groupedBasketItems]);

  // Handle quantity changes
  const handleQuantityChange = (item, quantity) => {
    if (quantity > 0) {
      updateBasketItem(item, quantity);
    }
  };

  // Handle option changes
  const handleOptionChange = (item, optionName, choice) => {
    const updatedItem = {
      ...item,
      selectedOptions: {
        ...item.selectedOptions,
        [optionName]: choice,
      },
    };
    updateBasketItem(updatedItem, item.quantity);
  };

  const handlePlaceOrder = async () => {
    try {
      // Ensure restaurantId and tableNumber are valid
      if (!restaurantId || !tableNumber) {
        alert(t('orderBasketPage.errors.invalidRestaurantOrTable'));
        return;
      }

      // Construct the order payload
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

      // Logging Statements
      console.log('Placing Order with Payload:', JSON.stringify(orderPayload, null, 2));
      basketItems.forEach((item, index) => {
        console.log(`Basket Item ${index + 1}:`, JSON.stringify(item, null, 2));
      });

      // Call the API to place the order
      const response = await placeOrder(orderPayload);
      console.log(orderPayload);

      // Log the API response for debugging
      console.log('API Response:', response);

      if (response.status === 201) {
        // Status 201 means order successfully created
        alert(t('orderBasketPage.success.orderPlaced'));

        // Empty the basket
        setBasketItems([]);
        localStorage.removeItem('basket');

        // Navigate to the order-success page with restaurantId and tableNumber
        navigate(`/restaurant/${restaurantId}/order-success/${tableNumber}`);
      } else {
        alert(t('orderBasketPage.errors.orderFailed'));
      }
    } catch (error) {
      console.error(t('orderBasketPage.errors.placeOrderError'), error);
      if (error.response) {
        console.error('Error Response Data:', error.response.data);
      }
      alert(t('orderBasketPage.errors.placeOrderError'));
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">{t('orderBasketPage.loading')}</span>
        </Spinner>
        <p className="mt-3">{t('orderBasketPage.loading')}</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="d-flex align-items-center">
          <FaTimesCircle className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <div
      className="order-basket-page"
      dir={i18n.dir()}
      style={{ position: 'relative', paddingBottom: '100px' }}
    >
      {/* Background image for restaurant */}
      {restaurantBackground && (
        <div
          className="background-image"
          style={{
            backgroundImage: `url(${restaurantBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            filter: 'blur(4px)',
            zIndex: -1,
          }}
          aria-label={t('orderBasketPage.aria.backgroundImage')}
        />
      )}

      {/* Content Container */}
      <Container className="my-5">
        <Row className="justify-content-center">
          <Col lg={10} md={12}>
            <Card className="bg-light shadow-lg p-4 rounded">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="d-flex align-items-center">
                  <FaShoppingCart className="me-2 text-primary" />
                  {t('orderBasketPage.title')}
                </h2>
                <Badge bg="success">
                  {t('orderBasketPage.table')}: {tableNumber}
                </Badge>
              </div>

              {groupedBasketItems.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <FaInfoCircle className="me-2" />
                  {t('orderBasketPage.emptyBasket')}
                </Alert>
              ) : (
                <>
                  <ListGroup variant="flush" className="mb-4">
                    {groupedBasketItems.map((item, index) => (
                      <ListGroup.Item key={index} className="mb-3">
                        <Row className="align-items-center">
                          {/* Item Image */}
                          <Col md={3} className="text-center mb-3 mb-md-0">
                            <Image
                              src={item.image}
                              alt={item.name}
                              rounded
                              fluid
                              style={{ maxHeight: '100px', objectFit: 'cover' }}
                              loading="lazy"
                            />
                          </Col>

                          {/* Item Details */}
                          <Col md={6}>
                            <h5>
                              <FaCheckCircle className="me-2 text-success" />
                              {item.name}
                            </h5>
                            <p className="mb-1">
                              <FaDollarSign className="me-2 text-warning" />
                              {t('orderBasketPage.basePrice')}:{' '}
                              ${parseFloat(item.price).toFixed(2)}
                            </p>
                            <p className="mb-1">
                              <FaReceipt className="me-2 text-info" />
                              {t('orderBasketPage.quantity')}: {item.quantity}
                            </p>
                            {/* Display Selected Options */}
                            {item.selectedOptions && (
                              <div className="mb-1">
                                <strong>{t('orderBasketPage.selectedOptions')}:</strong>
                                {Object.keys(item.selectedOptions).map((optionName) => (
                                  <div key={optionName}>
                                    {optionName}: {item.selectedOptions[optionName].name}
                                    {item.selectedOptions[optionName].price_modifier
                                      ? ` (+${item.selectedOptions[optionName].price_modifier} ${t(
                                          'orderBasketPage.currency'
                                        )})`
                                      : ''}
                                  </div>
                                ))}
                              </div>
                            )}
                          </Col>

                          {/* Item Actions */}
                          <Col md={3} className="text-center">
                            <InputGroup className="justify-content-center mb-2">
                              <Button
                                variant="outline-primary"
                                onClick={() =>
                                  handleQuantityChange(item, item.quantity - 1)
                                }
                                disabled={item.quantity <= 1}
                                aria-label={t('orderBasketPage.decreaseQuantity')}
                              >
                                <FaMinusCircle />
                              </Button>
                              <Form.Control
                                type="text"
                                readOnly
                                value={item.quantity}
                                className="text-center"
                                style={{ maxWidth: '50px' }}
                                aria-label={t('orderBasketPage.quantity')}
                              />
                              <Button
                                variant="outline-primary"
                                onClick={() =>
                                  handleQuantityChange(item, item.quantity + 1)
                                }
                                aria-label={t('orderBasketPage.increaseQuantity')}
                              >
                                <FaPlusCircle />
                              </Button>
                            </InputGroup>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => removeBasketItem(item)}
                              aria-label={t('orderBasketPage.removeItem')}
                            >
                              <FaTimesCircle /> {t('orderBasketPage.remove')}
                            </Button>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>

                  {/* Total Price */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4>
                      <FaDollarSign className="me-2 text-success" />
                      {t('orderBasketPage.totalPrice')}:
                    </h4>
                    <h3>${totalPrice.toFixed(2)}</h3>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex justify-content-between">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(-1)}
                      className="d-flex align-items-center"
                    >
                      <FaArrowLeft className="me-2" />
                      {t('orderBasketPage.goBack')}
                    </Button>
                    <Button
                      variant="success"
                      onClick={handlePlaceOrder}
                      className="d-flex align-items-center"
                    >
                      <FaReceipt className="me-2" />
                      {t('orderBasketPage.placeOrder')}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
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
      options: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
          choices: PropTypes.arrayOf(
            PropTypes.shape({
              id: PropTypes.number.isRequired,
              name: PropTypes.string.isRequired,
              price_modifier: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            })
          ),
        })
      ),
      special_request: PropTypes.string,
    })
  ).isRequired,
  updateBasketItem: PropTypes.func.isRequired,
  removeBasketItem: PropTypes.func.isRequired,
  setBasketItems: PropTypes.func.isRequired,
};

export default OrderBasketPage;
