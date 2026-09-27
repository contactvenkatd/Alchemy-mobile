import { create } from 'zustand';
import { MOCK_STORIES } from '../data/mockStories.js';

/**
 * Stories live here rather than in FeedScreen state so the viewer can mark
 * one seen without a callback being passed through navigation params —
 * functions in params make the navigation state non-serializable.
 *
 * Swap MOCK_STORIES for a fetch when there is a stories API.
 */
export const useStoryStore = create((set) => ({
  stories: MOCK_STORIES,

  markSeen: (storyId) => set((state) => {
    const target = state.stories.find((s) => s.id === storyId);
    if (!target || target.seen) return state; // no-op keeps the reference stable
    return { stories: state.stories.map((s) => (s.id === storyId ? { ...s, seen: true } : s)) };
  }),
}));
