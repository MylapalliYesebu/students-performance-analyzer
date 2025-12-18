import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [classAnalysis, setClassAnalysis] = useState(null);
    const [examType, setExamType] = useState('Mid-1');
    const [marks, setMarks] = useState('');
    const [totalMarks, setTotalMarks] = useState(100);
    const [message, setMessage] = useState('');

    // Chart Data
    const chartData = classAnalysis ? {
        labels: Object.keys(classAnalysis.subject_performance),
        datasets: [
            {
                label: 'Class Average (%)',
                data: Object.values(classAnalysis.subject_performance),
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
            },
        ],
    } : null;

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/teacher/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error("Failed to fetch subjects", err);
        }
    };

    const handleSubjectSelect = async (subject) => {
        setSelectedSubject(subject);
        setSelectedStudent('');
        setClassAnalysis(null);
        try {
            // Fetch Students
            const resStudents = await api.get(`/teacher/students/${subject.department_id}/${subject.semester_id}`);
            setStudents(resStudents.data);

            // Fetch Analysis
            const resAnalysis = await api.get(`/teacher/analysis/${subject.department_id}/${subject.semester_id}`);
            setClassAnalysis(resAnalysis.data);
        } catch (err) {
            console.error("Failed to fetch data (students or analysis)", err);
            setStudents([]);
            setClassAnalysis(null);
        }
    };

    const handleBack = () => {
        setSelectedSubject(null);
        setStudents([]);
        setClassAnalysis(null);
        setMessage('');
        setMarks('');
        setSelectedStudent('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!selectedSubject || !selectedStudent) return;

        try {
            await api.post('/teacher/marks', {
                student_id: parseInt(selectedStudent),
                subject_id: selectedSubject.id,
                exam_type: examType,
                marks_obtained: parseFloat(marks),
                total_marks: parseFloat(totalMarks)
            });
            setMessage('Marks uploaded successfully!');
            setMarks('');
            // Optionally refresh analysis
            const resAnalysis = await api.get(`/teacher/analysis/${selectedSubject.department_id}/${selectedSubject.semester_id}`);
            setClassAnalysis(resAnalysis.data);
        } catch (err) {
            console.error(err);
            setMessage('Failed to upload marks.');
        }
    };

    if (!selectedSubject) {
        return (
            <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ marginBottom: 0, color: 'var(--text-primary)' }}>My Assigned Subjects</h2>
                    <div>
                        <button className="btn btn-secondary" onClick={() => navigate('/teacher/students')} style={{ marginRight: '1rem' }}>Find Student by Class</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/teacher/marks')} style={{ marginRight: '1rem' }}>Upload Marks (Manual)</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/teacher/analysis')}>Class Analysis</button>
                    </div>
                </div>
                {subjects.length === 0 ? (
                    <p>No subjects assigned yet.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {subjects.map(s => (
                            <div
                                key={s.id}
                                className="card"
                                onClick={() => handleSubjectSelect(s)}
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    borderLeft: '5px solid var(--primary-color)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-5px)';
                                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <h3 style={{ marginBottom: '0.5rem', color: 'var(--primary-color)' }}>{s.name}</h3>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}><strong>Code:</strong> {s.code}</p>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}><strong>Semester:</strong> {s.semester}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem' }}>
            <button
                onClick={handleBack}
                className="btn btn-secondary"
                style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <span>&larr;</span> Back to Subjects
            </button>

            <header style={{ marginBottom: '2rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                <h2 style={{ color: 'var(--primary-color)' }}>{selectedSubject.name} <span style={{ fontSize: '1rem', color: '#666' }}>({selectedSubject.code})</span></h2>
                <p style={{ margin: 0 }}>Semester: {selectedSubject.semester}</p>
            </header>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3>Upload Marks</h3>
                <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>

                    <div className="form-group">
                        <label className="form-label">Student</label>
                        <select
                            className="form-input"
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            required
                        >
                            <option value="" disabled>Select Student</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.roll_number})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Exam Type</label>
                        <select
                            className="form-input"
                            value={examType}
                            onChange={(e) => setExamType(e.target.value)}
                        >
                            <option value="Slip Test">Slip Test</option>
                            <option value="Mid-1">Mid-1</option>
                            <option value="Mid-2">Mid-2</option>
                            <option value="University">University</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Marks Obtained</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={marks}
                                    onChange={(e) => setMarks(e.target.value)}
                                    required
                                    min="0"
                                    step="0.5"
                                />
                            </div>
                            <div>
                                <label className="form-label">Total Marks</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={totalMarks}
                                    onChange={(e) => setTotalMarks(e.target.value)}
                                    required
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary">Submit Marks</button>

                    {message && (
                        <p style={{ marginTop: '1rem', color: message.includes('success') ? 'var(--success-color)' : 'var(--danger-color)' }}>
                            {message}
                        </p>
                    )}
                </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                {classAnalysis && (
                    <div>
                        <h3>Class Performance Analysis</h3>
                        <div className="card">
                            <Bar data={chartData} options={{ responsive: true, plugins: { title: { display: true, text: 'Subject Averages' } } }} />
                            {classAnalysis.weakest_subject && (
                                <p style={{ marginTop: '1rem' }}>
                                    <strong>Weakest Subject (Class Average):</strong> <span style={{ color: 'var(--danger-color)' }}>{classAnalysis.weakest_subject}</span>
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
