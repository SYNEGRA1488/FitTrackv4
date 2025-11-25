export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  height: number | null;
  weight: number | null;
  age: number | null;
  goal: string | null;
  activityLevel: string | null;
  theme: string;
  language: string;
  calorieGoal: number | null;
  proteinGoal: number | null;
  fatGoal: number | null;
  carbGoal: number | null;
  profileComplete: boolean;
}

export interface Workout {
  id: string;
  userId: string;
  name: string;
  date: Date;
  duration: number;
  exercises: Exercise[];
  notes: string | null;
}

export interface Exercise {
  name: string;
  sets: Set[];
  notes?: string;
}

export interface Set {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface AIPlan {
  id: string;
  userId: string;
  goal: string;
  plan: string;
  createdAt: Date;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number;
  thisWeekWorkouts: number;
  thisWeekDuration: number;
  lastWorkout: Date | null;
}


