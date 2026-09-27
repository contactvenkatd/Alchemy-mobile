/**
 * Stories have no backend yet. This stands in for `GET /api/stories` so the
 * viewer and the rail can be built and reviewed; swap this module for a real
 * fetch and nothing downstream changes.
 */
export const MOCK_STORIES = [
  {
    id: 's1',
    author: { name: 'Sunita Devi', city: 'Gorakhpur' },
    seen: false,
    items: [
      { id: 's1a', image: 'https://picsum.photos/seed/story1a/900/1600', createdAt: hoursAgo(2) },
      { id: 's1b', image: 'https://picsum.photos/seed/story1b/900/1600', createdAt: hoursAgo(2) },
    ],
  },
  {
    id: 's2',
    author: { name: 'Ramesh Yadav', city: 'Jhansi' },
    seen: false,
    items: [
      { id: 's2a', image: 'https://picsum.photos/seed/story2a/900/1600', createdAt: hoursAgo(5) },
    ],
  },
  {
    id: 's3',
    author: { name: 'Pooja Sharma', city: 'Jhansi' },
    seen: true,
    items: [
      { id: 's3a', image: 'https://picsum.photos/seed/story3a/900/1600', createdAt: hoursAgo(9) },
      { id: 's3b', image: 'https://picsum.photos/seed/story3b/900/1600', createdAt: hoursAgo(9) },
      { id: 's3c', image: 'https://picsum.photos/seed/story3c/900/1600', createdAt: hoursAgo(10) },
    ],
  },
  {
    id: 's4',
    author: { name: 'Imran Qureshi', city: 'Gorakhpur' },
    seen: true,
    items: [
      { id: 's4a', image: 'https://picsum.photos/seed/story4a/900/1600', createdAt: hoursAgo(20) },
    ],
  },
];

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}
