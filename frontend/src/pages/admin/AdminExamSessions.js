import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminExamSessions = () => {
    const navigate = useNavigate();
    const [examSessions, setExamSessions] = useState([]);
    const [examTypes, setExamTypes] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [regulations, setRegulations] = useState([]);
    const [formData, setFormData] = useState({
        exam_type_id: '',
        semester_id: '',
        regulation_id: '',
        academic_year: '2024-25',
        exam_date: ''
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
            const [sessionsRes, typesRes, semestersRes, regulationsRes] = await Promise.all([
                api.get('/admin/exam-sessions'),
                api.get('/admin/exam-types'),
                api.get('/admin/semesters'),
                api.get('/admin/regulations')
            ]);
            setExamSessions(sessionsRes.data);
            setExamTypes(typesRes.data);
            setSemesters(semestersRes.data);
            setRegulations(regulationsRes.data);
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
            const payload = {
                exam_type_id: parseInt(formData.exam_type_id),
                semester_id: parseInt(formData.semester_id),
                regulation_id: parseInt(formData.regulation_id),
                academic_year: formData.academic_year
            };

            // Only include exam_date if it's provided
            if (formData.exam_date) {
                payload.exam_date = formData.exam_date;
            }

            await api.post('/admin/exam-sessions', payload);
            setSuccess('Exam session created successfully.');
            fetchData();
            setFormData({
                exam_type_id: '',
                semester_id: '',
                regulation_id: '',
                academic_year: '2024-25',
                exam_date: ''
            });

            // Auto clear success message
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getExamTypeName = (typeId) => {
        const type = examTypes.find(t => t.id === typeId);
        return type ? type.name : 'N/A';
    };

    const getSemesterName = (semId) => {
        const semester = semesters.find(s => s.id === semId);
        return semester ? semester.name : 'N/A';
    };

    const getRegulationName = (regId) => {
        const regulation = regulations.find(r => r.id === regId);
        return regulation ? regulation.name : 'N/A';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not Set';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)' }}>Exam Sessions Management</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage exam sessions and schedules</p>
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
                        ➕ Add New Exam Session
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Exam Type <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="exam_type_id"
                                    className="form-input"
                                    value={formData.exam_type_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Exam Type</option>
                                    {examTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
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
                                    <option value="">Select Semester</option>
                                    {semesters.map(semester => (
                                        <option key={semester.id} value={semester.id}>
                                            {semester.name}
                                        </option>
                                    ))}
                                </select>
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
                            </div>
                            <div className="form-group">
                                <label className="form-label">Academic Year <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    name="academic_year"
                                    className="form-input"
                                    placeholder="e.g. 2024-25"
                                    value={formData.academic_year}
                                    onChange={handleChange}
                                    required
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    Format: YYYY-YY
                                </small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Exam Date (Optional)</label>
                                <input
                                    type="date"
                                    name="exam_date"
                                    className="form-input"
                                    value={formData.exam_date}
                                    onChange={handleChange}
                                />
                                <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                    Can be set later if not yet scheduled
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
                                {isSubmitting ? 'Processing...' : 'Create Exam Session'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Exam Sessions List Section */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Existing Exam Sessions</h3>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading exam sessions...
                        </div>
                    ) : examSessions.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No exam sessions found. Add one above.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Exam Type</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Semester</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Regulation</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Academic Year</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Exam Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {examSessions.map((session) => (
                                        <tr
                                            key={session.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem' }}>{session.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{getExamTypeName(session.exam_type_id)}</td>
                                            <td style={{ padding: '1rem' }}>{getSemesterName(session.semester_id)}</td>
                                            <td style={{ padding: '1rem' }}>{getRegulationName(session.regulation_id)}</td>
                                            <td style={{ padding: '1rem' }}>{session.academic_year}</td>
                                            <td style={{ padding: '1rem' }}>{formatDate(session.exam_date)}</td>
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

export default AdminExamSessions;
