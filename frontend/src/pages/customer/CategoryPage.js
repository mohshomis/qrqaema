import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantPublicDetails, getRestaurantMenus, getMenuItems } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Button, Alert, Badge } from 'react-bootstrap';
import { FaReceipt, FaDollarSign, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';
import '../../styles/NewCustomerPages.css';

const CategoryPage = () => {
  const { t, i18n } = useTranslation();
  const { restaurantId, categoryId, tableNumber } = useParams();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMenu, setCurrentMenu] = useState(null);

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
        setError(t('categoryPage.errors.fetchFailed'));
      }
    };

    fetchMenus();
  }, [restaurantId, i18n, t]);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        if (currentMenu) {
          const menuResponse = await getMenuItems(restaurantId, currentMenu.id, categoryId);
          setMenuItems(menuResponse.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError(t('categoryPage.errors.fetchFailed'));
        setLoading(false);
      }
    };

    if (currentMenu) {
      fetchCategoryData();
    }
  }, [restaurantId, categoryId, currentMenu, t]);

  const handleMenuItemClick = (itemId) => {
    navigate(`/restaurant/${restaurantId}/table/${tableNumber}/menu-item/${itemId}`);
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

  return (
    <div className="customer-page" dir={i18n.dir()}>
      <Container className="content-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Button
            variant="outline-primary"
            onClick={() => navigate(-1)}
            className="action-button outline-button"
            style={{ width: 'auto' }}
          >
            <FaArrowLeft className="me-2" />
            {t('categoryPage.backButton')}
          </Button>
          <Badge bg="primary" className="px-3 py-2">
            {t('categoryPage.itemCount', { count: menuItems.length })}
          </Badge>
        </div>

        <Row className="g-4">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <Col key={item.id} xs={6} md={4} lg={3}>
                <div className="menu-card fade-in" onClick={() => handleMenuItemClick(item.id)}>
                  <div className="menu-image-container">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="menu-image"
                        loading="lazy"
                      />
                    )}
                    <div className="price-badge">
                      <FaDollarSign className="me-1" />
                      {Number(item.price).toFixed(2)}
                    </div>
                  </div>
                  <div className="card-content">
                    <h3 className="card-title">{item.name}</h3>
                    {item.description && (
                      <p className="card-description">{item.description}</p>
                    )}
                    <Button
                      variant="primary"
                      className="action-button primary-button mt-auto"
                    >
                      {t('categoryPage.viewDetails')}
                      <FaInfoCircle className="ms-2" />
                    </Button>
                  </div>
                </div>
              </Col>
            ))
          ) : (
            <Col>
              <Alert variant="info" className="text-center">
                <FaReceipt className="me-2" />
                {t('categoryPage.noItems')}
              </Alert>
            </Col>
          )}
        </Row>
      </Container>
    </div>
  );
};

export default CategoryPage;
