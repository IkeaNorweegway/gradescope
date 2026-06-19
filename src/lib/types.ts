export interface Class {
  id: string;
  name: string;
  grade_level: string;
  subject: string;
  created_at: string;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  class_id: string;
  student_code: string;
  created_at: string;
  class?: Class;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  max_points: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  description: string;
  rubric: RubricCriterion[];
  max_marks: number;
  class_id: string | null;
  source_url: string;
  created_at: string;
}

export interface ManifestAssignment {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  description: string;
  url: string;
  rubric: Omit<RubricCriterion, 'id'>[];
}

export interface CriterionScore {
  criterion_id: string;
  criterion_name: string;
  score: number;
  max_points: number;
  comment: string;
}

export interface Submission {
  id: string;
  student_id: string;
  assignment_id: string;
  grade: number;
  percentage: number;
  rubric_scores: CriterionScore[];
  ai_feedback: string;
  conceptual_notes: string;
  strengths: string;
  areas_for_improvement: string;
  image_url?: string;
  marked_at: string;
  student?: Student;
  assignment?: Assignment;
}

export interface AppSettings {
  claudeApiKey: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}
