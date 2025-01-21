// src/App.js

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode'; // Corrected import statement
import { useTranslation } from 'react-i18next';
import { getRestaurantMenus } from './services/api';
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
import PasswordResetRequestPage from './pages/shared/PasswordResetRequestPage'; // New Import
import PasswordResetConfirmPage from './pages/shared/PasswordResetConfirmPage'; // New Import
import ActivateAccountPage from './pages/shared/ActivateAccountPage'; // New Import
import UsernameRecoveryPage from './pages/shared/UsernameRecoveryPage'; // New Import
import { AuthProvider } from './AuthContext'; // Import AuthProvider
import PrivateRoute from './components/PrivateRoute'; // Import PrivateRoute

// Function to retrieve basket from localStorage (optional for persistence)
const loadBasketFromLocalStorage = () => {
    const storedBasket = localStorage.getItem('basket');
    return storedBasket ? JSON.parse(storedBasket) : [];
};

const App = () => {
    const [basketItems, setBasketItems] = useState(loadBasketFromLocalStorage);
    const [totalPrice, setTotalPrice] = useState(0);

    // Calculate total price whenever basketItems changes
    useEffect(() => {
        const newTotalPrice = basketItems.reduce((total, item) => total + item.price * item.quantity, 0);
        setTotalPrice(newTotalPrice);
    }, [basketItems]);

    // Synchronize basket state with localStorage to persist after page refresh
    useEffect(() => {
        localStorage.setItem('basket', JSON.stringify(basketItems));
    }, [basketItems]);

    // Add an item to the basket
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

    // Update the quantity of an item in the basket
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

    // Remove an item from the basket
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

    // Extract params and handle menu selection
    const CustomerHeaderWithParams = () => {
        const { restaurantId, tableNumber, menuId } = useParams();
        const navigate = useNavigate();
        const { i18n } = useTranslation();
        const [availableMenus, setAvailableMenus] = useState([]);
        const [currentMenu, setCurrentMenu] = useState(null);

        useEffect(() => {
            const fetchMenus = async () => {
                try {
                    const response = await getRestaurantMenus(restaurantId);
                    const menus = response.data.menus || [];
                    setAvailableMenus(menus);
                    
                    // If menuId is provided, find that menu
                    if (menuId) {
                        const menu = menus.find(m => m.id === menuId);
                        if (menu) setCurrentMenu(menu);
                    } else {
                        // If no menuId, try to find menu matching current language
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
                    }
                } catch (error) {
                    console.error('Error fetching menus:', error);
                }
            };

            if (restaurantId) {
                fetchMenus();
            }
        }, [restaurantId, menuId, i18n.language, navigate, tableNumber]);

        const handleMenuChange = (newMenu) => {
            setCurrentMenu(newMenu);
            // Always navigate back to the menu page when changing language/menu
            navigate(`/restaurant/${restaurantId}/menu/${newMenu.id}/table/${tableNumber}`);
        };

        return (
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
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Route for Home Page */}
                    <Route path="/" element={
                        <>
                            <HomePageHeader />
                            <HomePage />
                        </>
                    } />

                    {/* Auth-related Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/logout" element={<LogoutPage />} />

                    {/* Account Activation Route */}
                    <Route path="/activate/:uidb64/:token/" element={<ActivateAccountPage />} />

                    {/* Password Reset Routes */}
                    <Route path="/password-reset" element={<PasswordResetRequestPage />} />
                    <Route path="/password-reset-confirm/:uidb64/:token/" element={<PasswordResetConfirmPage />} />

                    {/* Username Recovery Route */}
                    <Route path="/username-recovery" element={<UsernameRecoveryPage />} />

                    {/* Authenticated Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <DashboardPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/orders/:restaurantId"
                        element={
                            <PrivateRoute>
                                <OrderPage />
                            </PrivateRoute>
                        }
                    />

                    {/* Restaurant management routes for authenticated users */}
                    <Route
                        path="/restaurant/:restaurantId/*"
                        element={
                            <PrivateRoute>
                                <RestaurantManagementLayout />
                            </PrivateRoute>
                        }
                    >
                        <Route path="profile" element={<RestaurantProfilePage />} />
        {/* Menu Management Routes */}
        <Route path="menus" element={<MenuManagementPage />} />
        <Route path="menus/:menuId/categories" element={<CategoryManagementPage />} />
        <Route path="menus/:menuId/categories/:categoryId/edit" element={<CategoryEditPage />} />
        <Route path="menus/:menuId/menu-items" element={<MenuItemManagementPage />} />
        <Route path="menus/:menuId/menu-items/create" element={<MenuItemCreatePage />} />
        <Route path="menus/:menuId/menu-items/:menuItemId/edit" element={<MenuItemEditPage />} />
                        <Route path="staff" element={<StaffManagementPage />} />
                        <Route path="categories" element={<CategoryManagementPage />} />
                        <Route path="categories/:categoryId/edit" element={<CategoryEditPage />} />
                        {/* Added MenuItem management routes */}
                        <Route path="menu-items" element={<MenuItemManagementPage />} />
                        <Route path="menu-items/create" element={<MenuItemCreatePage />} />
                        <Route path="menu-items/:menuItemId/edit" element={<MenuItemEditPage />} />
                    </Route>

                    {/* Public (Non-Authenticated) Customer Routes */}
                    {/* Route for QR code access with menu ID */}
                    <Route
                        path="/restaurant/:restaurantId/menu/:menuId/table/:tableNumber"
                        element={
                            <Layout>
                                <CustomerHeaderWithParams />
                                <CustomerMenuPage basketItems={basketItems} addToBasket={addToBasket} />
                            </Layout>
                        }
                    />
                    {/* Fallback route without menu ID */}
                    <Route
                        path="/restaurant/:restaurantId/table/:tableNumber"
                        element={
                            <Layout>
                                <CustomerHeaderWithParams />
                                <CustomerMenuPage basketItems={basketItems} addToBasket={addToBasket} />
                            </Layout>
                        }
                    />
                    <Route
                        path="/restaurant/:restaurantId/menu/:menuId/table/:tableNumber/menu-item/:itemId"
                        element={
                            <Layout>
                                <CustomerHeaderWithParams />
                                <CustomerMenuItemPage addToBasket={addToBasket} />
                            </Layout>
                        }
                    />
                    <Route
                        path="/restaurant/:restaurantId/menu/:menuId/order-basket/:tableNumber"
                        element={
                            <Layout>
                                <CustomerHeaderWithParams />
                                <OrderBasketPage
                                    basketItems={basketItems}
                                    updateBasketItem={updateBasketItem}
                                    removeBasketItem={removeBasketItem}
                                    setBasketItems={setBasketItems}
                                />
                            </Layout>
                        }
                    />
                    <Route
                        path="/restaurant/:restaurantId/menu/:menuId/table/:tableNumber/category/:categoryId"
                        element={
                            <Layout>
                                <CustomerHeaderWithParams />
                                <CategoryPage addToBasket={addToBasket} />
                            </Layout>
                        }
                    />
                    <Route
                        path="/restaurant/:restaurantId/menu/:menuId/order-success/:tableNumber"
                        element={
                            <Layout>
                                <CustomerHeaderWithParams />
                                <OrderSuccessPage />
                            </Layout>
                        }
                    />

                    {/* Redirect unknown routes to Home Page */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;
