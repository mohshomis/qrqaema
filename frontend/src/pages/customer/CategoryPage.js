import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantPublicDetails, getRestaurantMenus, getMenuItems } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Button, Alert, Badge } from 'react-bootstrap';
import OptimizedImage from '../../components/OptimizedImage';
import { FaReceipt, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { formatPrice } from '../../utils/currencyUtils';
import '../../styles/NewCustomerPages.css';
import CustomerHeader from './components/CustomerHeader';

const CategoryPage = () => {
  const { t, i18n } = useTranslation();
  const { restaurantId, categoryId, tableNumber, menuId } = useParams();
  const restaurantDetails = useRestaurant();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableMenus, setAvailableMenus] = useState([]);
  const [currentMenu, setCurrentMenu] = useState(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        if (!menuId || !categoryId) {
          setError(t('categoryPage.errors.invalidIds'));
          return;
        }

        const menuResponse = await getMenuItems(restaurantId, menuId, categoryId);
        setMenuItems(menuResponse.data);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError(t('categoryPage.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [restaurantId, categoryId, menuId, t]);

  const handleMenuItemClick = (itemId) => {
    if (!menuId) {
      console.error('Menu ID is required');
      return;
    }
    navigate(`/restaurant/${restaurantId}/menu/${menuId}/table/${tableNumber}/menu-item/${itemId}`);
  };

  const handleBackClick = () => {
    navigate(`/restaurant/${restaurantId}/menu/${menuId}/table/${tableNumber}`);
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
            onClick={handleBackClick}
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
                      <OptimizedImage
                        src={item.image_url}
                        alt={item.name}
                        className="menu-image"
                        sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, 33vw"
                      />
                    )}
                    <div className="price-badge">
                      {formatPrice(item.price, restaurantDetails.currency)}
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
