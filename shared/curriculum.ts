/**
 * CBSE/NCERT Curriculum Structure
 * Classes 1-10 with standard subjects
 * Classes 11-12 with three streams: Science, Commerce, Arts
 */

export type ClassLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11-Science' | '11-Commerce' | '11-Arts' | '12-Science' | '12-Commerce' | '12-Arts';

export type Subject = 
  // Classes 1-10
  | 'Mathematics'
  | 'Science'
  | 'English'
  | 'Hindi'
  | 'Social Science'
  | 'Sanskrit'
  | 'EVS'
  // Class 11-12 Science
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Computer Science'
  // Class 11-12 Commerce
  | 'Accountancy'
  | 'Business Studies'
  | 'Economics'
  | 'Statistics'
  // Class 11-12 Arts/Humanities
  | 'History'
  | 'Geography'
  | 'Political Science'
  | 'Psychology'
  | 'Sociology';

export const CLASSES: ClassLevel[] = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11-Science', '11-Commerce', '11-Arts',
  '12-Science', '12-Commerce', '12-Arts'
];

export const SUBJECTS_BY_CLASS: Record<ClassLevel, Subject[]> = {
  '1': ['Mathematics', 'English', 'Hindi', 'EVS'],
  '2': ['Mathematics', 'English', 'Hindi', 'EVS'],
  '3': ['Mathematics', 'English', 'Hindi', 'EVS', 'Science'],
  '4': ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science'],
  '5': ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science', 'Sanskrit'],
  '6': ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science', 'Sanskrit'],
  '7': ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science', 'Sanskrit'],
  '8': ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science', 'Sanskrit'],
  '9': ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science', 'Sanskrit'],
  '10': ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science', 'Sanskrit'],
  '11-Science': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'English', 'Hindi'],
  '11-Commerce': ['Accountancy', 'Business Studies', 'Economics', 'Statistics', 'English', 'Hindi'],
  '11-Arts': ['History', 'Geography', 'Political Science', 'Psychology', 'Sociology', 'English', 'Hindi'],
  '12-Science': ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'English', 'Hindi'],
  '12-Commerce': ['Accountancy', 'Business Studies', 'Economics', 'Statistics', 'English', 'Hindi'],
  '12-Arts': ['History', 'Geography', 'Political Science', 'Psychology', 'Sociology', 'English', 'Hindi'],
};

export const CLASS_LABELS: Record<ClassLevel, string> = {
  '1': 'Class 1',
  '2': 'Class 2',
  '3': 'Class 3',
  '4': 'Class 4',
  '5': 'Class 5',
  '6': 'Class 6',
  '7': 'Class 7',
  '8': 'Class 8',
  '9': 'Class 9',
  '10': 'Class 10',
  '11-Science': 'Class 11 (Science)',
  '11-Commerce': 'Class 11 (Commerce)',
  '11-Arts': 'Class 11 (Arts)',
  '12-Science': 'Class 12 (Science)',
  '12-Commerce': 'Class 12 (Commerce)',
  '12-Arts': 'Class 12 (Arts)',
};

export const STREAM_GROUPS = {
  elementary: ['1', '2', '3', '4', '5'],
  middle: ['6', '7', '8'],
  secondary: ['9', '10'],
  senior: ['11-Science', '11-Commerce', '11-Arts', '12-Science', '12-Commerce', '12-Arts'],
};
