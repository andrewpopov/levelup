/**
 * Domain Event Bus - Single-instance event dispatcher
 * Enables loose coupling between bounded contexts
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventHistory = [];
  }

  /**
   * Subscribe to an event type
   * @param {string} eventType - Type of event to listen for
   * @param {Function} handler - Async handler function
   */
  subscribe(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(handler);
  }

  /**
   * Publish a domain event
   * @param {DomainEvent} event - Event to publish
   */
  async publish(event) {
    // Store in history for audit/analytics
    this.eventHistory.push({
      ...event,
      publishedAt: new Date()
    });

    // Notify all listeners
    const handlers = this.listeners.get(event.type) || [];
    const promises = handlers.map(handler =>
      Promise.resolve(handler(event)).catch(err => {
        console.error(`Error in event handler for ${event.type}:`, err);
      })
    );

    await Promise.all(promises);
  }

  /**
   * Get event history (for audit/analytics)
   */
  getHistory(eventType = null, limit = 100) {
    let history = this.eventHistory;
    if (eventType) {
      history = history.filter(e => e.type === eventType);
    }
    return history.slice(-limit);
  }

  /**
   * Clear all listeners (useful for testing)
   */
  clearListeners() {
    this.listeners.clear();
  }

  /**
   * Clear event history (useful for testing)
   */
  clearHistory() {
    this.eventHistory = [];
  }
}

// Singleton instance
const eventBus = new EventBus();
export default eventBus;
