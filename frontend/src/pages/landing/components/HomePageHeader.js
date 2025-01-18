import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { FaLanguage, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import 'bootstrap/dist/css/bootstrap.min.css';

const HomePageHeader = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <Navbar 
      bg="transparent" 
      variant="dark" 
      expand="lg" 
      className="py-3"
      style={{ 
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(0, 0, 0, 0.5)'
      }}
    >
      <Container>
        {/* Brand */}
        <Navbar.Brand as={Link} to="/" className="fs-3 fw-bold">
          {t('appName')}
        </Navbar.Brand>

        {/* Toggle for mobile */}
        <Navbar.Toggle aria-controls="navbar-nav" />

        {/* Navigation Items */}
        <Navbar.Collapse id="navbar-nav">
          <Nav className="ms-auto align-items-center">
            {/* Language Selector */}
            <NavDropdown
              title={
                <>
                  <FaLanguage className="me-1" />
                  {i18n.language.toUpperCase()}
                </>
              }
              id="language-dropdown"
              className="me-3"
            >
              <NavDropdown.Item onClick={() => changeLanguage('en')}>
                🇬🇧 English
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => changeLanguage('ar')}>
                🇸🇦 العربية
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => changeLanguage('tr')}>
                🇹🇷 Türkçe
              </NavDropdown.Item>
              <NavDropdown.Item onClick={() => changeLanguage('nl')}>
                🇳🇱 Nederlands
              </NavDropdown.Item>
            </NavDropdown>

            {/* Login Button */}
            <Nav.Link 
              as={Link} 
              to="/login"
              className="btn btn-outline-light me-2 d-flex align-items-center"
            >
              <FaSignInAlt className="me-2" />
              {t('login')}
            </Nav.Link>

            {/* Register Button */}
            <Nav.Link 
              as={Link} 
              to="/register"
              className="btn btn-primary d-flex align-items-center"
              style={{
                background: 'linear-gradient(45deg, #007bff, #0056b3)',
                border: 'none'
              }}
            >
              <FaUserPlus className="me-2" />
              {t('register')}
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default HomePageHeader;
