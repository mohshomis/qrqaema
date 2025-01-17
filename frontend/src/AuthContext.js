// src/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import {jwtDecode} from 'jwt-decode'; // Correct import

// Create the AuthContext
export const AuthContext = createContext();

// Create the AuthProvider component
export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userRoles, setUserRoles] = useState({
        is_owner: false,
        is_staff: false,
        restaurant_id: null,
    });

    // Function to handle login and store the token
    const login = (token) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        setToken(token);
        const decodedToken = jwtDecode(token);
        setUserRoles({
            is_owner: decodedToken.is_owner,
            is_staff: decodedToken.is_staff,
            restaurant_id: decodedToken.restaurant_id,
        });
    };

    // Function to handle logout and remove the token
    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setToken(null);
        setUserRoles({
            is_owner: false,
            is_staff: false,
            restaurant_id: null,
        });
    };

    // Check for existing token and validate it
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            try {
                const decodedToken = jwtDecode(storedToken);
                if (decodedToken.exp * 1000 < Date.now()) {
                    // Token has expired
                    logout();
                } else {
                    setIsAuthenticated(true);
                    setToken(storedToken);
                    setUserRoles({
                        is_owner: decodedToken.is_owner,
                        is_staff: decodedToken.is_staff,
                        restaurant_id: decodedToken.restaurant_id,
                    });
                }
            } catch (error) {
                console.error("Error decoding token:", error);
                logout();
            }
        }
        setLoadingAuth(false);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, token, userRoles }}>
            {!loadingAuth && children}
        </AuthContext.Provider>
    );
};
