// src/pages/MenuPage.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMenuItems, placeOrder } from '../services/api'; // API for fetching menu and placing order
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Spinner, Alert, Button, Card, Container, Row, Col } from 'react-bootstrap'; // Optional: Using React Bootstrap for styling

const MenuPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { restaurantId, tableNumber } = useParams(); // Get restaurantId and tableNumber from URL
    const [menuItems, setMenuItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const response = await getMenuItems(restaurantId);
                setMenuItems(response.data);
                setLoading(false);
            } catch (err) {
                console.error(t('menuPage.errors.fetchMenuItems'), err);
                setError(t('menuPage.errors.fetchMenuItems'));
                setLoading(false);
            }
        };

        if (restaurantId) {
            fetchMenuItems();
        }
    }, [restaurantId, t]);

    const handleItemSelect = (itemId) => {
        if (!selectedItems.includes(itemId)) {
            setSelectedItems([...selectedItems, itemId]); // Add item to the selected list if not already selected
        }
    };

    const handleOrderSubmit = async () => {
        if (selectedItems.length === 0) {
            setError(t('menuPage.errors.noItemsSelected'));
            return;
        }

        try {
            const orderData = {
                restaurant_id: restaurantId,
                table_number: tableNumber,
                items: selectedItems,
            };
            await placeOrder(orderData); // Place the order using the API
            alert(t('menuPage.success.orderPlaced'));
            // Optionally, redirect or reset the selected items
            setSelectedItems([]);
        } catch (err) {
            console.error(t('menuPage.errors.placeOrderFailed'), err);
            setError(t('menuPage.errors.placeOrderFailed'));
        }
    };

    if (loading) {
        return (
            <Container className="my-5 text-center">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">{t('menuPage.loading')}</span>
                </Spinner>
                <p className="mt-3">{t('menuPage.loading')}</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="my-5">
                <Alert variant="danger">
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="my-5" dir={i18n.dir()}>
            <h1 className="mb-4">{t('menuPage.title')}</h1>
            <Row>
                {menuItems.length > 0 ? (
                    menuItems.map(item => (
                        <Col key={item.id} xs={12} md={6} lg={4} className="mb-4">
                            <Card>
                                {item.image && (
                                    <Card.Img
                                        variant="top"
                                        src={item.image} // Ensure that the image URL is absolute
                                        alt={item.name}
                                        style={{ height: '200px', objectFit: 'cover' }} // Adjust image size as needed
                                    />
                                )}
                                <Card.Body>
                                    <Card.Title>{item.name}</Card.Title>
                                    <Card.Text>{item.description}</Card.Text>
                                    <Card.Text>
                                        {t('menuPage.price', { price: item.price })}
                                    </Card.Text>
                                    <Button
                                        variant={selectedItems.includes(item.id) ? "success" : "primary"}
                                        onClick={() => handleItemSelect(item.id)}
                                        disabled={selectedItems.includes(item.id)}
                                    >
                                        {selectedItems.includes(item.id) ? t('menuPage.added') : t('menuPage.addToOrder')}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))
                ) : (
                    <Col>
                        <p>{t('menuPage.noItems')}</p>
                    </Col>
                )}
            </Row>
            <div className="text-center mt-4">
                <Button
                    variant="success"
                    onClick={handleOrderSubmit}
                    disabled={selectedItems.length === 0}
                >
                    {t('menuPage.placeOrder')}
                </Button>
                {selectedItems.length > 0 && (
                    <p className="mt-2">
                        {t('menuPage.selectedItems')}: {selectedItems.length}
                    </p>
                )}
            </div>
        </Container>
    );
};

export default MenuPage;
