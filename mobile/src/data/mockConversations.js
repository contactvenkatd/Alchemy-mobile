/**
 * DMs have no backend yet — same stand-in approach as `mockStories`.
 * `messages` are ordered oldest first; the chat screen renders them inverted.
 */
export const MOCK_CONVERSATIONS = [
  {
    id: 'c1',
    peer: { name: 'Sunita Devi', city: 'Gorakhpur' },
    unread: 2,
    messages: [
      { id: 'm1', text: 'Namaste! Saree ka stock hai kya?', mine: false, at: minsAgo(180) },
      { id: 'm2', text: 'Haan ji, 24 pieces available hain.', mine: true, at: minsAgo(174) },
      { id: 'm3', text: 'Delivery Jhansi tak kitne din?', mine: false, at: minsAgo(40) },
      { id: 'm4', text: '3-4 din lag jayenge.', mine: true, at: minsAgo(38) },
      { id: 'm5', text: 'Theek hai, order kar deti hoon 🙏', mine: false, at: minsAgo(12) },
    ],
  },
  {
    id: 'c2',
    peer: { name: 'Ramesh Yadav', city: 'Jhansi' },
    unread: 0,
    messages: [
      { id: 'm1', text: 'Bhai referral link bhej do', mine: false, at: minsAgo(1500) },
      { id: 'm2', text: 'Bhej diya, wallet me 5% aayega har order pe.', mine: true, at: minsAgo(1480) },
      { id: 'm3', text: 'Mil gaya, thanks!', mine: false, at: minsAgo(1470) },
    ],
  },
  {
    id: 'c3',
    peer: { name: 'Pooja Sharma', city: 'Jhansi' },
    unread: 1,
    messages: [
      { id: 'm1', text: 'Pool me kitna return mila is mahine?', mine: false, at: minsAgo(2900) },
      { id: 'm2', text: 'Dairy collective se 2.1% aaya tha.', mine: true, at: minsAgo(2880) },
      { id: 'm3', text: 'Achha hai. Main bhi units badhati hoon.', mine: false, at: minsAgo(60) },
    ],
  },
  {
    id: 'c4',
    peer: { name: 'Imran Qureshi', city: 'Gorakhpur' },
    unread: 0,
    messages: [
      { id: 'm1', text: 'Mustard oil ka rate kya chal raha hai?', mine: false, at: minsAgo(4300) },
      { id: 'm2', text: '₹210 per litre, cold pressed.', mine: true, at: minsAgo(4280) },
    ],
  },
];

function minsAgo(m) {
  return new Date(Date.now() - m * 60 * 1000).toISOString();
}
