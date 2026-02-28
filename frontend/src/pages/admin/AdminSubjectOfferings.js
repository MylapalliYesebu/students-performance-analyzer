import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminSubjectOfferings = () => {
    const navigate = useNavigate();
    const [offerings, setOfferings] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [sections, setSections] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [formData, setFormData] = useState({
        subject_id: '',
        section_id: '',
        teacher_id: '',
        academic_year: '2024-25'
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
            const [offeringsRes, subjectsRes, sectionsRes, teachersRes] = await Promise.all([
                api.get('/admin/subject-offerings'),
                api.get('/admin/subjects'),
                api.get('/admin/sections'),
                api.get('/admin/teachers')
            ]);
            setOfferings(offeringsRes.data);
            setSubjects(subjectsRes.data);
            setSections(sectionsRes.data);
            setTeachers(teachersRes.data);
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
            await api.post('/admin/subject-offerings', {
                subject_id: parseInt(formData.subject_id),
                section_id: parseInt(formData.section_id),
                teacher_id: parseInt(formData.teacher_id),
                academic_year: formData.academic_year
            });
            setSuccess('Subject offering created successfully.');
            fetchData();
            setFormData({ subject_id: '', section_id: '', teacher_id: '', academic_year: '2024-25' });

            // Auto clear success message
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getSubjectName = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? `${subject.name} (${subject.code})` : 'N/A';
    };

    const getSectionName = (sectionId) => {
        const section = sections.find(s => s.id === sectionId);
        return section ? section.name : 'N/A';
    };

    const getTeacherName = (teacherId) => {
        const teacher = teachers.find(t => t.id === teacherId);
        return teacher ? teacher.name : 'N/A';
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ color: 'var(--primary-color)' }}>Subject Offerings Management</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Assign subjects to sections with teachers</p>
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
                        ➕ Add New Subject Offering
                    </h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label">Subject <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="subject_id"
                                    className="form-input"
                                    value={formData.subject_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name} ({subject.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Section <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="section_id"
                                    className="form-input"
                                    value={formData.section_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Section</option>
                                    {sections.map(section => (
                                        <option key={section.id} value={section.id}>
                                            {section.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Teacher <span style={{ color: 'red' }}>*</span></label>
                                <select
                                    name="teacher_id"
                                    className="form-input"
                                    value={formData.teacher_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Teacher</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name}
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
                                    Format: YYYY-YY (e.g., 2024-25)
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
                                {isSubmitting ? 'Processing...' : 'Create Subject Offering'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Offerings List Section */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Existing Subject Offerings</h3>

                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Loading subject offerings...
                        </div>
                    ) : offerings.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            No subject offerings found. Add one above.
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--border-color)' }}>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Subject</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Section</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Teacher</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600 }}>Academic Year</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offerings.map((offering) => (
                                        <tr
                                            key={offering.id}
                                            style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--background-color)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <td style={{ padding: '1rem' }}>{offering.id}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{getSubjectName(offering.subject_id)}</td>
                                            <td style={{ padding: '1rem' }}>{getSectionName(offering.section_id)}</td>
                                            <td style={{ padding: '1rem' }}>{getTeacherName(offering.teacher_id)}</td>
                                            <td style={{ padding: '1rem' }}>{offering.academic_year}</td>
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

export default AdminSubjectOfferings;
