import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const StudentMarks = () => {
    const navigate = useNavigate();
    const [marksData, setMarksData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMarks = async () => {
            try {
                const res = await api.get('/student/marks');
                // Process and group marks by exam session
                const processed = processMarksData(res.data);
                setMarksData(processed);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch marks data.');
                setLoading(false);
            }
        };
        fetchMarks();
    }, []);

    /**
     * Process marks data to group by exam sessions
     * Maintains backward compatibility with legacy data
     */
    const processMarksData = (rawData) => {
        const grouped = {};

        rawData.forEach(mark => {
            let groupKey;
            let groupLabel;
            let examInfo;

            // NEW: Use exam session if available
            if (mark.exam_session) {
                const session = mark.exam_session;
                groupKey = `session_${session.id}`;
                groupLabel = `${session.exam_type} - Sem ${session.semester_name} (AY ${session.academic_year})`;
                examInfo = {
                    type: 'session',
                    exam_type: session.exam_type,
                    semester: session.semester_name,
                    academic_year: session.academic_year,
                    exam_date: session.exam_date
                };
            }
            // FALLBACK: Legacy exam_type (backward compatibility)
            else {
                groupKey = `legacy_${mark.exam_type}_${mark.semester}`;
                groupLabel = `${mark.exam_type} - Sem ${mark.semester}`;
                examInfo = {
                    type: 'legacy',
                    exam_type: mark.exam_type,
                    semester: mark.semester
                };
            }

            // Initialize group if not exists
            if (!grouped[groupKey]) {
                grouped[groupKey] = {
                    label: groupLabel,
                    examInfo: examInfo,
                    subjects: [],
                    totalSubjects: 0,
                    failedSubjects: 0
                };
            }

            // Add subject to group
            grouped[groupKey].subjects.push({
                subject_code: mark.subject_code,
                subject_name: mark.subject_name,
                internal_marks: mark.internal_marks || 0,
                university_marks: mark.university_marks || 0,
                total_marks: mark.total_marks,
                max_total_marks: mark.max_total_marks,
                is_passed: mark.is_passed
            });

            grouped[groupKey].totalSubjects++;
            if (!mark.is_passed) {
                grouped[groupKey].failedSubjects++;
            }
        });

        // Convert to array and sort
        return Object.values(grouped).sort((a, b) => {
            // Sort by semester first, then by exam type
            return a.label.localeCompare(b.label);
        });
    };

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
                    {marksData.length === 0 ? (
                        <p>No academic records found.</p>
                    ) : (
                        marksData.map((examGroup, index) => (
                            <div key={index} className="card">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem',
                                    borderBottom: '1px solid #eee',
                                    paddingBottom: '0.5rem'
                                }}>
                                    <div>
                                        <h3 style={{ margin: 0 }}>{examGroup.label}</h3>
                                        {examGroup.examInfo.type === 'session' && examGroup.examInfo.exam_date && (
                                            <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                                Exam Date: {new Date(examGroup.examInfo.exam_date).toLocaleDateString()}
                                            </small>
                                        )}
                                    </div>
                                    <div>
                                        {examGroup.failedSubjects > 0 ? (
                                            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                                                Backlogs: {examGroup.failedSubjects}
                                            </span>
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
                                        {examGroup.subjects.map((sub, subIndex) => (
                                            <tr key={subIndex} style={{ borderBottom: '1px solid #dee2e6' }}>
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
