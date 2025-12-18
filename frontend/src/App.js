import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLayout from './components/AdminLayout';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminSemesters from './pages/admin/AdminSemesters';
import AdminSubjects from './pages/admin/AdminSubjects';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminAssignments from './pages/admin/AdminAssignments';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReports from './pages/admin/AdminReports';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherMarks from './pages/teacher/TeacherMarks';
import TeacherStudentPerformance from './pages/teacher/TeacherStudentPerformance';
import TeacherClassAnalysis from './pages/teacher/TeacherClassAnalysis';
import StudentMarks from './pages/student/StudentMarks';
import StudentAnalysis from './pages/student/StudentAnalysis';
import HomePage from './pages/HomePage';
import './styles/App.css';

function App() {
    const isAuthenticated = !!localStorage.getItem('token'); // Basic auth check for now

    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
                    <Route
                        path="/dashboard"
                        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin/departments"
                        element={isAuthenticated ? <AdminLayout><AdminDepartments /></AdminLayout> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin/semesters"
                        element={isAuthenticated ? <AdminLayout><AdminSemesters /></AdminLayout> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin/subjects"
                        element={isAuthenticated ? <AdminLayout><AdminSubjects /></AdminLayout> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin/students"
                        element={isAuthenticated ? <AdminLayout><AdminStudents /></AdminLayout> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin/teachers"
                        element={isAuthenticated ? <AdminLayout><AdminTeachers /></AdminLayout> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin/assignments"
                        element={isAuthenticated ? <AdminLayout><AdminAssignments /></AdminLayout> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin/settings"
                        element={isAuthenticated ? <AdminLayout><AdminSettings /></AdminLayout> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/admin/reports"
                        element={isAuthenticated ? <AdminLayout><AdminReports /></AdminLayout> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/teacher/students"
                        element={isAuthenticated ? <TeacherStudents /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/teacher/marks"
                        element={isAuthenticated ? <TeacherMarks /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/teacher/student/:rollNumber"
                        element={isAuthenticated ? <TeacherStudentPerformance /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/teacher/analysis"
                        element={isAuthenticated ? <TeacherClassAnalysis /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/student/marks"
                        element={isAuthenticated ? <StudentMarks /> : <Navigate to="/login" />}
                    />
                    <Route
                        path="/student/analysis"
                        element={isAuthenticated ? <StudentAnalysis /> : <Navigate to="/login" />}
                    />
                    <Route path="/" element={<HomePage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
