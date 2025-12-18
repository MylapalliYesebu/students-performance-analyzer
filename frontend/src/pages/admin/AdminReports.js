import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminReports = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [deptRes, semRes] = await Promise.all([
                api.get('/admin/departments'),
                api.get('/admin/semesters')
            ]);
            setDepartments(deptRes.data);
            setSemesters(semRes.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch filter data');
            setLoading(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setError(null);
        try {
            const params = {};
            if (selectedDept) params.department_id = selectedDept;
            if (selectedSem) params.semester_id = selectedSem;

            const response = await api.get('/admin/reports/export', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'student_performance_report.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setExporting(false);
        } catch (err) {
            console.error(err);
            setError('Failed to export report');
            setExporting(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Export Reports</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ marginBottom: '1rem' }}>Select filters to customize your report (optional). Leave empty to export all data.</p>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Filter by Department</label>
                            <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="">All Departments</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Filter by Semester</label>
                            <select
                                value={selectedSem}
                                onChange={(e) => setSelectedSem(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem' }}
                            >
                                <option value="">All Semesters</option>
                                {semesters.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleExport}
                            className="btn btn-primary"
                            disabled={exporting}
                            style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                opacity: exporting ? 0.6 : 1
                            }}
                        >
                            {exporting ? 'Generating CSV...' : 'Export to CSV'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminReports;
