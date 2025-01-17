// RestaurantManagementLayout.js

import React, { useEffect, useState, useContext } from 'react';
import { useParams, Outlet } from 'react-router-dom';
import RestaurantManagementHeader from './RestaurantManagementHeader';
import { AuthContext } from '../AuthContext';
import { API_URL } from '../services/api';
import axios from 'axios';

const RestaurantManagementLayout = () => {
    const { restaurantId } = useParams();
    const [restaurantName, setRestaurantName] = useState('');
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchRestaurantDetails = async () => {
            try {
                const response = await axios.get(`${API_URL}/restaurants/${restaurantId}/public-details/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log('Restaurant details response:', response);
                setRestaurantName(response.data.name);
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
