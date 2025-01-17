// src/pages/CustomerMenuPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantPublicDetails, getCategories } from '../../services/api';
import Footer from '../../components/Footer';
import '../../styles/Footer.css';
import '../../styles/CustomerPages.css';
import '../../App.css';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { 
    Container, 
    Row, 
    Col, 
    Card, 
    Button, 
    Spinner, 
    Alert,
    Badge 
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

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                const response = await axios.get(`/api/restaurants/${restaurantId}/menus/`);
                setAvailableMenus(response.data);
                
                // Find menu matching current language or default menu
                const matchingMenu = response.data.find(menu => menu.language === i18n.language) ||
                                   response.data.find(menu => menu.is_default);
                
                if (matchingMenu) {
                    setCurrentMenu(matchingMenu);
                }
            } catch (err) {
                console.error('Error fetching menus:', err);
            }
        };

        fetchMenus();
    }, [restaurantId, i18n.language]);

    useEffect(() => {
        const fetchRestaurantData = async () => {
            try {
                const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
                setRestaurantBackground(restaurantResponse.data.background_image_url);
                setRestaurantName(restaurantResponse.data.name);

                if (currentMenu) {
                    const categoriesResponse = await axios.get(`/api/categories/?menu=${currentMenu.id}`);
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

    // Update menu when language changes
    useEffect(() => {
        const matchingMenu = availableMenus.find(menu => menu.language === i18n.language) ||
                           availableMenus.find(menu => menu.is_default);
        if (matchingMenu) {
            setCurrentMenu(matchingMenu);
        }
    }, [i18n.language, availableMenus]);

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
                        <div className="text-center mb-5 fade-in">
                            <h1 className="display-4 mb-3">
                                <FaUtensils className="me-3" />
                                {restaurantName}
                            </h1>
                            <Badge bg="primary" className="px-3 py-2">
                                {t('customerMenuPage.table')}: {tableNumber}
                            </Badge>
                            <p className="text-light mt-3">
                                {t('customerMenuPage.subtitle')}
                            </p>
                        </div>

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
