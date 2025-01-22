import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { getRestaurantProfile } from '../services/api';
import { AuthContext } from '../AuthContext';

const PrivateRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [redirectPath, setRedirectPath] = useState('/login');
    const location = useLocation();
    const authChecked = useRef(false);
    const { isAuthenticated, userRoles } = useContext(AuthContext);

    useEffect(() => {
        const checkAuth = async () => {
            // Skip auth check if we're already on login or complete-profile pages
            if (location.pathname === '/login' || location.pathname === '/complete-profile') {
                setLoading(false);
                return;
            }

            // Skip if we've already checked auth for this location
            if (authChecked.current) {
                return;
            }

            if (!isAuthenticated) {
                console.log('Not authenticated, redirecting to login');
                setShouldRedirect(true);
                setRedirectPath('/login');
                setLoading(false);
                return;
            }

            try {
                // Check if we have a valid restaurant ID from AuthContext
                if (!userRoles.restaurant_id) {
                    console.log('No restaurant ID found in auth context, redirecting to login');
                    setShouldRedirect(true);
                    setRedirectPath('/login');
                } else {
                    console.log('Checking profile for restaurant:', userRoles.restaurant_id);
                    // Check if profile is completed
                    const response = await getRestaurantProfile(userRoles.restaurant_id);
                    const profileData = response.data;
                    
                    // Check if all required fields are present
                    const requiredProfileFields = ['address', 'phone_number', 'country', 'city', 'postal_code'];
                    const profileCompleted = requiredProfileFields.every(field => profileData[field]);

                    // If profile is not completed and we're not already on the profile completion page
                    if (!profileCompleted && location.pathname !== '/complete-profile') {
                        console.log('Profile not completed, redirecting to complete-profile');
                        setShouldRedirect(true);
                        setRedirectPath('/complete-profile');
                    } else {
                        console.log('Auth check passed');
                        setShouldRedirect(false);
                    }
                }
            } catch (error) {
                console.error('Error checking profile:', error);
                setShouldRedirect(true);
                setRedirectPath('/login');
            } finally {
                setLoading(false);
                authChecked.current = true;
            }
        };

        checkAuth();
    }, [location.pathname, isAuthenticated, userRoles.restaurant_id]); // Include auth context dependencies

    if (loading) {
        return <div>Loading...</div>; // You can replace this with a proper loading component
    }

    if (shouldRedirect) {
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;
