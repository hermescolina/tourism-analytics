import React, { useEffect, useState } from 'react';
import './Hotel.css';

export default function Hotel() {
    const [scrolled, setScrolled] = useState(false);
    const [hotelData, setHotelData] = useState(null);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        fetch('http://localhost:5000/api/hotel/the-peninsula-manila')
            .then(res => res.json())
            .then(data => setHotelData(data))
            .catch(err => console.error('❌ Failed to fetch hotel data:', err));
    }, []);

    if (!hotelData) {
        return <div className="loading">Loading hotel information...</div>;
    }

    const { hotel, images } = hotelData;

    return (
        <>
            <header className={`hotel-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="header-content">
                    <div className="menu-bar">
                        <span className="menu-icon">≡</span>
                        <span className="menu-label">MENU</span>
                    </div>

                    <div className="logo">
                        <div className="logo-title">{hotel?.name?.toUpperCase()}</div>
                        <div className="logo-subtitle">{hotel?.city?.toUpperCase()}</div>
                    </div>

                    <div className="action-bar">
                        <a href={`mailto:${hotel.email}`}>CONTACT US</a>
                        <span className="divider">|</span>
                        <span className="globe-icon" role="img" aria-label="globe">🌐</span>
                        <span>ENGLISH</span>
                        <button className="reserve-btn">RESERVE</button>
                    </div>
                </div>

                <div className="tagline">
                    Truly Authentically Filipino, Quintessentially Peninsula
                </div>
            </header>

            {/* ✅ Spacer to push main content below the fixed header */}
            <div style={{ height: '20vh' }}></div>

            <main>
                {images.map((img, idx) => (
                    <section key={idx} className={`hotel-description section-${idx}`}>
                        <img
                            src={`/tourism-analytics/images/${img.filename}`}
                            alt={img.description || img.category}
                            loading="lazy"
                        />
                        <p>{img.description}</p>
                    </section>
                ))}
            </main>
        </>
    );
}
