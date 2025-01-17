// Layout.js
import React from 'react';
import { useLocation } from 'react-router-dom';
import Footer from './Footer'; // Import the Footer

const Layout = ({ children }) => {
    const location = useLocation(); // Get the current path

    // Check if the current path is the home page ("/")
    const isHomePage = location.pathname === '/';

    return (
        <>
            {children}
            {/* Only show the Footer if not on the home page */}
            {!isHomePage && <Footer />}
        </>
    );
};

export default Layout;
