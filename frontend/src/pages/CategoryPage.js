// src/pages/CategoryPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuItemsByCategory, getRestaurantPublicDetails } from '../services/api';
import Footer from '../components/Footer'; // Removed Header
import '../styles/Footer.css';
import '../styles/CategoryPage.css'; // Add the new CSS file for CategoryPage
import '../App.css';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Spinner,
    Alert,
} from 'react-bootstrap';
import {
    FaReceipt,
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
        <div className="category-page-container" style={{ position: 'relative', paddingBottom: '100px' }}>
            {/* Blurred Background Image */}
            {restaurantBackground && (
                <div
                    className="background-image"
                    style={{
                        backgroundImage: `url(${restaurantBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'fixed',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        filter: 'blur(4px)',
                        zIndex: -1,
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
                                        <Card className="h-100 shadow-sm" onClick={() => handleMenuItemClick(item.id)} style={{ cursor: 'pointer' }}>
                                            {item.image && (
                                                <Card.Img variant="top" src={item.image} alt={item.name} style={{ height: '150px', objectFit: 'cover' }} />
                                            )}
                                            <Card.Body className="d-flex flex-column">
                                                <Card.Title>{item.name}</Card.Title>
                                                <Card.Text className="mt-auto">
                                                    <strong>{t('categoryPage.price')}: </strong>${Number(item.price).toFixed(2)}
                                                </Card.Text>
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
                        <Button variant="secondary" onClick={() => navigate(-1)} className="mt-3">
                            {t('categoryPage.backButton')}
                        </Button>
                    </Col>
                </Row>
            </Container>

        </div>
    );
};

export default CategoryPage;
