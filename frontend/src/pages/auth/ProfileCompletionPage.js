import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import { completeRestaurantProfile, getRestaurantProfile } from '../../services/api';
import { AuthContext } from '../../AuthContext';

const ProfileCompletionPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { userRoles } = useContext(AuthContext);
    const [formData, setFormData] = useState({
        address: '',
        phone_number: '',
        country: '',
        city: '',
        postal_code: '',
        currency: 'EUR',
        number_of_employees: 1
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            // Validate required fields
            const requiredFields = ['address', 'phone_number', 'country', 'city', 'postal_code'];
            const missingFields = requiredFields.filter(field => !formData[field]);
            
            if (missingFields.length > 0) {
                throw new Error(t('profileCompletion.errors.required'));
            }

            // Phone number validation
            const phoneRegex = /^\+?[\d\s-]{8,}$/;
            if (!phoneRegex.test(formData.phone_number)) {
                throw new Error(t('profileCompletion.errors.invalidPhone'));
            }

            // Postal code validation
            const postalRegex = /^[A-Z\d\s-]{3,10}$/i;
            if (!postalRegex.test(formData.postal_code)) {
                throw new Error(t('profileCompletion.errors.invalidPostalCode'));
            }

            const restaurantId = userRoles?.restaurant_id;
            
            if (!restaurantId) {
                throw new Error(t('profileCompletion.errors.noRestaurantId'));
            }
            
            console.log('Completing profile for restaurant:', restaurantId);
            const completionResponse = await completeRestaurantProfile(restaurantId, formData);
            console.log('Profile completion response:', completionResponse.data);
            
            // Verify profile completion status
            const profileResponse = await getRestaurantProfile(restaurantId);
            console.log('Profile verification response:', profileResponse.data);
            
            const profileData = profileResponse.data;
            console.log('Profile data:', profileData);
            
            if (!profileData) {
                console.error('Invalid profile response:', profileResponse);
                throw new Error(t('profileCompletion.errors.invalidResponse'));
            }
            
            // Check if all required fields are present
            const requiredProfileFields = ['address', 'phone_number', 'country', 'city', 'postal_code'];
            const hasAllFields = requiredProfileFields.every(field => profileData[field]);
            
            if (hasAllFields) {
                navigate('/dashboard');
            } else {
                console.error('Profile not marked as completed:', profileResponse.data);
                throw new Error(t('profileCompletion.errors.completionFailed'));
            }
        } catch (err) {
            setError(err.message || t('profileCompletion.error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Container className="py-5">
            <Card className="mx-auto" style={{ maxWidth: '600px' }}>
                <Card.Header>
                    <h2 className="text-center">{t('profileCompletion.title')}</h2>
                </Card.Header>
                <Card.Body>
                    <p className="text-center mb-4">{t('profileCompletion.description')}</p>
                    
                    {error && <Alert variant="danger">{error}</Alert>}
                    
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>{t('profileCompletion.form.address')}</Form.Label>
                            <Form.Control
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder={t('profileCompletion.form.addressPlaceholder')}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('profileCompletion.form.phoneNumber')}</Form.Label>
                            <Form.Control
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder={t('profileCompletion.form.phoneNumberPlaceholder')}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('profileCompletion.form.country')}</Form.Label>
                            <Form.Control
                                type="text"
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                placeholder={t('profileCompletion.form.countryPlaceholder')}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('profileCompletion.form.city')}</Form.Label>
                            <Form.Control
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder={t('profileCompletion.form.cityPlaceholder')}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('profileCompletion.form.postalCode')}</Form.Label>
                            <Form.Control
                                type="text"
                                name="postal_code"
                                value={formData.postal_code}
                                onChange={handleChange}
                                placeholder={t('profileCompletion.form.postalCodePlaceholder')}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('profileCompletion.form.currency')}</Form.Label>
                            <Form.Select
                                name="currency"
                                value={formData.currency}
                                onChange={handleChange}
                                required
                            >
                                <option value="EUR">EUR</option>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                                <option value="TRY">TRY</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>{t('profileCompletion.form.employees')}</Form.Label>
                            <Form.Control
                                type="number"
                                name="number_of_employees"
                                value={formData.number_of_employees}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </Form.Group>

                        <div className="d-grid">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? t('profileCompletion.submitting') : t('profileCompletion.submit')}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ProfileCompletionPage;
