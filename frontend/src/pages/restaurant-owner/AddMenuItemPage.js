import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getMenuItems, placeOrder, getOrderStatus } from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/CustomerMenuPage.css'; // New CSS file for this page

const CustomerMenuPage = () => {
    const { restaurantId, tableNumber } = useParams();
    const [menuItems, setMenuItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [orderStatus, setOrderStatus] = useState(null);
    const [orderSummary, setOrderSummary] = useState(null);
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [totalPrice, setTotalPrice] = useState(0); // Total price state

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const response = await getMenuItems(restaurantId);
                setMenuItems(response.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching menu items:', err);
                setError('Failed to load menu items');
                setLoading(false);
            }
        };

        if (restaurantId) {
            fetchMenuItems();
        }
    }, [restaurantId]);

    const pollOrderStatus = async () => {
        try {
            const response = await getOrderStatus(restaurantId, tableNumber);
            if (response && response.length > 0) {
                const order = response[0];
                setOrderStatus(order.status);
                setOrderSummary(order.items);
                setShowMenu(false);
            } else {
                setShowMenu(true);
            }
        } catch (err) {
            console.error("Error fetching order status:", err);
        }
    };

    useEffect(() => {
        pollOrderStatus();
    }, []);

    const handleViewMenu = () => {
        setShowMenu(true);
    };

    const handleItemSelect = (itemId, action, specialRequest = '') => {
        setSelectedItems(prevState => {
            const existingItem = prevState.find(item => item.id === itemId);
            if (existingItem) {
                const updatedQuantity = action === 'increase' ? existingItem.quantity + 1 : existingItem.quantity - 1;
                if (updatedQuantity <= 0) {
                    return prevState.filter(item => item.id !== itemId);
                }
                return prevState.map(item => item.id === itemId ? { ...item, quantity: updatedQuantity, specialRequest } : item);
            } else {
                return [...prevState, { id: itemId, quantity: 1, specialRequest }];
            }
        });
    };

    // Calculate total price whenever selectedItems changes
    useEffect(() => {
        const total = selectedItems.reduce((sum, item) => {
            const menuItem = menuItems.find(mi => mi.id === item.id);
            return sum + (menuItem ? menuItem.price * item.quantity : 0);
        }, 0);
        setTotalPrice(total);
    }, [selectedItems, menuItems]);

    const handleOrderSubmit = async () => {
        try {
            if (selectedItems.length === 0) {
                alert('Please add at least one item to the order.');
                return;
            }

            const statusResponse = await getOrderStatus(restaurantId, tableNumber);
            if (statusResponse && statusResponse.length > 0) {
                const existingOrder = statusResponse.find(order => order.status === 'Pending' || order.status === 'In Progress');
                if (existingOrder) {
                    alert('An order is already in progress for this table. Please wait for it to complete.');
                    return;
                }
            }

            const orderData = {
                restaurant: restaurantId,
                table_number: parseInt(tableNumber),
                items: selectedItems,
                additional_info: additionalInfo,
            };

            const response = await placeOrder(orderData);
            if (response.status >= 400) {
                throw new Error(response.data.error || 'Failed to place order');
            }

            alert('Order placed successfully!');
            setOrderSummary(selectedItems);
            setSelectedItems([]);
            pollOrderStatus();
        } catch (err) {
            console.error('Error placing order:', err);
            alert(`Failed to place order: ${err.message || 'Unknown error'}`);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    if (orderStatus && !showMenu) {
        return (
            <div className="container">
                <h1>Order Status: {orderStatus}</h1>
                <p>Your order is currently {orderStatus}.</p>
                <h2>Order Summary</h2>
                <ul className="order-summary">
                    {orderSummary && orderSummary.length > 0 ? (
                        orderSummary.map((item, index) => (
                            <li key={index}>
                                {item.quantity}x {item.menu_item}
                                {item.special_request && ` (Special Request: ${item.special_request})`}
                            </li>
                        ))
                    ) : (
                        <li>No items found</li>
                    )}
                </ul>
                <button className="btn btn-primary" onClick={handleViewMenu}>View Menu</button>
            </div>
        );
    }

    return (
        <div className="container">
            {/* Navbar with Restaurant Name and Total Price */}
            <nav className="navbar navbar-light bg-light mb-4 d-flex justify-content-between">
                <span className="navbar-brand">{`Restaurant Name (ID: ${restaurantId})`}</span>
                {/* Dynamic price counter */}
                <div className="price-counter bg-white rounded px-4 py-2 d-flex align-items-center">
                    <h5 className="mb-0">Total:</h5>
                    <h5 className="mb-0 ml-2 price-number" id="price-number">${totalPrice.toFixed(2)}</h5>
                </div>
            </nav>

            <h1>Menu for Table {tableNumber}</h1>
            <div className="row">
                {menuItems.length > 0 ? (
                    menuItems.map(item => (
                        <div key={item.id} className="col-6 col-sm-6 mb-4">
                            <div className="card">
                                <img src={item.image} alt={item.name} className="card-img-top" style={{ height: '150px', objectFit: 'cover' }} />
                                <div className="card-body">
                                    <h5 className="card-title">{item.name}</h5>
                                    <p className="card-text">{item.description}</p>
                                    <p className="text-success font-weight-bold">Price: ${item.price}</p>
                                    <div className="input-group mb-3">
                                        <div className="input-group-prepend">
                                            <button className="btn btn-outline-secondary" type="button" onClick={() => handleItemSelect(item.id, 'decrease')}>-</button>
                                        </div>
                                        <input type="text" className="form-control text-center" readOnly value={selectedItems.find(si => si.id === item.id)?.quantity || 0} />
                                        <div className="input-group-append">
                                            <button className="btn btn-outline-secondary" type="button" onClick={() => handleItemSelect(item.id, 'increase')}>+</button>
                                        </div>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control mb-3"
                                        placeholder="Special Request"
                                        onChange={(e) => handleItemSelect(item.id, 'increase', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No menu items available</p>
                )}
            </div>

            <div className="mb-4">
                <h3>Additional Information for the Entire Order</h3>
                <textarea
                    className="form-control"
                    placeholder="Enter any additional info for the order"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                />
            </div>

            {/* Place Order Button */}
            <button className="btn btn-success btn-block mt-4 mb-5" onClick={handleOrderSubmit}>Place Order</button>

        </div>
    );
};

export default CustomerMenuPage;
