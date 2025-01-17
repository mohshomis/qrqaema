import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = ({ logout }) => {
    const navigate = useNavigate();

    useEffect(() => {
        logout(); // Call the logout function from App.js to handle the token removal
        navigate('/login'); // Redirect to the login page
    }, [navigate, logout]);

    return null; // Optionally return a loading indicator or nothing
};

export default Logout;
