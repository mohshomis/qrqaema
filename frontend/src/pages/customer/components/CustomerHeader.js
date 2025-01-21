import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../../styles/Header.css';
import { Modal, Button, Form, NavDropdown, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { createHelpRequest } from '../../../services/api';
import { useTranslation } from 'react-i18next';
import { FaLanguage } from 'react-icons/fa';
import { BiCart, BiHelpCircle, BiTable, BiDollarCircle } from 'react-icons/bi';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CustomerHeader = ({ totalPrice, basket, restaurantId, tableNumber, menuId, availableMenus, currentMenu, onMenuChange }) => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);

    const [showHelpModal, setShowHelpModal] = useState(false);
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleViewBasket = () => {
        if (!restaurantId || !tableNumber || !menuId) {
            console.error('Missing required IDs:', { restaurantId, tableNumber, menuId });
            toast.error(t('header.errors.missingRestaurantOrTable'));
            return;
        }

        // Ensure all IDs are valid
        const parsedRestaurantId = parseInt(restaurantId, 10);
        const parsedTableNumber = parseInt(tableNumber, 10);
        const parsedMenuId = parseInt(menuId, 10);

        if (isNaN(parsedRestaurantId) || isNaN(parsedTableNumber) || isNaN(parsedMenuId)) {
            console.error('Invalid ID values:', {
                restaurantId: parsedRestaurantId,
                tableNumber: parsedTableNumber,
                menuId: parsedMenuId
            });
            toast.error(t('header.errors.invalidIds'));
            return;
        }

        navigate(`/restaurant/${parsedRestaurantId}/menu/${parsedMenuId}/order-basket/${parsedTableNumber}`);
    };

    const handleShowHelpModal = () => setShowHelpModal(true);
    const handleCloseHelpModal = () => {
        setShowHelpModal(false);
        setDescription('');
    };

    const handleSubmitHelpRequest = async (e) => {
        e.preventDefault();

        const trimmedDescription = description.trim();

        const data = {
            restaurant: restaurantId,
            table_number: tableNumber,
            description: trimmedDescription ? trimmedDescription : null,
        };

        try {
            setIsSubmitting(true);
            const response = await createHelpRequest(data);
            if (response.status === 201) {
                toast.success(t('header.helpRequestSuccess'));
                handleCloseHelpModal();
            } else {
                const errorData = response.data;
                toast.error(t('header.helpRequestFailed', { error: JSON.stringify(errorData) }));
            }
        } catch (error) {
            console.error(t('header.errors.submitHelpRequest'), error);
            toast.error(t('header.helpRequestError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const changeLanguage = (lng) => {
        // Change UI language
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);

        // Find and switch to corresponding menu if available
        if (availableMenus) {
            const matchingMenu = availableMenus.find(menu => menu.language === lng);
            if (matchingMenu) {
                // Let the parent handle navigation and state updates
                onMenuChange(matchingMenu);
                localStorage.setItem(`restaurant_${restaurantId}_menu`, matchingMenu.id);
                localStorage.setItem(`restaurant_${restaurantId}_language`, lng);
            }
        }
    };

    const renderTooltip = (message) => (props) => (
        <Tooltip id="button-tooltip" {...props}>
            {message}
        </Tooltip>
    );

    return (
        <>
            <header
                className="navbar navbar-light bg-white shadow-sm py-2 py-md-3 sticky-top"
                dir={i18n.dir()}
                style={{ overflow: 'visible' }}
            >
                <div
                    className="container-fluid  justify-content-between align-items-center flex-nowrap w-100"
                    style={{ overflow: 'visible', position: 'relative' }}
                >
                    {/* Left Section: Table Number and Total Price */}
                    <div className="d-flex align-items-center flex-shrink-1 me-2">
                        {tableNumber && (
                            <span className="text-muted d-flex align-items-center me-2">
                                <BiTable className="me-1" />
                                <span className="me-1 d-none d-md-inline">{t('header.tableNumber')}:</span>
                                <strong>{tableNumber}</strong>
                            </span>
                        )}
                        <span className="text-muted d-flex align-items-center">
                            <BiDollarCircle className="me-1" />
                            <span className="me-1 d-none d-md-inline">{t('header.total')}:</span>
                            <strong>${totalPrice.toFixed(2)}</strong>
                        </span>
                    </div>

                    {/* Right Section: View Basket, Help, and Language Selector */}
                    <div className="d-flex  flex-shrink-0" style={{ overflow: 'visible' }}>
                        {/* Language Selector */}
                        <NavDropdown
                            title={
                                <>
                                    <FaLanguage className="me-1" />
                                    <span className="d-none d-sm-inline">{i18n.language.toUpperCase()}</span>
                                </>
                            }
                            id="language-dropdown"
                            className="text-dark me-1"
                            menuVariant="light"
                            style={{ zIndex: 1050 }}
                            drop="down"
                        >
                            {availableMenus ? (
                                availableMenus.map(menu => (
                                    <NavDropdown.Item 
                                        key={menu.language}
                                        onClick={() => changeLanguage(menu.language)}
                                        active={currentMenu?.language === menu.language}
                                    >
                                        {menu.language === 'en' && '🇬🇧 English'}
                                        {menu.language === 'ar' && '🇸🇦 العربية'}
                                        {menu.language === 'tr' && '🇹🇷 Türkçe'}
                                        {menu.language === 'nl' && '🇳🇱 Nederlands'}
                                    </NavDropdown.Item>
                                ))
                            ) : (
                                <>
                                    <NavDropdown.Item onClick={() => changeLanguage('en')}>
                                        🇬🇧 English
                                    </NavDropdown.Item>
                                    <NavDropdown.Item onClick={() => changeLanguage('ar')}>
                                        🇸🇦 العربية
                                    </NavDropdown.Item>
                                    <NavDropdown.Item onClick={() => changeLanguage('tr')}>
                                        🇹🇷 Türkçe
                                    </NavDropdown.Item>
                                    <NavDropdown.Item onClick={() => changeLanguage('nl')}>
                                        🇳🇱 Nederlands
                                    </NavDropdown.Item>
                                </>
                            )}
                        </NavDropdown>

                        {/* View Basket Button */}
                        <OverlayTrigger
                            placement="bottom"
                            overlay={renderTooltip(t('header.viewBasketAriaLabel'))}
                        >
                            <button
                                className="btn btn-primary btn-sm px-2 py-1 d-flex align-items-center basket-button me-1"
                                onClick={handleViewBasket}
                                aria-label={t('header.viewBasketAriaLabel')}
                            >
                                <BiCart size={20} className="me-1" />
                                <span className="d-none d-md-inline">{t('header.viewBasket')}</span>
                                <span className="d-inline d-md-none">{`${totalItems}`}</span>
                            </button>
                        </OverlayTrigger>

                        {/* Help Request Button */}
                        <OverlayTrigger
                            placement="bottom"
                            overlay={renderTooltip(t('header.requestHelpAriaLabel'))}
                        >
                            <button
                                className="btn btn-secondary btn-sm px-2 py-1 d-flex align-items-center"
                                onClick={handleShowHelpModal}
                                aria-label={t('header.requestHelpAriaLabel')}
                            >
                                <BiHelpCircle size={20} className="me-1" />
                                <span className="d-none d-md-inline">{t('header.requestHelp')}</span>
                            </button>
                        </OverlayTrigger>
                    </div>
                </div>
            </header>

            {/* Help Request Modal */}
            <Modal show={showHelpModal} onHide={handleCloseHelpModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t('header.helpModal.title')}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmitHelpRequest}>
                    <Modal.Body>
                        <Form.Group controlId="helpDescription">
                            <Form.Label>{t('header.helpModal.descriptionLabel')}</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('header.helpModal.descriptionPlaceholder')}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseHelpModal}>
                            {t('header.helpModal.cancel')}
                        </Button>
                        <Button variant="primary" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? t('header.helpModal.submitting') : t('header.helpModal.submit')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Toast Container for Notifications */}
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={i18n.dir() === 'rtl'}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </>
    );
};

export default CustomerHeader;
