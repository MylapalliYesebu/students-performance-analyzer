import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import TeacherDashboard from './teacher/TeacherDashboard';
import StudentDashboard from './student/StudentDashboard';
import AdminLayout from '../components/AdminLayout';

const Dashboard = () => {
    const navigate = useNavigate();
    const role = localStorage.getItem('role');
    const [stats, setStats] = useState({ students: 0, teachers: 0, departments: 0, subjects: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (role === 'admin') {
            fetchAdminStats();
        } else {
            setLoading(false);
        }
    }, [role]);

    const fetchAdminStats = async () => {
        try {
            // Artificial delay to show skeleton if needed, or remove for prod
            // await new Promise(resolve => setTimeout(resolve, 800)); 
            const response = await api.get('/admin/stats');
            setStats(response.data);
        } catch (error) {
            console.error("Error fetching stats", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    if (loading) {
        return (
            <AdminLayout>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ height: '32px', width: '200px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card" style={{ height: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ height: '24px', width: '60%', backgroundColor: '#e2e8f0', marginBottom: '1rem', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                            <div style={{ height: '40px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                        </div>
                    ))}
                </div>
                <style>{`
                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.5; }
                        100% { opacity: 1; }
                    }
                `}</style>
            </AdminLayout>
        );
    }

    const StatCard = ({ title, value, color, path }) => (
        <div
            className="card"
            onClick={() => navigate(path)}
            style={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                borderLeft: `4px solid ${color}`
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.5rem' }}>{value}</p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: color, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>View Details</span>
                <span>→</span>
            </div>
        </div>
    );

    const AdminContent = () => (
        <AdminLayout>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '2rem',
                gap: '1rem'
            }}>
                <h2 style={{ margin: 0 }}>Dashboard</h2>
                <span style={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em'
                }}>
                    ADMIN
                </span>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <StatCard title="Students" value={stats.students} color="var(--primary-color)" path="/admin/students" />
                <StatCard title="Teachers" value={stats.teachers} color="var(--success-color)" path="/admin/teachers" />
                <StatCard title="Departments" value={stats.departments} color="#8b5cf6" path="/admin/departments" />
                <StatCard title="Subjects" value={stats.subjects} color="#f59e0b" path="/admin/subjects" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem' }}>
                <div className="card">
                    <h3>Reports</h3>
                    <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Download comprehensive marks data for all students.</p>
                    <button onClick={() => navigate('/admin/reports')} className="btn btn-primary">
                        <span>📥</span>
                        <span style={{ marginLeft: '0.5rem' }}>Export to CSV</span>
                    </button>
                </div>
            </div>
        </AdminLayout>
    );

    if (role === 'admin') {
        return <AdminContent />;
    }

    return (
        <div className="container">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 0',
                marginBottom: '2rem',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <h2>Dashboard ({role})</h2>
                <div>
                    <span style={{ marginRight: '1rem' }}>Welcome, User</span>
                    <button className="btn btn-primary" onClick={handleLogout}>Logout</button>
                </div>
            </header>

            {role !== 'admin' && role !== 'teacher' && role !== 'student' && (
                <div className="card">
                    <h3>Welcome!</h3>
                    <p>Dashboard not available.</p>
                </div>
            )}

            {role === 'teacher' && <TeacherDashboard />}
            {role === 'student' && <StudentDashboard />}
        </div>
    );
};
export default Dashboard;
