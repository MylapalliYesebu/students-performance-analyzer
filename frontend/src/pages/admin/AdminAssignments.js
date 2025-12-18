import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminAssignments = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [teachRes, subjRes] = await Promise.all([
                api.get('/admin/teachers'),
                api.get('/admin/subjects')
            ]);
            setTeachers(teachRes.data);
            setSubjects(subjRes.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await api.post('/admin/teacher-subjects', {
                teacher_id: parseInt(selectedTeacher),
                subject_id: parseInt(selectedSubject)
            });
            setMessage('Subject assigned successfully!');
            setSelectedTeacher('');
            setSelectedSubject('');
            // Optional: Re-fetch if we want to update UI to show assignments (currently no list view requested)
            // fetchData(); 
        } catch (err) {
            setError(err.response?.data?.detail || 'Assignment failed');
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Assign Subject to Teacher</h2>
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
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Teacher</label>
                            <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="">-- Select Teacher --</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Subject</label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="">-- Select Subject --</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.code} - {s.name}
                                        {s.teacher_id ? ` (Currently assigned)` : ''} {/* Hint if already assigned */}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!selectedTeacher || !selectedSubject}
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                opacity: (!selectedTeacher || !selectedSubject) ? 0.6 : 1
                            }}
                        >
                            Assign Subject
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AdminAssignments;
