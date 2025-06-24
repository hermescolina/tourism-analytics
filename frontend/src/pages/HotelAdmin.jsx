import { useParams } from 'react-router-dom';
import { apiBaseTour, apiBaseHotel, apiBaseCar, frontendBase } from '../config';
import React, { useEffect, useState } from 'react';
import styles from './HotelAdmin.module.css';

//export default function HotelAdmin({ slug = 'the-peninsula-manila' }) {
export default function HotelAdmin() {
    const { slug } = useParams(); // ✅ get slug from route
    const [hotelData, setHotelData] = useState(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [previewURL, setPreviewURL] = useState(null);
    const [isBackground, setIsBackground] = useState(false);


    const [uploadData, setUploadData] = useState({
        image: null,
        cardImage: null,
        description: '',
        category: '',
        is_background: false,
    });


    const [hotels, setHotels] = useState([]);

    const [newHotel, setNewHotel] = useState({
        name: '', slug: '', address: '', city: '', region: '', country: '',
        phone: '', email: '', website: '', opening_date: '',
        operator: '', owner: '', number_of_rooms: '', number_of_suites: '', floors: '',
        description: ''
    });

    const handleNewHotelChange = (e) => {
        const { name, value } = e.target;
        setNewHotel(prev => ({ ...prev, [name]: value }));
    };

    const handleAddHotel = () => {
        if (!newHotel.name || !newHotel.slug) {
            setStatus("❌ Hotel name and slug are required.");
            return;
        }

        fetch(`${apiBaseHotel}/api/hotel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHotel)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setStatus(`❌ ${data.error}`);
                } else {
                    setStatus(`✅ Hotel "${data.name}" added!`);
                    setNewHotel({
                        name: '', slug: '', address: '', city: '', region: '', country: '',
                        phone: '', email: '', website: '', opening_date: '',
                        operator: '', owner: '', number_of_rooms: '', number_of_suites: '', floors: '',
                        description: ''
                    });
                    fetchHotels();
                }
            })
            .catch(() => setStatus("❌ Server error while adding hotel"));
    };

    const fetchHotels = () => {
        fetch(`${apiBaseHotel}/api/hotels`)
            .then(res => res.json())
            .then(data => {
                setHotels(data);
            })
            .catch(() => setStatus('❌ Failed to load hotel list'));
    };

    useEffect(() => {
        fetch(`${apiBaseHotel}/api/hotel/${slug}`)
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

        fetchHotels();
    }, [slug]);

    const updateImageField = (index, key, newValue) => {
        const updated = [...hotelData.images];
        updated[index][key] = newValue;
        setHotelData({ ...hotelData, images: updated });
    };

    const handleSaveImage = (image) => {
        fetch(`${apiBaseHotel}/api/hotel/image/${image.filename}`, {
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
        fetch(`${apiBaseHotel}/api/hotel/image/${filename}`, {
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
        formData.append('is_background', uploadData.is_background); // ✅ Important

        console.log('📤 Uploading FormData:', {
            hotel_id: hotelData.hotel.hotel_id,
            image: uploadData.image?.name,
            category: uploadData.category,
            description: uploadData.description,
            is_background: uploadData.is_background
        });

        fetch(`${apiBaseHotel}/api/hotel/image`, {
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
                    setPreviewURL(null);
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
        <div className={styles.adminContainer}>
            <h1>🛠 Hotel Admin: {hotelData.hotel.name}</h1>
            {status && (
                <p className={`${styles.statusMessage} ${status.includes('❌') ? 'error' : 'success'}`}>
                    {status}
                </p>
            )}

            <section className={styles.cardImageUpload}>
                <h2>🖼 Card Image</h2>
                <div>
                    {hotelData.hotel.card_image && (
                        <img
                            src={`/tourism-analytics/images/${hotelData.hotel.card_image}`}
                            alt="Hotel Card"
                            style={{ width: 240, borderRadius: 16, marginBottom: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                        />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => {
                            const file = e.target.files[0];
                            if (file) setPreviewURL(URL.createObjectURL(file));
                            setUploadData(prev => ({ ...prev, cardImage: file }));
                        }}
                    />
                    {previewURL && uploadData.cardImage && (
                        <img src={previewURL} alt="Card Preview" style={{ width: 180, borderRadius: 12, margin: 8 }} />
                    )}
                    <button
                        onClick={async () => {
                            if (!uploadData.cardImage) {
                                setStatus('❌ Select a card image first.');
                                return;
                            }
                            const formData = new FormData();
                            formData.append('hotel_id', hotelData.hotel.hotel_id);
                            formData.append('image', uploadData.cardImage);
                            setStatus('⏳ Uploading...');
                            const res = await fetch(`${apiBaseHotel}/api/hotel/card-image`, {
                                method: 'POST',
                                body: formData,
                            });
                            const data = await res.json();
                            if (data.success) {
                                setHotelData(prev => ({
                                    ...prev,
                                    hotel: { ...prev.hotel, card_image: data.filename }
                                }));
                                setStatus('✅ Card image uploaded!');
                                setPreviewURL(null);
                                setUploadData(prev => ({ ...prev, cardImage: null }));
                            } else {
                                setStatus('❌ Failed to upload card image');
                            }
                        }}
                    >⬆️ Upload Card Image</button>
                </div>
            </section>


            <section className={styles.hotelList}>
                <h2>🏨 All Hotels</h2>
                <ul>
                    {hotels.map(h => (
                        <li key={h.slug}>
                            <button
                                onClick={() => {
                                    const targetUrl = `/tourism-analytics/admin/hotel/${h.slug}`;
                                    console.log(`🖱️ Clicked hotel: ${h.name}`);
                                    console.log(`🌐 Navigating to: ${targetUrl}`);
                                    setTimeout(() => {
                                        window.location.href = targetUrl;
                                    }, 150); // small delay for logs to print
                                }}

                                className={h.slug === slug ? 'selected' : ''}
                            >
                                {h.name} ({h.city}, {h.country})
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <section className={styles.addHotelForm}>
                <h2>➕ Add New Hotel</h2>
                <input name="name" placeholder="Hotel Name" value={newHotel.name} onChange={handleNewHotelChange} />
                <input name="slug" placeholder="Slug" value={newHotel.slug} onChange={handleNewHotelChange} />
                <input name="address" placeholder="Address" value={newHotel.address} onChange={handleNewHotelChange} />
                <input name="city" placeholder="City" value={newHotel.city} onChange={handleNewHotelChange} />
                <input name="region" placeholder="Region" value={newHotel.region} onChange={handleNewHotelChange} />
                <input name="country" placeholder="Country" value={newHotel.country} onChange={handleNewHotelChange} />
                <input name="phone" placeholder="Phone" value={newHotel.phone} onChange={handleNewHotelChange} />
                <input name="email" placeholder="Email" value={newHotel.email} onChange={handleNewHotelChange} />
                <input name="website" placeholder="Website" value={newHotel.website} onChange={handleNewHotelChange} />
                <input name="opening_date" type="date" placeholder="Opening Date" value={newHotel.opening_date} onChange={handleNewHotelChange} />
                <input name="operator" placeholder="Operator" value={newHotel.operator} onChange={handleNewHotelChange} />
                <input name="owner" placeholder="Owner" value={newHotel.owner} onChange={handleNewHotelChange} />
                <input name="number_of_rooms" type="number" placeholder="Rooms" value={newHotel.number_of_rooms} onChange={handleNewHotelChange} />
                <input name="number_of_suites" type="number" placeholder="Suites" value={newHotel.number_of_suites} onChange={handleNewHotelChange} />
                <input name="floors" type="number" placeholder="Floors" value={newHotel.floors} onChange={handleNewHotelChange} />
                <textarea name="description" placeholder="Description" value={newHotel.description} onChange={handleNewHotelChange} />
                <button onClick={handleAddHotel}>➕ Add Hotel</button>
            </section>

            <section>
                <h2>🖼 Hotel Images</h2>

                <div className={styles.uploadForm}>
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
                        disabled={uploadData.is_background} // ✅ Disable if background is selected
                    />
                    <textarea
                        name="description"
                        placeholder="Description"
                        value={uploadData.description}
                        onChange={handleUploadChange}
                        disabled={uploadData.is_background} // ✅ Disable if background is selected
                    />

                    {/* ✅ Insert here */}
                    <label style={{ display: 'flex', alignItems: 'center', marginTop: '1rem' }}>
                        <input
                            type="checkbox"
                            name="is_background"
                            checked={uploadData.is_background || false}
                            onChange={(e) =>
                                setUploadData({ ...uploadData, is_background: e.target.checked })
                            }
                        />
                        <span style={{ marginLeft: '0.5rem' }}>Background Image:</span>
                    </label>

                    <button onClick={handleUploadSubmit}>⬆️ Upload</button>
                </div>


                {hotelData.images
                    .filter(img => img.filename) // ✅ Skip images without a filename
                    .map((img, i) => (
                        <div key={img.filename} className={styles.imageEdit}>
                            <img
                                src={`/tourism-analytics/images/${img.filename}`}
                                alt={`Preview of ${img.category || 'image'}`}
                                loading="lazy"
                            />
                            <div className={styles.imageFields}>
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
                                <div className={styles.actions}>
                                    <button onClick={() => handleSaveImage(img)}>📏 Save</button>
                                    <button className={styles.deleteBtn} onClick={() => handleDeleteImage(img.filename)}>🗑️ Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
            </section>
        </div>
    );
}
