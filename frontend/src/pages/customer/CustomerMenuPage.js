// src/pages/CustomerMenuPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantPublicDetails, getCategories, getRestaurantMenus } from '../../services/api';
import Footer from '../../components/Footer';
import '../../styles/Footer.css';
import '../../styles/CustomerPages.css';
import '../../App.css';
import { useTranslation } from 'react-i18next';
import { 
    Container, 
    Row, 
    Col, 
    Card, 
    Button, 
    Spinner, 
    Alert,
    Badge,
    Modal
} from 'react-bootstrap';
import {
    FaUtensils,
    FaList,
    FaInfoCircle,
    FaExclamationCircle,
    FaArrowRight
} from 'react-icons/fa';

const CustomerMenuPage = ({ basketItems, addToBasket }) => {
    const { t, i18n } = useTranslation();
    const { restaurantId, tableNumber } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restaurantBackground, setRestaurantBackground] = useState(null);
    const [restaurantName, setRestaurantName] = useState('');
    const [currentMenu, setCurrentMenu] = useState(null);
    const [availableMenus, setAvailableMenus] = useState([]);
    const [showLanguageModal, setShowLanguageModal] = useState(false);

    // Check if it's the first visit or if menu selection is needed
    useEffect(() => {
        const savedMenuId = localStorage.getItem(`restaurant_${restaurantId}_menu`);
        if (!savedMenuId) {
            setShowLanguageModal(true);
        }
    }, [restaurantId]);

    // Handle menu and language selection
    const handleLanguageSelect = (menu) => {
        const selectedData = {
            menuId: menu.id,
            menuLanguage: menu.language,
            uiLanguage: menu.language // Initially set UI language same as menu language
        };
        
        // Store selection
        localStorage.setItem(`restaurant_${restaurantId}_menu`, selectedData.menuId);
        localStorage.setItem(`restaurant_${restaurantId}_language`, selectedData.menuLanguage);
        
        // Set menu content and UI language
        setCurrentMenu(menu);
        i18n.changeLanguage(menu.language);
        setShowLanguageModal(false);
    };

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const response = await getRestaurantMenus(restaurantId);
                const { menus, available_languages, default_language } = response.data;
                
                setAvailableMenus(menus);
                
                // Get saved selection or use default
                const savedMenuId = localStorage.getItem(`restaurant_${restaurantId}_menu`);
                const savedLanguage = localStorage.getItem(`restaurant_${restaurantId}_language`);
                if (savedMenuId) {
                    const matchingMenu = menus.find(menu => menu.id === savedMenuId);
                    if (matchingMenu) {
                        setCurrentMenu(matchingMenu);
                        i18n.changeLanguage(savedLanguage || matchingMenu.language);
                    }
                } else {
                    // Use default menu
                    const defaultMenu = menus.find(menu => menu.is_default);
                    if (defaultMenu) {
                        setCurrentMenu(defaultMenu);
                        i18n.changeLanguage(defaultMenu.language);
                        
                        // Store default selection
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
        const fetchRestaurantData = async () => {
            try {
                const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
                setRestaurantBackground(restaurantResponse.data.background_image_url);
                setRestaurantName(restaurantResponse.data.name);

                if (currentMenu) {
                    const categoriesResponse = await getCategories(restaurantId, currentMenu.id);
                    setCategories(categoriesResponse.data);
                }
                setLoading(false);
            } catch (err) {
                console.error('Error fetching categories or restaurant details:', err);
                setError(t('customerMenuPage.errors.fetchFailed'));
                setLoading(false);
            }
        };

        fetchRestaurantData();
    }, [restaurantId, currentMenu, t]);

    const handleCategoryClick = (categoryId) => {
        navigate(`/restaurant/${restaurantId}/table/${tableNumber}/category/${categoryId}`);
    };

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <div className="custom-spinner" />
                <p className="mt-3">{t('customerMenuPage.loading')}</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5">
                <Alert variant="danger" className="d-flex align-items-center justify-content-center">
                    <FaExclamationCircle className="me-2" />
                    {t('customerMenuPage.error')}
                </Alert>
            </Container>
        );
    }

    return (
        <div className="page-container" dir={i18n.dir()}>
            {/* Language Selection Modal */}
            <Modal
                show={showLanguageModal}
                onHide={() => {
                    // If user closes without selecting, use default menu
                    const defaultMenu = availableMenus.find(menu => menu.is_default);
                    if (defaultMenu) {
                        handleLanguageSelect(defaultMenu);
                    }
                }}
                centered
                backdrop="static"
                keyboard={false}
            >
                <Modal.Header closeButton={false}>
                    <Modal.Title className="text-center w-100">
                        Select Menu Language
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-grid gap-2">
                        {availableMenus.map(menu => {
                            const languageNames = {
                                en: 'English',
                                ar: 'العربية',
                                de: 'Deutsch',
                                es: 'Español',
                                fr: 'Français',
                                tr: 'Türkçe',
                                nl: 'Nederlands'
                            };
                            
                            return (
                                <Button
                                    key={menu.language}
                                    variant="outline-primary"
                                    size="lg"
                                    onClick={() => handleLanguageSelect(menu)}
                                    className="text-start d-flex justify-content-between align-items-center"
                                >
                                    <div className="d-flex flex-column">
                                        <span className="fs-5">
                                            {languageNames[menu.language] || menu.language}
                                        </span>
                                        <small className="text-muted">
                                            {menu.categories.length} {t('categories')}
                                        </small>
                                    </div>
                                    <div>
                                        {menu.is_default && (
                                            <span className="badge bg-primary me-2">Default</span>
                                        )}
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                </Modal.Body>
            </Modal>

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
                    aria-label={t('customerMenuPage.aria.backgroundImage', { restaurantName })}
                />
            )}

            <Container className="my-5">
                <Row className="justify-content-center">
                    <Col lg={10} md={12}>
                        <Row className="g-4">
                            {categories.length > 0 ? (
                                categories.map(category => (
                                    <Col key={category.id} xs={6} md={4} lg={3}>
                                        <Card
                                            className="h-100 custom-card category-card fade-in"
                                            onClick={() => handleCategoryClick(category.id)}
                                        >
                                            <div className="position-relative">
                                                {category.image_url && (
                                                    <div className="card-img-container">
                                                        <Card.Img
                                                            src={category.image_url}
                                                            alt={category.name}
                                                            className="card-img-top"
                                                        />
                                                        <div className="img-overlay"></div>
                                                    </div>
                                                )}
                                                <Badge 
                                                    bg="primary" 
                                                    className="position-absolute top-0 end-0 m-2"
                                                >
                                                    <FaList className="me-1" />
                                                    {t('customerMenuPage.items')}
                                                </Badge>
                                            </div>
                                            <Card.Body className="d-flex flex-column justify-content-between">
                                                <div>
                                                    <Card.Title className="text-center h5 mb-3">
                                                        {category.name}
                                                    </Card.Title>
                                                    {category.description && (
                                                        <Card.Text className="text-center text-muted small">
                                                            {category.description}
                                                        </Card.Text>
                                                    )}
                                                </div>
                                                <Button 
                                                    variant="outline-light" 
                                                    className="custom-button mt-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCategoryClick(category.id);
                                                    }}
                                                >
                                                    <span className="d-flex align-items-center justify-content-center">
                                                        {t('customerMenuPage.viewItems')}
                                                        <FaArrowRight className="ms-2" />
                                                    </span>
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))
                            ) : (
                                <Col>
                                    <Alert variant="info" className="text-center">
                                        <FaInfoCircle className="me-2" />
                                        {t('customerMenuPage.noCategories')}
                                    </Alert>
                                </Col>
                            )}
                        </Row>
                    </Col>
                </Row>
            </Container>
            <Footer />
        </div>
    );
};

export default CustomerMenuPage;
