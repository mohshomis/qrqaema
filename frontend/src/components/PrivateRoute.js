import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getRestaurantProfile } from '../services/api';

const PrivateRoute = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [shouldRedirect, setShouldRedirect] = useState(false);
    const [redirectPath, setRedirectPath] = useState('/login');
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const restaurantId = localStorage.getItem('restaurantId');

            if (!token) {
                setShouldRedirect(true);
                setRedirectPath('/login');
                setLoading(false);
                return;
            }

            try {
                // Check if profile is completed
                const response = await getRestaurantProfile(restaurantId);
                const profileCompleted = response.data.profile_completed;

                // If profile is not completed and we're not already on the profile completion page
                if (!profileCompleted && location.pathname !== '/complete-profile') {
                    setShouldRedirect(true);
                    setRedirectPath('/complete-profile');
                } else {
                    setShouldRedirect(false);
                }
            } catch (error) {
                console.error('Error checking profile:', error);
                setShouldRedirect(true);
                setRedirectPath('/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [location]);

    if (loading) {
        return <div>Loading...</div>; // You can replace this with a proper loading component
    }

    if (shouldRedirect) {
        return <Navigate to={redirectPath} state={{ from: location }} replace />;
    }

    return children;
};

export default PrivateRoute;
