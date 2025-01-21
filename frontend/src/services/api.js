import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: API_URL,
});

// Helper to get tokens from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Login function
export const login = async (credentials) => {
    try {
        const response = await axiosInstance.post('token/', credentials);
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        return response;
    } catch (error) {
        throw error.response;
    }
};

// Logout function
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
};

// Function to refresh token
const refreshToken = async () => {
    try {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) throw new Error('No refresh token available');

        const response = await axiosInstance.post('token/refresh/', {
            refresh: refresh
        });

        localStorage.setItem('token', response.data.access);
        if (response.data.refresh) {
            localStorage.setItem('refreshToken', response.data.refresh);
        }

        return response.data.access;
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw error;
    }
};

// Add request interceptor to include auth header
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add interceptor to handle token refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const token = await refreshToken();
                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            } catch (refreshError) {
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// -------------------------------- Existing API Functions ---------------------------------

// Get Menus for a Restaurant
export const getRestaurantMenus = (restaurantId) => {
    return axiosInstance.get(`restaurants/${restaurantId}/menus/`, {
        headers: {} // Public endpoint
    });
};

// Get Menu Items
export const getMenuItems = (restaurantId, menuId, categoryId) => {
    const params = {
        restaurant: restaurantId,
        menu: menuId
    };
    if (categoryId) {
        params.category = categoryId;
    }
    return axiosInstance.get('menu-items/', { 
        params,
        headers: {} // Public endpoint
    });
};

// Get a Menu Item by restaurantId and itemId
export const getMenuItemById = (restaurantId, menuItemId) => {
    return axiosInstance.get(`restaurants/${restaurantId}/menu-items/${menuItemId}/`);
};

// Get Orders
export const getOrders = (restaurantId) => {
    return axiosInstance.get(`orders/?restaurant=${restaurantId}`);
};

// Delete Order
export const deleteOrder = (orderId) => {
    return axiosInstance.delete(`orders/${orderId}/`);
};

// Get Table ID from table number
export const getTableId = async (restaurantId, tableNumber) => {
    try {
        console.log('Fetching table ID for:', { restaurantId, tableNumber });
        const response = await axiosInstance.get(`restaurants/${restaurantId}/tables/`, {
            params: { table_number: tableNumber },
            headers: {} // Public endpoint
        });
        console.log('Tables response:', response.data);
        const parsedTableNumber = parseInt(tableNumber, 10);
        const table = response.data.find(t => t.number === parsedTableNumber);
        console.log('Found table:', table);
        return table ? table.id : null;
    } catch (error) {
        console.error('Error fetching table ID:', error);
        throw error;
    }
};

// Place an Order
export const placeOrder = async (data) => {
    try {
        console.log('Placing order with data:', JSON.stringify(data, null, 2));
        
        // Validate required fields
        if (!data.restaurant || !data.table || !data.menu) {
            console.error('Missing required fields:', { 
                restaurant: data.restaurant, 
                table: data.table, 
                menu: data.menu 
            });
            throw new Error('Missing required fields');
        }

        // Validate order items
        if (!data.order_items || !data.order_items.length) {
            console.error('No order items provided');
            throw new Error('Order items are required');
        }

        // Validate each order item
        data.order_items.forEach((item, index) => {
            console.log(`Validating item ${index}:`, item);
            if (!item.menu_item || !item.quantity) {
                console.error(`Invalid item at index ${index}:`, item);
                throw new Error(`Invalid item data at index ${index}`);
            }
        });

        const response = await axiosInstance.post('orders/', data, {
            headers: {
                'Content-Type': 'application/json',
                // Public endpoint
            }
        });
        
        console.log('Order placed successfully:', response.data);
        return response;
    } catch (error) {
        console.error('Error placing order:', error);
        console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        
        if (error.response?.data) {
            throw error.response;
        }
        throw error;
    }
};

// Update order status
export const updateOrderStatus = (orderId, statusData) => {
    return axiosInstance.patch(`orders/${orderId}/`, statusData);
};

// Fetch QR codes for tables and total table count
export const getQrCodes = (restaurantId) => {
    return axiosInstance.get(`restaurants/${restaurantId}/get_qr_codes/`);
};

// Add a new table
export const addTable = (restaurantId) => {
    return axiosInstance.post(`restaurants/${restaurantId}/add_table/`, {
        capacity: 4  // Default capacity
    });
};

// Remove a table
export const removeTable = (restaurantId) => {
    return axiosInstance.post(`restaurants/${restaurantId}/remove_table/`, {});
};

// Get Order Status by Restaurant and Table Number (Public endpoint)
export const getOrderStatus = async (restaurantId, tableNumber) => {
    try {
        console.log("mew");
        console.log(restaurantId);
        console.log(tableNumber);
        const response = await axiosInstance.get('orders/status', {
            params: { restaurant: restaurantId, table_number: tableNumber },
            headers: {} // Override auth headers for public endpoint
        });
        return response.data || [];
    } catch (error) {
        console.error("Error fetching order status:", error);
        return [];
    }
};

// Get Restaurant Public Details (Public endpoint)
export const getRestaurantPublicDetails = (restaurantId) => {
    return axiosInstance.get(`restaurants/${restaurantId}/public-details/`, {
        headers: {} // Override auth headers for public endpoint
    });
};

// Get Menu Item Details (Public endpoint)
export const getMenuItemDetails = (restaurantId, itemId) => {
    return axiosInstance.get(`menu-items/${itemId}/`, {
        params: { restaurant: restaurantId },
        headers: {} // Override auth headers for public endpoint
    });
};

// Get Menu Items by Category
export const getMenuItemsByCategory = (categoryId) => {
    console.log(categoryId);
    return axiosInstance.get(`categories/menu-items-by-category/${categoryId}/`);
};

// Combined registration function (Public endpoint)
export const registerUserAndRestaurant = async (registrationData) => {
    console.log('Starting registration with data:', registrationData);
    
    const essentialData = {
        user: {
            username: registrationData.user.username,
            email: registrationData.user.email,
            password: registrationData.user.password
        },
        restaurant: {
            name: registrationData.restaurant.name
        }
    };
    
    try {
        console.log('Sending registration request with data:', essentialData);
        const response = await axiosInstance.post('register/', essentialData, {
            headers: { 
                'Content-Type': 'application/json',
                Authorization: undefined // Override auth headers for public endpoint
            }
        });
        console.log('Registration successful:', response.data);
        return response;
    } catch (error) {
        console.error('Registration error:', error);
        console.error('Error response:', error.response?.data);
        if (error.response?.data) {
            throw error.response.data;
        } else {
            throw { error: 'An unexpected error occurred during registration.' };
        }
    }
};

// Complete restaurant profile after registration
export const completeRestaurantProfile = (restaurantId, profileData) => {
    return axiosInstance.patch(`restaurants/${restaurantId}/update-profile/`, profileData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// Function to create a new user (Public endpoint)
export const createUser = async (userData) => {
    return axiosInstance.post('register-user/', { user: userData }, {
        headers: { 
            'Content-Type': 'application/json',
            Authorization: undefined // Override auth headers for public endpoint
        }
    });
};

// Function to add staff to a restaurant
export const addStaff = async (restaurantId, staffUsernames) => {
    return axiosInstance.post(`restaurants/${restaurantId}/add-staff/`, {
        staff: staffUsernames
    });
};

// Function to remove staff from a restaurant
export const removeStaff = async (restaurantId, staffUsernames) => {
    return axiosInstance.delete(`restaurants/${restaurantId}/remove-staff/`, {
        data: { staff: staffUsernames }
    });
};

// Validate User Data (Public endpoint)
export const validateUserData = (userData) => {
    return axiosInstance.post('validate-user/', userData, {
        headers: { Authorization: undefined } // Override auth headers for public endpoint
    });
};

// ------------------------------ New API Functions for Additional Pages -----------------------------

// Get Restaurant Profile
export const getRestaurantProfile = (restaurantId) => {
    return axiosInstance.get(`restaurants/${restaurantId}/profile/`);
};

// Update Restaurant Profile using PATCH
export const updateRestaurantProfile = (restaurantId, data) => {
    return axiosInstance.patch(`restaurants/${restaurantId}/update-profile/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// Create Category
export const createCategory = (restaurantId, name, imageFile, menuId) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('restaurant', restaurantId);
    formData.append('menu', menuId);
    if (imageFile) {
        formData.append('image', imageFile);
    }
    return axiosInstance.post('categories/', formData);
};

// Update Category with Image Upload
export const updateCategory = (categoryId, name, imageFile, menuId) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('menu', menuId);
    if (imageFile) {
        formData.append('image', imageFile);
    }
    return axiosInstance.patch(`categories/${categoryId}/`, formData);
};

// Delete a Category
export const deleteCategory = (categoryId) => {
    if (!categoryId) {
        throw new Error('Category ID is required');
    }
    return axiosInstance.delete(`categories/${categoryId}/`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

// Get Categories for a specific restaurant
export const getCategories = (restaurantId, menuId) => {
    if (!menuId) {
        throw new Error('Menu ID is required');
    }
    return axiosInstance.get(`restaurants/${restaurantId}/categories/`, {
        params: { menu: menuId },
        headers: {} // Public endpoint
    });
};

export const getCategoryById = (categoryId) => {
    return axiosInstance.get(`categories/${categoryId}/`);
};

// Fetch Staff List for a Restaurant
export const getStaffList = (restaurantId) => {
    return axiosInstance.get(`restaurants/${restaurantId}/staff/`);
};

// Create Menu Item with Image Upload
export const createMenuItem = (formData) => {
    // Log form data for debugging
    for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
    }
    return axiosInstance.post('menu-items/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
};

// Update Menu Item Details
export const updateMenuItem = (menuItemId, formData) => {
    return axiosInstance.patch(`menu-items/${menuItemId}/`, formData);
};

// Delete Menu Item
export const deleteMenuItem = (menuItemId) => {
    if (!menuItemId) {
        throw new Error('Menu Item ID is required');
    }
    return axiosInstance.delete(`menu-items/${menuItemId}/`, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

// Get All Restaurants for an Owner
export const getOwnerRestaurants = () => {
    return axiosInstance.get('owner/restaurants/');
};

// Activate account using uidb64 and token (Public endpoint)
export const activateAccount = (uidb64, token) => {
    return axiosInstance.get(`activate/${uidb64}/${token}/`, {
        headers: { Authorization: undefined }
    });
};

// Request password reset link via email (Public endpoint)
export const requestPasswordReset = (email) => {
    return axiosInstance.post('password-reset/', { email }, {
        headers: { Authorization: undefined }
    });
};

// Confirm password reset with uidb64 and token (Public endpoint)
export const confirmPasswordReset = (uidb64, token, newPassword, confirmPassword) => {
    return axiosInstance.post(`password-reset-confirm/${uidb64}/${token}/`, {
        new_password: newPassword,
        confirm_password: confirmPassword,
    }, {
        headers: { Authorization: undefined }
    });
};

// Recover username via email (Public endpoint)
export const recoverUsername = (email) => {
    return axiosInstance.post('username-recovery/', { email }, {
        headers: { Authorization: undefined }
    });
};

// Help Request Functions
export const fetchHelpRequests = (restaurantId) => {
    return axiosInstance.get('help-requests/', {
        params: { restaurant: restaurantId }
    });
};

export const acceptHelpRequest = (helpRequestId, responseText) => {
    return axiosInstance.patch(`help-requests/${helpRequestId}/`, {
        status: 'Accepted',
        response: responseText
    });
};

export const declineHelpRequest = (helpRequestId, responseText) => {
    return axiosInstance.patch(`help-requests/${helpRequestId}/`, {
        status: 'Declined',
        response: responseText
    });
};

export const deleteHelpRequest = (helpRequestId) => {
    return axiosInstance.delete(`help-requests/${helpRequestId}/`);
};

export const resolveHelpRequest = (helpRequestId, responseText) => {
    return axiosInstance.patch(`help-requests/${helpRequestId}/`, {
        status: 'Resolved',
        response: responseText
    });
};

export const getHelpRequestById = (helpRequestId) => {
    return axiosInstance.get(`help-requests/${helpRequestId}/`);
};

export const createHelpRequest = (helpRequestData) => {
    return axiosInstance.post('help-requests/', helpRequestData);
};
