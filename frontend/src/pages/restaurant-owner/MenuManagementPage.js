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
import { API_URL } from '../../services/api';
import { useTranslation } from 'react-i18next';
import '../../styles/CustomerPages.css';
import '../../styles/MenuManagementPage.css';

const MenuManagementPage = () => {
    const { restaurantId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { token } = useContext(AuthContext);
    const [menus, setMenus] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editMenu, setEditMenu] = useState(null);
    const [formData, setFormData] = useState({
        language: '',
        is_default: false,
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [menuToDelete, setMenuToDelete] = useState(null);

    const getMenuName = (lang) => {
        switch(lang) {
            case 'en': return 'English Menu';
            case 'ar': return 'القائمة العربية';
            case 'tr': return 'Türkçe Menü';
            case 'nl': return 'Nederlands Menu';
            default: return '';
        }
    };

    const fetchMenus = async () => {
        try {
            const response = await axios.get(`${API_URL}/restaurants/${restaurantId}/menus/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMenus(response.data.menus || []);
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
                language: menu.language,
                is_default: menu.is_default,
            });
        } else {
            setEditMenu(null);
            setFormData({
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
            language: '',
            is_default: false,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const menuData = {
                ...formData,
                name: getMenuName(formData.language),
                restaurant: restaurantId
            };

            if (editMenu) {
                await axios.put(
                    `${API_URL}/restaurants/${restaurantId}/menus/${editMenu.id}/`,
                    menuData,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                setSuccess(t('menuManagement.success.updated'));
            } else {
                await axios.post(
                    `${API_URL}/restaurants/${restaurantId}/menus/`,
                    menuData,
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
            await axios.delete(`${API_URL}/restaurants/${restaurantId}/menus/${menuToDelete.id}/`, {
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
                `${API_URL}/restaurants/${restaurantId}/menus/${menuId}/set-default/`,
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
            <Container className="menu-management-container">
                <div className="menu-management-header d-flex justify-content-between align-items-center">
                    <h1 className="text-light mb-0">
                        <FaGlobe className="me-2" />
                        {t('menuManagement.title')}
                    </h1>
                    <Button
                        onClick={() => handleOpenDialog()}
                        className="add-menu-button d-flex align-items-center gap-2"
                    >
                        <FaPlus />
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
                                className="menu-card h-100"
                                onClick={() => handleMenuClick(menu)}
                            >
                                <Card.Body className="d-flex flex-column">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <Card.Title>{menu.name}</Card.Title>
                                        {menu.is_default && (
                                            <Badge className="default-badge">
                                                {t('menuManagement.default')}
                                            </Badge>
                                        )}
                                    </div>
                                    <Badge className="menu-language-badge mb-3">
                                        {menu.language.toUpperCase()}
                                    </Badge>
                                    <div className="menu-actions">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDialog(menu);
                                            }}
                                            className="menu-action-button edit"
                                        >
                                            <FaEdit /> {t('menuManagement.edit')}
                                        </Button>
                                        {!menu.is_default && (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(menu);
                                                }}
                                                className="menu-action-button delete"
                                            >
                                                <FaTrash /> {t('menuManagement.delete')}
                                            </Button>
                                        )}
                                        <Button className="menu-action-button view">
                                            <FaArrowRight />
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Create/Edit Menu Modal */}
                <Modal show={openDialog} onHide={handleCloseDialog} className="menu-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {editMenu ? t('menuManagement.editMenu') : t('menuManagement.createMenu')}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('menuManagement.form.language')}</Form.Label>
                                <Form.Select
                                    value={formData.language}
                                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                                    required
                                    className="menu-form-control"
                                >
                                    <option value="">{t('menuManagement.form.selectLanguage')}</option>
                                    <option value="en">🇬🇧 English</option>
                                    <option value="ar">🇸🇦 Arabic</option>
                                    <option value="tr">🇹🇷 Turkish</option>
                                    <option value="nl">🇳🇱 Dutch</option>
                                </Form.Select>
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
