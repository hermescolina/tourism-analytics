import { useEffect, useState } from 'react';
import { apiBaseHotel } from '../config';
import { Link, useParams, Navigate } from 'react-router-dom';
import styles from './Hotel.module.css';

const base = '/tourism-analytics';

export default function Hotel() {
    const { slug } = useParams();
    const [scrolled, setScrolled] = useState(false);
    const [hotelData, setHotelData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!slug) {
            console.warn('⚠️ No slug provided, skipping fetch.');
            return;
        }

        console.log(`🔍 Fetching hotel data from: ${apiBaseHotel}/api/hotel/${slug}`);

        fetch(`${apiBaseHotel}/api/hotel/${slug}`)
            .then(res => {
                console.log('📥 Raw Response:', res);
                if (!res.ok) throw new Error(`Hotel not found: ${res.status}`);
                return res.json();
            })
            .then(data => {
                console.log('✅ Parsed hotel data:', data);
                Object.entries(data).forEach(([key, value]) => {
                    console.log(`🔑 ${key}:`, value);
                });
                setHotelData(data);
            })
            .catch(err => {
                console.error('❌ Failed to fetch hotel data:', err);
                setError(true);
            });
    }, [slug]);

    if (!slug) return <Navigate to="/tourism-analytics" />;
    if (error) return <div className={styles.error}>Hotel not found.</div>;
    if (!hotelData) return <div className={styles.loading}>Loading hotel information...</div>;

    const { hotel, images } = hotelData;
    const backgroundImageUrl = hotel?.background_image
        ? `${base}/images/${hotel.background_image}`
        : `${base}/images/default.png`;
    console.log("🏨 Hotel data:", hotel.description);
    return (
        <>
            <header
                className={`${styles.hotelHeader} ${scrolled ? styles.scrolled : ''}`}
                style={
                    !scrolled
                        ? { backgroundImage: `url(${backgroundImageUrl})` }
                        : {}
                }
            >

                <div className={styles.logoSection}>
                    <Link to="/hotel-cards">
                        <img src={`${base}/images/tourwise.png`} alt="TourWise Logo" className={styles.logoImage} />
                    </Link>
                    <Link to="/hotel-cards">
                        <span className={styles.logoText}>TourWise</span>
                    </Link>
                </div>

                <div className={styles.headerContent}>
                    <div className={styles.menuBar}>
                        <span className={styles.menuIcon}>≡</span>
                        <span className={styles.menuLabel}>MENU</span>
                    </div>

                    <div className={styles.actionBar}>
                        <a href={`mailto:${hotel?.email || 'info@example.com'}`}>CONTACT US</a>
                        <span className={styles.divider}>|</span>
                        <span className={styles.globeIcon} role="img" aria-label="globe">🌐</span>
                        <span>ENGLISH</span>
                        <button className={styles.reserveBtn}>RESERVE</button>
                    </div>
                </div>

                <div className={styles.tagline}>
                    <p>{hotel.description || 'No description available.'}</p>
                </div>
            </header>

            {/* Spacer to offset the fixed header */}
            <div style={{ height: '50vh' }}></div>

            <main className={styles.mainContainer}>
                {images && images.length > 0 ? (
                    images
                        .filter(img => img.filename && img.category !== 'background')
                        .map((img, idx) => {
                            const imageUrl = `${base}/images/${img.filename}`;
                            console.log("🖼️ Attempting to load image:", imageUrl);

                            return (
                                <section
                                    //  ${styles.section} section-${idx}
                                    key={`${img.filename}-${idx}`}
                                    className={`${styles.hotelDescription} ${idx % 2 === 0 ? styles.leftImage : styles.rightImage}`}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={img.description || img.category || 'Hotel image'}
                                        loading="lazy"
                                    />
                                    <p>{img.description || 'No description available.'}</p>
                                </section>
                            );
                        })
                ) : (
                    <p className={styles.noImages}>No hotel images available.</p>
                )}
            </main>
        </>
    );
}
