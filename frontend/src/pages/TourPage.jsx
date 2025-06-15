import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './TourPage.css';

const base = '/tourism-analytics';
const apiBase = 'http://localhost:3001';
const urlBase = 'http://localhost:5173/tourism-analytics';

export default function TourPage() {
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("History and Culture");
    const [tourVideos, setTourVideos] = useState([]);

    useEffect(() => {
        fetch(`${apiBase}/api/tours/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error('Tour not found');
                return res.json();
            })
            .then(data => {
                console.log('✅ Server responded with:', data);
                setTour(data);
                setTourVideos(data.videos || []);  // ✅ Assign videos directly
                document.title = `TourWise | ${data.title}`;
            })
            .catch(err => {
                console.error('❌ Failed to load tour:', err);
                setError('Tour not found or server error.');
            });
    }, [slug]);

    if (error) return <div className="tour-container">{error}</div>;
    if (!tour) return <div className="tour-container">Loading...</div>;

    const imagePath = tour.image || '';
    const imageUrl = imagePath.startsWith('/uploads/images/')
        ? `${urlBase}${imagePath.replace('/uploads', '')}`
        : `${apiBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

    const categories = ["About the Tour", "What to Expect", "History and Culture"];

    console.log("🎥 tourVideos:", tourVideos);

    return (
        <div className="tour-container">
            <header className="browse-header">
                <div className="logo-section">
                    <Link to="/tour-cards">
                        <img src={imageUrl} alt="TourWise" className="logo-image" />
                    </Link>
                    <Link to="/tour-cards">
                        <span className="logo-text">TourWise</span>
                    </Link>
                </div>
                <h1 className="browse-title-inline">{tour.title}</h1>
                <div className="tour-actions">
                    <button className="action-button" onClick={() => window.open(`${base}/tour-cards`, '_blank')}>Book Now</button>
                    <button className="action-button">Share</button>
                    <button className="action-button">Contact Guide</button>
                </div>
            </header>

            <div className="tour-hero" style={{ marginTop: '6rem' }}>
                <img src={imageUrl} alt={tour.title} className="tour-image" />
                <div className="tour-title">
                    <h1>{tour.title}</h1>
                    <p>{tour.location}</p>
                </div>
            </div>

            {tourVideos.length > 0 && (
                <section className="video-section" style={{ marginTop: '3rem' }}>
                    <h2 style={{ marginBottom: '1rem' }}>🎬 Tour Videos</h2>
                    <div className="video-card-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                        {tourVideos.map((video, idx) => (
                            <div
                                key={idx}
                                className="video-card"
                                style={{
                                    flex: '1 1 300px',
                                    border: '1px solid #ddd',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    background: '#fff'
                                }}
                            >
                                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                                    <iframe
                                        src={`https://www.youtube.com/embed/${video.video_id}`}
                                        title={video.caption}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            border: 0
                                        }}
                                    ></iframe>
                                </div>
                                <div style={{ padding: '1rem' }}>
                                    <h4>{video.caption}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Category Selector */}
            <div className="category-selector" style={{ margin: '2rem 0' }}>
                {categories.map((cat, i) => (
                    <label key={i} style={{ marginRight: '1rem' }}>
                        <input
                            type="radio"
                            name="category"
                            value={cat}
                            checked={selectedCategory === cat}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        /> {cat}
                    </label>
                ))}
            </div>




            {tour.history_images && tour.history_images.length > 0 && (
                <div className="history">

                    <section className="tour-section history-section">
                        <h2>{selectedCategory}</h2>
                        <div className="history-gallery">
                            {tour.history_images
                                .filter(item => item.image_path?.trim() && item.category === selectedCategory)
                                .slice(0, 10)
                                .map((item, index) => {
                                    const imageUrl = item.image_path.startsWith('/uploads/images/')
                                        ? `${urlBase}${item.image_path.replace('/uploads', '')}`
                                        : `${apiBase}${item.image_path.startsWith('/') ? '' : '/'}${item.image_path}`;

                                    const layoutClass = index % 2 === 0 ? 'left' : 'right';

                                    return (
                                        <div key={index} className={`history-entry ${layoutClass}`}>
                                            <img
                                                src={imageUrl}
                                                alt={`History ${index + 1}`}
                                                className="history-image"
                                                onError={(e) => (e.target.style.display = 'none')}
                                            />
                                            {item.caption?.trim() && (
                                                <p className="history-caption">{item.caption}</p>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </section>
                </div>
            )}

            <section className="tour-section">
                <h2>Tips for Visitors</h2>
                <ul>
                    {(tour.tips || '').split(';').map((item, idx) => (
                        <li key={idx}>{item.trim()}</li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
