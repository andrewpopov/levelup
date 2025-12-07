/**
 * Domain Event definitions for all bounded contexts
 */

// ============= USER IDENTITY CONTEXT =============

export class UserRegisteredEvent {
  constructor(userId, email, displayName) {
    this.type = 'user.registered';
    this.userId = userId;
    this.email = email;
    this.displayName = displayName;
    this.timestamp = new Date();
  }
}

export class UserLoggedInEvent {
  constructor(userId, email) {
    this.type = 'user.loggedIn';
    this.userId = userId;
    this.email = email;
    this.timestamp = new Date();
  }
}

// ============= COMMUNICATION CONTEXT =============

export class QuestionSessionInitiatedEvent {
  constructor(sessionId, questionId, userId1, userId2) {
    this.type = 'questionSession.initiated';
    this.sessionId = sessionId;
    this.questionId = questionId;
    this.userId1 = userId1;
    this.userId2 = userId2;
    this.timestamp = new Date();
  }
}

export class ResponseSubmittedEvent {
  constructor(responseId, sessionId, questionId, userId, responseType = 'text') {
    this.type = 'response.submitted';
    this.responseId = responseId;
    this.sessionId = sessionId;
    this.questionId = questionId;
    this.userId = userId;
    this.responseType = responseType; // 'text', 'media', etc
    this.timestamp = new Date();
  }
}

export class DiscussionRecordedEvent {
  constructor(sessionId, questionId, discussionId) {
    this.type = 'discussion.recorded';
    this.sessionId = sessionId;
    this.questionId = questionId;
    this.discussionId = discussionId;
    this.timestamp = new Date();
  }
}

// ============= LEARNING CONTEXT =============

export class JourneyEnrolledEvent {
  constructor(userJourneyId, userId, journeyId) {
    this.type = 'journey.enrolled';
    this.userJourneyId = userJourneyId;
    this.userId = userId;
    this.journeyId = journeyId;
    this.timestamp = new Date();
  }
}

export class TaskStartedEvent {
  constructor(taskProgressId, userJourneyId, taskId, userId) {
    this.type = 'task.started';
    this.taskProgressId = taskProgressId;
    this.userJourneyId = userJourneyId;
    this.taskId = taskId;
    this.userId = userId;
    this.timestamp = new Date();
  }
}

export class TaskCompletedEvent {
  constructor(taskProgressId, userJourneyId, taskId, userId, journeyId) {
    this.type = 'task.completed';
    this.taskProgressId = taskProgressId;
    this.userJourneyId = userJourneyId;
    this.taskId = taskId;
    this.userId = userId;
    this.journeyId = journeyId;
    this.timestamp = new Date();
  }
}

export class JourneyCompletedEvent {
  constructor(userJourneyId, userId, journeyId) {
    this.type = 'journey.completed';
    this.userJourneyId = userJourneyId;
    this.userId = userId;
    this.journeyId = journeyId;
    this.timestamp = new Date();
  }
}

export class StoryCreatedEvent {
  constructor(storyId, userId, journeyId, slotId) {
    this.type = 'story.created';
    this.storyId = storyId;
    this.userId = userId;
    this.journeyId = journeyId;
    this.slotId = slotId;
    this.timestamp = new Date();
  }
}

export class StorySectionUpdatedEvent {
  constructor(storyId, userId, journeyId, section, framework) {
    this.type = 'story.sectionUpdated';
    this.storyId = storyId;
    this.userId = userId;
    this.journeyId = journeyId;
    this.section = section; // 'situation', 'problem', 'actions', etc
    this.framework = framework; // 'SPARC' or 'STAR'
    this.timestamp = new Date();
  }
}

export class StoryCompletedEvent {
  constructor(storyId, userId, journeyId, slotId) {
    this.type = 'story.completed';
    this.storyId = storyId;
    this.userId = userId;
    this.journeyId = journeyId;
    this.slotId = slotId;
    this.timestamp = new Date();
  }
}

export class SignalTaggedEvent {
  constructor(storyId, signalName, strength) {
    this.type = 'signal.tagged';
    this.storyId = storyId;
    this.signalName = signalName;
    this.strength = strength;
    this.timestamp = new Date();
  }
}

// ============= MULTI-USER COLLABORATION CONTEXT =============

export class TeamJourneyCreatedEvent {
  constructor(teamJourneyId, teamId, journeyId) {
    this.type = 'teamJourney.created';
    this.teamJourneyId = teamJourneyId;
    this.teamId = teamId;
    this.journeyId = journeyId;
    this.timestamp = new Date();
  }
}

export class TeamMemberAddedEvent {
  constructor(teamJourneyId, userId) {
    this.type = 'teamMember.added';
    this.teamJourneyId = teamJourneyId;
    this.userId = userId;
    this.timestamp = new Date();
  }
}

export class SharedTaskSubmittedEvent {
  constructor(submissionId, teamJourneyId, taskId, userId) {
    this.type = 'sharedTask.submitted';
    this.submissionId = submissionId;
    this.teamJourneyId = teamJourneyId;
    this.taskId = taskId;
    this.userId = userId;
    this.timestamp = new Date();
  }
}

export class SubmissionReviewedEvent {
  constructor(submissionId, reviewedBy, feedback) {
    this.type = 'submission.reviewed';
    this.submissionId = submissionId;
    this.reviewedBy = reviewedBy;
    this.hasFeedback = !!feedback;
    this.timestamp = new Date();
  }
}

// ============= CERTIFICATION CONTEXT =============

export class CertificationIssuedEvent {
  constructor(certificationId, userId, journeyId) {
    this.type = 'certification.issued';
    this.certificationId = certificationId;
    this.userId = userId;
    this.journeyId = journeyId;
    this.timestamp = new Date();
  }
}

export class BadgeEarnedEvent {
  constructor(userId, badgeName) {
    this.type = 'badge.earned';
    this.userId = userId;
    this.badgeName = badgeName;
    this.timestamp = new Date();
  }
}
