import { useEffect, useState } from 'react';
import { apiBaseTour, frontendBase } from '../config';
import { useParams, Link } from 'react-router-dom';
import styles from './TourPage.module.css';


export default function UploadMedia() {
    const { slug } = useParams();
    const [tour, setTour] = useState(null);
    const [caption, setCaption] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);
    const [historyImages, setHistoryImages] = useState([]);
    const [videos, setVideos] = useState([]);
    const [category, setCategory] = useState('About the Tour');
    const [editMode, setEditMode] = useState(null);
    const [editCaption, setEditCaption] = useState('');
    const [editFile, setEditFile] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoCaption, setVideoCaption] = useState('');
    const [videoCategory, setVideoCategory] = useState('Tour Videos');
    const [videoEditMode, setVideoEditMode] = useState(null);
    const [videoEditCaption, setVideoEditCaption] = useState('');
    const [videoEditCategory, setVideoEditCategory] = useState('Tour Videos');
    const [editCategory, setEditCategory] = useState('');






    useEffect(() => {
        fetch(`${apiBaseTour}/api/tours/${slug}`)
            .then(res => res.ok ? res.json() : Promise.reject('Tour not found'))
            .then(data => setTour(data))
            .catch(err => {
                console.error(err);
                setError('Tour not found or server error.');
            });

        fetch(`${apiBaseTour}/api/history-images/${slug}`)
            .then(res => res.json())
            .then(data => setHistoryImages(data))
            .catch(console.error);

        // ✅ Just get the uploaded videos (no POST here)
        fetch(`${apiBaseTour}/api/tours/${slug}/videos`)
            .then(res => res.json())
            .then(data => setVideos(data))
            .catch(console.error);
    }, [slug]);

    const handleCategoryChange = (e) => setCategory(e.target.value);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!imageFile) return alert("Please choose an image.");

        const form = document.querySelector("form.upload-form");
        const formData = new FormData(form);
        const selected = formData.get("category");

        const summary = `
        You are about to upload:
        📁 Image File: ${imageFile.name}
        📝 Caption: ${caption || 'No caption'}
        🏷️ Category: ${selected}

        Proceed with upload?
        `;

        const confirmUpload = window.confirm(summary.trim());
        if (!confirmUpload) return;

        setCategory(selected);
        formData.append("image", imageFile);
        formData.append("caption", caption);
        formData.append('category', selected);


        setUploading(true);
        try {
            const res = await fetch(`${apiBaseTour}/api/tours/${slug}/history-image`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');

            setCaption('');
            setCategory('Tour Videos');
            setImageFile(null);
            setPreviewUrl(null);

            const updated = await fetch(`${apiBaseTour}/api/history-images/${slug}`).then(r => r.json());
            setHistoryImages(updated);

            alert("✅ History image uploaded!");
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this image?')) return;
        await fetch(`${apiBaseTour}/api/history-image/${id}`, { method: 'DELETE' });
        setHistoryImages(prev => prev.filter(img => img.id !== id));
    };

    const handleEditSubmit = async () => {
        const formData = new FormData();
        if (editCaption) formData.append('caption', editCaption);
        if (editFile) formData.append('image', editFile);

        console.log("Submitting edit with data:");
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }
        const res = await fetch(`${apiBaseTour}/api/history-image/${editMode}`, {
            method: 'PATCH',
            body: formData,
        });

        if (!res.ok) return alert("Update failed");

        const updated = await fetch(`${apiBaseTour}/api/history-images/${slug}`).then(r => r.json());
        setHistoryImages(updated);

        setEditMode(null);
        setEditCaption('');
        setVideoEditCategory('Tour Videos');
        setEditFile(null);
    };

    const handleVideoDelete = async (id) => {
        const confirm = window.confirm("Delete this video?");
        if (!confirm) return;

        const res = await fetch(`${apiBaseTour}/api/tours/${slug}/video/${id}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            setVideos(prev => prev.filter(v => v.id !== id));
        } else {
            alert("❌ Failed to delete video.");
        }
    };


    const handleVideoEditSubmit = async (id) => {
        const formData = new FormData();
        formData.append("caption", videoEditCaption);
        formData.append("category", videoEditCategory); // <- make sure this exists

        // ✅ Debug logs
        console.log("Sending update for video ID:", id);
        console.log("caption:", videoEditCaption);
        console.log("category:", videoEditCategory);
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        const res = await fetch(`${apiBaseTour}/api/tours/${slug}/video/${id}`, {
            method: 'PATCH',
            body: formData
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("❌ Update failed:", errorText);
            alert("❌ Update failed.");
        }
    };



    const extractYouTubeId = (url) => {
        const match = url.match(/(?:youtube\.com\/(?:[^/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);

        return match ? match[1] : null;
    };

    const handleVideoUpload = async (e) => {
        e.preventDefault();
        const videoId = extractYouTubeId(videoUrl);
        if (!videoId) {
            alert("❌ Invalid YouTube URL");
            return;
        }

        const formData = new FormData();
        formData.append("video_id", videoId);
        formData.append("caption", videoCaption);
        formData.append("category", videoCategory);

        const res = await fetch(`${apiBaseTour}/api/tours/${slug}/save-video`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            alert("❌ Failed to upload video.");
            return;
        }

        const updated = await fetch(`${apiBaseTour}/api/tours/${slug}/videos`).then(r => r.json());
        setVideos(updated);
        setVideoUrl('');
        setVideoCaption('');
        setVideoCategory('Tour Videos');
        alert("✅ Video uploaded!");
    };

    const imagePath = tour?.image || '';
    const imageUrl = imagePath.startsWith('/uploads/images/')
        ? `${frontendBase}${imagePath.replace('/uploads', '')}`
        : `${apiBaseTour}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

    console.log("Image URL:", imageUrl);

    console.log("imagePath:", imagePath);

    const filteredImages = category ? historyImages.filter(img => img.category === category) : historyImages;

    const videoCategories = [
        { label: 'About the Tour', value: 'About the Tour' },
        { label: 'Tour Videos', value: 'Tour Videos' },
        { label: 'History and Culture', value: 'History and Culture' },
        { label: 'Header Background Video', value: 'backgroundvideo' },
    ];


    if (error) return <div className={styles.tourContainer}>{error}</div>;
    if (!tour) return <div className={styles.tourContainer}>Loading...</div>;

    return (
        <div className={styles.tourContainer}>
            <header className={styles.browseHeader}>
                <div className={styles.logoSection}>
                    <Link to="/">
                        <img src={imageUrl} alt="TourWise" className={styles.logoImage} />
                    </Link>
                    <span className={styles.logoText}>Upload Media</span>
                </div>
            </header>

            <section style={{ marginTop: '2rem' }}>
                <h3>Add New Video</h3>
                <form onSubmit={handleVideoUpload} className={styles.uploadForm}>
                    <label>
                        YouTube Video URL:
                        <input
                            type="text"
                            placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            style={{ width: '100%', marginTop: '4px' }}
                        />
                    </label>
                    <br /><br />
                    <label>
                        Caption:
                        <textarea
                            rows={2}
                            value={videoCaption}
                            onChange={(e) => setVideoCaption(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </label>
                    <br />
                    <button type="submit" className={styles.actionButton}>
                        Upload Video
                    </button>
                </form>
            </section>

            <section className={styles.tourSection}>
                <h2>Tour: {tour.title}</h2>
                <form onSubmit={handleUpload} className={styles.uploadForm}>
                    <div className={styles.categorySelect}>
                        <label><strong>Select Section:</strong></label><br />
                        {videoCategories.map(option => (
                            <label key={option.value}>
                                <input
                                    type="radio"
                                    name="category"
                                    value={option.value}
                                    checked={category === option.value}
                                    onChange={handleCategoryChange}
                                /> {option.label}
                            </label>
                        ))}
                    </div>

                    <p><strong>Selected Category:</strong> {category}</p>

                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                const img = new Image();
                                img.onload = () => {
                                    const canvas = document.createElement('canvas');
                                    const scale = 350 / img.width;
                                    canvas.width = 350;
                                    canvas.height = img.height * scale;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                    canvas.toBlob((blob) => {
                                        const resizedFile = new File([blob], file.name, {
                                            type: file.type,
                                            lastModified: Date.now(),
                                        });
                                        setImageFile(resizedFile);
                                        setPreviewUrl(URL.createObjectURL(blob));
                                    }, file.type, 0.9);
                                };
                                img.src = event.target.result;
                            };
                            reader.readAsDataURL(file);
                        }}
                    />

                    {previewUrl && <img src={previewUrl} alt="Preview" className={styles.previewImage} />}

                    <textarea
                        placeholder="Enter caption"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows={3}
                        style={{ width: '100%' }}
                    />

                    <button
                        type="submit"
                        disabled={uploading}
                        className={styles.actionButton}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h3>Uploaded Images</h3>
                {filteredImages.map(img => (
                    <div key={img.id} className={styles.imageCard}>
                        <img
                            src={`${apiBaseTour}/uploads/${img.filename}`}
                            alt={img.caption}
                            className={styles.previewImage}
                        />
                        {editMode === img.id ? (
                            <>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setEditFile(e.target.files[0])}
                                />

                                <textarea
                                    rows={2}
                                    value={editCaption}
                                    onChange={(e) => setEditCaption(e.target.value)}
                                />

                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                >
                                    <option value="About the Tour">About the Tour</option>
                                    <option value="Tour Videos">Tour Videos</option>
                                    <option value="History and Culture">History and Culture</option>
                                    <option value="Header Background Video">Header Background Video</option>
                                </select>

                                <button onClick={handleEditSubmit}>Save</button>
                                <button onClick={() => setEditMode(null)}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <p>{img.caption}</p>
                                <button onClick={() => handleDelete(img.id)}>Delete</button>
                                <button onClick={() => {
                                    setEditMode(img.id);
                                    setEditCaption(img.caption);
                                }}>Edit</button>
                            </>
                        )}
                    </div>
                ))}
            </section>


            <section style={{ marginTop: '2rem' }}>
                <h3>Uploaded Videos</h3>
                {videos.map(video => (
                    <div key={video.id} className={styles.videoCard}>
                        <iframe
                            width="350"
                            height="197"
                            src={`https://www.youtube.com/embed/${video.video_id}`}
                            title={video.caption}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        {videoEditMode === video.id ? (
                            <>
                                <textarea
                                    rows={2}
                                    value={videoEditCaption}
                                    onChange={(e) => {
                                        setVideoEditCaption(e.target.value);
                                    }}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                />
                                <select
                                    value={videoEditCategory}
                                    onChange={(e) => setVideoEditCategory(e.target.value)}
                                    style={{ marginTop: '0.5rem', display: 'block' }}
                                >
                                    {videoCategories.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>

                                <button onClick={() => handleVideoEditSubmit(video.id)}>Save</button>
                                <button onClick={() => {
                                    setVideoEditMode(null);
                                    setVideoEditCaption('');
                                    setVideoEditCategory('Tour Video');
                                }}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <p>{video.caption}</p>
                                <p><strong>Category:</strong> {video.category}</p>

                                <button onClick={() => handleVideoDelete(video.id)}>Delete</button>
                                <button onClick={() => {
                                    setVideoEditMode(video.id);
                                    setVideoEditCaption(video.caption);
                                }}>Edit</button>
                            </>
                        )}
                    </div>
                ))}
            </section>



        </div>
    );
}
