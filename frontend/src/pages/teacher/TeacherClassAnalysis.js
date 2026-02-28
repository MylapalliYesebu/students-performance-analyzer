import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TeacherClassAnalysis = () => {
    const navigate = useNavigate();
    const [subjectOfferings, setSubjectOfferings] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState(null);
    const [analysisData, setAnalysisData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [aiInsightsLoading, setAiInsightsLoading] = useState(false);

    useEffect(() => {
        const fetchSubjectOfferings = async () => {
            try {
                // NEW ENDPOINT: Get enriched subject offerings for teacher
                const res = await api.get('/teacher/subject-offerings');
                setSubjectOfferings(res.data);
                setInitialLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch your assigned subject offerings.');
                setInitialLoading(false);
            }
        };
        fetchSubjectOfferings();
    }, []);

    const fetchAIInsights = async (offeringId) => {
        setAiInsightsLoading(true);
        try {
            const res = await api.get(`/teacher/ai-insights?subject_offering_id=${offeringId}`);
            setAiInsights(res.data);
        } catch (err) {
            console.error('Failed to fetch AI insights:', err);
            // Gracefully handle - don't show error to user
            setAiInsights(null);
        } finally {
            setAiInsightsLoading(false);
        }
    };

    const handleOfferingChange = (e) => {
        const offering = subjectOfferings.find(o => o.subject_offering_id === parseInt(e.target.value));
        setSelectedOffering(offering);
        setAnalysisData(null); // Clear previous analysis
        setAiInsights(null); // Clear previous insights

        if (offering) {
            // Fetch AI insights automatically when offering selected
            fetchAIInsights(offering.subject_offering_id);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedOffering) return;

        setLoading(true);
        setError(null);
        try {
            // Fetch analysis with section_id for section-specific results
            const res = await api.get(
                `/teacher/analysis/${selectedOffering.subject.department_id}/${selectedOffering.subject.semester_id}?section_id=${selectedOffering.section.id}`
            );
            setAnalysisData(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch analysis data for this section.');
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Subject Offering (Section)</label>
                        <select
                            value={selectedOffering ? selectedOffering.subject_offering_id : ''}
                            onChange={handleOfferingChange}
                            style={{ width: '100%', padding: '0.5rem' }}
                            disabled={initialLoading}
                        >
                            <option value="">Select Subject & Section</option>
                            {subjectOfferings.map(offering => (
                                <option key={offering.subject_offering_id} value={offering.subject_offering_id}>
                                    {offering.subject.name} ({offering.subject.code}) - Section {offering.section.name} - AY {offering.academic_year}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                            Select a subject offering to analyze that section's performance
                        </small>
                    </div>

                    <button
                        onClick={handleAnalyze}
                        className="btn btn-primary"
                        disabled={!selectedOffering || loading}
                        style={{ padding: '0.5rem 1rem', height: '38px', marginBottom: '1px' }}
                    >
                        {loading ? 'Analyzing...' : 'Analyze'}
                    </button>
                </div>
            </div>

            {/* AI Class Insights Card */}
            {!aiInsightsLoading && aiInsights && selectedOffering && (
                <div className="card" style={{
                    marginBottom: '2rem',
                    background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '24px', height: '24px', marginRight: '0.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                            AI Class Insights
                            {aiInsights.source === 'fallback' && (
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

                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.75rem',
                        borderRadius: '6px',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.9 }}>
                            <strong>Subject:</strong> {aiInsights.scope.subject} |
                            <strong style={{ marginLeft: '0.5rem' }}>Section:</strong> {aiInsights.scope.section} |
                            <strong style={{ marginLeft: '0.5rem' }}>AY:</strong> {aiInsights.scope.academic_year}
                        </div>
                    </div>

                    <p style={{
                        fontSize: '1rem',
                        lineHeight: '1.6',
                        margin: '0 0 1rem 0',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {aiInsights.insights}
                    </p>

                    <div style={{
                        fontSize: '0.875rem',
                        opacity: 0.8,
                        fontStyle: 'italic',
                        textAlign: 'right'
                    }}>
                        Generated {new Date(aiInsights.generated_at).toLocaleString()}
                    </div>
                </div>
            )}

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
