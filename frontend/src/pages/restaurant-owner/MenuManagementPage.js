import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Row,
    Col,
    Card,
    Button,
    Form,
    Modal,
    Alert,
    Badge
} from 'react-bootstrap';
import { FaGlobe, FaEdit, FaTrash, FaPlus, FaArrowRight } from 'react-icons/fa';
import { AuthContext } from '../../AuthContext';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../../styles/CustomerPages.css';

const MenuManagementPage = () => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { token } = useContext(AuthContext);
    const [menus, setMenus] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMenu, setEditMenu] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        language: '',
        is_default: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [menuToDelete, setMenuToDelete] = useState(null);

    const fetchMenus = async () => {
        try {
            const response = await axios.get(`/api/restaurants/${restaurantId}/menus/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMenus(response.data);
        } catch (err) {
            setError(t('menuManagement.errors.fetchFailed'));
        }
    };

    useEffect(() => {
        fetchMenus();
    }, [restaurantId, token]);

    const handleOpenDialog = (menu = null) => {
        if (menu) {
            setEditMenu(menu);
            setFormData({
                name: menu.name,
                language: menu.language,
                is_default: menu.is_default,
            });
        } else {
            setEditMenu(null);
            setFormData({
                name: '',
                language: '',
                is_default: false,
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditMenu(null);
        setFormData({
            name: '',
            language: '',
            is_default: false,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMenu) {
                await axios.put(
                    `/api/restaurants/${restaurantId}/menus/${editMenu.id}/`,
                    { ...formData, restaurant: restaurantId },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setSuccess(t('menuManagement.success.updated'));
            } else {
                await axios.post(
                    `/api/restaurants/${restaurantId}/menus/`,
                    { ...formData, restaurant: restaurantId },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setSuccess(t('menuManagement.success.created'));
            }
            handleCloseDialog();
            fetchMenus();
        } catch (err) {
            setError(err.response?.data?.message || t('menuManagement.errors.saveFailed'));
        }
    };

    const handleDeleteClick = (menu) => {
        setMenuToDelete(menu);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await axios.delete(`/api/restaurants/${restaurantId}/menus/${menuToDelete.id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccess(t('menuManagement.success.deleted'));
            fetchMenus();
        } catch (err) {
            setError(t('menuManagement.errors.deleteFailed'));
        }
        setShowDeleteConfirm(false);
        setMenuToDelete(null);
    };

    const handleSetDefault = async (menuId) => {
        try {
            await axios.post(
                `/api/restaurants/${restaurantId}/menus/${menuId}/set-default/`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            setSuccess(t('menuManagement.success.defaultUpdated'));
            fetchMenus();
        } catch (err) {
            setError(t('menuManagement.errors.setDefaultFailed'));
        }
    };

    const handleMenuClick = (menu) => {
        navigate(`/restaurant/${restaurantId}/menus/${menu.id}/categories`);
    };

    return (
        <div className="page-container">
            <div className="background-overlay"></div>
            <Container className="py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="text-light">
                        <FaGlobe className="me-2" />
                        {t('menuManagement.title')}
                    </h1>
                    <Button
                        variant="primary"
                        onClick={() => handleOpenDialog()}
                        className="d-flex align-items-center custom-button"
                    >
                        <FaPlus className="me-2" />
                        {t('menuManagement.addMenu')}
                    </Button>
                </div>

                {error && (
                    <Alert variant="danger" className="mb-4" onClose={() => setError('')} dismissible>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert variant="success" className="mb-4" onClose={() => setSuccess('')} dismissible>
                        {success}
                    </Alert>
                )}

                <Row className="g-4">
                    {menus.map((menu) => (
                        <Col key={menu.id} xs={12} sm={6} md={4} lg={3}>
                            <Card 
                                className="h-100 custom-card menu-card fade-in"
                                onClick={() => handleMenuClick(menu)}
                            >
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <Card.Title className="mb-0">{menu.name}</Card.Title>
                                        {menu.is_default && (
                                            <Badge bg="success">
                                                {t('menuManagement.default')}
                                            </Badge>
                                        )}
                                    </div>
                                    <Badge bg="info" className="mb-3 align-self-start">
                                        {menu.language.toUpperCase()}
                                    </Badge>
                                    <div className="mt-auto d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDialog(menu);
                                            }}
                                            className="flex-grow-0"
                                        >
                                            <FaEdit /> {t('menuManagement.edit')}
                                        </Button>
                                        {!menu.is_default && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(menu);
                                                }}
                                                className="flex-grow-0"
                                            >
                                                <FaTrash /> {t('menuManagement.delete')}
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline-success"
                                            size="sm"
                                            className="ms-auto"
                                        >
                                            <FaArrowRight />
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Create/Edit Menu Modal */}
                <Modal show={openDialog} onHide={handleCloseDialog}>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editMenu ? t('menuManagement.editMenu') : t('menuManagement.createMenu')}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('menuManagement.form.name')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('menuManagement.form.language')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    required
                                    placeholder="en, es, fr, etc."
                                />
                                <Form.Text className="text-muted">
                                    {t('menuManagement.form.languageHelp')}
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Check
                                    type="checkbox"
                                    label={t('menuManagement.form.setDefault')}
                                    checked={formData.is_default}
                                    onChange={(e) =>
                                        setFormData({ ...formData, is_default: e.target.checked })
                                    }
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseDialog}>
                            {t('menuManagement.cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {editMenu ? t('menuManagement.update') : t('menuManagement.create')}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('menuManagement.deleteConfirm.title')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {t('menuManagement.deleteConfirm.message', { name: menuToDelete?.name })}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                            {t('menuManagement.cancel')}
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirm}>
                            {t('menuManagement.delete')}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </div>
    );
};

export default MenuManagementPage;
