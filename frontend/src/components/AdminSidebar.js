import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = ({ isOpen }) => {

    const handleLogout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/admin/departments', label: 'Departments', icon: '🏢' },
        { path: '/admin/semesters', label: 'Semesters', icon: '📅' },
        { path: '/admin/subjects', label: 'Subjects', icon: '📚' },
        { path: '/admin/teachers', label: 'Teachers', icon: '👩‍🏫' },
        { path: '/admin/students', label: 'Students', icon: '👨‍🎓' },
        { path: '/admin/assignments', label: 'Assign Subjects', icon: '📝' },
        { path: '/admin/reports', label: 'Reports', icon: '📈' },
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div style={{
            width: isOpen ? '250px' : '70px',
            height: '100vh',
            backgroundColor: 'var(--surface-color)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            left: 0,
            top: 0,
            overflowX: 'hidden',
            whiteSpace: 'nowrap',
            padding: '1rem 0.5rem',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 999
        }}>
            <div style={{
                marginBottom: '2rem',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '40px',
                overflow: 'hidden'
            }}>
                <h3 style={{
                    color: 'var(--primary-color)',
                    transition: 'opacity 0.2s',
                    opacity: isOpen ? 1 : 0,
                    width: isOpen ? 'auto' : 0,
                    margin: 0
                }}>
                    Admin Panel
                </h3>
                {!isOpen && <span style={{ fontSize: '1.5rem' }}>🛡️</span>}
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        title={!isOpen ? item.label : ''}
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                        style={({ isActive }) => ({
                            textDecoration: 'none',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius)',
                            color: isActive ? 'white' : 'var(--text-primary)',
                            backgroundColor: isActive ? 'var(--primary-color)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isOpen ? 'flex-start' : 'center',
                            gap: '1rem',
                            transition: 'all 0.2s',
                            margin: '0 0.25rem'
                        })}
                    >
                        <span style={{ fontSize: '1.25rem', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
                        <span style={{
                            opacity: isOpen ? 1 : 0,
                            width: isOpen ? 'auto' : 0,
                            overflow: 'hidden',
                            transition: 'opacity 0.2s',
                        }}>
                            {item.label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            {/* Injected style for hover effect on non-active items */}
            <style>{`
                .nav-item:not(.active):hover {
                    background-color: var(--background-color) !important;
                    color: var(--primary-color) !important;
                }
            `}</style>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                    onClick={handleLogout}
                    title={!isOpen ? 'Logout' : ''}
                    className="nav-item" // Reuse hover style
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--danger-color)',
                        color: 'var(--danger-color)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isOpen ? 'center' : 'center',
                        gap: isOpen ? '0.5rem' : 0,
                        overflow: 'hidden'
                    }}
                >
                    <span style={{ fontSize: '1.25rem', minWidth: '24px', textAlign: 'center' }}>🚪</span>
                    <span style={{
                        display: isOpen ? 'inline' : 'none'
                    }}>
                        Logout
                    </span>
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;
