import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const StudentAnalysis = () => {
    const navigate = useNavigate();
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const res = await api.get('/student/analysis');
                setAnalysis(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch analysis data.');
                setLoading(false);
            }
        };
        fetchAnalysis();
    }, []);

    /**
     * Process trend data to use exam-session aware labels
     * Maintains backward compatibility with legacy semester_trend
     */
    const processChartData = () => {
        if (!analysis || !analysis.semester_trend) return null;

        const labels = [];
        const data = [];

        // Check if trend uses exam session format (object with metadata)
        Object.entries(analysis.semester_trend).forEach(([key, value]) => {
            if (typeof value === 'object' && value.percentage !== undefined) {
                // NEW: Exam session format with metadata
                const label = value.exam_session
                    ? `${value.exam_session.exam_type} - Sem ${value.exam_session.semester_name} (${value.exam_session.academic_year})`
                    : `${value.exam_type} - Sem ${value.semester}`;
                labels.push(label);
                data.push(value.percentage);
            } else {
                // LEGACY: Simple key-value format
                labels.push(key);
                data.push(value);
            }
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Average Percentage per Exam',
                    data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    tension: 0.3,
                },
            ],
        };
    };

    const chartData = processChartData();

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Performance Trend Over Time',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Percentage (%)'
                }
            }
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Performance Analysis</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/student/dashboard')}>Back to Dashboard</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {loading ? (
                <p>Loading...</p>
            ) : analysis ? (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>

                    {/* Main Chart Area */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        {Object.keys(analysis.semester_trend).length > 0 ? (
                            <Line options={chartOptions} data={chartData} />
                        ) : (
                            <p className="text-center">Not enough data for trend analysis.</p>
                        )}
                    </div>

                    {/* Insights Side Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Overall Average */}
                        <div className="card text-center" style={{ padding: '1.5rem', backgroundColor: '#e9ecef' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#495057' }}>Overall Average</h4>
                            <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff' }}>
                                {analysis.average_percentage ? analysis.average_percentage.toFixed(2) : 0}%
                            </p>
                        </div>

                        {/* Trend Indicator */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Current Trend</h4>
                            {analysis.overall_trend === 'improving' && (
                                <div style={{ color: '#28a745', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📈</span>
                                    <div>
                                        <strong>Improving</strong>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Keep up the momentum!</div>
                                    </div>
                                </div>
                            )}
                            {analysis.overall_trend === 'declining' && (
                                <div style={{ color: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>📉</span>
                                    <div>
                                        <strong>Declining</strong>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Focus on weak areas.</div>
                                    </div>
                                </div>
                            )}
                            {analysis.overall_trend === 'stable' && (
                                <div style={{ color: '#17a2b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem' }}>➡️</span>
                                    <div>
                                        <strong>Stable</strong>
                                        <div style={{ fontSize: '0.9rem', color: '#666' }}>Consistent performance.</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Weak Subjects */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Subjects to Improve</h4>
                            {analysis.weak_subjects.length > 0 ? (
                                <ul style={{ paddingLeft: '1.2rem', marginBottom: 0 }}>
                                    {analysis.weak_subjects.map((sub, idx) => (
                                        <li key={idx} style={{ color: '#dc3545', marginBottom: '0.25rem' }}>{sub}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p style={{ margin: 0, color: '#28a745' }}>No weak subjects detected. Excellent!</p>
                            )}
                        </div>

                    </div>
                </div>
            ) : (
                <p>No analysis data available.</p>
            )}
        </div>
    );
};

export default StudentAnalysis;
