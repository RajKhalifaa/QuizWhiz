import { formatTime } from "./timeUtils";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  answers: (number | null)[];
  startTime: number;
  endTime: number | null;
  elapsedTimeInSeconds: number;
}

/**
 * Creates a new quiz state
 */
export function createQuizState(questions: QuizQuestion[]): QuizState {
  return {
    questions,
    currentQuestionIndex: 0,
    answers: Array(questions.length).fill(null),
    startTime: Date.now(),
    endTime: null,
    elapsedTimeInSeconds: 0
  };
}

/**
 * Updates a quiz state with a new answer
 */
export function selectAnswer(state: QuizState, answerIndex: number): QuizState {
  const newAnswers = [...state.answers];
  newAnswers[state.currentQuestionIndex] = answerIndex;
  
  return {
    ...state,
    answers: newAnswers
  };
}

/**
 * Moves to the next question in the quiz
 */
export function goToNextQuestion(state: QuizState): QuizState {
  if (state.currentQuestionIndex < state.questions.length - 1) {
    return {
      ...state,
      currentQuestionIndex: state.currentQuestionIndex + 1
    };
  }
  return state;
}

/**
 * Moves to the previous question in the quiz
 */
export function goToPreviousQuestion(state: QuizState): QuizState {
  if (state.currentQuestionIndex > 0) {
    return {
      ...state,
      currentQuestionIndex: state.currentQuestionIndex - 1
    };
  }
  return state;
}

/**
 * Completes the quiz and calculates the score
 */
export function completeQuiz(state: QuizState): {
  state: QuizState;
  score: number;
  timeTaken: string;
  incorrectQuestions: QuizQuestion[];
} {
  const endTime = Date.now();
  const elapsedTimeInSeconds = Math.floor((endTime - state.startTime) / 1000);
  
  const updatedState = {
    ...state,
    endTime,
    elapsedTimeInSeconds
  };
  
  // Calculate score
  let correctAnswers = 0;
  const incorrectQuestions: QuizQuestion[] = [];
  
  state.questions.forEach((question, index) => {
    const userAnswer = state.answers[index];
    if (userAnswer === question.correctAnswerIndex) {
      correctAnswers++;
    } else if (userAnswer !== null) {
      incorrectQuestions.push(question);
    }
  });
  
  const answeredQuestions = state.answers.filter(answer => answer !== null).length;
  const score = answeredQuestions > 0 
    ? Math.round((correctAnswers / answeredQuestions) * 100) 
    : 0;
  
  // Format time taken as MM:SS
  const timeTaken = formatTime(elapsedTimeInSeconds);
  
  return {
    state: updatedState,
    score,
    timeTaken,
    incorrectQuestions
  };
}

/**
 * Checks if a level is passed based on the score
 */
export function isLevelPassed(level: string, score: number): boolean {
  const thresholds = {
    'Beginner': 50,
    'Intermediate': 70,
    'Advanced': 80
  };
  
  return score >= thresholds[level as keyof typeof thresholds];
}

/**
 * Gets the icon and style for a quiz option state
 */
export function getOptionStateClasses(
  questionIndex: number,
  optionIndex: number,
  currentState: 'answering' | 'review',
  answers: (number | null)[],
  correctAnswerIndex: number
): { 
  classes: string;
  icon: string | null;
} {
  // In answering mode, just show selected state
  if (currentState === 'answering') {
    const isSelected = answers[questionIndex] === optionIndex;
    return {
      classes: isSelected ? 'quiz-option selected' : 'quiz-option',
      icon: null
    };
  }
  
  // In review mode, show correct/incorrect
  const userAnswer = answers[questionIndex];
  const isCorrect = correctAnswerIndex === optionIndex;
  const isSelected = userAnswer === optionIndex;
  
  if (isCorrect) {
    return {
      classes: 'quiz-option correct',
      icon: 'check_circle'
    };
  }
  
  if (isSelected && !isCorrect) {
    return {
      classes: 'quiz-option incorrect',
      icon: 'cancel'
    };
  }
  
  return {
    classes: 'quiz-option',
    icon: null
  };
}
