import pandas as pd
import numpy as np

def analyze_performance(student_id: int, marks_data: list, weak_threshold: float = 50.0):
    """
    Analyze student marks to identify weak subjects and trends.
    marks_data: List of dicts [{'subject': 'Math', 'marks': 50, 'total': 100, 'semester': '1-1'}, ...]
    """
    if not marks_data:
        return {"weak_subjects": [], "trend": "Insufficent Data"}

    df = pd.DataFrame(marks_data)
    
    # Calculate Percentage
    df['percentage'] = (df['marks'] / df['total']) * 100
    
    # 1. Weak Subject Identification (consistently < weak_threshold)
    subject_avg = df.groupby('subject')['percentage'].mean()
    weak_subjects = subject_avg[subject_avg < weak_threshold].index.tolist()
    
    # 2. Performance Trend (Semester wise average)
    if 'semester' in df.columns:
        sem_trend = df.groupby('semester')['percentage'].mean().sort_index().to_dict()
        
        # Simple trend detection
        trend_values = list(sem_trend.values())
        if len(trend_values) > 1:
            trend = "improving" if trend_values[-1] > trend_values[0] else "declining"
        else:
            trend = "stable"
    else:
        sem_trend = {}
        trend = "stable"


    return {
        "weak_subjects": weak_subjects,
        "semester_trend": sem_trend,
        "overall_trend": trend,
        "average_percentage": df['percentage'].mean()
    }

def analyze_class_performance(marks_data: list):
    """
    Analyze performance for a whole class.
    marks_data: List of dicts [{'subject': 'Math', 'marks': 50, 'total': 100, 'student_id': 1}, ...]
    """
    if not marks_data:
        return {"subject_performance": {}, "weakest_subject": None}

    df = pd.DataFrame(marks_data)
    df['percentage'] = (df['marks'] / df['total']) * 100
    
    # Average percentage per subject
    subject_avg = df.groupby('subject')['percentage'].mean().to_dict()
    
    # Identify weakest subject (lowest average)
    try:
        weakest_subject = min(subject_avg, key=subject_avg.get)
    except ValueError:
        weakest_subject = None

    return {
        "subject_performance": subject_avg,
        "weakest_subject": weakest_subject
    }

