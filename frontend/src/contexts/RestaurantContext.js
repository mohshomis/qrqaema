import React, { createContext, useContext, useState, useEffect } from 'react';
import { getRestaurantPublicDetails } from '../services/api';

const RestaurantContext = createContext();

export const useRestaurant = () => {
    const context = useContext(RestaurantContext);
    if (!context) {
        throw new Error('useRestaurant must be used within a RestaurantProvider');
    }
    return context;
};

export const RestaurantProvider = ({ restaurantId, children }) => {
    const [restaurantDetails, setRestaurantDetails] = useState({
        name: '',
        currency: 'USD', // Default currency
        logo_url: null,
        background_image_url: null,
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            try {
                const response = await getRestaurantPublicDetails(restaurantId);
                setRestaurantDetails({
                    ...response.data,
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Error fetching restaurant details:', error);
                setRestaurantDetails(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Failed to load restaurant details'
                }));
            }
        };

        if (restaurantId) {
            fetchRestaurantDetails();
        }
    }, [restaurantId]);

    return (
        <RestaurantContext.Provider value={restaurantDetails}>
            {children}
        </RestaurantContext.Provider>
    );
};
