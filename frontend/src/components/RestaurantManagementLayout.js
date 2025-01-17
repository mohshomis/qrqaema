// RestaurantManagementLayout.js

import React, { useEffect, useState } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import RestaurantManagementHeader from './RestaurantManagementHeader';

const RestaurantManagementLayout = () => {
    const { restaurantId } = useParams();
    const [restaurantName, setRestaurantName] = useState('');

    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            try {
                const response = await fetch(`/api/restaurants/${restaurantId}`);
                const data = await response.json();
                setRestaurantName(data.name);
            } catch (error) {
                console.error('Error fetching restaurant data:', error);
            }
        };

        if (restaurantId) {
            fetchRestaurantDetails();
        }
    }, [restaurantId]);

    return (
        <>
            <RestaurantManagementHeader 
                restaurantName={restaurantName} 
                restaurantId={restaurantId} 
            />
            <div className="content">
                <Outlet />  {/* Render the nested routes */}
            </div>
        </>
    );
};

export default RestaurantManagementLayout;
