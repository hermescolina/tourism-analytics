import { createContext, useContext, useState } from 'react';
import { apiBaseTour } from '../config';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = async (item) => {
        try {
            const payload = {
                user_id: 1, // 🔁 Replace with dynamic user ID if available
                vendor_id: item.vendor_id,
                item_type: item.type,
                item_id: item.id,
                item_code: item.slug,
                quantity: item.quantity,
                total_price: item.price * item.quantity,
                selected_date: item.selected_date,
            };

            console.log("📝 Cart Payload:", payload);
            const response = await fetch(`${apiBaseTour}/api/cr/cart`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: 1, // 🔁 Replace with dynamic user ID if available
                    vendor_id: item.vendor_id,
                    item_type: item.type,
                    item_id: item.item_id,
                    item_code: item.item_code,
                    quantity: item.quantity,
                    total_price: item.price * item.quantity,
                    selected_date: item.selected_date,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Added to backend cart:', data);

                setCartItems((prevItems) => [...prevItems, item]);
            } else {
                alert(data.error || 'Failed to add to cart');
            }
        } catch (error) {
            console.error('Add to cart error:', error);
            alert('Something went wrong while adding to cart.');
        }
    };


    const removeFromCart = async (item) => {
        console.log('Removing item from cart:', item); // Logs the whole object
        try {
            const response = await fetch(`${apiBaseTour}/api/cr/cart`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: 1, // Replace with real user ID
                    vendor_id: item.vendor_id,
                    item_type: item.item_type,
                    item_id: item.item_id,
                }),
            });

            const body = {
                user_id: 1, // Replace with real user ID
                vendor_id: item.vendor_id,
                item_type: item.item_type,
                item_id: item.item_id,
            };

            console.log("Request body:", JSON.stringify(body, null, 2)); // Pretty print

            const result = await response.json();

            if (response.ok) {
                setCartItems((prevItems) =>
                    prevItems.filter((i) => i.item_id !== item.item_id)
                );
            } else {
                alert(result.error || 'Failed to remove item from cart');
            }
        } catch (error) {
            console.error('Remove from cart error:', error);
            alert('An error occurred while removing the item.');
        }
    };


    const loadCart = async (userId = 1) => {
        try {
            const response = await fetch(`${apiBaseTour}/api/cr/cart/${userId}`);
            const data = await response.json();

            if (Array.isArray(data)) {
                setCartItems(data); // Update local cart state
            } else {
                console.warn('Unexpected cart data format:', data);
            }
        } catch (error) {
            console.error('Failed to load cart:', error);
        }
    };



    const clearCart = async () => {
        setCartItems([]);

        try {
            const response = await fetch(`${apiBaseTour}/api/cr/clear-cart`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Server returned status ${response.status}`);
            }

            const data = await response.json();
            console.log('Cart cleared:', data.message || data);

        } catch (error) {
            console.error('Remove from cart error:', error);
            alert('An error occurred while clearing the cart.');
        }
    };

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, loadCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);

export { CartContext };