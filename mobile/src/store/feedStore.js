import { create } from 'zustand';
import { postApi } from '../api/endpoints.js';

export const useFeedStore = create((set, get) => ({
  posts: [],
  page: 1,
  hasMore: true,
  loading: false,
  refreshing: false,
  error: null,

  load: async ({ refresh = false } = {}) => {
    const { loading, hasMore, page } = get();
    if (loading || (!refresh && !hasMore)) return;

    const nextPage = refresh ? 1 : page;
    set(refresh ? { refreshing: true, error: null } : { loading: true, error: null });

    try {
      const res = await postApi.list(nextPage);
      set((state) => ({
        posts: refresh ? res.items : [...state.posts, ...res.items],
        page: nextPage + 1,
        hasMore: res.hasMore,
        loading: false,
        refreshing: false,
      }));
    } catch (err) {
      set({ loading: false, refreshing: false, error: err.message });
    }
  },

  /** Optimistic like — the row flips instantly, then reconciles with the server. */
  toggleLike: async (postId) => {
    const apply = (mutate) => set((state) => ({
      posts: state.posts.map((p) => (p._id === postId ? mutate(p) : p)),
    }));

    apply((p) => ({
      ...p,
      likedByMe: !p.likedByMe,
      likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
    }));

    try {
      const res = await postApi.like(postId);
      apply((p) => ({ ...p, likedByMe: res.liked, likeCount: res.likeCount }));
    } catch {
      apply((p) => ({
        ...p,
        likedByMe: !p.likedByMe,
        likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
      }));
    }
  },

  /**
   * Merge a comment posted elsewhere (the detail screen) into the feed row,
   * so counts do not drift between the two views.
   */
  applyComment: (postId, comment, commentCount) => set((state) => ({
    posts: state.posts.map((p) => (p._id === postId
      ? { ...p, comments: [...p.comments, comment], commentCount }
      : p)),
  })),

  addComment: async (postId, text) => {
    const res = await postApi.comment(postId, text);
    set((state) => ({
      posts: state.posts.map((p) => (p._id === postId
        ? { ...p, comments: [...p.comments, res.comment], commentCount: res.commentCount }
        : p)),
    }));
    return res;
  },

  share: async (postId) => {
    const res = await postApi.share(postId);
    set((state) => ({
      posts: state.posts.map((p) => (p._id === postId ? { ...p, shareCount: res.shareCount } : p)),
    }));
    return res;
  },

  prepend: (post) => set((state) => ({
    posts: [{ ...post, likeCount: 0, commentCount: 0, likedByMe: false }, ...state.posts],
  })),
}));
