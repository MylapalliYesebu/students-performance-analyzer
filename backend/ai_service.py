"""
AI Service Module for Student Performance Summary Generation

This module provides AI-powered natural language summaries of student performance
using Google's Generative AI (Gemini). It includes graceful fallback to rule-based
summaries when AI is unavailable.

STRICT RULES:
- READ-ONLY: No database writes
- Uses existing marks and analysis data
- Graceful degradation when AI unavailable
"""

import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import Google Generative AI
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    logger.warning("google-generativeai not installed. AI summaries will use fallback mode.")


class AIPerformanceSummarizer:
    """
    Generates AI-powered performance summaries for students.
    Falls back to rule-based summaries when AI is unavailable.
    """
    
    def __init__(self):
        """Initialize the AI service with API key if available."""
        self.ai_enabled = False
        self.model = None
        
        if GENAI_AVAILABLE:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                try:
                    genai.configure(api_key=api_key)
                    self.model = genai.GenerativeModel('gemini-pro')
                    self.ai_enabled = True
                    logger.info("AI service initialized with Gemini API")
                except Exception as e:
                    logger.error(f"Failed to initialize Gemini API: {e}")
            else:
                logger.info("GEMINI_API_KEY not found. Using fallback mode.")
    
    def generate_summary(self, student_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate performance summary for a student.
        
        Args:
            student_data: Dictionary containing:
                - student_name: str
                - total_subjects: int
                - current_semester: str
                - average_percentage: float
                - strong_subjects: list of dicts with name and percentage
                - weak_subjects: list of dicts with name and percentage
                - exam_trend: str (improving/stable/declining)
                - backlogs: int
        
        Returns:
            Dictionary with:
                - summary: str (AI-generated or fallback text)
                - generated_at: str (ISO timestamp)
                - source: str ("ai" or "fallback")
        """
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        try:
            if self.ai_enabled and self.model:
                # Try AI generation
                summary_text = self._generate_ai_summary(student_data)
                return {
                    "summary": summary_text,
                    "generated_at": timestamp,
                    "source": "ai"
                }
        except Exception as e:
            logger.warning(f"AI generation failed: {e}. Falling back to rule-based summary.")
        
        # Fallback to rule-based summary
        summary_text = self._generate_fallback_summary(student_data)
        return {
            "summary": summary_text,
            "generated_at": timestamp,
            "source": "fallback"
        }
    
    def _construct_prompt(self, student_data: Dict[str, Any]) -> str:
        """
        Construct a structured prompt for the LLM.
        
        Args:
            student_data: Student performance data
        
        Returns:
            Formatted prompt string
        """
        # Build subject list
        strong_subjects_text = ""
        if student_data.get("strong_subjects"):
            strong_list = [f"{s['name']} ({s['percentage']:.1f}%)" 
                          for s in student_data["strong_subjects"][:3]]
            strong_subjects_text = ", ".join(strong_list)
        else:
            strong_subjects_text = "None identified yet"
        
        weak_subjects_text = ""
        if student_data.get("weak_subjects"):
            weak_list = [f"{s['name']} ({s['percentage']:.1f}%)" 
                        for s in student_data["weak_subjects"][:3]]
            weak_subjects_text = ", ".join(weak_list)
        else:
            weak_subjects_text = "None"
        
        # Construct prompt
        prompt = f"""You are an academic advisor analyzing student performance data.

Student Performance Data:
- Total Subjects: {student_data.get('total_subjects', 0)}
- Current Semester: {student_data.get('current_semester', 'N/A')}
- Overall Average: {student_data.get('average_percentage', 0):.1f}%
- Total Backlogs: {student_data.get('backlogs', 0)}

Strong Subjects (≥75%):
{strong_subjects_text}

Weak Subjects (<50%):
{weak_subjects_text}

Exam Performance Trend:
{student_data.get('exam_trend', 'stable')}

Please provide a concise, encouraging performance summary including:
1. Overall performance assessment
2. Recognition of strong subjects  
3. Areas needing improvement
4. Actionable study suggestions (non-prescriptive)
5. Motivational closing remark

Keep the tone supportive and constructive. Limit to 150 words.
"""
        return prompt
    
    def _generate_ai_summary(self, student_data: Dict[str, Any]) -> str:
        """
        Generate summary using Gemini AI.
        
        Args:
            student_data: Student performance data
        
        Returns:
            AI-generated summary text
        
        Raises:
            Exception: If AI generation fails
        """
        prompt = self._construct_prompt(student_data)
        
        # Generate content with timeout and safety settings
        response = self.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=300,
                temperature=0.7,
            )
        )
        
        if not response or not response.text:
            raise Exception("Empty response from AI model")
        
        return response.text.strip()
    
    def _generate_fallback_summary(self, student_data: Dict[str, Any]) -> str:
        """
        Generate rule-based summary when AI is unavailable.
        
        Args:
            student_data: Student performance data
        
        Returns:
            Rule-based summary text
        """
        avg = student_data.get('average_percentage', 0)
        total_subjects = student_data.get('total_subjects', 0)
        strong = student_data.get('strong_subjects', [])
        weak = student_data.get('weak_subjects', [])
        backlogs = student_data.get('backlogs', 0)
        trend = student_data.get('exam_trend', 'stable')
        
        # Performance level
        if avg >= 75:
            performance = "excellent"
        elif avg >= 60:
            performance = "good"
        elif avg >= 50:
            performance = "satisfactory"
        else:
            performance = "needs improvement"
        
        # Build summary
        summary = f"Based on your performance data: You have a {performance} average of {avg:.1f}% across {total_subjects} subjects. "
        
        # Strong subjects
        if strong:
            strong_names = [s['name'] for s in strong[:2]]
            summary += f"Strong performance in {', '.join(strong_names)}. "
        
        # Weak subjects
        if weak:
            weak_names = [s['name'] for s in weak[:2]]
            summary += f"Focus on improving {', '.join(weak_names)}. "
        
        # Backlogs
        if backlogs > 0:
            summary += f"You have {backlogs} backlog(s) to clear. "
        
        # Trend
        if trend == "improving":
            summary += "Your scores show an upward trend—keep up the good work! "
        elif trend == "declining":
            summary += "Recent scores suggest you need to refocus your study approach. "
        else:
            summary += "Maintain consistent study habits. "
        
        summary += "Stay motivated and keep working towards your goals!"
        
        return summary


# Global instance for reuse
_summarizer_instance: Optional[AIPerformanceSummarizer] = None


def get_summarizer() -> AIPerformanceSummarizer:
    """
    Get or create the global AI summarizer instance.
    
    Returns:
        AIPerformanceSummarizer instance
    """
    global _summarizer_instance
    if _summarizer_instance is None:
        _summarizer_instance = AIPerformanceSummarizer()
    return _summarizer_instance


def generate_student_summary(student_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convenience function to generate student performance summary.
    
    Args:
        student_data: Student performance data dictionary
    
    Returns:
        Summary dictionary with 'summary', 'generated_at', and 'source' fields
    """
    summarizer = get_summarizer()
    return summarizer.generate_summary(student_data)


def generate_teacher_insights(class_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate AI-powered class insights for teachers.
    
    Args:
        class_data: Dictionary containing:
            - subject_name: str
            - section_name: str
            - academic_year: str
            - total_students: int
            - class_average: float
            - exam_sessions: list of dicts with exam_type and avg_marks
            - high_performers: list of student names
            - low_performers: list of student names
            - improvement_trend: str (improving/stable/declining)
    
    Returns:
        Dictionary with:
            - insights: str (AI-generated or fallback text)
            - generated_at: str (ISO timestamp)
            - scope: dict with subject, section, academic_year
            - source: str ("ai" or "fallback")
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    summarizer = get_summarizer()
    
    # Prepare scope info
    scope = {
        "subject": class_data.get("subject_name", "Unknown"),
        "section": class_data.get("section_name", "Unknown"),
        "academic_year": class_data.get("academic_year", "Unknown")
    }
    
    try:
        if summarizer.ai_enabled and summarizer.model:
            # Try AI generation
            insights_text = _generate_ai_teacher_insights(summarizer.model, class_data)
            return {
                "insights": insights_text,
                "generated_at": timestamp,
                "scope": scope,
                "source": "ai"
            }
    except Exception as e:
        logger.warning(f"AI generation failed for teacher insights: {e}. Falling back.")
    
    # Fallback to rule-based insights
    insights_text = _generate_fallback_teacher_insights(class_data)
    return {
        "insights": insights_text,
        "generated_at": timestamp,
        "scope": scope,
        "source": "fallback"
    }


def _construct_teacher_prompt(class_data: Dict[str, Any]) -> str:
    """
    Construct a structured prompt for teacher class insights.
    
    Args:
        class_data: Class performance data
    
    Returns:
        Formatted prompt string
    """
    # Build exam sessions comparison
    exam_sessions_text = ""
    if class_data.get("exam_sessions"):
        sessions_list = [f"{s['exam_type']}: {s['avg_marks']:.1f}%" 
                        for s in class_data["exam_sessions"]]
        exam_sessions_text = "\n".join(sessions_list)
    else:
        exam_sessions_text = "No exam data available yet"
    
    # Build high/low performers
    high_performers_text = ""
    if class_data.get("high_performers"):
        high_performers_text = f"{len(class_data['high_performers'])} students scoring above 75%"
    else:
        high_performers_text = "None yet"
    
    low_performers_text = ""
    if class_data.get("low_performers"):
        low_performers_text = f"{len(class_data['low_performers'])} students below 50%"
    else:
        low_performers_text = "None"
    
    # Construct prompt
    prompt = f"""You are an educational consultant analyzing class performance data for a teacher.

Class Performance Data:
- Subject: {class_data.get('subject_name', 'Unknown')}
- Section: {class_data.get('section_name', 'Unknown')}
- Total Students: {class_data.get('total_students', 0)}
- Class Average: {class_data.get('class_average', 0):.1f}%

Exam Performance Comparison:
{exam_sessions_text}

Distribution:
- High Performers (≥75%): {high_performers_text}
- Struggling Students (<50%): {low_performers_text}

Overall Trend:
{class_data.get('improvement_trend', 'stable')}

Please provide concise teaching insights including:
1. Overall class performance assessment
2. Comparison across exam sessions (if multiple exams)
3. Observed trends (improving, stable, or areas of concern)
4. Non-prescriptive teaching suggestions to support struggling students
5. Encouraging note for the teacher

Keep the tone professional and constructive. Limit to 150 words.
"""
    return prompt


def _generate_ai_teacher_insights(model, class_data: Dict[str, Any]) -> str:
    """
    Generate insights using Gemini AI.
    
    Args:
        model: Gemini model instance
        class_data: Class performance data
    
    Returns:
        AI-generated insights text
    
    Raises:
        Exception: If AI generation fails
    """
    prompt = _construct_teacher_prompt(class_data)
    
    # Generate content
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=300,
            temperature=0.7,
        )
    )
    
    if not response or not response.text:
        raise Exception("Empty response from AI model")
    
    return response.text.strip()


def _generate_fallback_teacher_insights(class_data: Dict[str, Any]) -> str:
    """
    Generate rule-based insights when AI is unavailable.
    
    Args:
        class_data: Class performance data
    
    Returns:
        Rule-based insights text
    """
    avg = class_data.get('class_average', 0)
    total_students = class_data.get('total_students', 0)
    high_performers = class_data.get('high_performers', [])
    low_performers = class_data.get('low_performers', [])
    trend = class_data.get('improvement_trend', 'stable')
    subject_name = class_data.get('subject_name', 'this subject')
    
    # Performance assessment
    if avg >= 75:
        assessment = "excellent"
    elif avg >= 60:
        assessment = "good"
    elif avg >= 50:
        assessment = "satisfactory"
    else:
        assessment = "needs attention"
    
    # Build insights
    insights = f"Class Performance Analysis: Your section has an {assessment} average of {avg:.1f}% in {subject_name} with {total_students} students. "
    
    # Distribution
    if high_performers:
        insights += f"{len(high_performers)} students are performing excellently (≥75%). "
    
    if low_performers:
        insights += f"{len(low_performers)} students need additional support (<50%). "
        insights += "Consider targeted interventions for struggling students. "
    else:
        insights += "All students are maintaining passing grades. "
    
    # Trend
    if trend == "improving":
        insights += "The class shows an improving trend across exam sessions. "
    elif trend == "declining":
        insights += "Recent scores indicate a declining trend—review recent topics. "
    else:
        insights += "Performance remains stable. "
    
    insights += "Keep up the good work with your teaching methods!"
    
    return insights

