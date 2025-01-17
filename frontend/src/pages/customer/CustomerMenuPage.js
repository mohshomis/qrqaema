import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantPublicDetails, getCategories, getRestaurantMenus } from '../../services/api';
import Footer from '../../components/Footer';
import { useTranslation } from 'react-i18next';
import { Container, Row, Col, Card, Button, Alert, Badge, Modal } from 'react-bootstrap';
import { FaUtensils, FaList, FaInfoCircle, FaArrowRight } from 'react-icons/fa';
import '../../styles/NewCustomerPages.css';

const CustomerMenuPage = () => {
  const { t, i18n } = useTranslation();
  const { restaurantId, tableNumber } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [currentMenu, setCurrentMenu] = useState(null);
  const [availableMenus, setAvailableMenus] = useState([]);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    const savedMenuId = localStorage.getItem(`restaurant_${restaurantId}_menu`);
    if (!savedMenuId) {
      setShowLanguageModal(true);
    }
  }, [restaurantId]);

  const handleLanguageSelect = (menu) => {
    const selectedData = {
      menuId: menu.id,
      menuLanguage: menu.language,
      uiLanguage: menu.language
    };
    
    localStorage.setItem(`restaurant_${restaurantId}_menu`, selectedData.menuId);
    localStorage.setItem(`restaurant_${restaurantId}_language`, selectedData.menuLanguage);
    
    setCurrentMenu(menu);
    i18n.changeLanguage(menu.language);
    setShowLanguageModal(false);
  };

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const response = await getRestaurantMenus(restaurantId);
        const { menus } = response.data;
        
        setAvailableMenus(menus);
        
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
      }
    };

    fetchMenus();
  }, [restaurantId, i18n]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
        setRestaurantName(restaurantResponse.data.name);

        if (currentMenu) {
          const categoriesResponse = await getCategories(restaurantId, currentMenu.id);
          setCategories(categoriesResponse.data);
        }
        setLoading(false);
      } catch (err) {
        setError(t('customerMenuPage.errors.fetchFailed'));
        setLoading(false);
      }
    };

    fetchData();
  }, [restaurantId, currentMenu, t]);

  const handleCategoryClick = (categoryId) => {
    navigate(`/restaurant/${restaurantId}/table/${tableNumber}/category/${categoryId}`);
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
      <Modal
        show={showLanguageModal}
        onHide={() => {
          const defaultMenu = availableMenus.find(menu => menu.is_default);
          if (defaultMenu) handleLanguageSelect(defaultMenu);
        }}
        centered
        backdrop="static"
      >
        <Modal.Header>
          <Modal.Title className="w-100 text-center">
            {t('customerMenuPage.selectLanguage')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-grid gap-2">
            {availableMenus.map(menu => (
              <Button
                key={menu.language}
                variant={menu.is_default ? 'primary' : 'outline-primary'}
                size="lg"
                onClick={() => handleLanguageSelect(menu)}
                className="text-start d-flex justify-content-between align-items-center p-3"
              >
                <span className="fs-5">
                  {menu.language.toUpperCase()}
                </span>
                <Badge bg={menu.is_default ? 'light' : 'primary'} text={menu.is_default ? 'primary' : 'light'}>
                  {menu.categories.length} {t('categories')}
                </Badge>
              </Button>
            ))}
          </div>
        </Modal.Body>
      </Modal>

      <Container className="content-container">
        <Row className="g-4">
          {categories.map(category => (
            <Col key={category.id} xs={6} md={4} lg={3}>
              <div className="menu-card fade-in" onClick={() => handleCategoryClick(category.id)}>
                <div className="menu-image-container">
                  {category.image_url && (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="menu-image"
                      loading="lazy"
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
