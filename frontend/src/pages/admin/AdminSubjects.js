import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminSubjects = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [formData, setFormData] = useState({ name: '', code: '', department_id: '', semester_id: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [subjRes, deptRes, semRes] = await Promise.all([
                api.get('/admin/subjects'),
                api.get('/admin/departments'),
                api.get('/admin/semesters')
            ]);
            setSubjects(subjRes.data);
            setDepartments(deptRes.data);
            setSemesters(semRes.data);
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
            await api.post('/admin/subjects', formData);
            setSuccess('Subject created successfully.');
            fetchData();
            setFormData({ name: '', code: '', department_id: '', semester_id: '' });

            // Auto clear success
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDeptCode = (id) => departments.find(d => d.id === id)?.code || id;
    const getSemName = (id) => semesters.find(s => s.id === id)?.name || id;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)' }}>Subjects Management</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>manage academic subjects</p>
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

                {/* Add Subject Card */}
                <div className="card" style={{ borderTop: '4px solid var(--success-color)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ➕ Add New Subject
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Subject Name <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="e.g. Data Structures"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Subject Code <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="code"
                                    className="form-input"
                                    placeholder="e.g. CS201"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                />
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
                                    <option value="">-- Select Department --</option>
                                    {departments.map(d => (
                                        <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Semester <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="semester_id"
                                    className="form-input"
                                    value={formData.semester_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">-- Select Semester --</option>
                                    {semesters.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isSubmitting}
                                style={{ minWidth: '150px' }}
                            >
                                {isSubmitting ? 'Processing...' : 'Create Subject'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Subjects List Card */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Existing Subjects</h3>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading subjects...
                        </div>
                    ) : subjects.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No subjects found. Create one above.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Code</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Subject Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Department</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Semester</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjects.map((sub) => (
                                        <tr
                                            key={sub.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{sub.code}</td>
                                            <td style={{ padding: '1rem' }}>{sub.name}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    backgroundColor: '#e0f2fe',
                                                    color: '#0369a1',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {getDeptCode(sub.department_id)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>{getSemName(sub.semester_id)}</td>
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

export default AdminSubjects;
