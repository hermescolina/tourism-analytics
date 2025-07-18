import { apiBaseTour, frontendBase } from '../config';
import { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import styles from './CartPage.module.css';


export default function CartPage() {
    const { cartItems, removeFromCart, loadCart, clearCart } = useCart();
    const [selectedItems, setSelectedItems] = useState({});
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        loadCart(1);
    }, []);


    const handleBulkBooking = async () => {
        const confirmedItems = cartItems.filter(item => selectedItems[item.id]);

        if (confirmedItems.length === 0) {
            alert("Please select at least one item to book.");
            return;
        }

        const payload = {
            user_id: 1, // You can replace this with real user ID later
            email: "itloboc@gmail.com", // Replace with dynamic email if needed
            bookings: confirmedItems.map(item => ({
                title: (item.title || item.tour_title),
                price: (item.price || item.tour_price).toString(),
                quantity: item.quantity
            }))
        };

        try {
            const response = await fetch(`${apiBaseTour}/api/cr/book-cart`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                alert(`✅ Booking successful!\nReference ID: ${data.reference_id}`);
                clearCart([]); // Optional: clear cart after successful booking
                setSelectedItems({});
                setSelectAll(false);
            } else {
                alert(`❌ Booking failed: ${data.error || "Unknown error"}`);
            }

        } catch (error) {
            console.error("❌ Error booking cart:", error);
            alert("❌ Network or server error occurred.");
        }
    };



    return (
        <div style={{ padding: '2rem' }}>
            <h2>Your Tour Cart</h2>

            {cartItems.length === 0 ? (
                <>
                    <p>Your cart is empty.</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>


                        <button
                            disabled={!Object.values(selectedItems).some(val => val)}
                            onClick={() => handleBulkBooking()}
                            style={{
                                padding: '0.5rem 1.25rem',
                                background: Object.values(selectedItems).some(val => val) ? '#28a745' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.3rem',
                                cursor: Object.values(selectedItems).some(val => val) ? 'pointer' : 'not-allowed'
                            }}
                        >
                            ✅ Book Selected
                        </button>
                    </div>

                </>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={selectAll}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setSelectAll(checked);
                                    const newSelected = {};
                                    cartItems.forEach(item => {
                                        newSelected[item.id] = checked;
                                    });
                                    setSelectedItems(newSelected);
                                }}
                            />
                            Select All
                        </label>

                        <button
                            disabled={!Object.values(selectedItems).some(val => val)}
                            onClick={() => handleBulkBooking()}
                            style={{
                                padding: '0.5rem 1.25rem',
                                background: Object.values(selectedItems).some(val => val) ? '#28a745' : '#ccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.3rem',
                                cursor: Object.values(selectedItems).some(val => val) ? 'pointer' : 'not-allowed'
                            }}
                        >
                            ✅ Book Selected
                        </button>
                    </div>

                    <div className={styles.tourGrid}>

                        {cartItems.map((item, index) => {
                            const isUpload = (item.image || item.tour_image)?.startsWith('/images');
                            const imageSrc = isUpload
                                ? `${frontendBase}/tourism-analytics${item.image || item.tour_image}`
                                : `${apiBaseTour}/uploads/${item.image || item.tour_image}`;

                            return (

                                <div key={index} className={styles.tourCard}>
                                    <h3>{item.title}</h3>

                                    {(item.image || item.tour_image) && (
                                        <img
                                            src={imageSrc}
                                            alt={item.title}
                                            onError={(e) => {
                                                e.target.src = `${frontendBase}/tourism-analytics/images/placeholder.jpg`;
                                            }}
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                borderRadius: '0.5rem',
                                                marginBottom: '0.75rem'
                                            }}
                                        />
                                    )}

                                    {item.hotel && <p>🏨 Hotel: {item.hotel}</p>}
                                    {item.car && <p>🚗 Car: {item.car}</p>}

                                    {/* ✅ Cart Item Pricing Summary */}
                                    <p>
                                        💵 Price per Pax: ₱{parseFloat(item.price || item.tour_price).toFixed(2)}<br />
                                        👥 Quantity: {item.quantity}<br />
                                        🧮 Total: ₱{(parseFloat(item.price || item.tour_price) * item.quantity).toFixed(2)}
                                    </p>

                                    <div style={{ marginTop: '1.5rem' }}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={selectedItems[item.id] || false}
                                                onChange={(e) => {
                                                    const updated = {
                                                        ...selectedItems,
                                                        [item.id]: e.target.checked,
                                                    };
                                                    setSelectedItems(updated);

                                                    // ✅ Update selectAll if all checkboxes become checked
                                                    const allChecked = cartItems.every(it => updated[it.id]);
                                                    setSelectAll(allChecked);
                                                }}
                                            />

                                            I confirm this booking and agree to the terms.
                                        </label>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item)}
                                        style={{
                                            marginTop: '0.5rem',
                                            padding: '0.25rem 0.75rem',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        🗑 Remove
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {cartItems.length > 0 && (
                        <div style={{
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            marginTop: '1rem',
                            borderTop: '1px solid #ccc',
                            paddingTop: '1rem'
                        }}>
                            Grand Total: ₱{cartItems.reduce((sum, item) => (
                                sum + (parseFloat(item.price || item.tour_price) * item.quantity)
                            ), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    )}

                    <button
                        onClick={clearCart}
                        style={{
                            marginTop: '1.5rem',
                            padding: '0.5rem 1rem',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.3rem',
                            cursor: 'pointer'
                        }}
                    >
                        🧹 Clear Cart
                    </button>
                </>
            )}
        </div>
    );
}
