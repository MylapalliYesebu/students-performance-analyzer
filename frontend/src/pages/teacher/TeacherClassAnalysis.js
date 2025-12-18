import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TeacherClassAnalysis = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [deptRes, semRes] = await Promise.all([
                    api.get('/admin/departments'),
                    api.get('/admin/semesters')
                ]);
                setDepartments(deptRes.data);
                setSemesters(semRes.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch filter options.');
            }
        };
        fetchFilters();
    }, []);

    const handleAnalyze = async () => {
        if (!selectedDept || !selectedSem) return;

        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/teacher/analysis/${selectedDept}/${selectedSem}`);
            setAnalysisData(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch analysis data.');
            setAnalysisData(null);
        } finally {
            setLoading(false);
        }
    };

    // Prepare Chart Data
    const chartData = analysisData ? {
        labels: Object.keys(analysisData.subject_performance),
        datasets: [
            {
                label: 'Average Marks (%)',
                data: Object.values(analysisData.subject_performance),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    } : null;

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Class Subject Performance',
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

    // Calculate overall class average
    const calculateOverallAverage = () => {
        if (!analysisData || !analysisData.subject_performance) return 0;
        const values = Object.values(analysisData.subject_performance);
        if (values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return (sum / values.length).toFixed(2);
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Class Performance Analysis</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Department</label>
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem' }}
                        >
                            <option value="">Select Department</option>
                            {departments.map(d => (
                                <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Semester</label>
                        <select
                            value={selectedSem}
                            onChange={(e) => setSelectedSem(e.target.value)}
                            style={{ width: '100%', padding: '0.5rem' }}
                        >
                            <option value="">Select Semester</option>
                            {semesters.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        className="btn btn-primary"
                        disabled={!selectedDept || !selectedSem || loading}
                        style={{ padding: '0.5rem 1rem', height: '38px', marginBottom: '1px' }}
                    >
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
            </div>

            {analysisData && (
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div className="card" style={{ padding: '1rem' }}>
                        <Bar options={chartOptions} data={chartData} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '1rem' }}>Overall Class Average</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', margin: 0 }}>
                                {calculateOverallAverage()}%
                            </p>
                        </div>

                        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', backgroundColor: '#fff3cd' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', color: '#856404', fontSize: '1rem' }}>Weakest Subject</h3>
                            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc3545', margin: 0 }}>
                                {analysisData.weakest_subject || 'N/A'}
                            </p>
                            <small style={{ display: 'block', marginTop: '0.5rem', color: '#856404' }}>
                                Based on lowest average marks
                            </small>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherClassAnalysis;
