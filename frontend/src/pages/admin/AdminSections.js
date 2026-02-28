import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminSections = () => {
    const navigate = useNavigate();
    const [sections, setSections] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [formData, setFormData] = useState({ name: '', department_id: '', batch_id: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [sectionsRes, deptRes, batchesRes] = await Promise.all([
                api.get('/admin/sections'),
                api.get('/admin/departments'),
                api.get('/admin/batches')
            ]);
            setSections(sectionsRes.data);
            setDepartments(deptRes.data);
            setBatches(batchesRes.data);
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
            await api.post('/admin/sections', {
                ...formData,
                department_id: parseInt(formData.department_id),
                batch_id: parseInt(formData.batch_id)
            });
            setSuccess('Section created successfully.');
            fetchData();
            setFormData({ name: '', department_id: '', batch_id: '' });

            // Auto clear success message
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDepartmentName = (deptId) => {
        const dept = departments.find(d => d.id === deptId);
        return dept ? `${dept.code} - ${dept.name}` : 'N/A';
    };

    const getBatchName = (batchId) => {
        const batch = batches.find(b => b.id === batchId);
        return batch ? batch.name : 'N/A';
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)' }}>Sections Management</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage academic sections</p>
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
                        ➕ Add New Section
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Section Name <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="e.g. A, B, C"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    Section identifier (e.g., A, B, C, or 05-a)
                                </small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Department <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="department_id"
                                    className="form-input"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.code} - {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Batch <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="batch_id"
                                    className="form-input"
                                    value={formData.batch_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Batch</option>
                                    {batches.map(batch => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.name}
                                        </option>
                                    ))}
                                </select>
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    Academic batch/year group
                                </small>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                                style={{ minWidth: '120px' }}
                            >
                                {isSubmitting ? 'Processing...' : 'Create Section'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sections List Section */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Existing Sections</h3>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading sections...
                        </div>
                    ) : sections.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No sections found. Add one above.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Section Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Department</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Batch</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map((section) => (
                                        <tr
                                            key={section.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem' }}>{section.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{section.name}</td>
                                            <td style={{ padding: '1rem' }}>{getDepartmentName(section.department_id)}</td>
                                            <td style={{ padding: '1rem' }}>{getBatchName(section.batch_id)}</td>
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

export default AdminSections;
