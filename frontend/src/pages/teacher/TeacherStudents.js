import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const TeacherStudents = () => {
    const navigate = useNavigate();
    const [departments, setDepartments] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        fetchFilters();
    }, []);

    const fetchFilters = async () => {
        try {
            const [deptRes, semRes] = await Promise.all([
                api.get('/admin/departments'), // Now accessible to teachers
                api.get('/admin/semesters')    // Now accessible to teachers
            ]);
            setDepartments(deptRes.data);
            setSemesters(semRes.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch filter options');
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!selectedDept || !selectedSem) return;

        setSearching(true);
        setError(null);
        setSearched(true);

        try {
            const response = await api.get(`/teacher/students/${selectedDept}/${selectedSem}`);
            setStudents(response.data);
            setSearching(false);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch students for this class');
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
                        onClick={handleSearch}
                        className="btn btn-primary"
                        disabled={!selectedDept || !selectedSem || searching}
                        style={{ padding: '0.5rem 1rem', height: '38px', marginBottom: '1px' }}
                    >
                        {searching ? 'Start Search...' : 'Search'}
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
                                    <th style={{ padding: '0.75rem', textAlign: 'left' }}>Department</th>
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
                                        <td style={{ padding: '0.75rem' }}>{departments.find(d => d.id === s.department_id)?.code}</td>
                                        <td style={{ padding: '0.75rem' }}>{semesters.find(sem => sem.id === s.current_semester_id)?.name}</td>
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
