import React, { useState } from 'react';
import './TourAdmin.css';

export default function TourAdmin() {
    const [form, setForm] = useState({
        title: '',
        slug: '',
        location: '',
        price: '',
        description: '',
        start_date: '',
        end_date: '',
        available_slots: '',
        image: null
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setForm({ ...form, image: e.target.files[0] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();

        // Append all non-file fields
        for (const key in form) {
            if (key !== 'image') {
                formData.append(key, form[key]);
            }
        }

        // Only append image if selected
        if (form.image) {
            formData.append('image', form.image);
        }

        try {
            const response = await fetch('http://localhost:3001/api/tours', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                alert(`❌ Error: ${error.error}`);
                return;
            }

            alert('✅ Tour added successfully!');
            setForm({
                title: '',
                slug: '',
                location: '',
                price: '',
                description: '',
                start_date: '',
                end_date: '',
                available_slots: '',
                image: null
            });
        } catch (err) {
            console.error(err);
            alert('❌ Something went wrong. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="tour-admin-container">
            <h2>Add / Edit Tour</h2>
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
                    <textarea
                        name="description"
                        rows="6"
                        value={form.description}
                        onChange={handleChange}
                        required
                    />
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
                    {form.image && (
                        <div className="image-preview">
                            <p>Preview:</p>
                            <img
                                src={URL.createObjectURL(form.image)}
                                alt="Preview"
                                style={{ maxWidth: '100%', height: 'auto', marginTop: '1rem', borderRadius: '8px' }}
                            />
                        </div>
                    )}
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Tour'}
                </button>
            </form>
        </div>
    );
}
