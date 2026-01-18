import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import StorySlotDashboard from '../StorySlotDashboard';
import * as api from '../../../api';

// Mock the api module
vi.mock('../../../api');

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(() => ({ journeyId: '1' })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

describe('StorySlotDashboard Component', () => {
  const mockJourney = {
    id: 1,
    title: 'IC Software Engineer Interview Prep',
    description: 'Master behavioral interviews for software engineering roles'
  };

  const mockSlotProgress = [
    {
      id: 1,
      slot_key: 'big-impact',
      title: 'Big, Hard Project / Largest Impact',
      description: 'Your most impactful technical contribution',
      signals: ['ownership', 'execution', 'craft', 'product_sense'],
      estimated_minutes: 45,
      isComplete: false,
      userStory: null
    },
    {
      id: 2,
      slot_key: 'ambiguity',
      title: 'Ambiguous / Underspecified Work',
      description: 'A time when requirements were unclear',
      signals: ['ambiguity', 'ownership', 'product_sense'],
      estimated_minutes: 45,
      isComplete: true,
      userStory: { id: 1, story_title: 'Built microservices architecture' }
    }
  ];

  const mockSignalCoverage = {
    ownership: { covered: true, count: 2, avg_strength: 2.5 },
    execution: { covered: true, count: 1, avg_strength: 3 },
    ambiguity: { covered: true, count: 1, avg_strength: 2 },
    craft: { covered: false, count: 0 },
    product_sense: { covered: true, count: 1, avg_strength: 2.5 }
  };

  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('should render loading state initially', () => {
    api.getJourney.mockImplementation(() => new Promise(() => {}));
    api.getJourneyStoryProgress.mockImplementation(() => new Promise(() => {}));
    api.getJourneySignalCoverage.mockImplementation(() => new Promise(() => {}));

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/Loading story slots/i)).toBeInTheDocument();
  });

  test('should fetch and display journey details', async () => {
    api.getJourney.mockResolvedValue({ data: mockJourney });
    api.getJourneyStoryProgress.mockResolvedValue({ data: mockSlotProgress });
    api.getJourneySignalCoverage.mockResolvedValue({ data: mockSignalCoverage });

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(mockJourney.title)).toBeInTheDocument();
      expect(screen.getByText(mockJourney.description)).toBeInTheDocument();
    });
  });

  test('should display all story slots', async () => {
    api.getJourney.mockResolvedValue({ data: mockJourney });
    api.getJourneyStoryProgress.mockResolvedValue({ data: mockSlotProgress });
    api.getJourneySignalCoverage.mockResolvedValue({ data: mockSignalCoverage });

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Big, Hard Project/i)).toBeInTheDocument();
      expect(screen.getByText(/Ambiguous/i)).toBeInTheDocument();
    });
  });

  test('should show completion status for each slot', async () => {
    api.getJourney.mockResolvedValue({ data: mockJourney });
    api.getJourneyStoryProgress.mockResolvedValue({ data: mockSlotProgress });
    api.getJourneySignalCoverage.mockResolvedValue({ data: mockSignalCoverage });

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const completedBadge = screen.getByText('Completed');
      expect(completedBadge).toBeInTheDocument();
    });
  });

  test('should display signal coverage summary', async () => {
    api.getJourney.mockResolvedValue({ data: mockJourney });
    api.getJourneyStoryProgress.mockResolvedValue({ data: mockSlotProgress });
    api.getJourneySignalCoverage.mockResolvedValue({ data: mockSignalCoverage });

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const coverageText = screen.getByText(/signals covered/i);
      expect(coverageText).toBeInTheDocument();
    });
  });

  test('should display estimated time for each slot', async () => {
    api.getJourney.mockResolvedValue({ data: mockJourney });
    api.getJourneyStoryProgress.mockResolvedValue({ data: mockSlotProgress });
    api.getJourneySignalCoverage.mockResolvedValue({ data: mockSignalCoverage });

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/45 minutes/i).length).toBeGreaterThan(0);
    });
  });

  test('should display signals for each slot', async () => {
    api.getJourney.mockResolvedValue({ data: mockJourney });
    api.getJourneyStoryProgress.mockResolvedValue({ data: mockSlotProgress });
    api.getJourneySignalCoverage.mockResolvedValue({ data: mockSignalCoverage });

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Signals are displayed as comma-separated in the card
      const signalTexts = screen.getAllByText(/Signals:/i);
      expect(signalTexts.length).toBeGreaterThan(0);
    });
  });

  test('should handle API errors gracefully', async () => {
    api.getJourney.mockRejectedValue(new Error('API Error'));
    api.getJourneyStoryProgress.mockRejectedValue(new Error('API Error'));
    api.getJourneySignalCoverage.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Journey not found/i)).toBeInTheDocument();
    });
  });

  test('should show Start or Continue button based on completion', async () => {
    api.getJourney.mockResolvedValue({ data: mockJourney });
    api.getJourneyStoryProgress.mockResolvedValue({ data: mockSlotProgress });
    api.getJourneySignalCoverage.mockResolvedValue({ data: mockSignalCoverage });

    render(
      <BrowserRouter>
        <StorySlotDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });
  });
});
