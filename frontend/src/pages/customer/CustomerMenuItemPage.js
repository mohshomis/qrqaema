// src/pages/CustomerMenuItemPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuItemDetails, getRestaurantPublicDetails } from '../../services/api';
import Footer from '../../components/Footer';
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
  FaListAlt,
  FaArrowLeft,
  FaExclamationCircle
} from 'react-icons/fa';
import '../../styles/Footer.css';
import '../../styles/CustomerPages.css';
import { useTranslation } from 'react-i18next';

const CustomerMenuItemPage = ({ addToBasket, basketItems = [] }) => {
  const { t, i18n } = useTranslation();
  const { restaurantId, itemId } = useParams();
  const [menuItem, setMenuItem] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [error, setError] = useState(null);
  const [animateBasket, setAnimateBasket] = useState(false);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu item details:', err);
        setError(t('customerMenuItemPage.errors.fetchFailed'));
        setLoading(false);
      }
    };
    fetchMenuItem();
  }, [restaurantId, itemId, t]);

  const calculatePrice = () => {
    if (!menuItem) return;
    
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
    calculatePrice();
  }, [selectedOptions, quantity]);

  const handleOptionChange = (optionId, choiceId) => {
    setSelectedOptions(prev => ({
      ...prev,
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

      setAnimateBasket(true);
      setTimeout(() => {
        addToBasket(basketItem);
        navigate(`/restaurant/${restaurantId}/table/1`);
        setAnimateBasket(false);
      }, 1000);
    }
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <div className="custom-spinner" />
        <p className="mt-3">{t('customerMenuItemPage.loading')}</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger" className="d-flex align-items-center">
          <FaExclamationCircle className="me-2" />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!menuItem) return null;

  return (
    <div className="page-container" dir={i18n.dir()}>
      <div className="background-overlay"></div>
      <div
        className="background-image"
        style={{
          backgroundImage: `url(${menuItem.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          width: '100%',
          height: '100%',
          zIndex: -2,
        }}
        aria-label={t('customerMenuItemPage.aria.backgroundImage', { itemName: menuItem.name })}
      />

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

      <Container className="my-5">
        <Row className="justify-content-center">
          <Col lg={10} md={12}>
            <Card className="custom-card fade-in">
              <Row className="g-0">
                <Col md={5} className="d-flex align-items-center justify-content-center p-3">
                  <div className="card-img-container rounded overflow-hidden">
                    <Image
                      src={menuItem.image_url}
                      alt={menuItem.name}
                      fluid
                      className="w-100 h-100 object-fit-cover"
                      loading="lazy"
                    />
                  </div>
                </Col>

                <Col md={7}>
                  <Card.Body>
                    <div className="mb-4 fade-in">
                      <div className="d-flex justify-content-between align-items-start">
                        <h2 className="card-title d-flex align-items-center">
                          <FaUtensils className="me-2 text-primary" /> {menuItem.name}
                        </h2>
                        <Badge bg="primary" pill className="ms-2">
                          {restaurantName}
                        </Badge>
                      </div>
                      <div className="price-badge mt-2">
                        <FaDollarSign className="me-1" />
                        {!isNaN(calculatedPrice) ? calculatedPrice.toFixed(2) : 'N/A'}
                      </div>
                    </div>

                    <div className="mb-4 fade-in">
                      <h5 className="d-flex align-items-center text-primary">
                        <FaInfoCircle className="me-2" /> {t('customerMenuItemPage.details')}
                      </h5>
                      <p className="text-light">{menuItem.description}</p>
                    </div>

                    {menuItem.options && menuItem.options.length > 0 && (
                      <div className="mb-4 fade-in">
                        <h5 className="d-flex align-items-center text-warning">
                          <FaListAlt className="me-2" /> {t('customerMenuItemPage.chooseOptions')}
                        </h5>
                        {menuItem.options.map(option => (
                          <Card key={option.id} className="custom-card mb-3 border-0">
                            <Card.Body>
                              <Card.Title className="d-flex align-items-center mb-3">
                                <FaCheckCircle className="me-2 text-success" /> {option.name}
                              </Card.Title>
                              <Form>
                                <Row>
                                  {option.choices && option.choices.length > 0 ? (
                                    option.choices.map(choice => (
                                      <Col md={6} key={choice.id}>
                                        <Form.Check
                                          type="radio"
                                          id={`option-${option.id}-choice-${choice.id}`}
                                          name={`option-${option.id}`}
                                          className="mb-2 custom-radio"
                                          label={
                                            <span className="d-flex justify-content-between align-items-center">
                                              {choice.name}
                                              {choice.price_modifier > 0 && (
                                                <Badge bg="info" className="ms-2">
                                                  +${choice.price_modifier}
                                                </Badge>
                                              )}
                                            </span>
                                          }
                                          value={choice.id}
                                          checked={selectedOptions[option.id] === choice.id}
                                          onChange={() => handleOptionChange(option.id, choice.id)}
                                        />
                                      </Col>
                                    ))
                                  ) : (
                                    <Col>
                                      <p className="text-muted mb-0">{t('customerMenuItemPage.noAdditions')}</p>
                                    </Col>
                                  )}
                                </Row>
                              </Form>
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    )}

                    <div className="mb-4 fade-in">
                      <h5 className="d-flex align-items-center text-primary">
                        <FaPlus className="me-2" /> {t('customerMenuItemPage.quantity')}
                      </h5>
                      <div className="quantity-control">
                        <InputGroup>
                          <Button
                            variant="outline-primary"
                            onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                            disabled={quantity <= 1}
                            className="custom-button"
                            aria-label={t('customerMenuItemPage.decreaseQuantity')}
                          >
                            <FaMinus />
                          </Button>
                          <Form.Control
                            type="text"
                            readOnly
                            value={quantity}
                            className="text-center border-0 bg-transparent text-light"
                            aria-label={t('customerMenuItemPage.quantity')}
                          />
                          <Button
                            variant="outline-primary"
                            onClick={() => setQuantity(prev => prev + 1)}
                            className="custom-button"
                            aria-label={t('customerMenuItemPage.increaseQuantity')}
                          >
                            <FaPlus />
                          </Button>
                        </InputGroup>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <Button
                        variant="outline-light"
                        className="custom-button flex-grow-0"
                        onClick={() => navigate(-1)}
                      >
                        <FaArrowLeft className="me-2" />
                        {t('customerMenuItemPage.back')}
                      </Button>
                      <Button
                        variant="success"
                        className="custom-button flex-grow-1"
                        onClick={handleAddToBasket}
                      >
                        <FaShoppingCart className="me-2" />
                        {t('customerMenuItemPage.addToBasket')}
                      </Button>
                    </div>
                  </Card.Body>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
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
