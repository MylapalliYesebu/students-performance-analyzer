import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const TeacherMarks = () => {
    const navigate = useNavigate();
    const [subjectOfferings, setSubjectOfferings] = useState([]);
    const [selectedOffering, setSelectedOffering] = useState(null);
    const [students, setStudents] = useState([]); // Used for roll number lookup
    const [rollNumber, setRollNumber] = useState('');
    const [examType, setExamType] = useState('Mid-1');
    const [marks, setMarks] = useState('');
    const [totalMarks, setTotalMarks] = useState(100);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSubjectOfferings();
    }, []);

    const fetchSubjectOfferings = async () => {
        try {
            // NEW ENDPOINT: Single call returns fully enriched data
            const res = await api.get('/teacher/subject-offerings');
            setSubjectOfferings(res.data);
        } catch (err) {
            console.error("Failed to fetch subject offerings", err);
        }
    };

    const handleOfferingChange = async (e) => {
        const offeringId = e.target.value;
        const offering = subjectOfferings.find(o => o.subject_offering_id === parseInt(offeringId));
        setSelectedOffering(offering);
        setRollNumber('');
        setStudents([]);

        if (offering && offering.subject && offering.section) {
            try {
                // Fetch students by section (new model)
                const res = await api.get(
                    `/teacher/students/${offering.subject.department_id}/${offering.subject.semester_id}?section_id=${offering.section.id}`
                );
                setStudents(res.data);
            } catch (err) {
                console.error("Failed to fetch class list", err);
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

        if (!selectedOffering || !selectedOffering.subject) {
            setMessage('Error: Please select a subject offering.');
            setLoading(false);
            return;
        }

        try {
            // Send legacy params - backend maps to new model internally
            await api.post('/teacher/marks', {
                student_id: studentId,
                subject_id: selectedOffering.subject_id,
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
                        <label className="form-label">Subject Offering</label>
                        <select
                            className="form-input"
                            value={selectedOffering ? selectedOffering.subject_offering_id : ''}
                            onChange={handleOfferingChange}
                            required
                        >
                            <option value="">Select Subject Offering</option>
                            {subjectOfferings.map(offering => (
                                <option key={offering.subject_offering_id} value={offering.subject_offering_id}>
                                    {offering.subject ?
                                        `${offering.subject.name} (${offering.subject.code}) - Section ${offering.section ? offering.section.name : 'N/A'} - AY ${offering.academic_year}`
                                        : 'Loading...'}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                            Shows subject with section and academic year
                        </small>
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
                            disabled={!selectedOffering}
                        />
                        {selectedOffering && students.length === 0 && (
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
                            <option value="Slip Test">
                                Slip Test{selectedOffering ? ` - Sem ${selectedOffering.semester_name} - AY ${selectedOffering.academic_year}` : ''}
                            </option>
                            <option value="Mid-1">
                                Mid-1{selectedOffering ? ` - Sem ${selectedOffering.semester_name} - AY ${selectedOffering.academic_year}` : ''}
                            </option>
                            <option value="Mid-2">
                                Mid-2{selectedOffering ? ` - Sem ${selectedOffering.semester_name} - AY ${selectedOffering.academic_year}` : ''}
                            </option>
                            <option value="University">
                                University{selectedOffering ? ` - Sem ${selectedOffering.semester_name} - AY ${selectedOffering.academic_year}` : ''}
                            </option>
                        </select>
                        <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                            Exam type for selected semester and academic year
                        </small>
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
                        disabled={loading || !selectedOffering}
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
