// src/pages/MenuItemCreatePage.js

import React, { useState, useEffect } from 'react';
import { createMenuItem, getCategories } from '../../services/api'; // Ensure these functions exist and are correctly implemented
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import imageCompression from 'browser-image-compression';
import { FaUpload, FaPlus, FaTrash, FaEdit } from 'react-icons/fa'; // Consolidated icon imports
import { useTranslation } from 'react-i18next'; // Import useTranslation

const MenuItemCreatePage = () => {
    const { t } = useTranslation(); // Initialize translation
    const { restaurantId, menuId } = useParams();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [options, setOptions] = useState([{ name: '', choices: [''] }]);
    const [booleanOptions, setBooleanOptions] = useState([{ name: '', price_modifier: '' }]);
    const [error, setError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // For image preview

    useEffect(() => {
        // Fetch categories for the restaurant
        const fetchCategories = async () => {
            try {
                const response = await getCategories(restaurantId, menuId);
                setCategories(response.data);
            } catch (error) {
                console.error(t('errors.fetchCategories'), error);
                toast.error(t('errors.fetchCategories'));
            }
        };

        fetchCategories();
    }, [restaurantId, t]);

    // Handle image selection and compression
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Compress the image before uploading
                const compressionOptions = {
                    maxSizeMB: 1,          // Maximum size in MB
                    maxWidthOrHeight: 800, // Max width or height
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, compressionOptions);
                setImageFile(compressedFile);

                // Generate a preview URL
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewImage(reader.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error(t('errors.imageProcessingFailed'), error);
                toast.error(t('errors.imageProcessingFailed'));
            }
        }
    };

    // Handle adding a new option
    const handleAddOption = () => {
        setOptions([...options, { name: '', choices: [''] }]);
    };

    // Handle removing an option
    const handleRemoveOption = (index) => {
        const newOptions = [...options];
        newOptions.splice(index, 1);
        setOptions(newOptions);
    };

    // Handle changing option name
    const handleOptionNameChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index].name = value;
        setOptions(newOptions);
    };

    // Handle adding a choice to an option
    const handleAddChoice = (optionIndex) => {
        const newOptions = [...options];
        newOptions[optionIndex].choices.push('');
        setOptions(newOptions);
    };

    // Handle changing a choice in an option
    const handleChoiceChange = (optionIndex, choiceIndex, value) => {
        const newOptions = [...options];
        newOptions[optionIndex].choices[choiceIndex] = value;
        setOptions(newOptions);
    };

    // Handle removing a choice from an option
    const handleRemoveChoice = (optionIndex, choiceIndex) => {
        const newOptions = [...options];
        newOptions[optionIndex].choices.splice(choiceIndex, 1);
        setOptions(newOptions);
    };

    // Handle adding a new boolean option
    const handleAddBooleanOption = () => {
        setBooleanOptions([...booleanOptions, { name: '', price_modifier: '' }]);
    };

    // Handle removing a boolean option
    const handleRemoveBooleanOption = (index) => {
        const newBooleanOptions = [...booleanOptions];
        newBooleanOptions.splice(index, 1);
        setBooleanOptions(newBooleanOptions);
    };

    // Handle changing boolean option name
    const handleBooleanOptionNameChange = (index, value) => {
        const newBooleanOptions = [...booleanOptions];
        newBooleanOptions[index].name = value;
        setBooleanOptions(newBooleanOptions);
    };

    // Handle changing boolean option price modifier
    const handleBooleanOptionPriceModifierChange = (index, value) => {
        const newBooleanOptions = [...booleanOptions];
        newBooleanOptions[index].price_modifier = value;
        setBooleanOptions(newBooleanOptions);
    };

    const handleCreateMenuItem = async () => {
        // Basic validation
        if (name.trim() === '' || price === '' || categoryId === '') {
            setError(t('errors.fillRequiredFields'));
            toast.error(t('errors.fillRequiredFields'));
            return;
        }

        // Construct FormData
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('category', categoryId);
        formData.append('restaurant', restaurantId);

        // If image file exists, append it
        if (imageFile) {
            formData.append('image', imageFile);
        }

        // Convert options and booleanOptions to JSON and append
        formData.append('options', JSON.stringify(options));  // Convert to JSON string
        formData.append('boolean_options', JSON.stringify(booleanOptions));  // Convert to JSON string

        try {
            await createMenuItem(formData, menuId);
            toast.success(t('success.menuItemCreated'));
            navigate(`/restaurant/${restaurantId}/menus/${menuId}/menu-items`);
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
        }
    };

    return (
        <div className="container mt-5">
            <h2>{t('addNewMenuItem')}</h2>
            {/* Form Fields */}
            <div className="mb-3">
                <label className="form-label">{t('itemName')} *</label>
                <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('enterMenuItemName')}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">{t('description')}</label>
                <textarea
                    className="form-control"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('enterDescription')}
                    rows="3"
                ></textarea>
            </div>
            <div className="mb-3">
                <label className="form-label">{t('price')} ({t('currency')}) *</label>
                <input
                    type="number"
                    className="form-control"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={t('enterPrice')}
                    min="0"
                    step="0.01"
                />
            </div>
            <div className="mb-3">
                <label className="form-label">{t('image')}</label>
                <input
                    type="file"
                    className="form-control"
                    onChange={handleImageChange}
                    accept="image/*"
                />
                {previewImage && (
                    <div className="mt-2">
                        <p>{t('imagePreview')}:</p>
                        <img
                            src={previewImage}
                            alt={t('menuItemImagePreview')}
                            style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '5px' }}
                        />
                    </div>
                )}
            </div>
            <div className="mb-3">
                <label className="form-label">{t('category')} *</label>
                <select
                    className="form-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                >
                    <option value="">{t('selectCategory')}</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Options */}
            <div className="mb-4">
                <h4>{t('options')}</h4>
                {options.map((option, index) => (
                    <div key={index} className="card mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title">{t('option')} {index + 1}</h5>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRemoveOption(index)}
                                >
                                    {t('remove')}
                                </button>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">{t('optionName')} *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={option.name}
                                    onChange={(e) => handleOptionNameChange(index, e.target.value)}
                                    placeholder={t('enterOptionName')}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">{t('choices')} ({t('commaSeparated')}) *</label>
                                <textarea
                                    className="form-control"
                                    value={option.choices.join(', ')}
                                    onChange={(e) => {
                                        const choices = e.target.value
                                            .split(',')
                                            .map((choice) => choice.trim())
                                            .filter((choice) => choice !== '');
                                        // Update all choices for simplicity
                                        const newOptions = [...options];
                                        newOptions[index].choices = choices;
                                        setOptions(newOptions);
                                    }}
                                    placeholder={t('enterChoices')}
                                    rows="2"
                                ></textarea>
                            </div>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleAddChoice(index)}
                            >
                                {t('addAnotherChoice')}
                            </button>
                        </div>
                    </div>
                ))}
                <button className="btn btn-secondary" onClick={handleAddOption}>
                    <FaPlus /> {t('addOption')}
                </button>
            </div>

            {/* Boolean Options */}
            <div className="mb-4">
                <h4>{t('booleanOptions')}</h4>
                {booleanOptions.map((option, index) => (
                    <div key={index} className="card mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="card-title">{t('booleanOption')} {index + 1}</h5>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRemoveBooleanOption(index)}
                                >
                                    {t('remove')}
                                </button>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">{t('optionName')} *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={option.name}
                                    onChange={(e) => handleBooleanOptionNameChange(index, e.target.value)}
                                    placeholder={t('enterOptionName')}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">{t('priceModifier')} ({t('currency')}) *</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={option.price_modifier}
                                    onChange={(e) => handleBooleanOptionPriceModifierChange(index, e.target.value)}
                                    placeholder={t('enterPriceModifier')}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>
                ))}
                <button className="btn btn-secondary" onClick={handleAddBooleanOption}>
                    <FaPlus /> {t('addBooleanOption')}
                </button>
            </div>

            <button className="btn btn-primary" onClick={handleCreateMenuItem}>
                {t('createMenuItem')}
            </button>

            {error && <p className="text-danger mt-3">{error}</p>}
            <ToastContainer />
        </div>
    );

};

export default MenuItemCreatePage;
