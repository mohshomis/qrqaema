import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUserAndRestaurant } from '../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import './RegisterPage.css';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from 'react-bootstrap';

const RegisterPage = () => {
    const { t, i18n } = useTranslation();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        restaurantName: ''
    });
    const [errors, setErrors] = useState({});
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = t('register.errors.usernameRequired');
        } else if (formData.username.length < 3) {
            newErrors.username = t('register.errors.usernameTooShort');
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = t('register.errors.usernameInvalid');
        }

        if (!formData.email.trim()) {
            newErrors.email = t('register.errors.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = t('register.errors.emailInvalid');
        }

        if (!formData.password) {
            newErrors.password = t('register.errors.passwordRequired');
        } else if (formData.password.length < 6) {
            newErrors.password = t('register.errors.passwordTooShort');
        } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = t('register.errors.passwordWeak');
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = t('register.errors.confirmPasswordRequired');
        } else if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = t('register.errors.passwordsDoNotMatch');
        }

        if (!formData.restaurantName.trim()) {
            newErrors.restaurantName = t('register.errors.restaurantNameRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const registrationData = {
            user: {
                username: formData.username,
                password: formData.password,
                email: formData.email
            },
            restaurant: {
                name: formData.restaurantName
            }
        };

        try {
            await registerUserAndRestaurant(registrationData);
            setShowSuccessModal(true);
        } catch (err) {
            console.error('Registration error:', err);
            const errorData = err.error || err.response?.data;
            console.log('Error data:', errorData);

            const newErrors = {};
            
            // Handle user-related errors
            if (errorData?.user) {
                if (typeof errorData.user === 'string') {
                    newErrors.api = errorData.user;
                } else {
                    if (errorData.user.username) {
                        newErrors.username = errorData.user.username;
                    }
                    if (errorData.user.email) {
                        newErrors.email = errorData.user.email;
                    }
                    if (errorData.user.password) {
                        newErrors.password = errorData.user.password;
                    }
                }
            }

            // Handle restaurant-related errors
            if (errorData?.restaurant) {
                if (typeof errorData.restaurant === 'string') {
                    newErrors.restaurantName = errorData.restaurant;
                } else if (errorData.restaurant.name) {
                    newErrors.restaurantName = errorData.restaurant.name;
                }
            }

            // Handle email-related errors
            if (errorData?.email) {
                newErrors.email = errorData.email;
            }

            // If no specific errors were found, set a generic error
            if (Object.keys(newErrors).length === 0) {
                newErrors.api = t('register.errors.unexpectedError');
            }

            console.log('Setting errors:', newErrors);
            setErrors(prev => ({ ...prev, ...newErrors }));
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        navigate('/login');
    };

    return (
        <div className="register-page-container d-flex align-items-center justify-content-center" style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #007bff, #00c853)'
        }}>
            <div className="register-box p-5 shadow" style={{ backgroundColor: '#fff', borderRadius: '10px', maxWidth: '500px', width: '100%' }}>
                <h2 className="text-center mb-4">{t('register.title')}</h2>

                <form onSubmit={handleSubmit} className="text-right" dir={i18n.dir()}>
                    <div className="form-group mb-3">
                        <label htmlFor="username">{t('register.userForm.username')}</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                        {errors.username && <div className="invalid-feedback">{errors.username}</div>}
                    </div>

                    <div className="form-group mb-3">
                        <label htmlFor="email">{t('register.userForm.email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                    </div>

                    <div className="form-group mb-3">
                        <label htmlFor="password">{t('register.userForm.password')}</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                    </div>

                    <div className="form-group mb-3">
                        <label htmlFor="confirmPassword">{t('register.userForm.confirmPassword')}</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                    </div>

                    <div className="form-group mb-3">
                        <label htmlFor="restaurantName">{t('register.restaurantForm.name')}</label>
                        <input
                            type="text"
                            id="restaurantName"
                            name="restaurantName"
                            className={`form-control ${errors.restaurantName ? 'is-invalid' : ''}`}
                            value={formData.restaurantName}
                            onChange={handleChange}
                            required
                        />
                        {errors.restaurantName && <div className="invalid-feedback">{errors.restaurantName}</div>}
                    </div>

                    {errors.api && <p className="text-danger text-center">{errors.api}</p>}

                    <div className="d-grid gap-2">
                        <button type="submit" className="btn btn-primary">
                            {t('register.buttons.register')}
                        </button>
                    </div>
                </form>

                <Modal show={showSuccessModal} onHide={handleCloseSuccessModal} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('register.success.title')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>{t('register.success.message')}</p>
                        <p>{t('register.success.activationEmail')}</p>
                        <p>{t('register.success.completeProfile')}</p>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary" onClick={handleCloseSuccessModal}>
                            {t('register.success.ok')}
                        </Button>
                    </Modal.Footer>
                </Modal>

                <div className="text-center mt-3">
                    <a href="/login" className="text-muted">
                        {t('register.links.returnToLogin')}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
