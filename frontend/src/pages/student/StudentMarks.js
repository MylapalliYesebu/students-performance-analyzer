import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const StudentMarks = () => {
    const navigate = useNavigate();
    const [semesterData, setSemesterData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const res = await api.get('/student/marks');
                setSemesterData(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch marks data.');
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>My Academic Record</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {loading ? (
                <p>Loading...</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {semesterData.length === 0 ? (
                        <p>No academic records found.</p>
                    ) : (
                        semesterData.map((sem) => (
                            <div key={sem.semester_name} className="card">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem',
                                    borderBottom: '1px solid #eee',
                                    paddingBottom: '0.5rem'
                                }}>
                                    <h3 style={{ margin: 0 }}>Semester {sem.semester_name}</h3>
                                    <div>
                                        {sem.backlogs > 0 ? (
                                            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Backlogs: {sem.backlogs}</span>
                                        ) : (
                                            <span style={{ color: '#28a745', fontWeight: 'bold' }}>All Clear</span>
                                        )}
                                    </div>
                                </div>

                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: '#f8f9fa' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Subject Code</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Subject Name</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Internal</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>University</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Total</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Max Marks</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sem.subjects.map((sub) => (
                                            <tr key={sub.subject_code} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ padding: '0.75rem' }}>{sub.subject_code}</td>
                                                <td style={{ padding: '0.75rem' }}>{sub.subject_name}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{sub.internal_marks}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{sub.university_marks}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{sub.total_marks}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>{sub.max_total_marks}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                                    {sub.is_passed ? (
                                                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>PASS</span>
                                                    ) : (
                                                        <span style={{ color: '#dc3545', fontWeight: 'bold' }}>FAIL</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentMarks;
