import React from 'react';

const OrderItem = ({ order }) => {
    return (
        <div>
            <h3>Table {order.table_number}</h3>
            <ul>
                {order.items.map(item => (
                    <li key={item.id}>{item.name}</li>
                ))}
            </ul>
            <p>Status: {order.status}</p>
        </div>
    );
};

export default OrderItem;
