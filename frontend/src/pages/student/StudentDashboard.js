import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [marks, setMarks] = useState([]);
    const [analysis, setAnalysis] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const marksRes = await api.get('/student/marks');
                setMarks(marksRes.data);

                const analysisRes = await api.get('/student/analysis');
                setAnalysis(analysisRes.data);
            } catch (err) {
                console.error("Failed to fetch student data", err);
            }
        };
        fetchData();
    }, []);

    const chartData = {
        labels: marks.map(m => m.subject_id), // Use Subject Name ideally, but ID for MVP if name not in schema response
        datasets: [
            {
                label: 'Marks Obtained',
                data: marks.map(m => m.marks_obtained),
                backgroundColor: 'rgba(37, 99, 235, 0.5)',
            },
        ],
    };

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ marginBottom: 0 }}>My Dashboard</h2>
                <div>
                    <button className="btn btn-secondary" onClick={() => navigate('/student/marks')} style={{ marginRight: '1rem' }}>View Full Marks History</button>
                    <button className="btn btn-secondary" onClick={() => navigate('/student/analysis')}>View Detailed Analysis</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <h3>My Performance</h3>
                    <div className="card" style={{ marginTop: '1rem' }}>
                        {marks.length > 0 ? <Bar data={chartData} /> : <p>No marks available.</p>}
                    </div>
                </div>

                <div>
                    <h3>Analysis Insights</h3>
                    {analysis ? (
                        <div className="card" style={{ marginTop: '1rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <h4>Average Percentage</h4>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                    {analysis.average_percentage ? analysis.average_percentage.toFixed(2) + '%' : 'N/A'}
                                </p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <h4>Overall Trend</h4>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    backgroundColor: analysis.overall_trend === 'improving' ? '#dcfce7' : '#fee2e2',
                                    color: analysis.overall_trend === 'improving' ? '#166534' : '#991b1b',
                                    fontWeight: '500'
                                }}>
                                    {analysis.overall_trend.toUpperCase()}
                                </span>
                            </div>

                            <div>
                                <h4>Weak Subjects</h4>
                                {analysis.weak_subjects.length > 0 ? (
                                    <ul>
                                        {analysis.weak_subjects.map((sub, idx) => <li key={idx} style={{ color: 'var(--danger-color)' }}>{sub}</li>)}
                                    </ul>
                                ) : (
                                    <p style={{ color: 'var(--success-color)' }}>None! Keep it up.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p>Loading analysis...</p>
                    )}
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
                <h3>Marks History</h3>
                <div className="card" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <th style={{ padding: '0.5rem' }}>Subject ID</th>
                                <th style={{ padding: '0.5rem' }}>Exam Type</th>
                                <th style={{ padding: '0.5rem' }}>Obtained</th>
                                <th style={{ padding: '0.5rem' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {marks.map(m => (
                                <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.5rem' }}>{m.subject_id}</td>
                                    <td style={{ padding: '0.5rem' }}>{m.exam_type}</td>
                                    <td style={{ padding: '0.5rem' }}>{m.marks_obtained}</td>
                                    <td style={{ padding: '0.5rem' }}>{m.total_marks}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
