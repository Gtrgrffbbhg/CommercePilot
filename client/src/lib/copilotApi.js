// Copilot chat API helper
// Posts a message to the rule-based business copilot and returns a grounded, cited answer.

import { apiClient } from './apiClient.js';

export function postCopilotChat(message, signal) {
  return apiClient('/api/copilot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
    signal,
  });
}
