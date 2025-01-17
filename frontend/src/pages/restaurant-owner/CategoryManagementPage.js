import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCategories, createCategory, deleteCategory, updateCategory } from '../../services/api';
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
                // Fetch menu details
                const menuResponse = await fetch(`/api/menus/${menuId}/`);
                const menuData = await menuResponse.json();
                setMenuName(menuData.name);
                setMenuLanguage(menuData.language);

                // Fetch categories for this menu
                const categoriesResponse = await getCategories(restaurantId, menuId);
                setCategories(categoriesResponse.data);
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
            setCategories(response.data);
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
            await deleteCategory(categoryToDelete.id);
            setSuccess(t('categoryManagement.success.deleted'));
            const response = await getCategories(restaurantId, menuId);
            setCategories(response.data);
        } catch (error) {
            console.error('Error deleting category:', error);
            setError(t('categoryManagement.errors.deleteFailed'));
        }
        setShowDeleteConfirm(false);
        setCategoryToDelete(null);
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
            setCategories(response.data);
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
            <Container className="py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
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
                        variant="primary"
                        onClick={() => setShowEditModal(true)}
                        className="d-flex align-items-center custom-button"
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
                    {categories.map((category) => (
                        <Col key={category.id} xs={12} sm={6} md={4} lg={3}>
                            <Card 
                                className="h-100 custom-card category-card fade-in"
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
                                    <div className="mt-auto d-flex gap-2">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleShowEditModal(category);
                                            }}
                                            className="flex-grow-0"
                                        >
                                            <FaEdit /> {t('categoryManagement.edit')}
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(category);
                                            }}
                                            className="flex-grow-0"
                                        >
                                            <FaTrash /> {t('categoryManagement.delete')}
                                        </Button>
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

                {/* Create/Edit Category Modal */}
                <Modal show={showEditModal} onHide={handleCloseEditModal}>
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
                <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)}>
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
