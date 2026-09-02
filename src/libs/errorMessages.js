const ERROR_MESSAGES = {
  MISSING_FIELDS: 'Please fill in every field.',
  INVALID_PASSWORD: "That password doesn't look right — check with your teacher for today's password.",
  ROSTER_MISMATCH: "We couldn't find that name and student ID together. Double-check your spelling.",
  ALREADY_CHECKED_IN: "You're already marked present today!",
  INVALID_TEACHER_PASSWORD: 'Incorrect password.',
  NOT_AUTHENTICATED: 'Your session expired — please log in again.',
  DUPLICATE_STUDENT_NUMBER: 'That student ID is already used by another student.',
  STUDENT_NOT_FOUND: 'That student no longer exists.',
  PASSWORD_REQUIRED: "Password can't be empty.",
}

export function friendlyError(err) {
  return ERROR_MESSAGES[err?.code] ?? 'Something went wrong. Please try again.'
}
