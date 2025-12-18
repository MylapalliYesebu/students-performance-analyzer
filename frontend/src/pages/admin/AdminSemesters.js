import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminSemesters = () => {
    const navigate = useNavigate();
    const [semesters, setSemesters] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const allowedSemesters = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

    useEffect(() => {
        fetchSemesters();
    }, []);

    const fetchSemesters = async () => {
        try {
            const response = await api.get('/admin/semesters');
            setSemesters(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch semesters');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post('/admin/semesters', { name: selectedSemester });
            setSuccess('Semester created successfully.');
            fetchSemesters();
            setSelectedSemester('');

            // Auto clear success
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const initiateDelete = (id) => {
        setDeleteTargetId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        try {
            await api.delete(`/admin/semesters/${deleteTargetId}`);
            setSuccess('Semester deleted successfully.');
            fetchSemesters();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Delete failed');
        } finally {
            setShowDeleteModal(false);
            setDeleteTargetId(null);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)' }}>Semesters Management</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>manage academic semesters</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </div>

            {/* Alerts */}
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

                {/* Add Semester Card */}
                <div className="card" style={{ borderTop: '4px solid var(--success-color)' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ➕ Create New Semester
                    </h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Select Semester <span style={{ color: 'red' }}>*</span></label>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <select
                                    className="form-input"
                                    value={selectedSemester}
                                    onChange={(e) => setSelectedSemester(e.target.value)}
                                    required
                                    style={{ maxWidth: '300px' }}
                                >
                                    <option value="">-- Choose a Semester --</option>
                                    {allowedSemesters.map(sem => (
                                        <option key={sem} value={sem} disabled={semesters.some(s => s.name === sem)}>
                                            {sem} {semesters.some(s => s.name === sem) ? '(Already Created)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!selectedSemester || isSubmitting}
                                    style={{ minWidth: '150px' }}
                                >
                                    {isSubmitting ? 'Processing...' : 'Create Semester'}
                                </button>
                            </div>
                            <small style={{ color: 'var(--text-secondary)' }}>
                                Only predefined academic semesters can be created.
                            </small>
                        </div>
                    </form>
                </div>

                {/* List Card */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Active Semesters</h3>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading semesters...
                        </div>
                    ) : semesters.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No semesters found. Create one above.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Semester Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {semesters.map((sem) => (
                                        <tr
                                            key={sem.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem' }}>{sem.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{sem.name}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => initiateDelete(sem.id)}
                                                    className="btn"
                                                    style={{
                                                        border: '1px solid var(--danger-color)',
                                                        color: 'var(--danger-color)',
                                                        backgroundColor: 'transparent',
                                                        padding: '0.25rem 0.75rem',
                                                        fontSize: '0.8rem'
                                                    }}
                                                    title="Delete"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Delete Modal */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center' }}>
                        <h3 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>⚠️ Confirm Deletion</h3>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                            Are you sure you want to delete this semester?<br />
                            <strong>This action cannot be undone.</strong>
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn"
                                style={{ backgroundColor: 'var(--danger-color)', color: 'white' }}
                            >
                                Yes, Delete It
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSemesters;
