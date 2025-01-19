import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getMenuItems, deleteMenuItem, createMenuItem, getMenuItemById, updateMenuItem, getCategories, getRestaurantMenus } from '../../services/api';
import { FaUtensils, FaPlus, FaTrash, FaEdit, FaArrowLeft } from 'react-icons/fa';
import OptimizedImage from '../../components/OptimizedImage';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    Card,
    Alert,
    Modal,
    Badge,
    Image
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import '../../styles/CustomerPages.css';

const MenuItemManagementPage = () => {
    const { t } = useTranslation();
    const { restaurantId, menuId } = useParams();
    const [searchParams] = useSearchParams();
    const categoryId = searchParams.get('category');
    const navigate = useNavigate();

    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [menuName, setMenuName] = useState('');
    const [menuLanguage, setMenuLanguage] = useState('');
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: null,
        options: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch menu details using api service
                const menuResponse = await getRestaurantMenus(restaurantId);
                const menuData = menuResponse.data.menus.find(menu => menu.id === menuId);
                if (menuData) {
                    setMenuName(menuData.name);
                    setMenuLanguage(menuData.language);
                } else {
                    console.error('Menu not found:', menuId);
                    setError(t('menuItemManagement.errors.menuNotFound'));
                }

                // Fetch categories
                const categoriesResponse = await getCategories(restaurantId, menuId);
                setCategories(categoriesResponse.data.categories || []);

                if (categoryId) {
                    const category = categoriesResponse.data.categories?.find(c => c.id === categoryId);
                    if (category) {
                        setCategoryName(category.name);
                    } else {
                        console.error('Category not found:', categoryId);
                        setError(t('menuItemManagement.errors.categoryNotFound'));
                    }
                }

                // Fetch menu items
                const itemsResponse = await getMenuItems(restaurantId, menuId, categoryId);
                setMenuItems(itemsResponse.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(t('menuItemManagement.errors.fetchFailed'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [restaurantId, menuId, categoryId, t]);

    const handleCreateItem = async (e) => {
        e.preventDefault();
        try {
            const formDataObj = new FormData();
            // Required fields
            formDataObj.append('name', formData.name);
            formDataObj.append('price', formData.price);
            formDataObj.append('restaurant', restaurantId);
            formDataObj.append('menu', menuId);
            formDataObj.append('category', categoryId);

            // Optional fields
            if (formData.description) {
                formDataObj.append('description', formData.description);
            }
            if (formData.image) {
                formDataObj.append('image', formData.image);
            }
            if (formData.options && formData.options.length > 0) {
                formDataObj.append('options', JSON.stringify(formData.options));
            }

            await createMenuItem(formDataObj);
            setSuccess(t('menuItemManagement.success.created'));
            setShowCreateModal(false);
            const response = await getMenuItems(restaurantId, menuId, categoryId);
            setMenuItems(response.data);
            setFormData({
                name: '',
                description: '',
                price: '',
                image: null,
                options: []
            });
        } catch (error) {
            setError(t('menuItemManagement.errors.createFailed'));
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!itemToDelete?.id) {
                setError(t('menuItemManagement.errors.invalidItem'));
                return;
            }
            console.log('Deleting menu item:', itemToDelete.id);
            await deleteMenuItem(itemToDelete.id);
            setSuccess(t('menuItemManagement.success.deleted'));
            const response = await getMenuItems(restaurantId, menuId, categoryId);
            setMenuItems(response.data);
        } catch (error) {
            console.error('Error deleting menu item:', error);
            setError(error.response?.data?.error || t('menuItemManagement.errors.deleteFailed'));
        } finally {
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    const handleEditItem = (item) => {
        navigate(`/restaurant/${restaurantId}/menus/${menuId}/menu-items/${item.id}/edit`);
    };

    const handleBackToCategories = () => {
        navigate(`/restaurant/${restaurantId}/menus/${menuId}/categories`);
    };

    return (
        <div className="page-container">
            <div className="background-overlay"></div>
            <Container className="py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="text-light mb-2">
                            <FaUtensils className="me-2" />
                            {menuName}
                            {categoryName && ` - ${categoryName}`}
                        </h1>
                        <Badge bg="info" className="me-2">
                            {menuLanguage.toUpperCase()}
                        </Badge>
                    </div>
                    <div>
                        <Button
                            variant="outline-light"
                            onClick={handleBackToCategories}
                            className="me-2 custom-button"
                        >
                            <FaArrowLeft className="me-2" />
                            {t('menuItemManagement.backToCategories')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="custom-button"
                        >
                            <FaPlus className="me-2" />
                            {t('menuItemManagement.addItem')}
                        </Button>
                    </div>
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
                    {menuItems.map((item) => (
                        <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                            <Card className="h-100 custom-card menu-item-card fade-in">
                                {item.image_url && (
                                    <div className="card-img-container">
                                        <OptimizedImage
                                            src={item.image_url}
                                            alt={item.name}
                                            className="card-img-top"
                                            sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, 33vw"
                                        />
                                        <div className="img-overlay"></div>
                                    </div>
                                )}
                                <Card.Body className="d-flex flex-column">
                                    <Card.Title>{item.name}</Card.Title>
                                    <Card.Text className="text-muted small mb-2">
                                        {item.description}
                                    </Card.Text>
                                    <Badge bg="info" className="mb-3 align-self-start">
                                        ${Number(item.price).toFixed(2)}
                                    </Badge>
                                    <div className="mt-auto d-flex flex-wrap gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="md"
                                            onClick={() => handleEditItem(item)}
                                            className="action-button"
                                            style={{ padding: '8px 16px' }}
                                        >
                                            <FaEdit className="me-2" /> {t('menuItemManagement.edit')}
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="md"
                                            onClick={() => handleDeleteClick(item)}
                                            className="action-button"
                                            style={{ padding: '8px 16px' }}
                                        >
                                            <FaTrash className="me-2" /> {t('menuItemManagement.delete')}
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Create Menu Item Modal */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('menuItemManagement.createItem')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={handleCreateItem}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('menuItemManagement.form.name')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('menuItemManagement.form.description')}</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('menuItemManagement.form.price')}</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('menuItemManagement.form.image')}</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            {t('menuItemManagement.cancel')}
                        </Button>
                        <Button variant="primary" onClick={handleCreateItem}>
                            {t('menuItemManagement.create')}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('menuItemManagement.deleteConfirm.title')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {t('menuItemManagement.deleteConfirm.message', {
                            name: itemToDelete?.name,
                        })}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                            {t('menuItemManagement.cancel')}
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirm}>
                            {t('menuItemManagement.delete')}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </div>
    );
};

export default MenuItemManagementPage;
