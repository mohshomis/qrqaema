// src/pages/CategoryEditPage.js

import React, { useState, useEffect } from 'react';
import { getCategoryById, updateCategory } from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const CategoryEditPage = () => {
    const { t } = useTranslation(); // Initialize translation
    const { restaurantId, categoryId } = useParams();
    const navigate = useNavigate();
    const [category, setCategory] = useState(null);
    const [name, setName] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [error, setError] = useState(null);
    const [previewImage, setPreviewImage] = useState(null); // For image preview

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const response = await getCategoryById(categoryId);
                setCategory(response.data);
                setName(response.data.name);
                if (response.data.image_url) {
                    setPreviewImage(response.data.image_url);
                }
                setError(null);
            } catch (error) {
                console.error(t('errors.fetchCategoryError'), error);
                setError(t('errors.fetchCategoryError'));
            }
        };

        fetchCategory();
    }, [categoryId, t]);

    const handleUpdateCategory = async () => {
        if (name.trim() === '') {
            setError(t('errors.enterCategoryName'));
            return;
        }
        try {
            const formData = new FormData();
            formData.append('name', name);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            await updateCategory(categoryId, formData);
            setError(null);
            navigate(`/restaurant/${restaurantId}/categories`);
        } catch (error) {
            console.error(t('errors.updateCategoryError'), error);
            if (error.response && error.response.data) {
                // Concatenate all error messages
                const errorMessages = Object.values(error.response.data).flat().join(' ');
                setError(errorMessages);
            } else {
                setError(t('errors.updateCategoryError'));
            }
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    if (error) {
        return <p className="text-danger text-center mt-5">{error}</p>;
    }

    if (!category) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5">
            <h2 className="mb-4">{t('updateCategory')}</h2>
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control mb-2"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('categoryNamePlaceholder')}
                />
                <input
                    type="file"
                    className="form-control mb-3"
                    onChange={handleImageChange}
                    accept="image/*"
                />
                {previewImage && (
                    <div className="mb-3">
                        <p>{t('currentImage')}:</p>
                        <img
                            src={previewImage}
                            alt={t('categoryImage')}
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }}
                        />
                    </div>
                )}
                <button className="btn btn-primary" onClick={handleUpdateCategory}>
                    {t('updateCategoryButton')}
                </button>
            </div>
            {error && <p className="text-danger">{error}</p>}
        </div>
    );
};

export default CategoryEditPage;
