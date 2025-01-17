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
  const { restaurantId, itemId } = useParams();
  const [menuItem, setMenuItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [error, setError] = useState(null);
  const [animateBasket, setAnimateBasket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentMenu, setCurrentMenu] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await getRestaurantMenus(restaurantId);
        const { menus } = response.data;
        
        const savedMenuId = localStorage.getItem(`restaurant_${restaurantId}_menu`);
        const savedLanguage = localStorage.getItem(`restaurant_${restaurantId}_language`);
        
        if (savedMenuId) {
          const matchingMenu = menus.find(menu => menu.id === savedMenuId);
          if (matchingMenu) {
            setCurrentMenu(matchingMenu);
            // Only change language if it's different from current
            if (i18n.language !== (savedLanguage || matchingMenu.language)) {
              i18n.changeLanguage(savedLanguage || matchingMenu.language);
            }
          }
        } else {
          const defaultMenu = menus.find(menu => menu.is_default);
          if (defaultMenu) {
            setCurrentMenu(defaultMenu);
            // Only change language if it's different from current
            if (i18n.language !== defaultMenu.language) {
              i18n.changeLanguage(defaultMenu.language);
            }
            localStorage.setItem(`restaurant_${restaurantId}_menu`, defaultMenu.id);
            localStorage.setItem(`restaurant_${restaurantId}_language`, defaultMenu.language);
          }
        }
      } catch (err) {
        console.error('Error fetching menus:', err);
        setError(t('customerMenuItemPage.errors.fetchFailed'));
      }
    };

    fetchMenus();
  }, [restaurantId, i18n, t]);

  useEffect(() => {
    const fetchMenuItem = async () => {
      try {
        if (!currentMenu) return;
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

    if (currentMenu) {
      fetchMenuItem();
    }
  }, [restaurantId, itemId, currentMenu, t]);

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
        menu: currentMenu.id
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
    <div className="customer-page" dir={i18n.dir()}>
      {animateBasket && (
        <div className="flying-image">
          <Image
            src={menuItem.image_url}
            alt={menuItem.name}
            className="basket-animation"
          />
        </div>
      )}

      <Container className="content-container">
        <div className="menu-card fade-in">
          <div className="menu-image-container" style={{ paddingTop: '50%' }}>
            <img
              src={menuItem.image_url}
              alt={menuItem.name}
              className="menu-image"
              loading="lazy"
            />
            <div className="price-badge">
              <FaDollarSign className="me-1" />
              {calculatedPrice.toFixed(2)}
            </div>
          </div>

          <div className="card-content">
            <h2 className="card-title d-flex align-items-center">
              <FaUtensils className="me-2 text-primary" />
              {menuItem.name}
            </h2>

            <p className="card-description">{menuItem.description}</p>

            {menuItem.options && menuItem.options.length > 0 && (
              <div className="options-section">
                <h3 className="option-title">
                  <FaInfoCircle className="me-2" />
                  {t('customerMenuItemPage.chooseOptions')}
                </h3>
                {menuItem.options.map(option => (
                  <div key={option.id} className="mb-4">
                    <h4 className="mb-3">
                      <FaCheckCircle className="me-2 text-success" />
                      {option.name}
                    </h4>
                    <Form>
                      <Row className="g-3">
                        {option.choices && option.choices.length > 0 ? (
                          option.choices.map(choice => (
                            <Col md={6} key={choice.id}>
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

            <div className="quantity-control">
              <span>{t('customerMenuItemPage.quantity')}:</span>
              <div className="d-flex align-items-center">
                <Button
                  variant="outline-primary"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="quantity-button"
                >
                  <FaMinus />
                </Button>
                <Form.Control
                  type="text"
                  readOnly
                  value={quantity}
                  className="quantity-input"
                />
                <Button
                  variant="outline-primary"
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="quantity-button"
                >
                  <FaPlus />
                </Button>
              </div>
            </div>

            <Row className="g-3 mt-4">
              <Col xs={4}>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate(-1)}
                  className="action-button outline-button"
                >
                  <FaArrowLeft className="me-2" />
                  {t('customerMenuItemPage.back')}
                </Button>
              </Col>
              <Col xs={8}>
                <Button
                  variant="primary"
                  onClick={handleAddToBasket}
                  className="action-button primary-button"
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
