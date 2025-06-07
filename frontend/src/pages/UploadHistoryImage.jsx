import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './TourPage.css';

const apiBase = 'http://localhost:3001';
const urlBase = 'http://localhost:5173/tourism-analytics';

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
    const [videoEditMode, setVideoEditMode] = useState(null);
    const [videoEditCaption, setVideoEditCaption] = useState('');


    useEffect(() => {
        fetch(`${apiBase}/api/tours/${slug}`)
            .then(res => res.ok ? res.json() : Promise.reject('Tour not found'))
            .then(data => setTour(data))
            .catch(err => {
                console.error(err);
                setError('Tour not found or server error.');
            });

        fetch(`${apiBase}/api/history-images/${slug}`)
            .then(res => res.json())
            .then(data => setHistoryImages(data))
            .catch(console.error);

        // ✅ Just get the uploaded videos (no POST here)
        fetch(`${apiBase}/api/tours/${slug}/videos`)
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

        setUploading(true);
        try {
            const res = await fetch(`${apiBase}/api/tours/${slug}/history-image`, {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');

            setCaption('');
            setImageFile(null);
            setPreviewUrl(null);

            const updated = await fetch(`${apiBase}/api/history-images/${slug}`).then(r => r.json());
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
        await fetch(`${apiBase}/api/history-image/${id}`, { method: 'DELETE' });
        setHistoryImages(prev => prev.filter(img => img.id !== id));
    };

    const handleEditSubmit = async () => {
        const formData = new FormData();
        if (editCaption) formData.append('caption', editCaption);
        if (editFile) formData.append('image', editFile);

        const res = await fetch(`${apiBase}/api/history-image/${editMode}`, {
            method: 'PATCH',
            body: formData,
        });

        if (!res.ok) return alert("Update failed");

        const updated = await fetch(`${apiBase}/api/history-images/${slug}`).then(r => r.json());
        setHistoryImages(updated);

        setEditMode(null);
        setEditCaption('');
        setEditFile(null);
    };

    const handleVideoDelete = async (id) => {
        const confirm = window.confirm("Delete this video?");
        if (!confirm) return;

        const res = await fetch(`${apiBase}/api/tours/${slug}/video/${id}`, {
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

        const res = await fetch(`${apiBase}/api/tours/${slug}/video/${id}`, {
            method: 'PATCH',
            body: formData
        });

        if (!res.ok) {
            alert("❌ Failed to update video.");
            return;
        }

        const updated = await fetch(`${apiBase}/api/tours/${slug}/videos`).then(r => r.json());
        setVideos(updated);
        setVideoEditMode(null);
        setVideoEditCaption('');
    };


    const extractYouTubeId = (url) => {
        const match = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
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

        const res = await fetch(`${apiBase}/api/tours/${slug}/save-video`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            alert("❌ Failed to upload video.");
            return;
        }

        const updated = await fetch(`${apiBase}/api/tours/${slug}/videos`).then(r => r.json());
        setVideos(updated);
        setVideoUrl('');
        setVideoCaption('');
        alert("✅ Video uploaded!");
    };

    const imagePath = tour?.image || '';
    const imageUrl = imagePath.startsWith('/uploads/images/')
        ? `${urlBase}${imagePath.replace('/uploads', '')}`
        : `${apiBase}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

    const filteredImages = category ? historyImages.filter(img => img.category === category) : historyImages;

    if (error) return <div className="tour-container">{error}</div>;
    if (!tour) return <div className="tour-container">Loading...</div>;

    return (
        <div className="tour-container">
            <header className="browse-header">
                <div className="logo-section">
                    <Link to="/">
                        <img src={imageUrl} alt="TourWise" className="logo-image" />
                    </Link>
                    <span className="logo-text">Upload Media</span>
                </div>
            </header>

            <section className="tour-section">
                <h2>Tour: {tour.title}</h2>
                <form onSubmit={handleUpload} className="upload-form">
                    <div className="category-select">
                        <label><strong>Select Section:</strong></label><br />
                        {['About the Tour', 'What to Expect', 'History and Culture'].map(option => (
                            <label key={option}>
                                <input
                                    type="radio"
                                    name="category"
                                    value={option}
                                    checked={category === option}
                                    onChange={handleCategoryChange}
                                /> {option}
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

                    {previewUrl && <img src={previewUrl} alt="Preview" className="preview-image" />}

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
                        className="action-button"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </section>

            <section style={{ marginTop: '2rem' }}>
                <h3>Uploaded Images</h3>
                {filteredImages.map(img => (
                    <div key={img.id} className="image-card">
                        <img
                            src={`${apiBase}/uploads/${img.filename}`}
                            alt={img.caption}
                            className="preview-image"
                        />
                        {editMode === img.id ? (
                            <>
                                <input type="file" accept="image/*" onChange={(e) => setEditFile(e.target.files[0])} />
                                <textarea rows={2} value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
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

            {/* <section style={{ marginTop: '2rem' }}>
                <h3>Uploaded Videos</h3>
                {videos.map(video => (
                    <div key={video.id} className="video-card">
                        <iframe
                            width="350"
                            height="197"
                            src={`https://www.youtube.com/embed/${video.video_id}`}
                            title={video.caption}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                        <p>{video.caption}</p>
                        <button onClick={() => handleVideoDelete(video.id)}>Delete</button>
                    </div>
                ))}
            </section> */}

            <section style={{ marginTop: '2rem' }}>
                <h3>Uploaded Videos</h3>
                {videos.map(video => (
                    <div key={video.id} className="video-card">
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
                                    onChange={(e) => setVideoEditCaption(e.target.value)}
                                    style={{ width: '100%', marginTop: '0.5rem' }}
                                />
                                <button onClick={() => handleVideoEditSubmit(video.id)}>Save</button>
                                <button onClick={() => {
                                    setVideoEditMode(null);
                                    setVideoEditCaption('');
                                }}>Cancel</button>
                            </>
                        ) : (
                            <>
                                <p>{video.caption}</p>
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


            <section style={{ marginTop: '2rem' }}>
                <h3>Add New Video</h3>
                <form onSubmit={handleVideoUpload} className="upload-form">
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
                    <button type="submit" className="action-button">
                        Upload Video
                    </button>
                </form>
            </section>
        </div>
    );
}
