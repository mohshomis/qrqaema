// src/pages/CustomerMenuPage.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRestaurantPublicDetails, getCategories } from '../../services/api';
import Footer from '../../components/Footer';
import '../../styles/Footer.css';
import '../../styles/CustomerMenuPage.css';
import '../../App.css';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';

const CustomerMenuPage = ({ basketItems, addToBasket }) => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { restaurantId, tableNumber } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [restaurantBackground, setRestaurantBackground] = useState(null);
    const [restaurantName, setRestaurantName] = useState('');

    useEffect(() => {
        const fetchRestaurantData = async () => {
            try {
                const restaurantResponse = await getRestaurantPublicDetails(restaurantId);
                setRestaurantBackground(restaurantResponse.data.background_image_url);
                setRestaurantName(restaurantResponse.data.name);

                const categoriesResponse = await getCategories(restaurantId);
                setCategories(categoriesResponse.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching categories or restaurant details:', err);
                setError(t('customerMenuPage.errors.fetchFailed'));
                setLoading(false);
            }
        };

        fetchRestaurantData();
    }, [restaurantId, t]);

    // Handle category click and include tableNumber in the route
    const handleCategoryClick = (categoryId) => {
        navigate(`/restaurant/${restaurantId}/table/${tableNumber}/category/${categoryId}`);
    };

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">{t('customerMenuPage.loading')}</span>
                </Spinner>
                <p className="mt-3">{t('customerMenuPage.loading')}</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5">
                <Alert variant="danger" className="d-flex align-items-center justify-content-center">
                    {t('customerMenuPage.error')}
                </Alert>
            </Container>
        );
    }

    return (
        <div className="container customer-menu-page" dir={i18n.dir()} style={{ position: 'relative', paddingBottom: '100px' }}>
            {/* Background Image */}
            {restaurantBackground && (
                <div
                    className="background-image"
                    style={{
                        backgroundImage: `url(${restaurantBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        zIndex: -1,
                    }}
                    aria-label={t('customerMenuPage.aria.backgroundImage', { restaurantName })}
                />
            )}

            {/* Content */}
            <div className="content">
                <h1 className="text-center my-4">
                    {t('customerMenuPage.title', { tableNumber })}
                </h1>
                <Row className="g-4">
                    {categories.length > 0 ? (
                        categories.map(category => (
                            <Col key={category.id} xs={6} md={4} lg={3}>
                                <Card
                                    className="h-100 border-0 shadow-sm category-card"
                                    onClick={() => handleCategoryClick(category.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {category.image_url && (
                                        <Card.Img
                                            src={category.image_url}
                                            alt={category.name}
                                            className="card-img-top img-fluid rounded-top"
                                            style={{ height: '150px', objectFit: 'cover' }}
                                        />
                                    )}
                                    <Card.Body className="d-flex flex-column justify-content-between">
                                        <Card.Title className="text-center">{category.name}</Card.Title>
                                        <Card.Text className="text-center">
                                            {category.description}
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))
                    ) : (
                        <Col>
                            <p className="text-center">{t('customerMenuPage.noCategories')}</p>
                        </Col>
                    )}
                </Row>
            </div>


        </div>
    );
};

export default CustomerMenuPage;
