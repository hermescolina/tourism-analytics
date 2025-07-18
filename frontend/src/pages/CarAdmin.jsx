import { apiBaseCar } from '../config';
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './CarAdmin.css';

export default function CarAdmin() {
    const { slug } = useParams();
    const [carData, setCarData] = useState(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(true);
    const [previewURL, setPreviewURL] = useState(null);
    const [uploadData, setUploadData] = useState({
        image: null,
        description: '',
        category: '',
    });

    const [cars, setCars] = useState([]);

    const [newCar, setNewCar] = useState({
        make: '', model: '', slug: '', year: '', type: '', color: '', registration: '',
        owner: '', description: ''
    });

    const handleNewCarChange = (e) => {
        const { name, value } = e.target;
        setNewCar(prev => ({ ...prev, [name]: value }));
    };

    const handleAddCar = () => {
        if (!newCar.model || !newCar.slug) {
            setStatus("❌ Car model and slug are required.");
            return;
        }

        fetch('`${apiBaseCar}/api/car', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCar)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setStatus(`❌ ${data.error}`);
                } else {
                    setStatus(`✅ Car "${data.model}" added!`);
                    setNewCar({
                        make: '', model: '', slug: '', year: '', type: '', color: '', registration: '',
                        owner: '', description: ''
                    });
                    fetchCars();
                }
            })
            .catch(() => setStatus("❌ Server error while adding car"));
    };

    const fetchCars = () => {
        fetch('`${apiBaseCar}/api/cars')
            .then(res => res.json())
            .then(data => {
                setCars(data);
            })
            .catch(() => setStatus('❌ Failed to load car list'));
    };

    const fetchImages = async () => {
        try {
            const res = await fetch(`${apiBaseCar} / api / car / ${carData.car.slug}`);
            const data = await res.json();
            setCarData(data); // or setImages(data.images) if you manage images separately
        } catch (error) {
            console.error('Failed to fetch images:', error);
        }
    };

    useEffect(() => {
        fetch(`${apiBaseCar} / api / car / ${slug}`)
            .then(res => res.json())
            .then(data => {
                setCarData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setStatus('❌ Failed to load car data');
                setLoading(false);
            });

        fetchCars();
    }, [slug]);

    const updateImageField = (index, key, newValue) => {
        const updated = [...carData.images];
        updated[index][key] = newValue;
        setCarData({ ...carData, images: updated });
    };

    const handleSaveImage = (image) => {
        fetch(`${apiBaseCar} / api / car / image / ${image.image_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                description: image.description,
                category: image.category
            })
        })
            .then(res => {
                if (res.ok) {
                    setStatus(`✅ Image "${image.image_id}" updated`);
                    // fetchImages();
                } else {
                    setStatus(`❌ Failed to update image "${image.image_id}"`);
                }
            })
            .catch(() => setStatus(`❌ Server error while updating "${image.image_id}"`));
    };

    const handleDeleteImage = (image_id) => {
        fetch(`${apiBaseCar} / api / image / ${image_id}`, {
            method: 'DELETE'
        })
            .then(res => {
                if (res.ok) {
                    const updated = carData.images.filter(img => img.image_id !== image_id);
                    setCarData({ ...carData, images: updated });
                    setStatus(`🗑️ Image "${image_id}" deleted`);
                    // fetchImages();
                } else {
                    setStatus(`❌ Failed to delete image "${image_id}"`);
                }
            })
            .catch(() => setStatus(`❌ Server error while deleting "${image_id}"`));
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
        formData.append('car_id', carData.car.car_id);
        formData.append('image', uploadData.image);
        formData.append('category', uploadData.category);
        formData.append('description', uploadData.description);
        formData.append('is_background', uploadData.is_background ? 'true' : 'false');

        console.log('📤 Uploading FormData:', {
            car_id: carData.car.car_id,
            image: uploadData.image?.name,
            category: uploadData.category,
            description: uploadData.description,
            is_background: uploadData.is_background,
        });

        fetch('`${ apiBaseCar } /api/image', {
            method: 'POST',
            body: formData,
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setStatus(`❌ ${data.error}`);
                } else {
                    setStatus(`✅ Image "${data.filename}" uploaded`);
                    setCarData(prev => ({
                        ...prev,
                        images: [
                            ...prev.images,
                            {
                                image_id: data.image_id, // IMPORTANT: unique ID for React keys!
                                filename: data.filename,
                                category: uploadData.category,
                                description: uploadData.description,
                            },
                        ],
                    }));
                    setUploadData({ image: null, description: '', category: '', is_background: false });
                    setPreviewURL(null);
                    fetchImages();
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

    if (loading) return <div className="loading">⏳ Loading car information...</div>;

    if (carData && carData.images) {
        console.log(carData.images.map(img => img.image_id));
    }

    return (
        <div className="admin-container">
            <h1>🚗 Car Admin: {carData.car.model}</h1>
            {status && (
                <p className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>
                    {status}
                </p>
            )}

            <div className="upload-form" style={{ marginTop: 32 }}>
                <h3>➕ Set Card Image (Car Card Photo)</h3>
                {previewURL && uploadData.type === "card" && (
                    <img
                        src={previewURL}
                        alt="Preview Card Image"
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
                    name="card_image"
                    accept="image/*"
                    onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                            setPreviewURL(URL.createObjectURL(e.target.files[0]));
                            setUploadData({
                                ...uploadData,
                                card_image: e.target.files[0],
                                type: "card" // Mark as card image
                            });
                        }
                    }}
                />
                <button
                    onClick={() => {
                        if (!uploadData.card_image) {
                            setStatus('❌ Please select a card image to upload.');
                            return;
                        }
                        const formData = new FormData();
                        formData.append('car_id', carData.car.car_id);
                        formData.append('image', uploadData.card_image);

                        fetch('`${apiBaseCar}/api/car/card-image', {
                            method: 'POST',
                            body: formData,
                        })
                            .then(res => res.json())
                            .then(data => {
                                if (data.error) {
                                    setStatus(`❌ ${data.error}`);
                                } else {
                                    setStatus(`✅ Card image "${data.filename}" uploaded`);
                                    setCarData(prev => ({
                                        ...prev,
                                        car: { ...prev.car, card_image: data.filename }
                                    }));
                                    setUploadData(prev => ({ ...prev, card_image: null, type: '' }));
                                    setPreviewURL(null);
                                }
                            })
                            .catch(() => setStatus('❌ Server error while uploading card image'));
                    }}
                    style={{ marginTop: 12 }}
                >
                    ⬆️ Upload Card Image
                </button>
                {carData?.car?.card_image && (
                    <div style={{ marginTop: 8 }}>
                        <strong>Current Card Image:</strong>
                        <br />
                        <img
                            src={`/tourism-analytics/images/${carData.car.card_image}`}
                            alt="Current card"
                            style={{
                                width: '120px',
                                borderRadius: '0.25rem',
                                marginTop: '0.25rem'
                            }}
                        />
                    </div>
                )}
            </div>


            <section className="car-list">
                <h2>🚙 All Cars</h2>
                <ul>
                    {cars.map(c => (
                        <li key={c.slug}>
                            <button
                                onClick={() => {
                                    const targetUrl = `/tourism-analytics/admin/car/${c.slug}`;
                                    console.log(`🖱️ Clicked car: ${c.model}`);
                                    console.log(`🌐 Navigating to: ${targetUrl}`);
                                    setTimeout(() => {
                                        window.location.href = targetUrl;
                                    }, 150);
                                }}
                                className={c.slug === slug ? 'selected' : ''}
                            >
                                {c.make} {c.model} ({c.year}, {c.color})
                            </button>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="add-car-form">
                <h2>➕ Add New Car</h2>
                <input name="make" placeholder="Make" value={newCar.make} onChange={handleNewCarChange} />
                <input name="model" placeholder="Model" value={newCar.model} onChange={handleNewCarChange} />
                <input name="slug" placeholder="Slug" value={newCar.slug} onChange={handleNewCarChange} />
                <input name="year" type="number" placeholder="Year" value={newCar.year} onChange={handleNewCarChange} />
                <input name="type" placeholder="Type" value={newCar.type} onChange={handleNewCarChange} />
                <input name="color" placeholder="Color" value={newCar.color} onChange={handleNewCarChange} />
                <input name="registration" placeholder="Registration" value={newCar.registration} onChange={handleNewCarChange} />
                <input name="owner" placeholder="Owner" value={newCar.owner} onChange={handleNewCarChange} />
                <textarea name="description" placeholder="Description" value={newCar.description} onChange={handleNewCarChange} />
                <button onClick={handleAddCar}>➕ Add Car</button>
            </section>

            <section>
                <h2>🖼 Car Images</h2>
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
                        disabled={uploadData.is_background}
                    />
                    <textarea
                        name="description"
                        placeholder="Description"
                        value={uploadData.description}
                        onChange={handleUploadChange}
                        disabled={uploadData.is_background}
                    />
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

                {carData.images
                    .filter(img => img.image_id)
                    .map((img, i) => (
                        <div key={img.image_id} className="image-edit">
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
                                    <button onClick={() => handleSaveImage(img)}>📏 Save</button>
                                    <button className="delete-btn" onClick={() => handleDeleteImage(img.image_id)}>🗑️ Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
            </section>
        </div>
    );
}
