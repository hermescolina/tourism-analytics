import React, { useEffect, useState } from 'react';
import './HotelAdmin.css';

export default function HotelAdmin({ slug = 'the-peninsula-manila' }) {
    const [hotelData, setHotelData] = useState(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [previewURL, setPreviewURL] = useState(null);
    const [uploadData, setUploadData] = useState({
        image: null,
        description: '',
        category: '',
    });

    useEffect(() => {
        fetch(`http://localhost:5000/api/hotel/${slug}`)
            .then(res => res.json())
            .then(data => {
                setHotelData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setStatus('❌ Failed to load hotel data');
                setLoading(false);
            });
    }, [slug]);

    const updateImageField = (index, key, newValue) => {
        const updated = [...hotelData.images];
        updated[index][key] = newValue;
        setHotelData({ ...hotelData, images: updated });
    };

    const handleSaveImage = (image) => {
        fetch(`http://localhost:5000/api/hotel/image/${image.filename}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: image.description,
                category: image.category
            })
        })
            .then(res => {
                if (res.ok) {
                    setStatus(`✅ Image "${image.filename}" updated`);
                } else {
                    setStatus(`❌ Failed to update image "${image.filename}"`);
                }
            })
            .catch(() => setStatus(`❌ Server error while updating "${image.filename}"`));
    };

    const handleDeleteImage = (filename) => {
        fetch(`http://localhost:5000/api/hotel/image/${filename}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (res.ok) {
                    const updated = hotelData.images.filter(img => img.filename !== filename);
                    setHotelData({ ...hotelData, images: updated });
                    setStatus(`🗑️ Image "${filename}" deleted`);
                } else {
                    setStatus(`❌ Failed to delete image "${filename}"`);
                }
            })
            .catch(() => setStatus(`❌ Server error while deleting "${filename}"`));
    };

    const handleUploadChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'image' && files && files[0]) {
            const file = files[0];
            setPreviewURL(URL.createObjectURL(file));
            setUploadData(prev => ({ ...prev, image: file }));
        } else {
            setUploadData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUploadSubmit = () => {
        if (!uploadData.image) {
            setStatus('❌ Please select an image to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('hotel_id', hotelData.hotel.hotel_id);
        formData.append('image', uploadData.image);
        formData.append('category', uploadData.category);
        formData.append('description', uploadData.description);

        fetch('http://localhost:5000/api/hotel/image', {
            method: 'POST',
            body: formData,
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setStatus(`❌ ${data.error}`);
                } else {
                    setStatus(`✅ Image "${data.filename}" uploaded`);
                    setHotelData(prev => ({
                        ...prev,
                        images: [...prev.images, {
                            filename: data.filename,
                            category: uploadData.category,
                            description: uploadData.description,
                        }]
                    }));
                    setUploadData({ image: null, description: '', category: '' });
                    setPreviewURL(null); // ✅ clear preview
                }
            })
            .catch(() => setStatus('❌ Server error while uploading image'));
    };

    useEffect(() => {
        if (status) {
            const timeout = setTimeout(() => setStatus(''), 3000);
            return () => clearTimeout(timeout);
        }
    }, [status]);

    if (loading) return <div className="loading">⏳ Loading hotel information...</div>;

    return (
        <div className="admin-container">
            <h1>🛠 Hotel Admin: {hotelData.hotel.name}</h1>
            {status && (
                <p className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>
                    {status}
                </p>
            )}

            <section>
                <h2>🖼 Hotel Images</h2>

                {/* ⬆️ Upload Form */}
                <div className="upload-form">
                    <h3>➕ Add New Image</h3>

                    {previewURL && (
                        <img
                            src={previewURL}
                            alt="Preview before upload"
                            style={{
                                width: '200px',
                                borderRadius: '0.5rem',
                                marginBottom: '0.5rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                        />
                    )}

                    <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleUploadChange}
                    />
                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={uploadData.category}
                        onChange={handleUploadChange}
                    />
                    <textarea
                        name="description"
                        placeholder="Description"
                        value={uploadData.description}
                        onChange={handleUploadChange}
                    />
                    <button onClick={handleUploadSubmit}>⬆️ Upload</button>
                </div>

                {/* 🖼 Image List */}
                {hotelData.images.map((img, i) => (
                    <div key={img.filename} className="image-edit">
                        <img
                            src={`/tourism-analytics/images/${img.filename}`}
                            alt={`Preview of ${img.category || 'image'}`}
                            loading="lazy"
                        />
                        <div className="image-fields">
                            <textarea
                                value={img.description ?? ''}
                                onChange={(e) => updateImageField(i, 'description', e.target.value)}
                                placeholder="Description"
                            />
                            <input
                                type="text"
                                value={img.category ?? ''}
                                onChange={(e) => updateImageField(i, 'category', e.target.value)}
                                placeholder="Category"
                            />
                            <div className="actions">
                                <button onClick={() => handleSaveImage(img)}>💾 Save</button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteImage(img.filename)}
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    );
}
