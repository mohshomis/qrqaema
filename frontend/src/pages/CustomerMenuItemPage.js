// src/pages/CustomerMenuItemPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuItemDetails, getRestaurantPublicDetails } from '../services/api';
import Footer from '../components/Footer';
import PropTypes from 'prop-types';
import {
  Container,
  Row,
  Col,
  Image,
  Button,
  Card,
  Form,
  InputGroup,
  Spinner,
  Alert,
  Badge,
} from 'react-bootstrap';
import { 
  FaMinus, 
  FaPlus, 
  FaShoppingCart, 
  FaInfoCircle, 
  FaCheckCircle,
  FaUtensils,
  FaDollarSign,
  FaListAlt
} from 'react-icons/fa';
import '../styles/Footer.css';
import '../styles/CustomerMenuItemPage.css'; // Ensure this CSS handles RTL and other custom styles
import { useTranslation } from 'react-i18next'; // Import useTranslation

const CustomerMenuItemPage = ({ addToBasket, basketItems = [] }) => {
  const { t, i18n } = useTranslation(); // Initialize translation and i18n
  const { restaurantId, itemId } = useParams();
  const [menuItem, setMenuItem] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [error, setError] = useState(null);
  const [animateBasket, setAnimateBasket] = useState(false); // New state to handle animation
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        const menuItemResponse = await getMenuItemDetails(restaurantId, itemId);
        const item = menuItemResponse.data;
        setMenuItem(item);
        setCalculatedPrice(Number(item.price));

        const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
        setRestaurantName(restaurantResponse.data.name);
      } catch (err) {
        console.error('Error fetching menu item details:', err);
        setError(t('customerMenuItemPage.errors.fetchFailed'));
      }
    };
    fetchMenuItem();
  }, [restaurantId, itemId, t]);

  const calculatePrice = () => {
    let price = Number(menuItem.price);

    Object.keys(selectedOptions).forEach(optionId => {
      const selectedChoiceId = selectedOptions[optionId];
      const option = menuItem.options.find(opt => opt.id === Number(optionId));
      if (option) {
        const choice = option.choices.find(choice => choice.id === selectedChoiceId);
        if (choice) {
          price += Number(choice.price_modifier);
        }
      }
    });

    setCalculatedPrice(price * quantity);
  };

  useEffect(() => {
    if (menuItem) {
      calculatePrice();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions, quantity]);

  const handleOptionChange = (optionId, choiceId) => {
    setSelectedOptions(prevOptions => ({
      ...prevOptions,
      [optionId]: choiceId,
    }));
  };

  const handleAddToBasket = () => {
    if (quantity > 0) {
      const basketItem = {
        id: menuItem.id,
        name: menuItem.name,
        quantity,
        selectedOptions: {},
        price: calculatedPrice,
        image: menuItem.image_url,
      };

      // Populate selectedOptions with detailed info
      Object.keys(selectedOptions).forEach(optionId => {
        const selectedChoiceId = selectedOptions[optionId];
        const option = menuItem.options.find(opt => opt.id === Number(optionId));
        if (option) {
          const choice = option.choices.find(choice => choice.id === selectedChoiceId);
          if (choice) {
            basketItem.selectedOptions[option.name] = {
              id: choice.id,
              name: choice.name,
              price_modifier: choice.price_modifier,
            };
          }
        }
      });

      // Trigger animation when adding to basket
      setAnimateBasket(true);

      // After animation ends, add to basket and navigate
      setTimeout(() => {
        addToBasket(basketItem);
        navigate(`/restaurant/${restaurantId}/table/1`);
        setAnimateBasket(false); // Reset animation state
      }, 1000); // Wait for animation to finish
    } else {
      alert(t('customerMenuItemPage.alerts.minQuantity'));
    }
  };

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="d-flex align-items-center">
          <FaInfoCircle className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!menuItem) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">{t('customerMenuItemPage.loading')}</span>
        </Spinner>
        <p className="mt-3">{t('customerMenuItemPage.loading')}</p>
      </Container>
    );
  }

  return (
    <div className="customer-menu-item-page" dir={i18n.dir()} style={{ position: 'relative', paddingBottom: '100px' }}>
      {/* Background Image */}
      <div
        className="background-image"
        style={{
          backgroundImage: `url(${menuItem.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
        }}
        aria-label={t('customerMenuItemPage.aria.backgroundImage', { itemName: menuItem.name })}
      />

      {/* Flying image for animation */}
      {animateBasket && (
        <div className="flying-image">
          <Image
            src={menuItem.image_url}
            alt={menuItem.name}
            fluid
            className="basket-animation"
          />
        </div>
      )}

      {/* Content Container */}
      <Container className="my-5">
        <Row className="justify-content-center">
          <Col lg={10} md={12}>
            <Card className="bg-light shadow-lg">
              <Row className="g-0">
                {/* Menu Item Image */}
                <Col md={5} className="d-flex align-items-center justify-content-center p-3">
                  <Image
                    src={menuItem.image_url}
                    alt={menuItem.name}
                    fluid
                    className="rounded"
                    style={{ maxHeight: '500px', objectFit: 'cover' }}
                    loading="lazy"
                  />
                </Col>

                {/* Menu Item Details */}
                <Col md={7}>
                  <Card.Body>
                    {/* Header Section */}
                    <div className="mb-4">
                      <h2 className="card-title d-flex align-items-center">
                        <FaUtensils className="me-2 text-primary" /> {menuItem.name}
                      </h2>
                      <Badge bg="secondary" className="me-2">
                        {restaurantName}
                      </Badge>
                      <Badge bg="info">{t('customerMenuItemPage.idBadge', { id: menuItem.id })}</Badge>
                    </div>

                    {/* Description Section */}
                    <div className="mb-4">
                      <h5 className="d-flex align-items-center">
                        <FaInfoCircle className="me-2 text-info" /> {t('customerMenuItemPage.details')}
                      </h5>
                      <p>{menuItem.description}</p>
                    </div>

                    {/* Pricing Section */}
                    <div className="mb-4">
                      <h5 className="d-flex align-items-center">
                        <FaDollarSign className="me-2 text-success" /> {t('customerMenuItemPage.pricing')}
                      </h5>
                      <Row>
                        <Col xs={6}>
                          <p>
                            <strong>{t('customerMenuItemPage.basePrice')}:</strong> ${menuItem.price}
                          </p>
                        </Col>
                        <Col xs={6}>
                          <p>
                            <strong>{t('customerMenuItemPage.totalPrice')}:</strong> ${!isNaN(calculatedPrice) ? calculatedPrice.toFixed(2) : 'N/A'}
                          </p>
                        </Col>
                      </Row>
                    </div>

                    {/* Options Section */}
                    {menuItem.options && menuItem.options.length > 0 && (
                      <div className="mb-4">
                        <h5 className="d-flex align-items-center">
                          <FaListAlt className="me-2 text-warning" /> {t('customerMenuItemPage.chooseOptions')}
                        </h5>
                        {menuItem.options.map(option => (
                          <Card key={option.id} className="mb-3 border-0">
                            <Card.Body className="bg-secondary bg-opacity-10 rounded">
                              <Card.Title className="d-flex align-items-center">
                                <FaCheckCircle className="me-2 text-success" /> {option.name}
                              </Card.Title>
                              <Form>
                                {option.choices && option.choices.length > 0 ? (
                                  option.choices.map(choice => (
                                    <Form.Check
                                      type="radio"
                                      id={`option-${option.id}-choice-${choice.id}`}
                                      key={choice.id}
                                      name={`option-${option.id}`}
                                      label={t('customerMenuItemPage.optionChoice', { choiceName: choice.name, priceModifier: choice.price_modifier })}
                                      value={choice.id}
                                      checked={selectedOptions[option.id] === choice.id}
                                      onChange={() => handleOptionChange(option.id, choice.id)}
                                      className="mb-2"
                                    />
                                  ))
                                ) : (
                                  <p>{t('customerMenuItemPage.noAdditions')}</p>
                                )}
                              </Form>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="mb-4">
                      <h5 className="d-flex align-items-center">
                        <FaPlus className="me-2 text-primary" /> {t('customerMenuItemPage.quantity')}
                      </h5>
                      <InputGroup className="w-50">
                        <Button
                          variant="outline-primary"
                          onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                          disabled={quantity <= 1}
                          aria-label={t('customerMenuItemPage.decreaseQuantity')}
                        >
                          <FaMinus />
                        </Button>
                        <Form.Control
                          type="text"
                          readOnly
                          value={quantity}
                          className="text-center"
                          aria-label={t('customerMenuItemPage.quantity')}
                        />
                        <Button
                          variant="outline-primary"
                          onClick={() => setQuantity(prev => prev + 1)}
                          aria-label={t('customerMenuItemPage.increaseQuantity')}
                        >
                          <FaPlus />
                        </Button>
                      </InputGroup>
                    </div>

                    {/* Add to Basket Button */}
                    <Button
                      variant="success"
                      size="lg"
                      onClick={handleAddToBasket}
                      className="w-100 d-flex align-items-center justify-content-center"
                    >
                      <FaShoppingCart className="me-2" />
                      {t('customerMenuItemPage.addToBasket')}
                    </Button>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <Footer />
    </div>
  );
};

CustomerMenuItemPage.propTypes = {
  addToBasket: PropTypes.func.isRequired,
  basketItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      quantity: PropTypes.number.isRequired,
      selectedOptions: PropTypes.object.isRequired,
      price: PropTypes.number.isRequired,
      image: PropTypes.string,
    })
  ),
};

export default CustomerMenuItemPage;
