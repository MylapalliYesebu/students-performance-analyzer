import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <div className="homepage-container">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-left">
                    <h1 className="app-title">Performance Analyzer</h1>
                    <p className="welcome-text">Ideal Institute of Technology</p>
                </div>
                <div className="navbar-right">
                    <a href="#about" className="nav-link">About</a>
                    <a href="#use" className="nav-link">How to Use</a>
                    <a href="#roles" className="nav-link">Roles</a>
                    <button className="login-btn" onClick={handleLoginClick}>Login</button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-overlay"></div>
                <div className="hero-content">
                    <h2 className="hero-title">Welcome to Performance Analyzer</h2>
                    <p className="hero-subtitle">Ideal Institute of Technology</p>
                    <button className="login-btn" onClick={handleLoginClick}>Login</button>
                </div>
            </header>

            {/* Welcome Section */}
            <section id="about" className="section welcome-section">
                <h3 className="section-title">About the Platform</h3>
                <div className="section-content">
                    <p>
                        Performance Analyzer is a comprehensive tool designed for the Ideal Institute of Technology.
                        It empowers students, teachers, and administrators to track, analyze, and improve academic performance effectively.
                    </p>
                </div>
            </section>

            {/* How to Use Section */}
            <section id="use" className="section how-to-use-section">
                <h3 className="section-title">How to Use</h3>
                <div className="steps-container">
                    <div className="step-card">
                        <span className="step-number">01</span>
                        <h4>Login</h4>
                        <p>Use your secure credentials to access the platform.</p>
                    </div>
                    <div className="step-card">
                        <span className="step-number">02</span>
                        <h4>Access Dashboard</h4>
                        <p>View your personalized role-based dashboard.</p>
                    </div>
                    <div className="step-card">
                        <span className="step-number">03</span>
                        <h4>Manage Performance</h4>
                        <p>View marks, analyze trends, and generate reports.</p>
                    </div>
                </div>
            </section>

            {/* Role Overview Section */}
            <section id="roles" className="section role-section">
                <h3 className="section-title">Roles & Capabilities</h3>
                <div className="roles-container">
                    <div className="role-card">
                        <h4 className="role-name">Student</h4>
                        <p className="role-desc">View your academic history and performance analytics.</p>
                    </div>
                    <div className="role-card">
                        <h4 className="role-name">Teacher</h4>
                        <p className="role-desc">Manage class marks and analyze student progress.</p>
                    </div>
                    <div className="role-card">
                        <h4 className="role-name">Administrator</h4>
                        <p className="role-desc">Oversee the entire system, manage users and settings.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="homepage-footer">
                <div className="footer-content">
                    <p>&copy; {new Date().getFullYear()} Ideal Institute of Technology. All rights reserved.</p>
                    <p className="footer-links">
                        <a href="#about">About</a> | <a href="#use">How to Use</a> | <a href="#roles">Roles</a>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
