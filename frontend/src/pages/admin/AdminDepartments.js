import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';


const AdminDepartments = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState({ name: '', code: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete Confirmation State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await api.get('/admin/departments');
            setDepartments(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch departments');
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
            if (editingId) {
                await api.put(`/admin/departments/${editingId}`, formData);
                setSuccess('Department updated successfully.');
            } else {
                await api.post('/admin/departments', formData);
                setSuccess('Department created successfully.');
            }
            fetchDepartments();
            setFormData({ name: '', code: '', description: '' });
            setEditingId(null);

            // Auto clear success message
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (dept) => {
        setFormData({ name: dept.name, code: dept.code, description: dept.description || '' });
        setEditingId(dept.id);
        setError(null);
        setSuccess(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const initiateDelete = (id) => {
        setDeleteTargetId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!deleteTargetId) return;

        try {
            await api.delete(`/admin/departments/${deleteTargetId}`);
            setSuccess('Department deleted successfully.');
            fetchDepartments();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Delete failed');
        } finally {
            setShowDeleteModal(false);
            setDeleteTargetId(null);
        }
    };

    const handleCancel = () => {
        setFormData({ name: '', code: '', description: '' });
        setEditingId(null);
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)' }}>Departments Management</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>manage academic departments</p>
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

                {/* Add/Edit Form Section */}
                <div className="card" style={{ borderTop: `4px solid ${editingId ? 'var(--primary-color)' : 'var(--success-color)'}` }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {editingId ? '✏️ Edit Department' : '➕ Add New Department'}
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Department Name <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="e.g. Computer Science and Engineering"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Department Code <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="code"
                                    className="form-input"
                                    placeholder="e.g. CSE"
                                    value={formData.code}
                                    onChange={handleChange}
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    Unique identifier/abbreviation for the department.
                                </small>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                    style={{ minWidth: '120px' }}
                                >
                                    {isSubmitting ? 'Processing...' : (editingId ? 'Update Department' : 'Create Department')}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="btn"
                                        style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* Departments List Section */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Existing Departments</h3>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading departments...
                        </div>
                    ) : departments.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No departments found. Add one above.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Code</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Department Name</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {departments.map((dept) => (
                                        <tr
                                            key={dept.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem' }}>{dept.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{dept.code}</td>
                                            <td style={{ padding: '1rem' }}>{dept.name}</td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleEdit(dept)}
                                                        className="btn"
                                                        style={{
                                                            border: '1px solid var(--primary-color)',
                                                            color: 'var(--primary-color)',
                                                            backgroundColor: 'transparent',
                                                            padding: '0.25rem 0.75rem',
                                                            fontSize: '0.8rem'
                                                        }}
                                                        title="Edit"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => initiateDelete(dept.id)}
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
                                                </div>
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
                            Are you sure you want to delete this department?<br />
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

export default AdminDepartments;
