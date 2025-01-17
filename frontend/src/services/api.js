import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/';

// Helper to get token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// -------------------------------- Existing API Functions ---------------------------------

// Get Menu Items
export const getMenuItems = (restaurantId) => {
    console.log(restaurantId);
    return axios.get(`${API_URL}/menu-items/?restaurant=${restaurantId}`, {
    });
};

// Get a Menu Item by restaurantId and itemId
export const getMenuItemById = (restaurantId, menuItemId) => {
    return axios.get(`${API_URL}/restaurants/${restaurantId}/menu-items/${menuItemId}/`, {
        headers: getAuthHeaders(),
    });
};



// Get Orders
export const getOrders = (restaurantId) => {
    return axios.get(`${API_URL}/orders/?restaurant=${restaurantId}`, {
        headers: getAuthHeaders(),
    });
};

// Delete Order
export const deleteOrder = (orderId) => {
    return axios.delete(`${API_URL}/orders/${orderId}/`, {
        headers: getAuthHeaders(),
    });
};

// Place an Order
export const placeOrder = async (data) => {
    try {
        console.log(data);
        const response = await axios.post(`${API_URL}/orders/`, data);
        return response;  // Return the full response
    } catch (error) {
        throw error.response;  // Throw the error response to be caught in the frontend
    }
};

// Update order status
export const updateOrderStatus = (orderId, statusData) => {
    return axios.patch(`${API_URL}/orders/${orderId}/`, statusData, {
        headers: getAuthHeaders(),
    });
};

// Fetch QR codes for tables and total table count
export const getQrCodes = (restaurantId) => {
    return axios.get(`${API_URL}/restaurants/${restaurantId}/get_qr_codes/`, {
        headers: getAuthHeaders(),
    });
};

// Add a new table
export const addTable = (restaurantId) => {
    return axios.post(`${API_URL}/restaurants/${restaurantId}/add_table/`, {}, {
        headers: getAuthHeaders(),
    });
};

// Remove a table
export const removeTable = (restaurantId) => {
    return axios.post(`${API_URL}/restaurants/${restaurantId}/remove_table/`, {}, {
        headers: getAuthHeaders(),
    });
};

// Get Order Status by Restaurant and Table Number
export const getOrderStatus = async (restaurantId, tableNumber) => {
    try {
        console.log("mew");
        console.log(restaurantId);
        console.log(tableNumber);
        const response = await axios.get(`${API_URL}/orders/status`, {
            params: { restaurant: restaurantId, table_number: tableNumber },
        });
        return response.data || [];
    } catch (error) {
        console.error("Error fetching order status:", error);
        return [];
    }
};

// Get Restaurant Public Details
export const getRestaurantPublicDetails = (restaurantId) => {
    return axios.get(`${API_URL}/restaurants/${restaurantId}/public-details/`, {
        headers: {}  // Ensure no headers are sent
    });
};


// Get Menu Item Details
export const getMenuItemDetails = (restaurantId, itemId) => {
    return axios.get(`${API_URL}/restaurants/${restaurantId}/menu-items/${itemId}/`);
};

// Get Menu Items by Category
export const getMenuItemsByCategory = (categoryId) => {
    console.log(categoryId);
    return axios.get(`${API_URL}/categories/menu-items-by-category/${categoryId}/`, {
        headers: getAuthHeaders(),
    });
};


// Combined registration function
export const registerUserAndRestaurant = async (registrationData) => {
    console.log('Starting registration with data:', registrationData);
    
    // Only send essential data during registration
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
        const response = await axios.post(`${API_URL}/register/`, essentialData, {
            headers: { 'Content-Type': 'application/json' },
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
    return axios.patch(`${API_URL}/restaurants/${restaurantId}/update-profile/`, profileData, {
        headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
        },
    });
};

// Function to create a new user
export const createUser = async (userData) => {
    const response = await axios.post(`${API_URL}/register-user/`, { user: userData }, {
        headers: { 'Content-Type': 'application/json' }
    });
    return response;
};


// Function to add staff to a restaurant
export const addStaff = async (restaurantId, staffUsernames) => {
    const response = await axios.post(`${API_URL}/restaurants/${restaurantId}/add-staff/`, {
        staff: staffUsernames
    }, {
        headers: getAuthHeaders()
    });
    return response;
};

// Function to remove staff from a restaurant
export const removeStaff = async (restaurantId, staffUsernames) => {
    const response = await axios.delete(`${API_URL}/restaurants/${restaurantId}/remove-staff/`, {
        headers: getAuthHeaders(),
        data: { staff: staffUsernames }
    });
    return response;
};

// Validate User Data
export const validateUserData = (userData) => {
    return axios.post(`${API_URL}/validate-user/`, userData);
};

// ------------------------------ New API Functions for Additional Pages -----------------------------

// Get Restaurant Profile
export const getRestaurantProfile = (restaurantId) => {
    return axios.get(`${API_URL}/restaurants/${restaurantId}/profile/`, {
        headers: getAuthHeaders(),
    });
};

// Update Restaurant Profile using PATCH
export const updateRestaurantProfile = (restaurantId, data) => {
    return axios.patch(`${API_URL}/restaurants/${restaurantId}/update-profile/`, data, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
    });
};



// api.js

export const createCategory = (restaurantId, name, imageFile) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('restaurant', restaurantId);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    return axios.post(`${API_URL}/categories/`, formData, {
        headers: getAuthHeaders(), // Do not set 'Content-Type'; axios sets it automatically
    });
};



// Update Category with Image Upload
export const updateCategory = (categoryId, formData) => {
    return axios.patch(`${API_URL}/categories/${categoryId}/`, formData, {
        headers: {
            ...getAuthHeaders(),
            // 'Content-Type': 'multipart/form-data', // Do NOT set this manually
        },
    });
};



// Delete a Category
export const deleteCategory = (categoryId) => {
    return axios.delete(`${API_URL}/categories/${categoryId}/`, {
        headers: getAuthHeaders(),
    });
};

// Get Categories for a specific restaurant
export const getCategories = (restaurantId) => {
    return axios.get(`${API_URL}/restaurants/${restaurantId}/categories/`, {
        headers: getAuthHeaders(),
    });
};

export const getCategoryById = (categoryId) => {
    return axios.get(`${API_URL}/categories/${categoryId}/`, {
        headers: getAuthHeaders(),
    });
};


// Fetch Staff List for a Restaurant
export const getStaffList = (restaurantId) => {
    return axios.get(`${API_URL}/restaurants/${restaurantId}/staff/`, {
        headers: getAuthHeaders(),
    });
};



// Create Menu Item with Image Upload
export const createMenuItem = (formData) => {
    for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
    }
    return axios.post(`${API_URL}/menu-items/`, formData, {
        headers: {
            ...getAuthHeaders(),
            // 'Content-Type': 'multipart/form-data', // Do NOT set this manually
        },
    });
};



// Update Menu Item Details
export const updateMenuItem = (menuItemId, formData) => {
    return axios.patch(`${API_URL}/menu-items/${menuItemId}/`, formData, {
        headers: {
            ...getAuthHeaders(),
            // 'Content-Type' will be set automatically by axios when sending FormData
        },
    });
};

// Delete Menu Item
export const deleteMenuItem = (menuItemId) => {
    return axios.delete(`${API_URL}/menu-items/${menuItemId}/`, {
        headers: getAuthHeaders(),
    });
};
// Get All Restaurants for an Owner (for Dashboard and other Management Views)
export const getOwnerRestaurants = () => {
    return axios.get(`${API_URL}/owner/restaurants/`, {
        headers: getAuthHeaders(),
    });
};

// Activate account using uidb64 and token
export const activateAccount = (uidb64, token) => {
    return axios.get(`${API_URL}/activate/${uidb64}/${token}/`, {
        headers: getAuthHeaders(),
    });
};

// Request password reset link via email
export const requestPasswordReset = (email) => {
    return axios.post(`${API_URL}/password-reset/`, { email });
};

// Confirm password reset with uidb64 and token
export const confirmPasswordReset = (uidb64, token, newPassword, confirmPassword) => {
    return axios.post(`${API_URL}/password-reset-confirm/${uidb64}/${token}/`, {
        new_password: newPassword,
        confirm_password: confirmPassword,
    });
};
// Recover username via email
export const recoverUsername = (email) => {
    return axios.post(`${API_URL}/username-recovery/`, { email });
};

// Fetch Help Requests for a specific restaurant
export const fetchHelpRequests = (restaurantId) => {
    return axios.get(`${API_URL}/help-requests/`, {
        headers: getAuthHeaders(),
        params: { restaurant: restaurantId }
    });
};

// Accept a Help Request
export const acceptHelpRequest = (helpRequestId, responseText) => {
    return axios.patch(`${API_URL}/help-requests/${helpRequestId}/`, {
        status: 'Accepted',
        response: responseText
    }, {
        headers: getAuthHeaders(),
    });
};

// Decline a Help Request
export const declineHelpRequest = (helpRequestId, responseText) => {
    return axios.patch(`${API_URL}help-requests/${helpRequestId}/`, {
        status: 'Declined',
        response: responseText
    }, {
        headers: getAuthHeaders(),
    });
};

// Delete a Help Request
export const deleteHelpRequest = (helpRequestId) => {
    return axios.delete(`${API_URL}/help-requests/${helpRequestId}/`, {
        headers: getAuthHeaders(),
    });
};

// Resolve a Help Request (Optional)
export const resolveHelpRequest = (helpRequestId, responseText) => {
    return axios.patch(`${API_URL}/help-requests/${helpRequestId}/`, {
        status: 'Resolved',
        response: responseText
    }, {
        headers: getAuthHeaders(),
    });
};

// Get a Single Help Request (Optional)
export const getHelpRequestById = (helpRequestId) => {
    return axios.get(`${API_URL}/help-requests/${helpRequestId}/`, {
        headers: getAuthHeaders(),
    });
};

// Create a Help Request (Optional)
export const createHelpRequest = (helpRequestData) => {
    return axios.post(`${API_URL}/help-requests/`, helpRequestData, {
        headers: getAuthHeaders(),
    });
};
