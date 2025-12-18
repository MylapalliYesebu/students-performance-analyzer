import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminSettings = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        pass_percentage: '',
        weak_threshold: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            setFormData({
                pass_percentage: response.data.pass_percentage,
                weak_threshold: response.data.weak_threshold
            });
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch settings');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: parseFloat(e.target.value) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setSaving(true);
        try {
            await api.put('/admin/settings', formData);
            setMessage('Settings updated successfully!');
            setSaving(false);
        } catch (err) {
            setError(err.response?.data?.detail || 'Update failed');
            setSaving(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Global Settings</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
            {message && <div className="alert alert-success" style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Pass Percentage (%)</label>
                            <input
                                type="number"
                                name="pass_percentage"
                                value={formData.pass_percentage}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                max="100"
                                required
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                            <small style={{ color: '#666' }}>Minimum percentage required to pass a subject.</small>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Weak Student Threshold (%)</label>
                            <input
                                type="number"
                                name="weak_threshold"
                                value={formData.weak_threshold}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                max="100"
                                required
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                            <small style={{ color: '#666' }}>Students with overall percentage below this will be flagged as weak.</small>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                opacity: saving ? 0.6 : 1
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
