import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantPublicDetails, getCategories, getRestaurantMenus } from '../../services/api';
import OptimizedImage from '../../components/OptimizedImage';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { FaUtensils, FaList, FaInfoCircle, FaArrowRight } from 'react-icons/fa';
import '../../styles/NewCustomerPages.css';
import CustomerHeader from './components/CustomerHeader';

const CustomerMenuPage = () => {
  const { t, i18n } = useTranslation();
  const { restaurantId, tableNumber, menuId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
        setRestaurantName(restaurantResponse.data.name);

        // Fetch categories for the menu
        if (menuId) {
          const categoriesResponse = await getCategories(restaurantId, menuId);
          setCategories(categoriesResponse.data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(t('customerMenuPage.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, menuId, t]);

  const handleCategoryClick = (categoryId) => {
    if (!menuId) {
      console.error('Menu ID is required');
      return;
    }
    navigate(`/restaurant/${restaurantId}/menu/${menuId}/table/${tableNumber}/category/${categoryId}`);
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
        <Row className="g-4">
          {categories.map(category => (
            <Col key={category.id} xs={6} md={4} lg={3}>
              <div className="menu-card fade-in" onClick={() => handleCategoryClick(category.id)}>
                <div className="menu-image-container">
                  {category.image_url && (
                    <OptimizedImage
                      src={category.image_url}
                      alt={category.name}
                      className="menu-image"
                      sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, 33vw"
                    />
                  )}
                  <Badge 
                    bg="primary"
                    className="position-absolute top-0 end-0 m-2"
                  >
                    <FaList className="me-1" />
                    {t('customerMenuPage.items')}
                  </Badge>
                </div>
                <div className="card-content">
                  <h3 className="card-title">{category.name}</h3>
                  {category.description && (
                    <p className="card-description">{category.description}</p>
                  )}
                  <Button 
                    variant="primary"
                    className="action-button primary-button mt-auto"
                  >
                    {t('customerMenuPage.viewItems')}
                    <FaArrowRight />
                  </Button>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default CustomerMenuPage;
