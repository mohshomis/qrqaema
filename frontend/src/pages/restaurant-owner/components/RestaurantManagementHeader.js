import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { FaUserCircle, FaUtensils, FaSignOutAlt, FaLanguage, FaEye } from 'react-icons/fa';
import { HiUserGroup } from 'react-icons/hi';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthContext } from '../../../AuthContext';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { getRestaurantMenus } from '../../../services/api';

const RestaurantManagementHeader = () => {
  const navigate = useNavigate();
  const { logout, userRoles } = useContext(AuthContext);
  const { is_owner, is_staff, restaurant_id } = userRoles;
  const { t, i18n } = useTranslation();
  const [defaultMenuId, setDefaultMenuId] = useState(null);

  useEffect(() => {
    const fetchDefaultMenu = async () => {
      try {
        const menusResponse = await getRestaurantMenus(restaurant_id);
        const defaultMenu = menusResponse.data.menus.find(menu => menu.is_default);
        if (defaultMenu) {
          setDefaultMenuId(defaultMenu.id);
        }
      } catch (error) {
        console.error('Error fetching default menu:', error);
      }
    };

    if (restaurant_id) {
      fetchDefaultMenu();
    }
  }, [restaurant_id]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      className="mb-4"
      style={{ overflow: 'visible' }}
      data-tour="header"
    >
      <Container fluid className="d-flex align-items-center" style={{ overflow: 'visible' }}>
        {/* Left Side: Language Selector and Navbar.Brand */}
        <div className="d-flex align-items-center">
          {/* Language Selector */}
          <NavDropdown
            title={
              <>
                <FaLanguage className="me-1" /> {i18n.language.toUpperCase()}
              </>
            }
            id="language-dropdown"
            className="text-white me-3"
            style={{ zIndex: 1050 }}
            menuVariant="dark"
            data-tour="header-language-selector"
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

          {/* Navbar.Brand */}
          <Navbar.Brand
            as={Link}
            to="/dashboard"
            className="fs-4 text-end"
            data-tour="header-brand"
          >
            {t('restaurantManagement')}
          </Navbar.Brand>
        </div>

        {/* Spacer to push right-side content */}
        <div className="flex-grow-1"></div>

        {/* Right Side: Toggle and Navigation Links */}
        <div className="d-flex align-items-center">
          {/* Toggle for mobile view */}
          <Navbar.Toggle aria-controls="navbar-content" />

          {/* Navigation Links */}
          <Navbar.Collapse
            id="navbar-content"
            style={{ position: 'relative', zIndex: 1040, overflow: 'visible' }}
          >
            <Nav className="d-flex align-items-center gap-3">
              {is_owner && (
                <>
                  {/* Profile Link */}
                  <Nav.Link
                    as={Link}
                    to={`/restaurant/${restaurant_id}/profile`}
                    className="text-white d-flex align-items-center"
                    data-tour="header-profile"
                  >
                    <FaUserCircle className="me-2" /> {t('profile')}
                  </Nav.Link>

                  {/* View Menu Link */}
                  <Nav.Link
                    href={defaultMenuId ? `/restaurant/${restaurant_id}/menu/${defaultMenuId}/table/1` : '#'}
                    className="text-white d-flex align-items-center"
                    data-tour="header-view-menu"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => !defaultMenuId && e.preventDefault()}
                  >
                    <FaEye className="me-2" /> {t('viewMenu')}
                  </Nav.Link>

                  {/* Manage Menu Button */}
                  <Nav.Link
                    as={Link}
                    to={`/restaurant/${restaurant_id}/menus`}
                    className="text-white d-flex align-items-center"
                    data-tour="header-manage-menu"
                  >
                    <FaUtensils className="me-2" /> {t('manageMenu')}
                  </Nav.Link>

                  {/* Staff Management */}
                  <Nav.Link
                    as={Link}
                    to={`/restaurant/${restaurant_id}/staff`}
                    className="text-white d-flex align-items-center"
                    data-tour="header-manage-employees"
                  >
                    <HiUserGroup className="me-2" /> {t('manageEmployees')}
                  </Nav.Link>
                </>
              )}

              {/* Conditionally render Sign Out button for both owners and staff */}
              {(is_owner || is_staff) && (
                <Button
                  variant="danger"
                  className="d-flex align-items-center"
                  onClick={handleLogout}
                  data-tour="header-logout"
                  aria-label={t('logout')}
                >
                  <FaSignOutAlt className="me-2" /> {t('logout')}
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </div>
      </Container>
    </Navbar>
  );
};

// PropTypes for type checking
RestaurantManagementHeader.propTypes = {
  onReplayTour: PropTypes.func,
};

export default RestaurantManagementHeader;
