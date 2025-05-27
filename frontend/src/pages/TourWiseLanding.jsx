import React, { useEffect } from 'react';
import './TourWiseLanding.css';

const base = '/tourism-analytics';

const tours = [
    {
        title: "El Nido Island Hopping",
        location: "Palawan",
        price: 2500,
        image: `${base}/images/el_nido.jpg`,
        description: "Island adventure in Palawan",
        link: `${base}/el-nido`,
    },
    {
        title: "Vigan Heritage Walk",
        location: "Ilocos Sur",
        price: 1800,
        image: `${base}/images/vigan_heritage_tour.png`,
        description: "Cultural experience in Vigan",
        link: `${base}/vigan`,
    },
    {
        title: "Chocolate Hills Tour",
        location: "Bohol",
        price: 2100,
        image: `${base}/images/chocolate_hills.jpg`,
        description: "Explore nature in Bohol",
        link: `${base}/chocolatehills`,
    },
    {
        title: "Siargao Surf Camp",
        location: "Siargao",
        price: 3000,
        image: `${base}/images/siargao_surf_camp.jpg`,
        description: "Catch waves in the surfing capital of the Philippines",
        link: `${base}/siargao`,
    }
];

export default function TourWiseLanding() {
    useEffect(() => {
        document.title = 'TourWise | Explore the World';
    }, []);

    const handleBookNow = () => {
        window.open(`${base}/tour-cards`, '_blank');
    };

    return (
        <div className="tourwise-landing">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <h1>Explore the World with TourWise</h1>
                    <p>Discover amazing destinations and tours tailored for you.</p>
                    <button className="btn-primary" onClick={handleBookNow}>Book Now</button>
                </div>
            </section>

            {/* Featured Tours Section */}
            <section className="section-featured">
                <h2 className="section-title">Top Destinations</h2>

                <div className="tour-cards">
                    {tours.map((tour, index) => (
                        <a href={tour.link} className="tour-card" key={index}>
                            <img src={tour.image} alt={tour.title} className="tour-image" />
                            <div className="tour-info">
                                <h3>{tour.title}</h3>
                                <p className="location">{tour.location}</p>
                                <p className="description">{tour.description}</p>
                                <p className="price">₱{tour.price.toLocaleString()}</p>
                            </div>
                        </a>
                    ))}
                </div>
            </section>

            {/* Travel Tips Section */}
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
