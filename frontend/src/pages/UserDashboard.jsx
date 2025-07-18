import { useEffect, useState } from 'react';
import { apiBaseTour } from '../config';
import styles from './UserDashboard.module.css';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        const cachedUser = localStorage.getItem('user');

        // 🔐 Redirect if no session
        if (!userId) {
            navigate('/login');
            return;
        }

        // ✅ Use cached user info
        if (cachedUser) {
            setUser(JSON.parse(cachedUser));
        } else {
            // fallback: fetch user if not cached
            fetch(`${apiBaseTour}/api/users/${userId}`)
                .then(res => res.json())
                .then(data => {
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                })
                .catch(err => console.error('Error fetching user:', err));
        }

        // 📦 Fetch bookings
        fetch(`${apiBaseTour}/api/bookings/user/${userId}`)
            .then(res => res.json())
            .then(data => setBookings(data))
            .catch(err => console.error('Error fetching bookings:', err));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className={styles.dashboardContainer}>
            <h2>User Dashboard</h2>

            <div className={styles.profileCard}>
                <h3>Welcome, {user?.full_name}</h3>
                <p>Email: {user?.email}</p>
                {user?.phone && <p>Phone: {user.phone}</p>}
                {user?.location && <p>Location: {user.location}</p>}
            </div>

            <div className={styles.bookingsSection}>
                <h3>My Bookings</h3>
                {bookings.length > 0 ? (
                    bookings.map((b, idx) => (
                        <div key={idx} className={styles.bookingCard}>
                            <p><strong>{b.tour_title}</strong></p>
                            <p>Status: <span style={{ textTransform: 'capitalize' }}>{b.status}</span></p>
                            <p>Date: {new Date(b.booking_date).toLocaleString()}</p>
                            <p>Guests: {b.num_guests}</p>
                            {b.hotel_booked && <p>Hotel: {b.hotel_booked}</p>}
                            {b.car_rented && <p>Car Rental: {b.car_rented}</p>}
                        </div>
                    ))
                ) : (
                    <p>No bookings found.</p>
                )}
            </div>

            <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
    );
}
