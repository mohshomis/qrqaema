import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantPublicDetails, getRestaurantMenus, getMenuItemDetails } from '../../services/api';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Row,
  Col,
  Image,
  Button,
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
  FaArrowLeft,
} from 'react-icons/fa';
import '../../styles/NewCustomerPages.css';

const CustomerMenuItemPage = ({ addToBasket }) => {
  const { t, i18n } = useTranslation();
  const { restaurantId, itemId, menuId, tableNumber } = useParams();
  const [menuItem, setMenuItem] = useState(null);
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
        id: Number(menuItem.id), // Convert to number
        name: menuItem.name,
        quantity,
        selectedOptions: {},
        price: calculatedPrice,
        image: menuItem.image_url,
        menu: menuId
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
        const baseUrl = `/restaurant/${restaurantId}`;
        const path = menuId 
          ? `${baseUrl}/menu/${menuId}/table/${tableNumber}`
          : `${baseUrl}/table/${tableNumber}`;
        navigate(path);
        setAnimateBasket(false);
      }, 1000);
    }
  };

  if (loading) {
    return (
      <div className="customer-page">
        <Container className="content-container">
          <div className="loading-spinner" />
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-page">
        <Container className="content-container">
          <Alert variant="danger">
            <FaInfoCircle className="me-2" />
            {error}
          </Alert>
        </Container>
      </div>
    );
  }

  if (!menuItem) return null;

  return (
    <div className="customer-page min-vh-100 d-flex flex-column" dir={i18n.dir()}>
      {animateBasket && (
        <div className="flying-image">
          <Image
            src={menuItem.image_url}
            alt={menuItem.name}
            className="basket-animation"
          />
        </div>
      )}

      <Container className="content-container flex-grow-1 py-4">
            <div className="menu-card fade-in shadow-lg h-100">
          <div className="menu-image-container position-relative" style={{ paddingTop: '40%', minHeight: '200px' }}>
            <img
              src={menuItem.image_url}
              alt={menuItem.name}
              className="menu-image rounded-top"
              loading="lazy"
              style={{ objectFit: 'cover' }}
            />
            <div className="price-badge bg-primary text-white px-3 py-2 rounded-pill position-absolute top-0 end-0 m-3">
              <FaDollarSign className="me-1" />
              {calculatedPrice.toFixed(2)}
            </div>
          </div>

            <div className="card-content px-3 px-md-4 py-4">
            <h2 className="card-title d-flex align-items-center fs-3 fs-md-2">
              <FaUtensils className="me-2 text-primary" />
              {menuItem.name}
            </h2>

            <p className="card-description text-light-50">{menuItem.description}</p>

            {menuItem.options && menuItem.options.length > 0 && (
              <div className="options-section mt-4">
                <h3 className="option-title fs-4">
                  <FaInfoCircle className="me-2" />
                  {t('customerMenuItemPage.chooseOptions')}
                </h3>
                {menuItem.options.map(option => (
                  <div key={option.id} className="mb-4">
                    <h4 className="mb-3 fs-5">
                      <FaCheckCircle className="me-2 text-success" />
                      {option.name}
                    </h4>
                    <Form>
                      <Row className="g-3">
                        {option.choices && option.choices.length > 0 ? (
                          option.choices.map(choice => (
                            <Col xs={12} sm={6} key={choice.id}>
                              <div
                                className={`option-choice ${
                                  selectedOptions[option.id] === choice.id ? 'selected' : ''
                                }`}
                                onClick={() => handleOptionChange(option.id, choice.id)}
                              >
                                <span>{choice.name}</span>
                                {choice.price_modifier > 0 && (
                                  <Badge bg="info">
                                    +${choice.price_modifier.toFixed(2)}
                                  </Badge>
                                )}
                              </div>
                            </Col>
                          ))
                        ) : (
                          <Col>
                            <p className="text-muted mb-0">
                              {t('customerMenuItemPage.noAdditions')}
                            </p>
                          </Col>
                        )}
                      </Row>
                    </Form>
                  </div>
                ))}
              </div>
            )}

            <div className="quantity-control bg-dark bg-opacity-10 p-3 p-md-4 rounded-3 mt-4">
              <h4 className="mb-3 fs-5">{t('customerMenuItemPage.quantity')}:</h4>
              <div className="d-flex align-items-center justify-content-center">
                <Button
                  variant="primary"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="quantity-button rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px' }}
                >
                  <FaMinus />
                </Button>
                <Form.Control
                  type="text"
                  readOnly
                  value={quantity}
                  className="quantity-input text-center mx-3 bg-transparent border-0 fs-4 fw-bold"
                  style={{ width: '60px' }}
                />
                <Button
                  variant="primary"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="quantity-button rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px' }}
                >
                  <FaPlus />
                </Button>
              </div>
            </div>

            <Row className="g-3 mt-4 sticky-bottom pb-3">
              <Col xs={12} sm={4}>
                <Button
                  variant="outline-light"
                  onClick={() => navigate(-1)}
                  className="action-button w-100 py-3 rounded-pill shadow-sm"
                >
                  <FaArrowLeft className="me-2" />
                  {t('customerMenuItemPage.back')}
                </Button>
              </Col>
              <Col xs={12} sm={8}>
                <Button
                  variant="primary"
                  onClick={handleAddToBasket}
                  className="action-button w-100 py-3 rounded-pill shadow btn-glow mb-2 mb-sm-0"
                  style={{ 
                    background: 'linear-gradient(45deg, #007bff, #0056b3)',
                    border: 'none'
                  }}
                >
                  <FaShoppingCart className="me-2" />
                  {t('customerMenuItemPage.addToBasket')}
                </Button>
              </Col>
            </Row>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CustomerMenuItemPage;
