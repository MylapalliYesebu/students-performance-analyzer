import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminTeachers = () => {
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        department_id: '',
        password: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [teachRes, deptRes] = await Promise.all([
                api.get('/admin/teachers'),
                api.get('/admin/departments')
            ]);
            setTeachers(teachRes.data);
            setDepartments(deptRes.data);
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
            await api.post('/admin/teachers', formData);
            fetchData();
            setFormData({
                name: '',
                email: '',
                department_id: '',
                password: ''
            });
            setError(null);
        } catch (err) {
            setError(err.response?.data?.detail || 'Operation failed');
        }
    };

    const getDeptCode = (id) => departments.find(d => d.id === id)?.code || id;

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Manage Teachers</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
            </div>

            {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                <h3>Add New Teacher</h3>
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', alignItems: 'end' }}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Teacher Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ padding: '0.5rem' }}
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
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
                        Create Teacher
                    </button>
                </form>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Email</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Department</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teachers.map((t) => (
                            <tr key={t.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '0.75rem' }}>{t.name}</td>
                                <td style={{ padding: '0.75rem' }}>{t.email}</td>
                                <td style={{ padding: '0.75rem' }}>{getDeptCode(t.department_id)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminTeachers;
