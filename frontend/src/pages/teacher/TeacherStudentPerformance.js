import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useParams, useNavigate } from 'react-router-dom';

const TeacherStudentPerformance = () => {
    const { rollNumber } = useParams();
    const navigate = useNavigate();
    const [marks, setMarks] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch student marks (filtered by teacher's subjects on backend)
                const marksRes = await api.get(`/teacher/student/${rollNumber}`);

                // Fetch teacher's subjects to map names
                const subjectsRes = await api.get('/teacher/subjects');

                setMarks(marksRes.data);
                setSubjects(subjectsRes.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch student performance data.');
                setLoading(false);
            }
        };

        fetchData();
    }, [rollNumber]);

    const getSubjectName = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? `${subject.name} (${subject.code})` : `Subject ID: ${subjectId}`;
    };

    const getSemesterName = (subjectId) => {
        const subject = subjects.find(s => s.id === subjectId);
        return subject ? subject.semester : '-';
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Student Performance Report</h2>
                    <p style={{ color: '#666', margin: 0 }}>Roll Number: <strong>{rollNumber}</strong></p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>Back</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    {marks.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p>No marks found for this student in your subjects.</p>
                        </div>
                    ) : (
                        <div className="card">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Subject</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Semester</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Exam Type</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Marks Obtained</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Total Marks</th>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Percentage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {marks.map((m) => (
                                        <tr key={m.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '0.75rem' }}>{getSubjectName(m.subject_id)}</td>
                                            <td style={{ padding: '0.75rem' }}>{getSemesterName(m.subject_id)}</td>
                                            <td style={{ padding: '0.75rem' }}>{m.exam_type}</td>
                                            <td style={{ padding: '0.75rem' }}>{m.marks_obtained}</td>
                                            <td style={{ padding: '0.75rem' }}>{m.total_marks}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {((m.marks_obtained / m.total_marks) * 100).toFixed(2)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default TeacherStudentPerformance;
