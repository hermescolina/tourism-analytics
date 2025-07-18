import React from 'react';

export default function BookingVoucher({ bookings, referenceId }) {
    const date = new Date().toLocaleString();

    return (
        <div style={{
            border: '1px solid #ccc',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '600px',
            margin: '2rem auto',
            background: '#f9f9f9',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ textAlign: 'center' }}>📄 Booking Voucher</h2>
            <p><strong>Reference ID:</strong> {referenceId}</p>
            <p><strong>Date:</strong> {date}</p>

            {bookings.map((item, index) => (
                <div key={index} style={{ marginBottom: '1rem', borderBottom: '1px dashed #999' }}>
                    <p><strong>🏝️ Tour:</strong> {item.title}</p>
                    <p><strong>💵 Price per Pax:</strong> ₱{parseFloat(item.price).toFixed(2)}</p>
                    <p><strong>👥 Quantity:</strong> {item.quantity}</p>
                    <p><strong>🧮 Total:</strong> ₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                </div>
            ))}

            <hr />
            <h3>
                Grand Total: ₱{bookings.reduce((sum, item) =>
                    sum + parseFloat(item.price) * item.quantity, 0
                ).toFixed(2)}
            </h3>
        </div>
    );
}
