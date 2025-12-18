import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
    // Default to collapsed on mobile, open on desktop
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background-color)' }}>
            <AdminSidebar isOpen={isSidebarOpen} />

            <div style={{
                flex: 1,
                marginLeft: isSidebarOpen ? '250px' : '70px',
                width: isSidebarOpen ? 'calc(100% - 250px)' : 'calc(100% - 70px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Top Header */}
                <header style={{
                    height: '64px',
                    backgroundColor: 'var(--surface-color)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2rem',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={toggleSidebar}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-primary)',
                                borderRadius: 'var(--radius)',
                                transition: 'background-color 0.2s'
                            }}
                            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                        >
                            {/* Modern Hamburger / Close Icon Transition */}
                            <div style={{
                                width: '24px',
                                height: '24px',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                                <span style={{
                                    width: '20px',
                                    height: '2px',
                                    backgroundColor: 'currentColor',
                                    borderRadius: '2px',
                                    transition: 'all 0.3s ease',
                                    position: 'absolute',
                                    transform: isSidebarOpen ? 'rotate(45deg)' : 'translateY(-6px)'
                                }} />
                                <span style={{
                                    width: '20px',
                                    height: '2px',
                                    backgroundColor: 'currentColor',
                                    borderRadius: '2px',
                                    transition: 'all 0.3s ease',
                                    opacity: isSidebarOpen ? 0 : 1
                                }} />
                                <span style={{
                                    width: '20px',
                                    height: '2px',
                                    backgroundColor: 'currentColor',
                                    borderRadius: '2px',
                                    transition: 'all 0.3s ease',
                                    position: 'absolute',
                                    transform: isSidebarOpen ? 'rotate(-45deg)' : 'translateY(6px)'
                                }} />
                            </div>
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)' }}>Administrator</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Welcome back</div>
                        </div>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}>
                            A
                        </div>
                    </div>
                </header>

                {/* Main Content Scrollable Area */}
                <main style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
