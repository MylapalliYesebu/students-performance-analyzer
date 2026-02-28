import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminBatches = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [regulations, setRegulations] = useState([]);
    const [institutes, setInstitutes] = useState([]);
    const [formData, setFormData] = useState({
        admission_year: new Date().getFullYear().toString(),
        regulation_id: '',
        institute_id: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [batchesRes, regulationsRes, institutesRes] = await Promise.all([
                api.get('/admin/batches'),
                api.get('/admin/regulations'),
                api.get('/admin/institutes')
            ]);
            setBatches(batchesRes.data);
            setRegulations(regulationsRes.data);
            setInstitutes(institutesRes.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post('/admin/batches', {
                admission_year: formData.admission_year,
                regulation_id: parseInt(formData.regulation_id),
                institute_id: parseInt(formData.institute_id)
            });
            setSuccess('Batch created successfully.');
            fetchData();
            setFormData({
                admission_year: new Date().getFullYear().toString(),
                regulation_id: '',
                institute_id: ''
            });

            // Auto clear success message
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRegulationName = (regId) => {
        const regulation = regulations.find(r => r.id === regId);
        return regulation ? regulation.name : 'N/A';
    };

    const getInstituteName = (instId) => {
        const institute = institutes.find(i => i.id === instId);
        return institute ? institute.name : 'N/A';
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)' }}>Batches Management</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage academic batches and cohorts</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </div>

            {/* In-page Alerts */}
            {error && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid #fecaca' }}>
                    <strong>Error:</strong> {error}
                </div>
            )}
            {success && (
                <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', border: '1px solid #bbf7d0' }}>
                    <strong>Success:</strong> {success}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* Add Form Section */}
                <div className="card" style={{ borderTop: '4px solid var(--success-color)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ➕ Add New Batch
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Admission Year <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="admission_year"
                                    className="form-input"
                                    placeholder="e.g. 2024"
                                    value={formData.admission_year}
                                    onChange={handleChange}
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    Year when the batch was admitted
                                </small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Regulation <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="regulation_id"
                                    className="form-input"
                                    value={formData.regulation_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Regulation</option>
                                    {regulations.map(regulation => (
                                        <option key={regulation.id} value={regulation.id}>
                                            {regulation.name}
                                        </option>
                                    ))}
                                </select>
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    Academic regulation/syllabus
                                </small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Institute <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="institute_id"
                                    className="form-input"
                                    value={formData.institute_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Institute</option>
                                    {institutes.map(institute => (
                                        <option key={institute.id} value={institute.id}>
                                            {institute.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                                style={{ minWidth: '120px' }}
                            >
                                {isSubmitting ? 'Processing...' : 'Create Batch'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Batches List Section */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Existing Batches</h3>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading batches...
                        </div>
                    ) : batches.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No batches found. Add one above.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Admission Year</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Regulation</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Institute</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {batches.map((batch) => (
                                        <tr
                                            key={batch.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem' }}>{batch.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{batch.admission_year}</td>
                                            <td style={{ padding: '1rem' }}>{getRegulationName(batch.regulation_id)}</td>
                                            <td style={{ padding: '1rem' }}>{getInstituteName(batch.institute_id)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminBatches;
