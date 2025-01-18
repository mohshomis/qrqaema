import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategories, createCategory, deleteCategory, updateCategory, getRestaurantMenus } from '../../services/api';
import { FaUtensils, FaPlus, FaTrash, FaEdit, FaArrowRight } from 'react-icons/fa';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    Card,
    Alert,
    Modal,
    Badge
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import '../../styles/CustomerPages.css';
import '../../styles/CategoryManagementPage.css';

const CategoryManagementPage = () => {
    const { t } = useTranslation();
    const { restaurantId, menuId } = useParams();
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [menuName, setMenuName] = useState('');
    const [menuLanguage, setMenuLanguage] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryImage, setEditCategoryImage] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const categoriesResponse = await getCategories(restaurantId, menuId);
                setCategories(categoriesResponse.data.categories || []);
                if (categoriesResponse.data.menu) {
                    setMenuName(categoriesResponse.data.menu.name);
                    setMenuLanguage(categoriesResponse.data.menu.language);
                }
                setError(null);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError(t('categoryManagement.errors.fetchFailed'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [restaurantId, menuId, t]);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') {
            setError(t('categoryManagement.errors.nameRequired'));
            return;
        }
        try {
            await createCategory(restaurantId, newCategoryName, newCategoryImage, menuId);
            setNewCategoryName('');
            setNewCategoryImage(null);
            setSuccess(t('categoryManagement.success.created'));
            const response = await getCategories(restaurantId, menuId);
            setCategories(response.data.categories || []);
            handleCloseEditModal(); // Close the modal after successful creation
        } catch (error) {
            console.error('Error creating category:', error);
            setError(t('categoryManagement.errors.createFailed'));
        }
    };

    const handleDeleteClick = (category) => {
        setCategoryToDelete(category);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            if (!categoryToDelete?.id) {
                setError(t('categoryManagement.errors.invalidCategory'));
                return;
            }
            console.log('Deleting category:', categoryToDelete.id);
            await deleteCategory(categoryToDelete.id);
            setSuccess(t('categoryManagement.success.deleted'));
            const response = await getCategories(restaurantId, menuId);
            setCategories(response.data.categories || []);
        } catch (error) {
            console.error('Error deleting category:', error);
            setError(error.response?.data?.error || t('categoryManagement.errors.deleteFailed'));
        } finally {
            setShowDeleteConfirm(false);
            setCategoryToDelete(null);
        }
    };

    const handleShowEditModal = (category) => {
        setCurrentCategory(category);
        setEditCategoryName(category.name);
        setEditCategoryImage(null);
        setEditImagePreview(category.image_url || '');
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setCurrentCategory(null);
        setEditCategoryName('');
        setEditCategoryImage(null);
        setEditImagePreview('');
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (editCategoryName.trim() === '') {
            setError(t('categoryManagement.errors.nameRequired'));
            return;
        }
        try {
            await updateCategory(currentCategory.id, editCategoryName, editCategoryImage, menuId);
            setSuccess(t('categoryManagement.success.updated'));
            const response = await getCategories(restaurantId, menuId);
            setCategories(response.data.categories || []);
            handleCloseEditModal();
        } catch (error) {
            console.error('Error updating category:', error);
            setError(t('categoryManagement.errors.updateFailed'));
        }
    };

    const handleCategoryClick = (category) => {
        navigate(`/restaurant/${restaurantId}/menus/${menuId}/menu-items?category=${category.id}`);
    };

    return (
        <div className="page-container">
            <div className="background-overlay"></div>
            <Container className="category-management-container">
                <div className="category-management-header d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="text-light mb-2">
                            <FaUtensils className="me-2" />
                            {menuName}
                        </h1>
                        <Badge bg="info" className="me-2">
                            {menuLanguage.toUpperCase()}
                        </Badge>
                    </div>
                    <Button
                        onClick={() => setShowEditModal(true)}
                        className="add-category-button d-flex align-items-center gap-2"
                    >
                        <FaPlus className="me-2" />
                        {t('categoryManagement.addCategory')}
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
                    {!error && categories.length === 0 ? (
                        <Col>
                            <Alert variant="info">
                                {t('categoryManagement.noCategories')}
                            </Alert>
                        </Col>
                    ) : (
                        categories.map((category) => (
                            <Col key={category.id} xs={12} sm={6} md={4} lg={3}>
                                <Card
                                    className="category-card h-100"
                                    onClick={() => handleCategoryClick(category)}
                                >
                                    {category.image_url && (
                                        <div className="card-img-container">
                                            <Card.Img variant="top" src={category.image_url} alt={category.name} />
                                            <div className="img-overlay"></div>
                                        </div>
                                    )}
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title>{category.name}</Card.Title>
                                        <div className="category-actions">
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShowEditModal(category);
                                                }}
                                                className="category-action-button edit"
                                            >
                                                <FaEdit /> {t('categoryManagement.edit')}
                                            </Button>
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(category);
                                                }}
                                                className="category-action-button delete"
                                            >
                                                <FaTrash /> {t('categoryManagement.delete')}
                                            </Button>
                                            <Button className="category-action-button view">
                                                <FaArrowRight />
                                            </Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))
                    )}
                </Row>

                {/* Create/Edit Category Modal */}
                <Modal show={showEditModal} onHide={handleCloseEditModal} className="category-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>
                            {currentCategory
                                ? t('categoryManagement.editCategory')
                                : t('categoryManagement.createCategory')}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form onSubmit={currentCategory ? handleUpdateCategory : handleCreateCategory}>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('categoryManagement.form.name')}</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={currentCategory ? editCategoryName : newCategoryName}
                                    onChange={(e) =>
                                        currentCategory
                                            ? setEditCategoryName(e.target.value)
                                            : setNewCategoryName(e.target.value)
                                    }
                                    required
                                    className="category-form-control"
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>{t('categoryManagement.form.image')}</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        currentCategory
                                            ? setEditCategoryImage(e.target.files[0])
                                            : setNewCategoryImage(e.target.files[0])
                                    }
                                />
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseEditModal}>
                            {t('categoryManagement.cancel')}
                        </Button>
                        <Button
                            variant="primary"
                            onClick={currentCategory ? handleUpdateCategory : handleCreateCategory}
                        >
                            {currentCategory
                                ? t('categoryManagement.update')
                                : t('categoryManagement.create')}
                        </Button>
                    </Modal.Footer>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} className="category-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>{t('categoryManagement.deleteConfirm.title')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {t('categoryManagement.deleteConfirm.message', {
                            name: categoryToDelete?.name,
                        })}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                            {t('categoryManagement.cancel')}
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirm}>
                            {t('categoryManagement.delete')}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </div>
    );
};

export default CategoryManagementPage;
