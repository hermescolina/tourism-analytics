import React, { useEffect } from 'react';
import './ElNido.css';

const base = '/tourism-analytics';

export default function ElNido() {
    useEffect(() => {
        document.title = 'TourWise | El Nido Island Hopping';
    }, []);

    const handleBookNow = () => {
        window.open(`${base}/tour-cards`, '_blank');
    };

    return (
        <div className="elnido-container">
            {/* Main Header */}
            <header className="browse-header">
                <div className="logo-section">
                    <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className="logo-image" />
                    <span className="logo-text">TourWise</span>
                </div>
                <h1 className="browse-title-inline">El Nido Tour</h1>
                <div className="elnido-actions">
                    <button className="action-button" onClick={handleBookNow}>Book Now</button>
                    <button className="action-button">Share</button>
                    <button className="action-button">Contact Guide</button>
                </div>
            </header>

            <div className="elnido-hero" style={{ marginTop: '6rem' }}>
                <img src={`${base}/images/el_nido.jpg`} alt="El Nido Tour" className="elnido-image" />
                <div className="elnido-title">
                    <h1>El Nido Island Hopping</h1>
                    <p>Palawan, Philippines</p>
                </div>
            </div>

            <section className="elnido-section">
                <h2>About the Tour</h2>
                <p>
                    El Nido Island Hopping is one of the most popular activities in the Philippines, offering access
                    to pristine beaches, dramatic limestone cliffs, hidden lagoons, and crystal-clear waters...
                </p>
            </section>

            <section className="elnido-section">
                <h2>History</h2>
                <p>
                    El Nido, named after the Spanish word for "The Nest," refers to the edible nests found in the limestone
                    cliffs of the area...
                </p>
            </section>

            <section className="elnido-section">
                <h2>What to Expect</h2>
                <ul>
                    <li>Explore breathtaking lagoons by kayak</li>
                    <li>Snorkel over vibrant coral reefs and marine life</li>
                    <li>Enjoy grilled seafood lunch on a remote beach</li>
                    <li>Swim through rock openings to find hidden coves</li>
                    <li>Relax in serene turquoise waters surrounded by cliffs</li>
                </ul>
            </section>

            <section className="elnido-section">
                <h2>Tips for Visitors</h2>
                <ul>
                    <li>Book tours ahead of time (Tour A and Tour C are most popular)</li>
                    <li>Bring dry bags to protect electronics</li>
                    <li>Use reef-safe sunscreen to protect marine life</li>
                    <li>Wear aqua shoes or sandals with grip</li>
                </ul>
            </section>
        </div>
    );
}
