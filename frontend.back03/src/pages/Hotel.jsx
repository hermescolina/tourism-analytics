import React, { useEffect, useState } from 'react';
import './Hotel.css';

export default function Hotel() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <header className={`hotel-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="header-content">
                    <div className="menu-bar">
                        <span className="menu-icon">≡</span>
                        <span className="menu-label">MENU</span>
                    </div>

                    <div className="logo">
                        <div className="logo-title">THE PENINSULA</div>
                        <div className="logo-subtitle">MANILA</div>
                    </div>

                    <div className="action-bar">
                        <a href="#">CONTACT US</a>
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

            {/* ✅ Section: Dining Area */}
            <section className="hotel-description">
                <img
                    src="/tourism-analytics/images/The_Peninsula_Manila_Lifestyle_Spices.jpg"
                    alt="The Peninsula Manila Dining Area"
                    loading="lazy"
                />
                <p>
                    Share the history of an icon of sophistication in the Filipino capital.<br /><br />
                    Located in the center of Makati City, The Peninsula Manila has set the benchmark for luxury and sophistication for over four decades. Known affectionately as the “Jewel in the Capital’s Crown” for its legendary presence in the heart of the Philippines’ primary business district, it is a luxurious haven of comfort, quality service and fine cuisine, and is as much a favorite with discerning locals as it is with visitors from overseas.<br /><br />
                    The Peninsula Manila is awarded the coveted Forbes Travel Guide Five-Star rating – the only hotel in the principal central business districts of Makati and Bonifacio Global City to receive the coveted ranking in the publisher’s annual announcement of the world’s finest luxury hotels.
                </p>
            </section>

            {/* ✅ Section: Rooms and Lounge */}
            <section className="hotel-description second-section">
                <img
                    src="/tourism-analytics/images/The_Peninsula_PMN_Rooms_and_Lounge.jpg"
                    alt="Rooms and Lounge"
                    loading="lazy"
                />
                <p>
                    Experience the refined comfort of our newly refurbished rooms and lounges,
                    where elegance meets contemporary Filipino design. Each space has been thoughtfully
                    crafted to provide a serene sanctuary for relaxation, blending traditional warmth
                    with modern convenience. Whether you're unwinding after a day of business or
                    exploring the city's vibrant culture, our rooms offer the perfect retreat to
                    recharge and indulge in luxury.
                </p>
            </section>

            <section className="hotel-description fourth-section">
                <img
                    src="/tourism-analytics/images/The_Peninsula_Pen_Page_Wedding.jpg"
                    alt="Peninsula Wedding Venue"
                />
                <p>
                    Celebrate timeless moments at The Peninsula Manila's exquisite wedding venues.
                    Whether an intimate gathering or a grand affair, our elegant spaces and expert
                    service create memories that last a lifetime. Let sophistication and romance
                    set the tone for your perfect day.
                </p>
            </section>

            <section className="hotel-description fifth-section">
                <img
                    src="/tourism-analytics/images/The_Peninsula_Superior_Queen.jpg"
                    alt="Superior Queen Room"
                />
                <p>
                    The Superior Queen rooms offer a cozy yet elegant escape for the modern traveler.
                    With thoughtful design, plush bedding, and premium amenities, each room
                    guarantees a restful experience infused with Peninsula’s signature charm.
                </p>
            </section>

            <section className="hotel-description sixth-section">
                <img
                    src="/tourism-analytics/images/The_Peninsula_The_Lobby.jpg"
                    alt="The Lobby"
                />
                <p>
                    The Lobby at The Peninsula Manila is more than just a meeting space—
                    it’s a destination in itself. Enjoy traditional Afternoon Tea or unwind beneath
                    the high ceilings with live music in a space that reflects both grandeur and warmth.
                </p>
            </section>

        </>
    );
}
