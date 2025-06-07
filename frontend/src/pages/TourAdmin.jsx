import React, { useState, useEffect } from 'react';
import './TourAdmin.css';

export default function TourAdmin() {
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [tours, setTours] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: '',
        slug: '',
        location: '',
        price: '',
        description: '',
        start_date: '',
        end_date: '',
        available_slots: '',
        image: null,
        existingImage: null
    });

    useEffect(() => {
        fetchTours();
    }, []);

    const fetchTours = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/landing-data');
            const data = await res.json();
            setTours(data.topTours || []);
        } catch (err) {
            console.error('Failed to fetch tours:', err);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setForm({ ...form, image: e.target.files[0] });
    };

    const handleEdit = (tour) => {
        setForm({
            title: tour.title || '',
            slug: tour.slug || '',
            location: tour.location || '',
            price: tour.price || '',
            description: tour.description || '',
            start_date: tour.start_date || '',
            end_date: tour.end_date || '',
            available_slots: tour.available_slots || '',
            image: null,
            existingImage: tour.image || null
        });
        setIsEditing(true);
        setEditingId(tour.id || tour.slug);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        for (const key in form) {
            if (key !== 'image' && key !== 'existingImage') {
                formData.append(key, form[key]);
            }
        }
        if (form.image instanceof File) {
            formData.append('image', form.image);
        }

        const endpoint = isEditing
            ? `http://localhost:3001/api/tours/${editingId}`
            : 'http://localhost:3001/api/tours';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(endpoint, {
                method,
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`❌ Error: ${error.error}`);
                return;
            }

            alert(isEditing ? '✅ Tour updated successfully!' : '✅ Tour added successfully!');

            setForm({
                title: '', slug: '', location: '', price: '',
                description: '', start_date: '', end_date: '', available_slots: '', image: null, existingImage: null
            });
            setIsEditing(false);
            setEditingId(null);
            fetchTours();
        } catch (err) {
            console.error(err);
            alert('❌ Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="tour-admin-container">
            <h2>{isEditing ? 'Edit Tour' : 'Add Tour'}</h2>
            <form onSubmit={handleSubmit} className="tour-form">
                <div className="form-group">
                    <label>Title</label>
                    <input type="text" name="title" value={form.title} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Slug</label>
                    <input type="text" name="slug" value={form.slug} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Location</label>
                    <input type="text" name="location" value={form.location} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Price</label>
                    <input type="number" name="price" value={form.price} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="6" value={form.description} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Start Date</label>
                    <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>End Date</label>
                    <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Available Slots</label>
                    <input type="number" name="available_slots" value={form.available_slots} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Tour Image</label>
                    <input type="file" name="image" accept="image/*" onChange={handleFileChange} />
                    {form.image ? (
                        <div className="image-preview">
                            <p>Preview:</p>
                            <img src={URL.createObjectURL(form.image)} alt="Preview" style={{ maxWidth: '100%', height: 'auto', marginTop: '1rem', borderRadius: '8px' }} />
                        </div>
                    ) : form.existingImage ? (
                        <div className="image-preview">
                            <p>Current Image:</p>
                            <img src={form.existingImage.includes('uploads') ? `http://localhost:3001/${form.existingImage}` : `/tourism-analytics${form.existingImage}`} alt="Existing" style={{ maxWidth: '100%', height: 'auto', marginTop: '1rem', borderRadius: '8px' }} />
                        </div>
                    ) : null}
                </div>

                {isEditing && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditing(false);
                            setEditingId(null);
                            setForm({ title: '', slug: '', location: '', price: '', description: '', start_date: '', end_date: '', available_slots: '', image: null, existingImage: null });
                        }}
                        style={{ marginBottom: '1rem' }}
                    >
                        Cancel Edit
                    </button>
                )}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Tour'}
                </button>
            </form>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tours.map((tour) => (
                        <tr key={tour.slug}>
                            <td>{tour.title}</td>
                            <td>{tour.location}</td>
                            <td>₱ {Number(tour.price).toLocaleString()}</td>
                            <td>
                                <button onClick={() => handleEdit(tour)}>Edit</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
