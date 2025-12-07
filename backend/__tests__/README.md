# Level Up Journal - Backend Test Suite

## Overview

Comprehensive unit tests for all domain services in the Level Up Journal backend. Tests cover:

- **AuthenticationService** - User registration, login, token verification
- **CommunicationService** - Question management, responses, discussions
- **LearningService** - Journey enrollment, task progress, completion tracking
- **EnhancedResponseService** - Media responses, transcriptions, follow-up questions
- **MultiUserJourneyService** - Team journeys, shared tasks, peer reviews
- **CertificationService** - Competency profiles, assessments, certifications, badges

## File Structure

```
__tests__/
├── README.md                          # This file
├── setup.js                           # Jest configuration
├── services/
│   ├── AuthenticationService.test.js   # 5 test suites
│   ├── CommunicationService.test.js    # 6 test suites
│   ├── LearningService.test.js         # 6 test suites
│   ├── EnhancedResponseService.test.js # 8 test suites
│   ├── MultiUserJourneyService.test.js # 9 test suites
│   └── CertificationService.test.js    # 11 test suites
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (re-run on file changes)
```bash
npm test -- --watch
```

### Run tests with coverage report
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- AuthenticationService.test.js
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should reject"
```

### Run with verbose output
```bash
npm test -- --verbose
```

## Test Organization

Each test file follows this structure:

```javascript
describe('ServiceName', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    // Reset event bus
    eventBus.clearHistory();
    eventBus.clearListeners();

    // Create service with mocked dependencies
    service = new ServiceName({});
    service.repository = mockRepository;
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      mockRepository.someMethod.mockResolvedValue(data);

      // Act
      const result = await service.someMethod(param);

      // Assert
      expect(result).toEqual(expected);
      expect(mockRepository.someMethod).toHaveBeenCalled();
    });
  });
});
```

## Mocking Strategy

### Repository Mocking
All tests mock the underlying repositories using Jest:

```javascript
mockQuestionRepository = {
  findById: jest.fn(),
  saveResponse: jest.fn(),
  recordDiscussion: jest.fn()
};

service.questionRepository = mockQuestionRepository;
```

### Event Bus Testing
Tests verify that domain events are published:

```javascript
const publishSpy = jest.spyOn(eventBus, 'publish');
await service.submitResponse(...);

expect(publishSpy).toHaveBeenCalled();
const event = publishSpy.mock.calls[0][0];
expect(event).toBeInstanceOf(ResponseSubmittedEvent);
```

## Test Coverage

### AuthenticationService (39 lines of tests)
- ✅ User registration with valid credentials
- ✅ Event publishing on registration
- ✅ Reject duplicate emails
- ✅ Reject invalid emails
- ✅ Auto-generate displayName from email
- ✅ User login
- ✅ Reject non-existent users
- ✅ Update display name
- ✅ Fetch user profile

### CommunicationService (48 lines of tests)
- ✅ Submit response to question
- ✅ Publish ResponseSubmittedEvent
- ✅ Reject empty responses
- ✅ Reject missing questions
- ✅ Retrieve question with details
- ✅ Record discussion
- ✅ Publish DiscussionRecordedEvent
- ✅ Check session status (both responded, only one responded)
- ✅ Get question of the week
- ✅ Retrieve all questions

### LearningService (68 lines of tests)
- ✅ Enroll user in journey
- ✅ Create task progress with due dates
- ✅ Publish JourneyEnrolledEvent
- ✅ Reject duplicate enrollments
- ✅ Calculate due dates (daily, weekly, monthly, biweekly)
- ✅ Complete task and update progress
- ✅ Complete entire journey on final task
- ✅ Publish TaskCompletedEvent and JourneyCompletedEvent
- ✅ Get pending/current tasks
- ✅ Filter out completed tasks
- ✅ Get active journeys

### EnhancedResponseService (72 lines of tests)
- ✅ Submit media response (voice, video, image)
- ✅ Publish ResponseSubmittedEvent with media type
- ✅ Reject invalid response types
- ✅ Reject missing media URL
- ✅ Update existing enhanced response
- ✅ Ask follow-up question
- ✅ Reject empty follow-up text
- ✅ Reject if response not found
- ✅ Answer follow-up question
- ✅ Get all follow-ups
- ✅ Get unanswered follow-ups
- ✅ Delete unanswered follow-ups
- ✅ Reject deleting answered follow-ups
- ✅ Get full conversation thread
- ✅ Get conversation insights/analytics
- ✅ Get transcription

### MultiUserJourneyService (76 lines of tests)
- ✅ Create team journey
- ✅ Publish TeamJourneyCreatedEvent
- ✅ Reject if journey not found
- ✅ Add team member
- ✅ Publish TeamMemberAddedEvent
- ✅ Reject if user already member
- ✅ Publish event for each active journey
- ✅ Get team members
- ✅ Submit shared task
- ✅ Reject empty submission
- ✅ Reject duplicate submission
- ✅ Publish SharedTaskSubmittedEvent
- ✅ Get all submissions for task
- ✅ Review submission with rating
- ✅ Publish SubmissionReviewedEvent
- ✅ Reject invalid rating (1-5)
- ✅ Reject duplicate review
- ✅ Get submission reviews
- ✅ Calculate average rating
- ✅ Delete review

### CertificationService (88 lines of tests)
- ✅ Create competency profile
- ✅ Initialize assessments for target signals
- ✅ Return existing profile if already created
- ✅ Assess competency signals
- ✅ Update competency level
- ✅ Reject if profile not found
- ✅ Identify skill gaps
- ✅ Issue certification on journey completion
- ✅ Publish CertificationIssuedEvent
- ✅ Reject if journey not completed
- ✅ Don't re-issue if already certified
- ✅ Retrieve certification
- ✅ Get public certificate by token
- ✅ Reject invalid token
- ✅ Create badge definition
- ✅ Reject if badge name missing
- ✅ Award badge to user
- ✅ Publish BadgeEarnedEvent
- ✅ Reject if badge not found
- ✅ Reject if user already has badge
- ✅ Get user badges
- ✅ Generate comprehensive competency report
- ✅ Calculate interview readiness percentage
- ✅ Revoke certification
- ✅ Get all badges

## Performance Characteristics

- **Fast**: All tests complete in < 100ms each
- **Isolated**: No database calls, all dependencies mocked
- **Deterministic**: No random data, predictable outcomes
- **Parallel-safe**: No shared state between tests

## Debugging Tests

### Run single test
```bash
npm test -- --testNamePattern="should submit response"
```

### Debug with Node inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### See all mocked calls
```javascript
console.log(mockRepository.saveResponse.mock.calls);
console.log(mockRepository.saveResponse.mock.results);
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run tests
  run: npm test -- --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Future Test Expansion

- [ ] Integration tests with in-memory SQLite
- [ ] API endpoint tests with supertest
- [ ] E2E tests with real database
- [ ] Performance/load tests
- [ ] Security tests (injection, auth bypass)

## Notes

- Tests use **mocked repositories** to isolate service logic
- **Event publishing** is verified for audit trail testing
- **Error cases** are tested (validation, not found, etc)
- **Edge cases** are covered (duplicate entries, empty values, etc)
- All tests follow **AAA pattern** (Arrange, Act, Assert)

## Contributing

When adding new service methods:

1. Create corresponding test file if not exists
2. Add test for happy path
3. Add tests for error cases
4. Verify event publishing
5. Check coverage: `npm test -- --coverage`
6. Ensure all tests pass before committing

---

**Test Count**: 45+ test suites covering 100+ assertions
**Coverage Goal**: >80% for services and repositories
**Last Updated**: December 2024
