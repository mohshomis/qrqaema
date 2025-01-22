import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [userRoles, setUserRoles] = useState({
        is_owner: false,
        is_staff: false,
        restaurant_id: null,
    });

    const updateAuthState = useCallback((token) => {
        try {
            const decodedToken = jwtDecode(token);
            setIsAuthenticated(true);
            setToken(token);
            setUserRoles({
                is_owner: decodedToken.is_owner,
                is_staff: decodedToken.is_staff,
                restaurant_id: decodedToken.restaurant_id,
            });
            localStorage.setItem('token', token);
        } catch (error) {
            console.error("Error updating auth state:", error);
            logout();
        }
    }, []);

    const login = useCallback((token) => {
        console.log('Logging in with token');
        updateAuthState(token);
    }, [updateAuthState]);

    const logout = useCallback(() => {
        console.log('Logging out');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
        setToken(null);
        setUserRoles({
            is_owner: false,
            is_staff: false,
            restaurant_id: null,
        });
    }, []);

    // Check for existing token and validate it
    useEffect(() => {
        const validateToken = async () => {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                try {
                    const decodedToken = jwtDecode(storedToken);
                    if (decodedToken.exp * 1000 < Date.now()) {
                        console.log('Token expired');
                        logout();
                    } else {
                        console.log('Token valid, updating auth state');
                        updateAuthState(storedToken);
                    }
                } catch (error) {
                    console.error("Error validating token:", error);
                    logout();
                }
            }
            setLoadingAuth(false);
        };

        validateToken();
    }, [logout, updateAuthState]);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated, 
            login, 
            logout, 
            token, 
            userRoles,
            updateAuthState 
        }}>
            {!loadingAuth && children}
        </AuthContext.Provider>
    );
};
