import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const TeacherStudents = () => {
    const navigate = useNavigate();
    const [subjectOfferings, setSubjectOfferings] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        fetchSubjectOfferings();
    }, []);

    const fetchSubjectOfferings = async () => {
        try {
            // NEW ENDPOINT: Get enriched subject offerings for teacher
            const res = await api.get('/teacher/subject-offerings');
            setSubjectOfferings(res.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch your assigned subject offerings');
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!selectedOffering) return;

        setSearching(true);
        setError(null);
        setSearched(true);

        try {
            // Fetch students by section (section-first approach)
            const response = await api.get(
                `/teacher/students/${selectedOffering.subject.department_id}/${selectedOffering.subject.semester_id}?section_id=${selectedOffering.section.id}`
            );
            setStudents(response.data);
            setSearching(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch students for this section');
            setStudents([]);
            setSearching(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Find Student by Class</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject Offering (Section)</label>
                        <select
                            value={selectedOffering ? selectedOffering.subject_offering_id : ''}
                            onChange={(e) => {
                                const offering = subjectOfferings.find(o => o.subject_offering_id === parseInt(e.target.value));
                                setSelectedOffering(offering);
                            }}
                            style={{ width: '100%', padding: '0.5rem' }}
                        >
                            <option value="">Select Subject & Section</option>
                            {subjectOfferings.map(offering => (
                                <option key={offering.subject_offering_id} value={offering.subject_offering_id}>
                                    {offering.subject.name} ({offering.subject.code}) - Section {offering.section.name} - AY {offering.academic_year}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                            Select a subject offering to view students in that section
                        </small>
                    </div>

                    <button
                        onClick={handleSearch}
                        className="btn btn-primary"
                        disabled={!selectedOffering || searching}
                        style={{ padding: '0.5rem 1rem', height: '38px', marginBottom: '1px' }}
                    >
                        {searching ? 'Loading...' : 'Load Students'}
                    </button>
                </div>
            </div>

            {searched && (
                <div className="card">
                    {students.length === 0 ? (
                        <p>No students found for this class.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Roll Number</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Section</th>
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Semester</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                        <td style={{ padding: '0.75rem' }}>{s.roll_number}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span
                                                onClick={() => navigate(`/teacher/student/${s.roll_number}`)}
                                                style={{ color: '#007bff', textDecoration: 'underline', cursor: 'pointer' }}
                                            >
                                                {s.name}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>{selectedOffering ? selectedOffering.section.name : '-'}</td>
                                        <td style={{ padding: '0.75rem' }}>{selectedOffering ? selectedOffering.semester_name : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherStudents;
