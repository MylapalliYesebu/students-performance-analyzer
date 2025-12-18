import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminStudents = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [semesters, setSemesters] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        roll_number: '',
        department_id: '',
        current_semester_id: '',
        password: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [stuRes, deptRes, semRes] = await Promise.all([
                api.get('/admin/students'),
                api.get('/admin/departments'),
                api.get('/admin/semesters')
            ]);
            setStudents(stuRes.data);
            setDepartments(deptRes.data);
            setSemesters(semRes.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/students', formData);
            fetchData();
            setFormData({
                name: '',
                roll_number: '',
                department_id: '',
                current_semester_id: '',
                password: ''
            });
            setError(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        }
    };

    const getDeptCode = (id) => departments.find(d => d.id === id)?.code || id;
    const getSemName = (id) => semesters.find(s => s.id === id)?.name || id;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Manage Students</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <h3>Add New Student</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', alignItems: 'end' }}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Student Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <input
                        type="text"
                        name="roll_number"
                        placeholder="Roll Number"
                        value={formData.roll_number}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <select
                        name="department_id"
                        value={formData.department_id}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.5rem' }}
                    >
                        <option value="">Select Department</option>
                        {departments.map(d => (
                            <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                        ))}
                    </select>
                    <select
                        name="current_semester_id"
                        value={formData.current_semester_id}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.5rem' }}
                    >
                        <option value="">Select Semester</option>
                        {semesters.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <input
                        type="password"
                        name="password"
                        placeholder="Initial Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Create Student
                    </button>
                </form>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Roll Number</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Department</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Semester</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((stu) => (
                            <tr key={stu.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '0.75rem' }}>{stu.roll_number}</td>
                                <td style={{ padding: '0.75rem' }}>{stu.name}</td>
                                <td style={{ padding: '0.75rem' }}>{getDeptCode(stu.department_id)}</td>
                                <td style={{ padding: '0.75rem' }}>{getSemName(stu.current_semester_id)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminStudents;
