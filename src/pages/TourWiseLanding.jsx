import React from 'react';
import TourCards from '../components/TourCards';
import './TourWiseLanding.css'; // Make sure this file exists

export default function TourWiseLanding() {
    return (
        <div className="tourwise-landing">
            {/* Featured Tours */}
            <section className="section-featured">
                <h2 className="section-title">Top Destinations</h2>
                <TourCards />
            </section>

            {/* Travel Tips */}
            <section className="section-tips">
                <h2 className="section-title">Travel Tips</h2>
                <div className="tips-grid">
                    <p>Enjoy seamless travel planning with expert guidance every step of the way.</p>
                    <p>Experience unforgettable destinations with personalized recommendations.</p>
                    <p>Explore the world in comfort — your perfect trip starts here.</p>
                </div>
            </section>
        </div>
    );
}
