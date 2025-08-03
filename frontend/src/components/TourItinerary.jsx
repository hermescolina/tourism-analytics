// components/TourItinerary.jsx
import React from 'react';
import styles from './TourItinerary.module.css'; // optional CSS module

export default function TourItinerary({ itineraries = [] }) {
    if (!itineraries.length) return null;

    return (
        <div className={styles.itineraryContainer}>
            {itineraries.map((item, idx) => (
                <div key={idx} className={styles.itineraryCard}>
                    <h3>✅ {item.label} – {item.title}</h3>
                    <ul className={styles.stopList}>
                        {item.stops.map((stop, i) => (
                            <li key={i}>• {stop}</li>
                        ))}
                    </ul>
                    <p className={styles.time}>🕒 {item.time}</p>
                </div>
            ))}
        </div>
    );
}
