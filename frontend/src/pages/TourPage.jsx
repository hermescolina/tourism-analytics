import { useRef, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styles from './TourPage.module.css';
import VideoPlayer from '../components/VideoPlayer';

const base = '/tourism-analytics';
const apiBase = 'https://api.tourwise.shop';
const urlBase = 'https://app.tourwise.shop/tourism-analytics';

const handleReaction = (videoId, type) => {
    console.log(`User reacted with ${type} on video ${videoId}`);
    // Optional: send to backend
};

// const toggleCommentBox = (videoId) => {
//     setActiveCommentVideo(prev => (prev === videoId ? null : videoId));
// };

// const submitComment = (videoId) => {
//     console.log(`Comment on video ${videoId}:`, comments[videoId]);
//     setActiveCommentVideo(null);
// };

export default function TourPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("Tour Videos");
    const [tourVideos, setTourVideos] = useState([]);

    // const [activeCommentVideo, setActiveCommentVideo] = useState(null);
    // const [comments, setComments] = useState({});

    const categoryRef = useRef(null);
    const videoRef = useRef(null);

    useEffect(() => {
        fetch(`${apiBase}/api/tours/${slug}`)
            .then(res => {
                if (!res.ok) throw new Error('Tour not found');
                return res.json();
            })
            .then(data => {
                console.log('✅ Server responded with:', data);
                setTour(data);
                setTourVideos(data.videos || []);
                document.title = `TourWise | ${data.title}`;
            })
            .catch(err => {
                console.error('❌ Failed to load tour:', err);
                setError('Tour not found or server error.');
            });
    }, [slug]);

    useEffect(() => {
        let lastScrollY = window.scrollY;
        const header = document.querySelector('.topNav');

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY) {
                header?.classList.add('hide-header');
            } else {
                header?.classList.remove('hide-header');
            }
            lastScrollY = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const backgroundVideos = tourVideos.filter(v => v.category === 'Tour Videos' && v.video_id).slice(0, 3);

    useEffect(() => {
        if (backgroundVideos.length <= 1) return;

        const interval = setInterval(() => {
            setActiveIndex(prev => (prev + 1) % backgroundVideos.length);
        }, 15000);

        return () => clearInterval(interval);
    }, [backgroundVideos.length]);

    function TourHero({ headerVideo, title, location }) {
        if (!headerVideo) return null;

        return (
            <div className={styles.tourHero} style={{ marginTop: '0rem' }}>
                <iframe
                    key={headerVideo.video_id}
                    width="100%"
                    height="150"
                    src={`https://www.youtube.com/embed/${headerVideo.video_id}?autoplay=1&mute=1&loop=1&playlist=${headerVideo.video_id}`}
                    title="Background Video"
                    frameBorder="0"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                ></iframe>
                <div className={styles.tourTitle}>
                    <h1>{title}</h1>
                    <p>{location}</p>
                </div>
            </div>
        );
    }

    if (error) return <div className={styles.tourContainer}>{error}</div>;
    if (!tour) return <div className={styles.tourContainer}>Loading...</div>;

    const imagePath = tour.image || '';
    const imageUrl = imagePath.startsWith('/uploads/images/')
        ? `${urlBase}${imagePath.replace('/uploads', '')}`
        : `${apiBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

    const categories = ["About the Tour", "What to Expect", "History and Culture", "Tour Videos"];

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);

        setTimeout(() => {
            if (value === 'Tour Videos') {
                videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                const matchingVideos = tour.videos.filter(video => video.category === value);
                if (matchingVideos.length > 0 && videoRef.current) {
                    videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    document.getElementById('tourContentStart')?.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }, 50);
    };

    return (
        <div className={styles.tourContainer}>
            <header className={styles.browseHeader}>
                <div className={styles.logoSection}>
                    <Link to="/tour-cards">
                        <img src={imageUrl} alt="TourWise" className={styles.logoImage} />
                    </Link>
                    <Link to="/tour-cards">
                        <span className={styles.logoText}>TourWise</span>
                    </Link>
                </div>
                <h1 className={styles.browseTitleInline}>{tour.title}</h1>
                <div className={styles.tourActions}>
                    <button className={styles.actionButton} onClick={() => window.open(`${base}/bookpage`, '_blank')}>Book Now</button>
                    <button className={styles.actionButton}>Share</button>
                    <button className={styles.actionButton}>Contact Guide</button>
                </div>
            </header>

            <TourHero headerVideo={backgroundVideos[activeIndex]} imageUrl={imageUrl} title={tour?.title} location={tour?.location} />

            <div ref={categoryRef} className={styles.categorySelector}>
                {categories.map((cat, i) => (
                    <label key={i} style={{ marginRight: '1rem' }}>
                        <input
                            type="radio"
                            name="category"
                            value={cat}
                            checked={selectedCategory === cat}
                            onChange={handleCategoryChange}
                        /> {cat}
                    </label>
                ))}
            </div>

            <div ref={videoRef}>
                {tourVideos
                    .filter(video => video.category === selectedCategory)
                    .map((video, idx) => (
                        <div key={idx} className={styles.videoCard}>
                            <VideoPlayer videoId={video.video_id} index={idx} />

                            <div style={{ marginTop: '1rem' }}>
                                <h4 style={{ marginBottom: '0.5rem' }}>{video.caption}</h4>

                                {/* Reaction Buttons */}
                                <div className={styles.reactionBar}>
                                    <button onClick={() => handleReaction(video.video_id, 'like')}>👍 Like</button>
                                    <button onClick={() => handleReaction(video.video_id, 'love')}>❤️ Love</button>
                                    <button onClick={() => handleReaction(video.video_id, 'laugh')}>😂 Laugh</button>
                                    {/* <button onClick={() => toggleCommentBox(video.video_id)}>💬 Comment</button> */}
                                    <Link to="/tour-cards" className={styles.reactionBar}>
                                        <button>🔙 Back</button>
                                    </Link>

                                </div>

                                {/* Comment Box */}
                                {/* {activeCommentVideo === video.video_id && (
                                    <div className={styles.commentBox}>
                                        <textarea
                                            value={comments[video.video_id] || ''}
                                            onChange={(e) =>
                                                setComments(prev => ({ ...prev, [video.video_id]: e.target.value }))
                                            }
                                            placeholder="Write a comment..."
                                        />
                                        <button onClick={() => submitComment(video.video_id)}>Post</button>
                                    </div>
                                )} */}

                                <div style={{ marginTop: '0.5rem' }}>
                                    {categories.map((cat, i) => (
                                        <label key={i} style={{ marginRight: '1rem' }}>
                                            <input
                                                type="radio"
                                                name={`category-${idx}`}
                                                value={cat}
                                                checked={selectedCategory === cat}
                                                onChange={handleCategoryChange}
                                            />{' '}
                                            {cat}
                                        </label>
                                    ))}
                                </div>


                            </div>
                        </div>
                    ))}
            </div>

            {tour.history_images && tour.history_images.length > 0 && (
                <div id="tourContentStart" className={styles.history}>
                    <section className={`${styles.tourSection} ${styles.historySection}`}>
                        <h2>{selectedCategory}</h2>

                        <div style={{ margin: '1rem 0' }}>
                            {categories.map((cat, i) => (
                                <label key={i} style={{ marginRight: '1rem' }}>
                                    <input
                                        type="radio"
                                        name="category-history"
                                        value={cat}
                                        checked={selectedCategory === cat}
                                        onChange={handleCategoryChange}
                                    />{' '}
                                    {cat}
                                </label>
                            ))}
                        </div>

                        <div className={styles.historyGallery}>
                            {tour.history_images
                                .filter(item => item.image_path?.trim() && item.category === selectedCategory)
                                .slice(0, 10)
                                .map((item, index) => {
                                    const layoutClass = index % 2 === 0 ? styles.left : styles.right;
                                    const imageUrl = item.image_path.startsWith('/uploads/images/')
                                        ? `${urlBase}${item.image_path.replace('/uploads', '')}`
                                        : `${apiBase}${item.image_path.startsWith('/') ? '' : '/'}${item.image_path}`;

                                    return (
                                        <div key={index} className={`${styles.historyEntry} ${layoutClass}`}>
                                            <img
                                                src={imageUrl}
                                                alt={`History ${index + 1}`}
                                                className={styles.historyImage}
                                                onError={(e) => (e.target.style.display = 'none')}
                                            />
                                            {item.caption?.trim() && (
                                                <p className={styles.historyCaption}>{item.caption}</p>
                                            )}
                                            <div style={{ marginTop: '1rem' }}>
                                                {categories.map((cat, i) => (
                                                    <label key={i} style={{ marginRight: '1rem' }}>
                                                        <input
                                                            type="radio"
                                                            name={`category-${index}`}
                                                            value={cat}
                                                            checked={selectedCategory === cat}
                                                            onChange={handleCategoryChange}
                                                        />{' '}
                                                        {cat}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </section>
                </div>
            )}

            <div style={{ height: '150vh' }}></div>

            <section className={styles.tourSection}>
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