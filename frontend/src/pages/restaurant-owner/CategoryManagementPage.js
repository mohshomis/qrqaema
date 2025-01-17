// src/pages/CategoryManagementPage.js

import React, { useState, useEffect } from 'react';
import { getCategories, createCategory, deleteCategory, updateCategory } from '../../services/api'; // Ensure these functions exist and are correctly implemented
import { useParams } from 'react-router-dom';
import { FaUpload, FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    Spinner,
    Image,
    Card,
    Alert,
    Modal,
} from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const CategoryManagementPage = () => {
    const { t } = useTranslation(); // Initialize translation
    const { restaurantId } = useParams();
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryImage, setNewCategoryImage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // States for Edit Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryImage, setEditCategoryImage] = useState(null);
    const [editImagePreview, setEditImagePreview] = useState('');

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await getCategories(restaurantId);
            setCategories(response.data);
            setError(null);
        } catch (error) {
            console.error(t('errors.fetchCategories'), error);
            setError(t('errors.fetchCategories'));
            toast.error(t('errors.fetchCategories'));
        } finally {
            setLoading(false);
        }
    };

    // Handle category creation
    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') {
            setError(t('errors.enterCategoryName'));
            toast.error(t('errors.enterCategoryName'));
            return;
        }
        try {
            setSubmitting(true);
            await createCategory(restaurantId, newCategoryName, newCategoryImage);
            setNewCategoryName('');
            setNewCategoryImage(null);
            fetchCategories();
            setError(null);
            toast.success(t('success.categoryAdded'));
        } catch (error) {
            console.error(t('errors.addCategory'), error);
            if (error.response && error.response.data) {
                // Concatenate all error messages
                const errorMessages = Object.values(error.response.data).flat().join(' ');
                setError(errorMessages);
                toast.error(errorMessages);
            } else {
                setError(t('errors.addCategory'));
                toast.error(t('errors.addCategory'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle category deletion
    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm(t('confirm.deleteCategory'))) {
            try {
                setSubmitting(true);
                await deleteCategory(categoryId);
                fetchCategories();
                setError(null);
                toast.success(t('success.categoryDeleted'));
            } catch (error) {
                console.error(t('errors.deleteCategory'), error);
                setError(t('errors.deleteCategory'));
                toast.error(t('errors.deleteCategory'));
            } finally {
                setSubmitting(false);
            }
        }
    };

    // Handle Image Change with Preview for New Category
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewCategoryImage(file);
        }
    };

    // Handle Edit Modal Show
    const handleShowEditModal = (category) => {
        setCurrentCategory(category);
        setEditCategoryName(category.name);
        setEditCategoryImage(null);
        setEditImagePreview(category.image_url || '');
        setShowEditModal(true);
    };

    // Handle Edit Modal Close
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setCurrentCategory(null);
        setEditCategoryName('');
        setEditCategoryImage(null);
        setEditImagePreview('');
    };

    // Handle Image Change with Preview for Edit
    const handleEditImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditCategoryImage(file);
            const previewURL = URL.createObjectURL(file);
            setEditImagePreview(previewURL);
        }
    };

    // Handle Category Update
    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        if (editCategoryName.trim() === '') {
            setError(t('errors.enterCategoryName'));
            toast.error(t('errors.enterCategoryName'));
            return;
        }
        try {
            setSubmitting(true);
            await updateCategory(currentCategory.id, editCategoryName, editCategoryImage);
            fetchCategories();
            setError(null);
            toast.success(t('success.categoryUpdated'));
            handleCloseEditModal();
        } catch (error) {
            console.error(t('errors.updateCategory'), error);
            if (error.response && error.response.data) {
                const errorMessages = Object.values(error.response.data).flat().join(' ');
                setError(errorMessages);
                toast.error(errorMessages);
            } else {
                setError(t('errors.updateCategory'));
                toast.error(t('errors.updateCategory'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Container className="mt-5">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <Row className="justify-content-center">
                <Col lg={8}>
                    <Card className="mb-4">
                        <Card.Header as="h5">{t('manageCategories')}</Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleCreateCategory} encType="multipart/form-data">
                                <Form.Group as={Row} className="mb-3" controlId="newCategoryName">
                                    <Form.Label column sm={3}>
                                        {t('categoryName')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="text"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            placeholder={t('enterCategoryNamePlaceholder')}
                                            required
                                        />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="newCategoryImage">
                                    <Form.Label column sm={3}>
                                        {t('categoryImage')}
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="newCategoryImagePreview">
                                    <Form.Label column sm={3}></Form.Label>
                                    <Col sm={9}>
                                        {newCategoryImage && (
                                            <div className="mt-3 text-center">
                                                <Image
                                                    src={URL.createObjectURL(newCategoryImage)}
                                                    alt={t('newCategoryImagePreview')}
                                                    rounded
                                                    fluid
                                                    style={{ maxHeight: '150px' }}
                                                />
                                                <p className="mt-2">{t('newCategoryImagePreview')}</p>
                                            </div>
                                        )}
                                    </Col>
                                </Form.Group>

                                <Row>
                                    <Col sm={{ span: 9, offset: 3 }}>
                                        <Button variant="success" type="submit" disabled={submitting}>
                                            {submitting ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                    />{' '}
                                                    {t('addingCategory')}
                                                </>
                                            ) : (
                                                <>
                                                    <FaPlus /> {t('addCategory')}
                                                </>
                                            )}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* Categories List */}
                    <Card>
                        <Card.Header as="h5">{t('categoriesList')}</Card.Header>
                        <Card.Body>
                            {loading ? (
                                <div className="text-center">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">{t('loading')}</span>
                                    </Spinner>
                                    <p className="mt-3">{t('loadingCategories')}</p>
                                </div>
                            ) : categories.length > 0 ? (
                                <ul className="list-group">
                                    {categories.map((category) => (
                                        <li key={category.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                {category.image_url && (
                                                    <Image
                                                        src={category.image_url}
                                                        alt={category.name}
                                                        rounded
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px' }}
                                                    />
                                                )}
                                                <span>{category.name}</span>
                                            </div>
                                            <div>
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleShowEditModal(category)}
                                                >
                                                    <FaEdit /> {t('edit')}
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteCategory(category.id)}
                                                    disabled={submitting}
                                                >
                                                    <FaTrash /> {t('delete')}
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center">{t('noCategoriesAvailable')}</p>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Edit Category Modal */}
            <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t('editCategory')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentCategory && (
                        <Form onSubmit={handleUpdateCategory} encType="multipart/form-data">
                            <Form.Group as={Row} className="mb-3" controlId="editCategoryName">
                                <Form.Label column sm={4}>
                                    {t('categoryName')} <span className="text-danger">*</span>
                                </Form.Label>
                                <Col sm={8}>
                                    <Form.Control
                                        type="text"
                                        value={editCategoryName}
                                        onChange={(e) => setEditCategoryName(e.target.value)}
                                        placeholder={t('enterCategoryNamePlaceholder')}
                                        required
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3" controlId="editCategoryImage">
                                <Form.Label column sm={4}>
                                    {t('categoryImage')}
                                </Form.Label>
                                <Col sm={8}>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageChange}
                                    />
                                </Col>
                            </Form.Group>

                            <Form.Group as={Row} className="mb-3" controlId="editCategoryImagePreview">
                                <Form.Label column sm={4}></Form.Label>
                                <Col sm={8}>
                                    {editImagePreview && (
                                        <div className="mt-3 text-center">
                                            <Image
                                                src={editImagePreview}
                                                alt={t('editCategoryImagePreview')}
                                                rounded
                                                fluid
                                                style={{ maxHeight: '150px' }}
                                            />
                                            <p className="mt-2">{t('editCategoryImagePreview')}</p>
                                        </div>
                                    )}
                                </Col>
                            </Form.Group>

                            <Row>
                                <Col sm={{ span: 8, offset: 4 }}>
                                    <Button variant="primary" type="submit" disabled={submitting}>
                                        {submitting ? (
                                            <>
                                                <Spinner
                                                    as="span"
                                                    animation="border"
                                                    size="sm"
                                                    role="status"
                                                    aria-hidden="true"
                                                />{' '}
                                                {t('updatingCategory')}
                                            </>
                                        ) : (
                                            <>
                                                <FaUpload /> {t('updateCategory')}
                                            </>
                                        )}
                                    </Button>
                                </Col>
                            </Row>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default CategoryManagementPage;
