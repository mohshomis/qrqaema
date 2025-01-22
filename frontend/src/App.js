import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import { RestaurantProvider } from './contexts/RestaurantContext';
import { getRestaurantMenus } from './services/api';
import { initAuthService } from './services/authService';
import CustomerHeader from './pages/customer/components/CustomerHeader';
import HomePageHeader from './pages/landing/components/HomePageHeader';
import RestaurantManagementHeader from './pages/restaurant-owner/components/RestaurantManagementHeader';
import Layout from './components/Layout';
import RestaurantManagementLayout from './components/RestaurantManagementLayout';
import CustomerMenuPage from './pages/customer/CustomerMenuPage';
import CustomerMenuItemPage from './pages/customer/CustomerMenuItemPage';
import OrderBasketPage from './pages/customer/OrderBasketPage';
import CategoryPage from './pages/customer/CategoryPage';
import LoginPage from './pages/shared/LoginPage';
import LogoutPage from './pages/shared/LogoutPage';
import DashboardPage from './pages/restaurant-owner/DashboardPage';
import OrderPage from './pages/restaurant-owner/OrderPage';
import CategoryEditPage from './pages/restaurant-owner/CategoryEditPage';
import OrderSuccessPage from './pages/customer/OrderSuccessPage';
import HomePage from './pages/shared/HomePage';
import RegisterPage from './pages/shared/RegisterPage';
import RestaurantProfilePage from './pages/restaurant-owner/RestaurantProfilePage';
import MenuManagementPage from './pages/restaurant-owner/MenuManagementPage';
import StaffManagementPage from './pages/restaurant-owner/StaffManagementPage';
import CategoryManagementPage from './pages/restaurant-owner/CategoryManagementPage';
import MenuItemManagementPage from './pages/restaurant-owner/MenuItemManagementPage';
import MenuItemCreatePage from './pages/restaurant-owner/MenuItemCreatePage';
import MenuItemEditPage from './pages/restaurant-owner/MenuItemEditPage';
import PasswordResetRequestPage from './pages/shared/PasswordResetRequestPage';
import PasswordResetConfirmPage from './pages/shared/PasswordResetConfirmPage';
import ActivateAccountPage from './pages/shared/ActivateAccountPage';
import UsernameRecoveryPage from './pages/shared/UsernameRecoveryPage';
import ProfileCompletionPage from './pages/auth/ProfileCompletionPage';
import { AuthProvider, AuthContext } from './AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Function to retrieve basket from localStorage
const loadBasketFromLocalStorage = () => {
    const storedBasket = localStorage.getItem('basket');
    return storedBasket ? JSON.parse(storedBasket) : [];
};

// Route wrapper component to handle params
const RouteWrapper = ({ children }) => {
    const params = useParams();
    return children(params);
};

const AppContent = () => {
    const { updateAuthState, logout } = React.useContext(AuthContext);
    const [basketItems, setBasketItems] = useState(loadBasketFromLocalStorage);
    const [totalPrice, setTotalPrice] = useState(0);

    // Initialize auth service with context functions
    useEffect(() => {
        initAuthService(updateAuthState, logout);
    }, [updateAuthState, logout]);

    useEffect(() => {
        const newTotalPrice = basketItems.reduce((total, item) => total + item.price * item.quantity, 0);
        setTotalPrice(newTotalPrice);
    }, [basketItems]);

    useEffect(() => {
        localStorage.setItem('basket', JSON.stringify(basketItems));
    }, [basketItems]);

    const addToBasket = (item) => {
        setBasketItems((prevItems) => {
            const existingItem = prevItems.find(
                (i) =>
                    i.id === item.id &&
                    JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions) &&
                    JSON.stringify(i.selectedBooleans) === JSON.stringify(item.selectedBooleans)
            );

            if (existingItem) {
                return prevItems.map((i) =>
                    i.id === item.id &&
                    JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions) &&
                    JSON.stringify(i.selectedBooleans) === JSON.stringify(item.selectedBooleans)
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                );
            } else {
                return [...prevItems, { ...item, quantity: item.quantity || 1 }];
            }
        });
    };

    const updateBasketItem = (item, quantity) => {
        if (quantity > 0) {
            setBasketItems((prevItems) =>
                prevItems.map((i) =>
                    i.id === item.id &&
                    JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions) &&
                    JSON.stringify(i.selectedBooleans) === JSON.stringify(item.selectedBooleans)
                        ? { ...i, quantity: quantity }
                        : i
                )
            );
        }
    };

    const removeBasketItem = (item) => {
        setBasketItems((prevItems) =>
            prevItems.filter(
                (i) =>
                    i.id !== item.id ||
                    JSON.stringify(i.selectedOptions) !== JSON.stringify(item.selectedOptions) ||
                    JSON.stringify(i.selectedBooleans) !== JSON.stringify(item.selectedBooleans)
            )
        );
    };

    const CustomerHeaderWithParams = () => {
        const { restaurantId: rawRestaurantId, tableNumber: rawTableNumber, menuId: rawMenuId } = useParams();
        const navigate = useNavigate();
        const { i18n, t } = useTranslation();
        const [availableMenus, setAvailableMenus] = useState([]);
        const [currentMenu, setCurrentMenu] = useState(null);
        const [error, setError] = useState(null);

        const restaurantId = rawRestaurantId;
        const tableNumber = parseInt(rawTableNumber, 10);
        const menuId = rawMenuId;

        useEffect(() => {
            const fetchMenus = async () => {
                try {
                    if (!restaurantId || isNaN(tableNumber)) {
                        setError('Invalid restaurant or table number');
                        return;
                    }

                    const response = await getRestaurantMenus(restaurantId);
                    const menus = response.data.menus || [];
                    setAvailableMenus(menus);
                    
                    if (menuId) {
                        const menu = menus.find(m => m.id.toString() === menuId);
                        if (menu) {
                            setCurrentMenu(menu);
                            return;
                        }
                    }

                    const userLanguage = localStorage.getItem('language') || i18n.language;
                    const matchingMenu = menus.find(menu => menu.language === userLanguage);
                    const defaultMenu = menus.find(menu => menu.is_default);
                    
                    if (matchingMenu) {
                        setCurrentMenu(matchingMenu);
                        navigate(`/restaurant/${restaurantId}/menu/${matchingMenu.id}/table/${tableNumber}`);
                    } else if (defaultMenu) {
                        setCurrentMenu(defaultMenu);
                        navigate(`/restaurant/${restaurantId}/menu/${defaultMenu.id}/table/${tableNumber}`);
                    }
                } catch (error) {
                    console.error('Error fetching menus:', error);
                    setError('Error loading menus');
                }
            };

            fetchMenus();
        }, [restaurantId, menuId, i18n.language, navigate, tableNumber]);

        const handleMenuChange = (newMenu) => {
            setCurrentMenu(newMenu);
            navigate(`/restaurant/${restaurantId}/menu/${newMenu.id}/table/${tableNumber}`);
        };

        return error ? (
            <div className="alert alert-danger m-3">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
            </div>
        ) : (
            <CustomerHeader 
                basket={basketItems} 
                totalPrice={totalPrice} 
                restaurantId={restaurantId} 
                tableNumber={tableNumber}
                menuId={menuId}
                availableMenus={availableMenus}
                currentMenu={currentMenu}
                onMenuChange={handleMenuChange}
            />
        );
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={
                    <>
                        <HomePageHeader />
                        <HomePage />
                    </>
                } />

                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/logout" element={<LogoutPage />} />
                <Route path="/activate/:uidb64/:token/" element={<ActivateAccountPage />} />
                <Route path="/password-reset" element={<PasswordResetRequestPage />} />
                <Route path="/password-reset-confirm/:uidb64/:token/" element={<PasswordResetConfirmPage />} />
                <Route path="/username-recovery" element={<UsernameRecoveryPage />} />
                <Route path="/complete-profile" element={<ProfileCompletionPage />} />

                <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
                <Route path="/orders/:restaurantId" element={<PrivateRoute><OrderPage /></PrivateRoute>} />

                <Route path="/restaurant/:restaurantId/*" element={<PrivateRoute><RestaurantManagementLayout /></PrivateRoute>}>
                    <Route path="profile" element={<RestaurantProfilePage />} />
                    <Route path="menus" element={<MenuManagementPage />} />
                    <Route path="menus/:menuId/categories" element={<CategoryManagementPage />} />
                    <Route path="menus/:menuId/categories/:categoryId/edit" element={<CategoryEditPage />} />
                    <Route path="menus/:menuId/menu-items" element={<MenuItemManagementPage />} />
                    <Route path="menus/:menuId/menu-items/create" element={<MenuItemCreatePage />} />
                    <Route path="menus/:menuId/menu-items/:menuItemId/edit" element={<MenuItemEditPage />} />
                    <Route path="staff" element={<StaffManagementPage />} />
                    <Route path="categories" element={<CategoryManagementPage />} />
                    <Route path="categories/:categoryId/edit" element={<CategoryEditPage />} />
                    <Route path="menu-items" element={<MenuItemManagementPage />} />
                    <Route path="menu-items/create" element={<MenuItemCreatePage />} />
                    <Route path="menu-items/:menuItemId/edit" element={<MenuItemEditPage />} />
                </Route>

                <Route
                    path="/restaurant/:restaurantId/menu/:menuId/table/:tableNumber"
                    element={
                        <RouteWrapper>
                            {(params) => (
                                <Layout>
                                    <RestaurantProvider restaurantId={params.restaurantId}>
                                        <CustomerHeaderWithParams />
                                        <CustomerMenuPage basketItems={basketItems} addToBasket={addToBasket} />
                                    </RestaurantProvider>
                                </Layout>
                            )}
                        </RouteWrapper>
                    }
                />

                <Route
                    path="/restaurant/:restaurantId/table/:tableNumber"
                    element={
                        <RouteWrapper>
                            {(params) => (
                                <Layout>
                                    <RestaurantProvider restaurantId={params.restaurantId}>
                                        <CustomerHeaderWithParams />
                                        <CustomerMenuPage basketItems={basketItems} addToBasket={addToBasket} />
                                    </RestaurantProvider>
                                </Layout>
                            )}
                        </RouteWrapper>
                    }
                />

                <Route
                    path="/restaurant/:restaurantId/menu/:menuId/table/:tableNumber/menu-item/:itemId"
                    element={
                        <RouteWrapper>
                            {(params) => (
                                <Layout>
                                    <RestaurantProvider restaurantId={params.restaurantId}>
                                        <CustomerHeaderWithParams />
                                        <CustomerMenuItemPage addToBasket={addToBasket} />
                                    </RestaurantProvider>
                                </Layout>
                            )}
                        </RouteWrapper>
                    }
                />

                <Route
                    path="/restaurant/:restaurantId/menu/:menuId/order-basket/:tableNumber"
                    element={
                        <RouteWrapper>
                            {(params) => (
                                <Layout>
                                    <RestaurantProvider restaurantId={params.restaurantId}>
                                        <CustomerHeaderWithParams />
                                        <OrderBasketPage
                                            basketItems={basketItems}
                                            updateBasketItem={updateBasketItem}
                                            removeBasketItem={removeBasketItem}
                                            setBasketItems={setBasketItems}
                                        />
                                    </RestaurantProvider>
                                </Layout>
                            )}
                        </RouteWrapper>
                    }
                />

                <Route
                    path="/restaurant/:restaurantId/menu/:menuId/table/:tableNumber/category/:categoryId"
                    element={
                        <RouteWrapper>
                            {(params) => (
                                <Layout>
                                    <RestaurantProvider restaurantId={params.restaurantId}>
                                        <CustomerHeaderWithParams />
                                        <CategoryPage addToBasket={addToBasket} />
                                    </RestaurantProvider>
                                </Layout>
                            )}
                        </RouteWrapper>
                    }
                />

                <Route
                    path="/restaurant/:restaurantId/menu/:menuId/order-success/:tableNumber"
                    element={
                        <RouteWrapper>
                            {(params) => (
                                <Layout>
                                    <RestaurantProvider restaurantId={params.restaurantId}>
                                        <CustomerHeaderWithParams />
                                        <OrderSuccessPage />
                                    </RestaurantProvider>
                                </Layout>
                            )}
                        </RouteWrapper>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
