import React, { useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as ScrollLink, animateScroll as scroll } from 'react-scroll';
import { Navbar, Nav, Button, Container, Dropdown } from 'react-bootstrap';
import { FaSignInAlt, FaUserPlus, FaLanguage } from 'react-icons/fa'; // Importing icons including FaLanguage for language icon
import { useTranslation } from 'react-i18next'; // Import for localization
import 'bootstrap/dist/css/bootstrap.min.css'; // Ensure Bootstrap CSS is imported

import { AuthContext } from '../AuthContext'; // Import AuthContext
import { FiGlobe } from 'react-icons/fi'; // Import a globe icon for language switcher
import { FlagIcon } from 'react-flag-kit'; // Optional: You can use react-flag-kit or any other library for flags

const HomePageHeader = () => {
    const { isAuthenticated } = useContext(AuthContext); // Consume AuthContext
    const { t, i18n } = useTranslation(); // Using useTranslation hook for localization

    // Function to handle scroll to top when brand is clicked
    const scrollToTop = () => {
        scroll.scrollToTop();
    };

    // Function to change language
    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    return (
        <Navbar
            expand="lg"
            fixed="top"
            className="mb-4"
            style={{
                background: 'linear-gradient(135deg, #007bff, #00c853)',
                overflow: 'visible' // Ensure overflow is visible for the container
            }}
        >
            <Container fluid style={{ overflow: 'visible' }}>
                {/* Navbar Brand */}
                <Navbar.Brand
                    as={RouterLink}
                    to="/"
                    onClick={scrollToTop}
                    className="text-white fw-bold"
                >
                    {t('navbar.brand')} {/* Localized brand name */}
                </Navbar.Brand>

                {/* Toggle Button for Mobile View */}
                <Navbar.Toggle aria-controls="navbar-nav" />

                {/* Navbar Links */}
                <Navbar.Collapse id="navbar-nav" style={{ zIndex: 1040, position: 'relative' }}>
                    <Nav className="me-auto"> {/* 'me-auto' pushes items to the left in RTL */}
                        <Nav.Item>
                            <ScrollLink
                                activeClass="active"
                                to="welcome"
                                spy={true}
                                smooth={true}
                                offset={-70}
                                duration={500}
                                className="nav-link text-white"
                            >
                                {t('navbar.home')} {/* Localized home */}
                            </ScrollLink>
                        </Nav.Item>
                        <Nav.Item>
                            <ScrollLink
                                activeClass="active"
                                to="features"
                                spy={true}
                                smooth={true}
                                offset={-70}
                                duration={500}
                                className="nav-link text-white"
                            >
                                {t('navbar.features')} {/* Localized features */}
                            </ScrollLink>
                        </Nav.Item>
                        <Nav.Item>
                            <ScrollLink
                                activeClass="active"
                                to="pricing"
                                spy={true}
                                smooth={true}
                                offset={-70}
                                duration={500}
                                className="nav-link text-white"
                            >
                                {t('navbar.pricing')} {/* Localized pricing */}
                            </ScrollLink>
                        </Nav.Item>
                        <Nav.Item>
                            <ScrollLink
                                activeClass="active"
                                to="testimonials"
                                spy={true}
                                smooth={true}
                                offset={-70}
                                duration={500}
                                className="nav-link text-white"
                            >
                                {t('navbar.testimonials')} {/* Localized testimonials */}
                            </ScrollLink>
                        </Nav.Item>
                    </Nav>

                    <Nav className="d-flex align-items-center gap-3">
                        <Nav.Item>
                            {isAuthenticated ? (
                                <Button
                                    as={RouterLink}
                                    to="/dashboard"
                                    variant="outline-light"
                                    className="d-flex align-items-center"
                                    style={{ minWidth: '150px' }}
                                >
                                    <FaSignInAlt className="me-2" />
                                    {t('navbar.dashboard')} {/* Localized dashboard */}
                                </Button>
                            ) : (
                                <Button
                                    as={RouterLink}
                                    to="/login"
                                    variant="outline-light"
                                    className="d-flex align-items-center"
                                    style={{ minWidth: '150px' }}
                                >
                                    <FaSignInAlt className="me-2" />
                                    {t('navbar.login')} {/* Localized login */}
                                </Button>
                            )}
                        </Nav.Item>
                        <Nav.Item>
                            <Button
                                as={RouterLink}
                                to="/register"
                                variant="light"
                                className="d-flex align-items-center"
                                style={{ minWidth: '150px', color: '#fff', backgroundColor: 'transparent', borderColor: '#fff' }}
                            >
                                <FaUserPlus className="me-2" />
                                {t('navbar.register')} {/* Localized register */}
                            </Button>
                        </Nav.Item>

                        {/* Language Switcher */}
                        <Dropdown style={{ zIndex: 1050 }}> {/* Added z-index to ensure dropdown appears above other content */}
                            <Dropdown.Toggle variant="outline-light" id="dropdown-basic">
                                <FaLanguage className="me-1" /> {t('navbar.language')} {/* Localized language */}
                            </Dropdown.Toggle>

                            <Dropdown.Menu style={{ zIndex: 1050, position: 'absolute' }}>
                                <Dropdown.Item onClick={() => changeLanguage('en')}>
                                    <FlagIcon code="GB" size={20} className="me-2" /> English
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => changeLanguage('ar')}>
                                    <FlagIcon code="SA" size={20} className="me-2" /> العربية
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => changeLanguage('tr')}>
                                    <FlagIcon code="TR" size={20} className="me-2" /> Türkçe
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => changeLanguage('nl')}>
                                    <FlagIcon code="NL" size={20} className="me-2" /> Nederlands
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default HomePageHeader;
