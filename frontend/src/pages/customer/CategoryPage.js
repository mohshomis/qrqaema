// src/pages/CategoryPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuItemsByCategory, getRestaurantPublicDetails } from '../../services/api';
import Footer from '../../components/Footer'; // Removed Header
import '../../styles/Footer.css';
import '../../styles/CustomerPages.css';
import '../../App.css';
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
    FaReceipt,
    FaDollarSign,
    FaInfoCircle,
    FaArrowLeft
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const CategoryPage = ({ addToBasket }) => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { restaurantId, categoryId, tableNumber } = useParams(); // Include tableNumber from params
    const navigate = useNavigate();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restaurantBackground, setRestaurantBackground] = useState(null);
    const [restaurantName, setRestaurantName] = useState('');

    useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                // Fetch restaurant details
                const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
                const restaurantData = restaurantResponse.data;
                setRestaurantBackground(restaurantData.background_image_url);
                setRestaurantName(restaurantData.name);

                // Fetch menu items for the category
                console.log(categoryId);
                const menuResponse = await getMenuItemsByCategory(categoryId);
                console.log(categoryId);
                setMenuItems(menuResponse.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching menu items or restaurant details:', err);
                setError(t('categoryPage.errors.fetchFailed'));
                setLoading(false);
            }
        };

        if (restaurantId && categoryId) {
            fetchCategoryData();
        } else {
            setError(t('categoryPage.errors.invalidIds'));
            setLoading(false);
        }
    }, [restaurantId, categoryId, t]);

    // Include tableNumber in the URL when navigating to the menu item
    const handleMenuItemClick = (itemId) => {
        navigate(`/restaurant/${restaurantId}/table/${tableNumber}/menu-item/${itemId}`);
    };

    if (loading) return (
        <Container className="my-5 text-center">
            <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">{t('categoryPage.loading')}</span>
            </Spinner>
            <p className="mt-3">{t('categoryPage.loading')}</p>
        </Container>
    );

    if (error) return (
        <Container className="my-5">
            <Alert variant="danger" className="d-flex align-items-center">
                <FaReceipt className="me-2" />
                {error}
            </Alert>
        </Container>
    );

    return (
        <div className="page-container" dir={i18n.dir()}>
            {/* Background overlay */}
            <div className="background-overlay"></div>
            {/* Blurred Background Image */}
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
                    aria-label={t('categoryPage.aria.backgroundImage')}
                />
            )}

            {/* Foreground Content */}
            <Container className="my-5">
                <Row className="justify-content-center">
                    <Col lg={10} md={12}>
                        <h1 className="mb-4">{t('categoryPage.title', { restaurantName })}</h1>
                        <Row>
                            {menuItems.length > 0 ? (
                                menuItems.map((item) => (
                                    <Col key={item.id} sm={6} md={4} lg={3} className="mb-4">
                        <Card 
                            className="h-100 custom-card menu-item-card fade-in" 
                            onClick={() => handleMenuItemClick(item.id)}
                        >
                            <div className="position-relative">
                                {item.image && (
                                    <div className="card-img-container">
                                        <Card.Img variant="top" src={item.image} alt={item.name} />
                                        <div className="img-overlay"></div>
                                    </div>
                                )}
                                <div className="price-tag">
                                    <FaDollarSign className="me-1" />
                                    {Number(item.price).toFixed(2)}
                                </div>
                            </div>
                            <Card.Body className="d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <Card.Title className="mb-0">{item.name}</Card.Title>
                                    <Badge bg="success" className="ms-2">
                                        {t('categoryPage.available')}
                                    </Badge>
                                </div>
                                {item.description && (
                                    <Card.Text className="text-muted small mb-3">
                                        {item.description}
                                    </Card.Text>
                                )}
                                <Button 
                                    variant="outline-primary" 
                                    className="mt-auto custom-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleMenuItemClick(item.id);
                                    }}
                                >
                                    <FaInfoCircle className="me-2" />
                                    {t('categoryPage.viewDetails')}
                                </Button>
                            </Card.Body>
                        </Card>
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
                        <div className="d-flex justify-content-between align-items-center mt-4">
                            <Button 
                                variant="outline-light" 
                                onClick={() => navigate(-1)} 
                                className="custom-button"
                            >
                                <FaArrowLeft className="me-2" />
                                {t('categoryPage.backButton')}
                            </Button>
                            <Badge bg="primary" className="px-3 py-2">
                                {t('categoryPage.itemCount', { count: menuItems.length })}
                            </Badge>
                        </div>
                    </Col>
                </Row>
            </Container>

        </div>
    );
};

export default CategoryPage;
