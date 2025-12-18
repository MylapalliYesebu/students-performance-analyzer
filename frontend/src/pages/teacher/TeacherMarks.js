import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const TeacherMarks = () => {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [students, setStudents] = useState([]); // Used for roll number lookup
    const [rollNumber, setRollNumber] = useState('');
    const [examType, setExamType] = useState('Mid-1');
    const [marks, setMarks] = useState('');
    const [totalMarks, setTotalMarks] = useState(100);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

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

    const handleSubjectChange = async (e) => {
        const subjectId = e.target.value;
        setSelectedSubject(subjectId);
        setRollNumber('');
        setStudents([]);

        if (subjectId) {
            const subject = subjects.find(s => s.id === parseInt(subjectId));
            if (subject) {
                try {
                    const res = await api.get(`/teacher/students/${subject.department_id}/${subject.semester_id}`);
                    setStudents(res.data);
                } catch (err) {
                    console.error("Failed to fetch class list", err);
                }
            }
        }
    };

    const getStudentIdByRollNumber = (roll) => {
        const student = students.find(s => s.roll_number.toLowerCase() === roll.toLowerCase());
        return student ? student.id : null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        const studentId = getStudentIdByRollNumber(rollNumber);

        if (!studentId) {
            setMessage('Error: Invalid Roll Number for this subject.');
            setLoading(false);
            return;
        }

        try {
            await api.post('/teacher/marks', {
                student_id: studentId,
                subject_id: parseInt(selectedSubject),
                exam_type: examType,
                marks_obtained: parseFloat(marks),
                total_marks: parseFloat(totalMarks)
            });
            setMessage('Success: Marks uploaded successfully!');
            setMarks('');
            setRollNumber('');
        } catch (err) {
            console.error(err);
            setMessage('Error: Failed to upload marks.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Upload Marks (Manual Entry)</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/teacher/dashboard')}>Back to Dashboard</button>
            </div>

            <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Subject</label>
                        <select
                            className="form-input"
                            value={selectedSubject}
                            onChange={handleSubjectChange}
                            required
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Student Roll Number</label>
                        <input
                            type="text"
                            className="form-input"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            placeholder="e.g., 210101"
                            required
                            disabled={!selectedSubject}
                        />
                        {selectedSubject && students.length === 0 && (
                            <small style={{ color: 'orange' }}>Loading class list...</small>
                        )}
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

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !selectedSubject}
                    >
                        {loading ? 'Uploading...' : 'Submit Marks'}
                    </button>

                    {message && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '1rem',
                            borderRadius: '4px',
                            backgroundColor: message.includes('Success') ? '#d4edda' : '#f8d7da',
                            color: message.includes('Success') ? '#155724' : '#721c24',
                            border: `1px solid ${message.includes('Success') ? '#c3e6cb' : '#f5c6cb'}`
                        }}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default TeacherMarks;
