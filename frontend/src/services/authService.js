import axios from 'axios';
import { API_URL } from './api';

let updateAuthState = null;
let logoutCallback = null;

export const initAuthService = (updateAuthStateFn, logoutFn) => {
    updateAuthState = updateAuthStateFn;
    logoutCallback = logoutFn;
};

export const refreshAuthToken = async () => {
    try {
        console.log('Attempting to refresh token...');
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) {
            console.error('No refresh token available');
            throw new Error('No refresh token available');
        }

        const response = await axios.post(`${API_URL}token/refresh/`, {
            refresh: refresh
        });
        console.log('Token refresh successful');

        // Store the new tokens
        const { access, refresh: newRefresh } = response.data;
        localStorage.setItem('token', access);
        if (newRefresh) {
            localStorage.setItem('refreshToken', newRefresh);
        }

        // Update auth context state
        if (updateAuthState) {
            updateAuthState(access);
        }

        return access;
    } catch (error) {
        console.error('Token refresh failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (logoutCallback) {
            logoutCallback();
        }
        throw error;
    }
};
