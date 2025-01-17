// src/pages/RestaurantProfilePage.js

import React, { useState, useEffect } from 'react';
import { getRestaurantProfile, updateRestaurantProfile } from '../services/api'; // Ensure these functions exist and are correctly implemented
import { useParams } from 'react-router-dom'; // To get the restaurantId from the URL
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
} from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import { FaUpload } from 'react-icons/fa'; // For upload icons
import { useTranslation } from 'react-i18next'; // Import useTranslation
import Select from 'react-select';
import countryList from 'country-list';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css'; // Import styles for PhoneInput

// Define a list of all ISO 4217 currencies (same as in RegisterPage)
const currencyOptions = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'CHF', label: 'CHF - Swiss Franc' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'SEK', label: 'SEK - Swedish Krona' },
    { value: 'NZD', label: 'NZD - New Zealand Dollar' },
    { value: 'MXN', label: 'MXN - Mexican Peso' },
    { value: 'SGD', label: 'SGD - Singapore Dollar' },
    { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
    { value: 'NOK', label: 'NOK - Norwegian Krone' },
    { value: 'KRW', label: 'KRW - South Korean Won' },
    { value: 'TRY', label: 'TRY - Turkish Lira' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'RUB', label: 'RUB - Russian Ruble' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
    { value: 'ZAR', label: 'ZAR - South African Rand' },
    { value: 'SAR', label: 'SAR - Saudi Riyal' },
    { value: 'AED', label: 'AED - Emirati Dirham' },
    { value: 'ARS', label: 'ARS - Argentine Peso' },
    { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
    { value: 'THB', label: 'THB - Thai Baht' },
    { value: 'PLN', label: 'PLN - Polish Zloty' },
    { value: 'DKK', label: 'DKK - Danish Krone' },
    { value: 'HUF', label: 'HUF - Hungarian Forint' },
    { value: 'CZK', label: 'CZK - Czech Koruna' },
    { value: 'ILS', label: 'ILS - Israeli Shekel' },
    { value: 'CLP', label: 'CLP - Chilean Peso' },
    { value: 'PHP', label: 'PHP - Philippine Peso' },
    { value: 'PKR', label: 'PKR - Pakistani Rupee' },
    { value: 'VND', label: 'VND - Vietnamese Dong' },
    { value: 'BDT', label: 'BDT - Bangladeshi Taka' },
    { value: 'EGP', label: 'EGP - Egyptian Pound' },
    { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
    { value: 'NGN', label: 'NGN - Nigerian Naira' },
    { value: 'UAH', label: 'UAH - Ukrainian Hryvnia' },
    { value: 'COP', label: 'COP - Colombian Peso' },
    { value: 'TWD', label: 'TWD - New Taiwan Dollar' },
    { value: 'KZT', label: 'KZT - Kazakhstani Tenge' },
    { value: 'KWD', label: 'KWD - Kuwaiti Dinar' },
    { value: 'BHD', label: 'BHD - Bahraini Dinar' },
    { value: 'OMR', label: 'OMR - Omani Rial' },
    { value: 'QAR', label: 'QAR - Qatari Riyal' },
    { value: 'JOD', label: 'JOD - Jordanian Dinar' },
    { value: 'MAD', label: 'MAD - Moroccan Dirham' },
    { value: 'DZD', label: 'DZD - Algerian Dinar' },
    { value: 'TND', label: 'TND - Tunisian Dinar' },
    { value: 'LKR', label: 'LKR - Sri Lankan Rupee' },
    { value: 'XAF', label: 'XAF - Central African CFA Franc' },
    { value: 'XOF', label: 'XOF - West African CFA Franc' },
    { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
    { value: 'KES', label: 'KES - Kenyan Shilling' },
    { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
    { value: 'UGX', label: 'UGX - Ugandan Shilling' },
    { value: 'ZMW', label: 'ZMW - Zambian Kwacha' },
    { value: 'MWK', label: 'MWK - Malawian Kwacha' },
    { value: 'BWP', label: 'BWP - Botswana Pula' },
    { value: 'MZN', label: 'MZN - Mozambican Metical' },
    { value: 'GEL', label: 'GEL - Georgian Lari' },
    { value: 'AZN', label: 'AZN - Azerbaijani Manat' },
    { value: 'BYN', label: 'BYN - Belarusian Ruble' },
    { value: 'AMD', label: 'AMD - Armenian Dram' },
    { value: 'UZS', label: 'UZS - Uzbekistani Som' },
    { value: 'MNT', label: 'MNT - Mongolian Tugrik' },
    { value: 'KGS', label: 'KGS - Kyrgyzstani Som' },
    { value: 'AFN', label: 'AFN - Afghan Afghani' },
    { value: 'NPR', label: 'NPR - Nepalese Rupee' },
    { value: 'BND', label: 'BND - Brunei Dollar' },
    { value: 'KHR', label: 'KHR - Cambodian Riel' },
    { value: 'LAK', label: 'LAK - Lao Kip' },
    { value: 'MMK', label: 'MMK - Myanmar Kyat' },
    { value: 'MOP', label: 'MOP - Macanese Pataca' },
    { value: 'IRR', label: 'IRR - Iranian Rial' },
    { value: 'IQD', label: 'IQD - Iraqi Dinar' },
    { value: 'LBP', label: 'LBP - Lebanese Pound' },
    { value: 'SYP', label: 'SYP - Syrian Pound' },
    { value: 'YER', label: 'YER - Yemeni Rial' },
    { value: 'XCD', label: 'XCD - East Caribbean Dollar' },
    { value: 'TTD', label: 'TTD - Trinidad and Tobago Dollar' },
    { value: 'JMD', label: 'JMD - Jamaican Dollar' },
    { value: 'BBD', label: 'BBD - Barbadian Dollar' },
    { value: 'BZD', label: 'BZD - Belize Dollar' },
    { value: 'BSD', label: 'BSD - Bahamian Dollar' },
    { value: 'BMD', label: 'BMD - Bermudian Dollar' },
    { value: 'HTG', label: 'HTG - Haitian Gourde' },
    { value: 'DOP', label: 'DOP - Dominican Peso' },
    { value: 'FJD', label: 'FJD - Fijian Dollar' },
    { value: 'PGK', label: 'PGK - Papua New Guinean Kina' },
    { value: 'SBD', label: 'SBD - Solomon Islands Dollar' },
    { value: 'VUV', label: 'VUV - Vanuatu Vatu' },
    { value: 'TOP', label: 'TOP - Tongan Paʻanga' },
    { value: 'WST', label: 'WST - Samoan Tala' },
    { value: 'KPW', label: 'KPW - North Korean Won' },
    { value: 'SLL', label: 'SLL - Sierra Leonean Leone' },
    { value: 'GNF', label: 'GNF - Guinean Franc' },
    { value: 'MGA', label: 'MGA - Malagasy Ariary' },
    { value: 'SCR', label: 'SCR - Seychellois Rupee' },
    { value: 'MVR', label: 'MVR - Maldivian Rufiyaa' },
    { value: 'BAM', label: 'BAM - Bosnian Convertible Mark' },
    { value: 'ALL', label: 'ALL - Albanian Lek' },
    { value: 'MKD', label: 'MKD - Macedonian Denar' },
    { value: 'MDL', label: 'MDL - Moldovan Leu' },
    { value: 'RON', label: 'RON - Romanian Leu' },
    { value: 'HRK', label: 'HRK - Croatian Kuna' },
    { value: 'BGN', label: 'BGN - Bulgarian Lev' },
    { value: 'RSD', label: 'RSD - Serbian Dinar' },
    { value: 'ISK', label: 'ISK - Icelandic Krona' },
    { value: 'LTL', label: 'LTL - Lithuanian Litas' },
    { value: 'LVL', label: 'LVL - Latvian Lats' },
    { value: 'EEK', label: 'EEK - Estonian Kroon' }
];

const RestaurantProfilePage = () => {
    const { t, i18n } = useTranslation(); // Initialize translation
    const { restaurantId } = useParams(); // Capture restaurantId from the URL

    // Define state variables
    const [restaurantName, setRestaurantName] = useState('');
    const [address, setAddress] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [country, setCountry] = useState(null); // Use null for react-select
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [currency, setCurrency] = useState(null); // Use null for react-select
    const [numberOfEmployees, setNumberOfEmployees] = useState(1);
    const [logo, setLogo] = useState(null);
    const [backgroundImage, setBackgroundImage] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [backgroundPreview, setBackgroundPreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Options for Select components
    const countryOptions = countryList.getData().map(country => ({
        value: country.code,
        label: country.name,
    }));

    // Handle fetching restaurant profile
    useEffect(() => {
        fetchRestaurantProfile();

        // Cleanup object URLs on component unmount
        return () => {
            if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
            if (backgroundPreview && backgroundPreview.startsWith('blob:')) URL.revokeObjectURL(backgroundPreview);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [restaurantId]); // Ensure it reloads when restaurantId changes

    const fetchRestaurantProfile = async () => {
        try {
            setLoading(true);
            const response = await getRestaurantProfile(restaurantId); // Pass restaurantId to the API
            const {
                name,
                address,
                phone_number,
                logo,
                background_image,
                country: countryCode,       // Assuming country is sent as country code
                city,
                postal_code,
                currency: currencyCode,     // Assuming currency is sent as currency code
                number_of_employees,
            } = response.data;

            setRestaurantName(name);
            setAddress(address);
            setPhoneNumber(phone_number);
            setCountry(countryCode ? { value: countryCode, label: countryList.getName(countryCode) } : null); // Set country as react-select option
            setCity(city);
            setPostalCode(postal_code);
            setCurrency(currencyCode ? currencyOptions.find(option => option.value === currencyCode) : null); // Set currency as react-select option
            setNumberOfEmployees(number_of_employees);
            setLogoPreview(logo); // Assuming logo is a URL
            setBackgroundPreview(background_image); // Assuming background_image is a URL
            setLoading(false);
        } catch (error) {
            setError(t('errors.loadRestaurantProfile'));
            toast.error(t('errors.loadRestaurantProfile'));
            setLoading(false);
        }
    };

    // Handle logo file change
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogo(file);
            const previewURL = URL.createObjectURL(file);
            setLogoPreview(previewURL);
        }
    };

    // Handle background image file change
    const handleBackgroundChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBackgroundImage(file);
            const previewURL = URL.createObjectURL(file);
            setBackgroundPreview(previewURL);
        }
    };

    // Handle Select changes
    const handleSelectChange = (selectedOption, { name }) => {
        if (name === 'country') {
            setCountry(selectedOption);
        } else if (name === 'currency') {
            setCurrency(selectedOption);
        }
    };

    // Handle profile update submission
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        // Validate required Select fields
        if (!country || !currency) {
            setError(t('register.errors.selectCountryAndCurrency'));
            toast.error(t('register.errors.selectCountryAndCurrency'));
            setSubmitting(false);
            return;
        }

        const formData = new FormData();
        formData.append('name', restaurantName);
        formData.append('address', address);
        formData.append('phone_number', phoneNumber);
        formData.append('country', country.value); // Send country code
        formData.append('city', city);
        formData.append('postal_code', postalCode);
        formData.append('currency', currency.value); // Send currency code
        formData.append('number_of_employees', numberOfEmployees);
        if (logo) formData.append('logo', logo);
        if (backgroundImage) formData.append('background_image', backgroundImage);

        try {
            await updateRestaurantProfile(restaurantId, formData); // Pass restaurantId to the update API
            setSuccess(t('success.profileUpdated'));
            toast.success(t('success.profileUpdated'));
            fetchRestaurantProfile(); // Refresh profile after update
        } catch (error) {
            setError(t('errors.updateProfileFailed'));
            toast.error(t('errors.updateProfileFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">{t('loading')}</span>
                </Spinner>
                <p className="mt-3">{t('loadingRestaurantProfile')}</p>
            </Container>
        );
    }

    return (
        <Container className="mt-5" dir={i18n.dir()}>
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
            {/* Banner Section */}
            <Row className="justify-content-center">
                <Col lg={8}>
                    <Card className="mb-4">
                        {backgroundPreview && (
                            <div style={{ position: 'relative' }}>
                                <Image
                                    src={backgroundPreview}
                                    alt={t('backgroundImageAlt')}
                                    fluid
                                    style={{ width: '100%', height: '300px', objectFit: 'cover' }}
                                />
                                {/* Logo as Profile Photo */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-75px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    border: '5px solid white',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    width: '150px',
                                    height: '150px',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                    zIndex: 2 // Ensures the logo is above other elements
                                }}>
                                    {logoPreview && (
                                        <Image
                                            src={logoPreview}
                                            alt={t('logoAlt')}
                                            fluid
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                        {/* Adjust the top margin if background image is not present */}
                        {!backgroundPreview && logoPreview && (
                            <div className="text-center my-4">
                                <Image
                                    src={logoPreview}
                                    alt={t('logoAlt')}
                                    roundedCircle
                                    style={{ width: '150px', height: '150px', objectFit: 'cover', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
                                />
                            </div>
                        )}
                    </Card>

                    <Card>
                        <Card.Header as="h5">{t('updateRestaurantProfile')}</Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            <Form onSubmit={handleProfileUpdate} encType="multipart/form-data">
                                <Form.Group as={Row} className="mb-3" controlId="restaurantName">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.name')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="text"
                                            value={restaurantName}
                                            onChange={(e) => setRestaurantName(e.target.value)}
                                            placeholder={t('register.restaurantForm.placeholders.name')}
                                            required
                                        />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="address">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.address')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="text"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder={t('register.restaurantForm.placeholders.address')}
                                            required
                                        />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="phoneNumber">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.phoneNumber')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <PhoneInput
                                            country={'sa'}
                                            value={phoneNumber}
                                            onChange={setPhoneNumber}
                                            inputProps={{
                                                name: 'phone_number',
                                                required: true,
                                                className: 'form-control',
                                                placeholder: t('register.restaurantForm.placeholders.phoneNumber'),
                                            }}
                                            containerStyle={{ width: '100%' }}
                                            inputStyle={{ width: '100%' }}
                                            buttonStyle={{ borderLeft: 'none' }} // Aligns the country code on the left
                                            specialLabel=""
                                        />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="tables">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.tables')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="number"
                                            value={10} // Default value as in RegisterPage
                                            disabled // Assuming tables count is not editable in profile
                                        />
                                    </Col>
                                </Form.Group>

                                {/* Country Select */}
                                <Form.Group as={Row} className="mb-3" controlId="country">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.country')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Select
                                            id="country"
                                            name="country"
                                            options={countryOptions}
                                            value={country}
                                            onChange={handleSelectChange}
                                            placeholder={t('register.restaurantForm.placeholders.country')}
                                            isClearable
                                            required
                                        />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="city">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.city')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="text"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder={t('register.restaurantForm.placeholders.city')}
                                            required
                                        />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="postalCode">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.postalCode')}
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="text"
                                            value={postalCode}
                                            onChange={(e) => setPostalCode(e.target.value)}
                                            placeholder={t('register.restaurantForm.placeholders.postalCode')}
                                        />
                                    </Col>
                                </Form.Group>

                                {/* Currency Select */}
                                <Form.Group as={Row} className="mb-3" controlId="currency">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.currency')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Select
                                            id="currency"
                                            name="currency"
                                            options={currencyOptions}
                                            value={currency}
                                            onChange={handleSelectChange}
                                            placeholder={t('register.restaurantForm.placeholders.currency')}
                                            isClearable
                                            required
                                        />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className="mb-3" controlId="numberOfEmployees">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.numberOfEmployees')} <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="number"
                                            value={numberOfEmployees}
                                            onChange={(e) => setNumberOfEmployees(e.target.value)}
                                            min="1"
                                            placeholder={t('register.restaurantForm.placeholders.numberOfEmployees')}
                                            required
                                        />
                                    </Col>
                                </Form.Group>

                                {/* Logo Upload */}
                                <Form.Group as={Row} className="mb-3" controlId="logo">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.logo')}
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoChange}
                                        />
                                        {logoPreview && (
                                            <div className="mt-3 text-center">
                                                <Image
                                                    src={logoPreview}
                                                    alt={t('register.restaurantForm.logoAlt')}
                                                    roundedCircle
                                                    fluid
                                                    style={{ width: '150px', height: '150px', objectFit: 'cover', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
                                                />
                                                <p className="mt-2">{t('register.restaurantForm.logoPreview')}</p>
                                            </div>
                                        )}
                                    </Col>
                                </Form.Group>

                                {/* Background Image Upload */}
                                <Form.Group as={Row} className="mb-3" controlId="backgroundImage">
                                    <Form.Label column sm={3}>
                                        {t('register.restaurantForm.backgroundImage')}
                                    </Form.Label>
                                    <Col sm={9}>
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={handleBackgroundChange}
                                        />
                                        {backgroundPreview && (
                                            <div className="mt-3 text-center">
                                                <Image
                                                    src={backgroundPreview}
                                                    alt={t('register.restaurantForm.backgroundImageAlt')}
                                                    fluid
                                                    style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}
                                                />
                                                <p className="mt-2">{t('register.restaurantForm.backgroundImagePreview')}</p>
                                            </div>
                                        )}
                                    </Col>
                                </Form.Group>

                                <Row>
                                    <Col sm={{ span: 9, offset: 3 }}>
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
                                                    {t('register.buttons.updating')}
                                                </>
                                            ) : (
                                                <>
                                                    <FaUpload /> {t('register.buttons.updateProfile')}
                                                </>
                                            )}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default RestaurantProfilePage;
