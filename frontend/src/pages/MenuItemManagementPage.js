// src/pages/MenuItemManagementPage.js

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
    getMenuItems, 
    deleteMenuItem, 
    createMenuItem, 
    getMenuItemById, 
    updateMenuItem, 
    getCategories 
} from '../services/api';
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
import { FaPlus, FaTrash, FaEdit, FaUpload } from 'react-icons/fa';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const MenuItemManagementPage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { restaurantId } = useParams();
    const [menuItems, setMenuItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // States for Create Menu Item Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newMenuItem, setNewMenuItem] = useState({
        name: '',
        description: '',
        price: '',
        imageFile: null,
        categoryId: '',
        options: [],
    });
    const [newPreviewImage, setNewPreviewImage] = useState(null);

    // States for Edit Menu Item Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentMenuItem, setCurrentMenuItem] = useState(null);
    const [editMenuItem, setEditMenuItem] = useState({
        name: '',
        description: '',
        price: '',
        imageFile: null,
        categoryId: '',
        options: [],
    });
    const [editPreviewImage, setEditPreviewImage] = useState(null);
    const [existingImageUrl, setExistingImageUrl] = useState(null);

    useEffect(() => {
        fetchMenuItems();
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]);

    const fetchMenuItems = async () => {
        try {
            setLoading(true);
            const response = await getMenuItems(restaurantId);
            setMenuItems(response.data);
            setError(null);
        } catch (error) {
            console.error(t('errors.fetchMenuItems'), error);
            setError(t('errors.fetchMenuItems'));
            toast.error(t('errors.fetchMenuItems'));
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await getCategories(restaurantId);
            setCategories(response.data);
        } catch (error) {
            console.error(t('errors.fetchCategories'), error);
            toast.error(t('errors.fetchCategories'));
        }
    };

    // Handle Delete Menu Item
    const handleDeleteMenuItem = async (menuItemId) => {
        if (window.confirm(t('confirm.deleteMenuItem'))) {
            try {
                setSubmitting(true);
                await deleteMenuItem(menuItemId);
                fetchMenuItems();
                setError(null);
                toast.success(t('success.menuItemDeleted'));
            } catch (error) {
                console.error(t('errors.deleteMenuItem'), error);
                setError(t('errors.deleteMenuItem'));
                toast.error(t('errors.deleteMenuItem'));
            } finally {
                setSubmitting(false);
            }
        }
    };

    // Handle Open Create Modal
    const handleShowCreateModal = () => {
        setShowCreateModal(true);
    };

    // Handle Close Create Modal
    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
        setNewMenuItem({
            name: '',
            description: '',
            price: '',
            imageFile: null,
            categoryId: '',
            options: [],
        });
        setNewPreviewImage(null);
        setError(null);
    };

    // Handle Open Edit Modal
    const handleShowEditModal = async (menuItemId) => {
        try {
            const response = await getMenuItemById(restaurantId, menuItemId);
            const data = response.data;
            setCurrentMenuItem(data);
            setEditMenuItem({
                name: data.name,
                description: data.description,
                price: data.price,
                imageFile: null,
                categoryId: data.category,
                options: data.options || [],
            });
            setExistingImageUrl(data.image_url);
            setEditPreviewImage(null);
            setShowEditModal(true);
        } catch (error) {
            console.error(t('errors.fetchMenuItem'), error);
            setError(t('errors.fetchMenuItem'));
            toast.error(t('errors.fetchMenuItem'));
        }
    };

    // Handle Close Edit Modal
    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setCurrentMenuItem(null);
        setEditMenuItem({
            name: '',
            description: '',
            price: '',
            imageFile: null,
            categoryId: '',
            options: [],
        });
        setEditPreviewImage(null);
        setExistingImageUrl(null);
        setError(null);
    };

    // Handle Image Selection and Compression for Create
    const handleCreateImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);

                // Get the original file extension
                const extension = file.name.split('.').pop();
                // Set the name of the compressed file
                compressedFile.name = `compressed_image.${extension}`;

                setNewMenuItem((prev) => ({ ...prev, imageFile: compressedFile }));

                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewPreviewImage(reader.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error(t('errors.imageProcessingFailed'), error);
                toast.error(t('errors.imageProcessingFailed'));
            }
        }
    };

    // Handle Image Selection and Compression for Edit
    const handleEditImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);

                // Get the original file extension
                const extension = file.name.split('.').pop();
                // Set the name of the compressed file
                compressedFile.name = `compressed_image.${extension}`;

                setEditMenuItem((prev) => ({ ...prev, imageFile: compressedFile }));

                const reader = new FileReader();
                reader.onloadend = () => {
                    setEditPreviewImage(reader.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error(t('errors.imageProcessingFailed'), error);
                toast.error(t('errors.imageProcessingFailed'));
            }
        } else {
            console.log(t('noFileSelected'));
            setEditMenuItem((prev) => ({ ...prev, imageFile: null }));
            setEditPreviewImage(null);
        }
    };

    const handleCreateMenuItem = async (e) => {
        e.preventDefault();
        // Basic validation
        if (
            newMenuItem.name.trim() === '' ||
            newMenuItem.price === '' ||
            newMenuItem.categoryId === ''
        ) {
            setError(t('errors.fillRequiredFields'));
            toast.error(t('errors.fillRequiredFields'));
            return;
        }

        // Price validation
        if (parseFloat(newMenuItem.price) > 9999.99) {
            setError(t('errors.priceExceedsLimit'));
            toast.error(t('errors.priceExceedsLimit'));
            return;
        }

        // Validate that each option has a name and at least one choice
        for (let option of newMenuItem.options) {
            if (option.name.trim() === '') {
                setError(t('errors.optionNameRequired'));
                toast.error(t('errors.optionNameRequired'));
                return;
            }
            if (!option.choices || option.choices.length === 0) {
                setError(t('errors.atLeastOneChoice'));
                toast.error(t('errors.atLeastOneChoice'));
                return;
            }
            for (let choice of option.choices) {
                if (choice.name.trim() === '' || choice.price_modifier === '') {
                    setError(t('errors.choiceFieldsRequired'));
                    toast.error(t('errors.choiceFieldsRequired'));
                    return;
                }
            }
        }

        // Construct FormData
        const formData = new FormData();
        formData.append('name', newMenuItem.name);
        formData.append('description', newMenuItem.description);
        formData.append('price', newMenuItem.price);
        formData.append('category', newMenuItem.categoryId);
        formData.append('restaurant', restaurantId);

        if (newMenuItem.imageFile) {
            formData.append('image', newMenuItem.imageFile, newMenuItem.imageFile.name);
        }

        // Stringify the options array before appending it to FormData
        formData.append('options', JSON.stringify(newMenuItem.options));

        try {
            setSubmitting(true);
            await createMenuItem(formData);
            toast.success(t('success.menuItemCreated'));
            handleCloseCreateModal();
            fetchMenuItems();
        } catch (error) {
            console.error(t('errors.createMenuItemFailed'), error);
            if (error.response && error.response.data) {
                const errorMessages = Object.values(error.response.data).flat().join(' ');
                setError(errorMessages);
                toast.error(errorMessages);
            } else {
                setError(t('errors.createMenuItemFailed'));
                toast.error(t('errors.createMenuItemFailed'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Update Menu Item
    const handleUpdateMenuItem = async (e) => {
        e.preventDefault();
        // Basic validation
        if (
            editMenuItem.name.trim() === '' ||
            editMenuItem.price === '' ||
            editMenuItem.categoryId === ''
        ) {
            setError(t('errors.fillRequiredFields'));
            toast.error(t('errors.fillRequiredFields'));
            return;
        }

        // Price validation
        if (parseFloat(editMenuItem.price) > 9999.99) {
            setError(t('errors.priceExceedsLimit'));
            toast.error(t('errors.priceExceedsLimit'));
            return;
        }

        // Validate that each option has a name and at least one choice
        for (let option of editMenuItem.options) {
            if (option.name.trim() === '') {
                setError(t('errors.optionNameRequired'));
                toast.error(t('errors.optionNameRequired'));
                return;
            }
            if (!option.choices || option.choices.length === 0) {
                setError(t('errors.atLeastOneChoice'));
                toast.error(t('errors.atLeastOneChoice'));
                return;
            }
            for (let choice of option.choices) {
                if (choice.name.trim() === '' || choice.price_modifier === '') {
                    setError(t('errors.choiceFieldsRequired'));
                    toast.error(t('errors.choiceFieldsRequired'));
                    return;
                }
            }
        }

        // Construct FormData
        const formData = new FormData();
        formData.append('name', editMenuItem.name);
        formData.append('description', editMenuItem.description);
        formData.append('price', editMenuItem.price);
        formData.append('category', editMenuItem.categoryId);
        formData.append('restaurant', restaurantId);

        if (editMenuItem.imageFile) {
            formData.append('image', editMenuItem.imageFile, editMenuItem.imageFile.name);
        }

        // Stringify the options array before appending it to FormData
        formData.append('options', JSON.stringify(editMenuItem.options));

        try {
            setSubmitting(true);
            await updateMenuItem(currentMenuItem.id, formData);
            toast.success(t('success.menuItemUpdated'));
            handleCloseEditModal();
            fetchMenuItems();
        } catch (error) {
            console.error(t('errors.updateMenuItemFailed'), error);
            if (error.response && error.response.data) {
                const errorMessages = Object.values(error.response.data).flat().join(' ');
                setError(errorMessages);
                toast.error(errorMessages);
            } else {
                setError(t('errors.updateMenuItemFailed'));
                toast.error(t('errors.updateMenuItemFailed'));
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Input Changes for Create
    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;
        setNewMenuItem((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Input Changes for Edit
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditMenuItem((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Adding/Removing Option Categories and Choices for Create
    const handleCreateAddOptionCategory = () => {
        setNewMenuItem((prev) => ({
            ...prev,
            options: [...prev.options, { name: '', choices: [{ name: '', price_modifier: '' }] }],
        }));
    };

    const handleCreateRemoveOptionCategory = (index) => {
        const updatedOptions = [...newMenuItem.options];
        updatedOptions.splice(index, 1);
        setNewMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    const handleCreateOptionCategoryNameChange = (index, value) => {
        const updatedOptions = [...newMenuItem.options];
        updatedOptions[index].name = value;
        setNewMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    const handleCreateAddChoice = (optionIndex) => {
        const updatedOptions = [...newMenuItem.options];
        updatedOptions[optionIndex].choices.push({ name: '', price_modifier: '' });
        setNewMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    const handleCreateRemoveChoice = (optionIndex, choiceIndex) => {
        const updatedOptions = [...newMenuItem.options];
        updatedOptions[optionIndex].choices.splice(choiceIndex, 1);
        setNewMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    const handleCreateChoiceChange = (optionIndex, choiceIndex, field, value) => {
        const updatedOptions = [...newMenuItem.options];
        updatedOptions[optionIndex].choices[choiceIndex][field] = value;
        setNewMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    // Handle Adding/Removing Option Categories and Choices for Edit
    const handleEditAddOptionCategory = () => {
        setEditMenuItem((prev) => ({
            ...prev,
            options: [...prev.options, { name: '', choices: [{ name: '', price_modifier: '' }] }],
        }));
    };

    const handleEditRemoveOptionCategory = (index) => {
        const updatedOptions = [...editMenuItem.options];
        updatedOptions.splice(index, 1);
        setEditMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    const handleEditOptionCategoryNameChange = (index, value) => {
        const updatedOptions = [...editMenuItem.options];
        updatedOptions[index].name = value;
        setEditMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    const handleEditAddChoice = (optionIndex) => {
        const updatedOptions = [...editMenuItem.options];
        updatedOptions[optionIndex].choices.push({ name: '', price_modifier: '' });
        setEditMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    const handleEditRemoveChoice = (optionIndex, choiceIndex) => {
        const updatedOptions = [...editMenuItem.options];
        updatedOptions[optionIndex].choices.splice(choiceIndex, 1);
        setEditMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    const handleEditChoiceChange = (optionIndex, choiceIndex, field, value) => {
        const updatedOptions = [...editMenuItem.options];
        updatedOptions[optionIndex].choices[choiceIndex][field] = value;
        setEditMenuItem((prev) => ({ ...prev, options: updatedOptions }));
    };

    return (
        <Container className="mt-5" dir={i18n.dir()}>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            <Row className="justify-content-center">
                <Col lg={10}>
                    <Card className="mb-4">
                        <Card.Header as="h5">{t('menuItemManagement')}</Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Button variant="success" onClick={handleShowCreateModal} className="mb-3">
                                <FaPlus /> {t('addNewMenuItem')}
                            </Button>

                            {loading ? (
                                <div className="text-center">
                                    <Spinner animation="border" role="status">
                                        <span className="visually-hidden">{t('loading')}</span>
                                    </Spinner>
                                    <p className="mt-3">{t('loadingMenuItems')}</p>
                                </div>
                            ) : menuItems.length === 0 ? (
                                <p className="text-center">{t('noMenuItemsAvailable')}</p>
                            ) : (
                                <ul className="list-group">
                                    {menuItems.map((item) => (
                                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                {item.image_url && (
                                                    <Image
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        rounded
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover', marginRight: '15px' }}
                                                    />
                                                )}
                                                <span>{item.name}</span>
                                            </div>
                                            <div>
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2"
                                                    onClick={() => handleShowEditModal(item.id)}
                                                >
                                                    <FaEdit /> {t('edit')}
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteMenuItem(item.id)}
                                                    disabled={submitting}
                                                >
                                                    <FaTrash /> {t('delete')}
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Create Menu Item Modal */}
            <Modal show={showCreateModal} onHide={handleCloseCreateModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t('addNewMenuItem')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCreateMenuItem} encType="multipart/form-data">
                        <Row className="mb-3">
                            <Form.Label column sm={3}>
                                {t('itemName')} *
                            </Form.Label>
                            <Col sm={9}>
                                <Form.Control
                                    type="text"
                                    name="name"
                                    value={newMenuItem.name}
                                    onChange={handleCreateInputChange}
                                    placeholder={t('enterMenuItemName')}
                                    required
                                />
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Form.Label column sm={3}>
                                {t('description')}
                            </Form.Label>
                            <Col sm={9}>
                                <Form.Control
                                    as="textarea"
                                    name="description"
                                    value={newMenuItem.description}
                                    onChange={handleCreateInputChange}
                                    placeholder={t('enterDescription')}
                                    rows={3}
                                />
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Form.Label column sm={3}>
                                {t('price')} ({t('currency')}) *
                            </Form.Label>
                            <Col sm={9}>
                                <Form.Control
                                    type="number"
                                    name="price"
                                    value={newMenuItem.price}
                                    onChange={handleCreateInputChange}
                                    placeholder={t('enterPrice')}
                                    min="0"
                                    max="9999.99"
                                    step="0.01"
                                    required
                                />
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Form.Label column sm={3}>
                                {t('image')}
                            </Form.Label>
                            <Col sm={9}>
                                <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCreateImageChange}
                                />
                                {newPreviewImage && (
                                    <div className="mt-3 text-center">
                                        <Image
                                            src={newPreviewImage}
                                            alt={t('imagePreview')}
                                            rounded
                                            fluid
                                            style={{ maxHeight: '150px' }}
                                        />
                                        <p className="mt-2">{t('imagePreview')}</p>
                                    </div>
                                )}
                            </Col>
                        </Row>
                        <Row className="mb-3">
                            <Form.Label column sm={3}>
                                {t('category')} *
                            </Form.Label>
                            <Col sm={9}>
                                <Form.Select
                                    name="categoryId"
                                    value={newMenuItem.categoryId}
                                    onChange={handleCreateInputChange}
                                    required
                                >
                                    <option value="">{t('selectCategory')}</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>

                        {/* Options (Option Categories and Choices) */}
                        <div className="mb-4">
                            <h5>{t('options')}</h5>
                            {newMenuItem.options.map((option, optionIndex) => (
                                <Card key={optionIndex} className="mb-3">
                                    <Card.Body>
                                        <Row className="mb-3">
                                            <Form.Label column sm={3}>
                                                {t('optionName')} *
                                            </Form.Label>
                                            <Col sm={7}>
                                                <Form.Control
                                                    type="text"
                                                    value={option.name}
                                                    onChange={(e) => handleCreateOptionCategoryNameChange(optionIndex, e.target.value)}
                                                    placeholder={t('enterOptionName')}
                                                    required
                                                />
                                            </Col>
                                            <Col sm={2}>
                                                <Button variant="danger" size="sm" onClick={() => handleCreateRemoveOptionCategory(optionIndex)}>
                                                    {t('delete')}
                                                </Button>
                                            </Col>
                                        </Row>
                                        <h6>{t('choices')}:</h6>
                                        {option.choices.map((choice, choiceIndex) => (
                                            <Row className="mb-3" key={choiceIndex}>
                                                <Form.Label column sm={3}>
                                                    {t('choice')} *
                                                </Form.Label>
                                                <Col sm={4}>
                                                    <Form.Control
                                                        type="text"
                                                        value={choice.name}
                                                        onChange={(e) => handleCreateChoiceChange(optionIndex, choiceIndex, 'name', e.target.value)}
                                                        placeholder={t('enterChoiceName')}
                                                        required
                                                    />
                                                </Col>
                                                <Col sm={3}>
                                                    <Form.Control
                                                        type="number"
                                                        value={choice.price_modifier}
                                                        onChange={(e) => handleCreateChoiceChange(optionIndex, choiceIndex, 'price_modifier', e.target.value)}
                                                        placeholder={t('enterPriceModifier')}
                                                        min="0"
                                                        step="0.01"
                                                        required
                                                    />
                                                </Col>
                                                <Col sm={2}>
                                                    <Button variant="danger" size="sm" onClick={() => handleCreateRemoveChoice(optionIndex, choiceIndex)}>
                                                        {t('delete')}
                                                    </Button>
                                                </Col>
                                            </Row>
                                        ))}
                                        <Button variant="secondary" onClick={() => handleCreateAddChoice(optionIndex)}>
                                            {t('addAnotherChoice')}
                                        </Button>
                                    </Card.Body>
                                </Card>
                            ))}
                            <Button variant="secondary" onClick={handleCreateAddOptionCategory}>
                                <FaPlus /> {t('addOptionCategory')}
                            </Button>
                        </div>

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
                                    {t('addingMenuItem')}
                                </>
                            ) : (
                                <>
                                    <FaUpload /> {t('createMenuItem')}
                                </>
                            )}
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Edit Menu Item Modal */}
            <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t('editMenuItem')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentMenuItem && (
                        <Form onSubmit={handleUpdateMenuItem} encType="multipart/form-data">
                            <Row className="mb-3">
                                <Form.Label column sm={3}>
                                    {t('itemName')} *
                                </Form.Label>
                                <Col sm={9}>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={editMenuItem.name}
                                        onChange={handleEditInputChange}
                                        placeholder={t('enterMenuItemName')}
                                        required
                                    />
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Form.Label column sm={3}>
                                    {t('description')}
                                </Form.Label>
                                <Col sm={9}>
                                    <Form.Control
                                        as="textarea"
                                        name="description"
                                        value={editMenuItem.description}
                                        onChange={handleEditInputChange}
                                        placeholder={t('enterDescription')}
                                        rows={3}
                                    />
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Form.Label column sm={3}>
                                    {t('price')} ({t('currency')}) *
                                </Form.Label>
                                <Col sm={9}>
                                    <Form.Control
                                        type="number"
                                        name="price"
                                        value={editMenuItem.price}
                                        onChange={handleEditInputChange}
                                        placeholder={t('enterPrice')}
                                        min="0"
                                        max="9999.99"
                                        step="0.01"
                                        required
                                    />
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Form.Label column sm={3}>
                                    {t('image')}
                                </Form.Label>
                                <Col sm={9}>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handleEditImageChange}
                                    />
                                    {existingImageUrl && !editPreviewImage && (
                                        <div className="mt-3 text-center">
                                            <p>{t('currentImage')}:</p>
                                            <Image
                                                src={existingImageUrl}
                                                alt={t('currentMenuItemImage')}
                                                rounded
                                                fluid
                                                style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '5px' }}
                                            />
                                        </div>
                                    )}
                                    {editPreviewImage && (
                                        <div className="mt-3 text-center">
                                            <p>{t('imagePreview')}:</p>
                                            <Image
                                                src={editPreviewImage}
                                                alt={t('menuItemImagePreview')}
                                                rounded
                                                fluid
                                                style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '5px' }}
                                            />
                                        </div>
                                    )}
                                </Col>
                            </Row>
                            <Row className="mb-3">
                                <Form.Label column sm={3}>
                                    {t('category')} *
                                </Form.Label>
                                <Col sm={9}>
                                    <Form.Select
                                        name="categoryId"
                                        value={editMenuItem.categoryId}
                                        onChange={handleEditInputChange}
                                        required
                                    >
                                        <option value="">{t('selectCategory')}</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>

                            {/* Options (Option Categories and Choices) */}
                            <div className="mb-4">
                                <h5>{t('options')}</h5>
                                {editMenuItem.options.map((option, optionIndex) => (
                                    <Card key={optionIndex} className="mb-3">
                                        <Card.Body>
                                            <Row className="mb-3">
                                                <Form.Label column sm={3}>
                                                    {t('optionName')} *
                                                </Form.Label>
                                                <Col sm={7}>
                                                    <Form.Control
                                                        type="text"
                                                        value={option.name}
                                                        onChange={(e) => handleEditOptionCategoryNameChange(optionIndex, e.target.value)}
                                                        placeholder={t('enterOptionName')}
                                                        required
                                                    />
                                                </Col>
                                                <Col sm={2}>
                                                    <Button variant="danger" size="sm" onClick={() => handleEditRemoveOptionCategory(optionIndex)}>
                                                        {t('delete')}
                                                    </Button>
                                                </Col>
                                            </Row>
                                            <h6>{t('choices')}:</h6>
                                            {option.choices.map((choice, choiceIndex) => (
                                                <Row className="mb-3" key={choiceIndex}>
                                                    <Form.Label column sm={3}>
                                                        {t('choice')} *
                                                    </Form.Label>
                                                    <Col sm={4}>
                                                        <Form.Control
                                                            type="text"
                                                            value={choice.name}
                                                            onChange={(e) => handleEditChoiceChange(optionIndex, choiceIndex, 'name', e.target.value)}
                                                            placeholder={t('enterChoiceName')}
                                                            required
                                                        />
                                                    </Col>
                                                    <Col sm={3}>
                                                        <Form.Control
                                                            type="number"
                                                            value={choice.price_modifier}
                                                            onChange={(e) => handleEditChoiceChange(optionIndex, choiceIndex, 'price_modifier', e.target.value)}
                                                            placeholder={t('enterPriceModifier')}
                                                            min="0"
                                                            step="0.01"
                                                            required
                                                        />
                                                    </Col>
                                                    <Col sm={2}>
                                                        <Button variant="danger" size="sm" onClick={() => handleEditRemoveChoice(optionIndex, choiceIndex)}>
                                                            {t('delete')}
                                                        </Button>
                                                    </Col>
                                                </Row>
                                            ))}
                                            <Button variant="secondary" onClick={() => handleEditAddChoice(optionIndex)}>
                                                {t('addAnotherChoice')}
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                ))}
                                <Button variant="secondary" onClick={handleEditAddOptionCategory}>
                                    <FaPlus /> {t('addOptionCategory')}
                                </Button>
                            </div>

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
                                        {t('updatingMenuItem')}
                                    </>
                                ) : (
                                    <>
                                        <FaUpload /> {t('updateMenuItem')}
                                    </>
                                )}
                            </Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );

};

export default MenuItemManagementPage;
