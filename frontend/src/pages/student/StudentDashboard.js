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
    const [aiSummary, setAiSummary] = useState(null);
    const [aiSummaryLoading, setAiSummaryLoading] = useState(true);

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

        const fetchAISummary = async () => {
            try {
                const aiRes = await api.get('/student/ai-summary');
                setAiSummary(aiRes.data);
            } catch (err) {
                console.error("Failed to fetch AI summary", err);
                // Gracefully handle - don't block page
            } finally {
                setAiSummaryLoading(false);
            }
        };

        fetchData();
        fetchAISummary();
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

            {/* AI Performance Summary Card */}
            {!aiSummaryLoading && aiSummary && (
                <div className="card" style={{
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                            AI Performance Insights
                            {aiSummary.source === 'fallback' && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    marginLeft: '0.5rem',
                                    opacity: 0.8,
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    padding: '0.125rem 0.5rem',
                                    borderRadius: '4px'
                                }}>
                                    Rule-based
                                </span>
                            )}
                        </h3>
                    </div>
                    <p style={{
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        margin: '0 0 1rem 0',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {aiSummary.summary}
                    </p>
                    <div style={{
                        fontSize: '0.875rem',
                        opacity: 0.8,
                        fontStyle: 'italic'
                    }}>
                        Generated {new Date(aiSummary.generated_at).toLocaleString()}
                    </div>
                </div>
            )}

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
