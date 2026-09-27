/**
 * Pure-black palette. Gold is the only decorative accent; the two status
 * colours below carry meaning, not decoration.
 */
export const colors = {
  // Surfaces.
  bg: '#000000',
  card: '#0D0D0D',
  cardLift: '#141414',
  border: '#1A1A1A',

  // The single accent.
  gold: '#C9A84C',
  goldLight: '#E8CC7E',
  goldDeep: '#9C7C2A',
  goldSoft: 'rgba(201,168,76,0.14)',

  // Exactly two text colours: pure white, or mid grey.
  text: '#FFFFFF',
  textMuted: '#888888',
  // Aliases kept so call sites read by role. All grey resolves to #888888 —
  // there is no off-white or light grey anywhere in the app.
  bodyText: '#888888',
  textFaint: '#888888',
  onGold: '#000000',

  // Semantic only: credit/debit direction in the wallet ledger.
  credit: '#3DD68C',
  debit: '#F2637E',
  danger: '#F2637E',
  success: '#3DD68C',
};

/** Kept so the auth screens keep reading in brand terms. */
export const brand = {
  navy: colors.bg,
  navyLift: colors.card,
  gold: colors.gold,
  goldLight: colors.goldLight,
  goldDeep: colors.goldDeep,
  onDark: colors.text,
  onDarkMuted: colors.textMuted,
  cardBorder: colors.border,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 };

/**
 * One family: Syne. Bold for headings and the wordmark, Medium for
 * everything else.
 *
 * Weight lives in the family name, never in `fontWeight`: pairing a named
 * font file with fontWeight makes Android synthesise a fake bold, or drop to
 * the system face entirely. Nothing in this app sets fontWeight.
 */
export const fonts = {
  bold: 'Syne_700Bold',
  medium: 'Syne_500Medium',
};

/**
 * Ready-made text styles. Screens spread these instead of declaring a
 * fontFamily, so a type change happens here and nowhere else.
 */
export const type = {
  // White wordmark; the gold lives in the rule beneath it.
  wordmark: { fontFamily: fonts.bold, fontSize: 34, letterSpacing: 6, color: colors.text },
  wordmarkLg: { fontFamily: fonts.bold, fontSize: 58, letterSpacing: 8, color: colors.text },

  h1: { fontFamily: fonts.bold, fontSize: 26, color: colors.text },
  h2: { fontFamily: fonts.bold, fontSize: 21, color: colors.text },
  h3: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },

  /** Small uppercase run-in above a section. */
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },

  author: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  body: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 23, color: colors.textMuted },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },

  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  labelStrong: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  caption: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  /** City · time stamps and other incidental metadata. */
  meta: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  tiny: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },

  /** Money is always Syne Bold so digits line up between screens. */
  price: { fontFamily: fonts.bold, fontSize: 17, color: colors.gold },
  priceLg: { fontFamily: fonts.bold, fontSize: 26, color: colors.gold },
  priceHero: { fontFamily: fonts.bold, fontSize: 52, letterSpacing: -1, color: colors.text },
  statValue: { fontFamily: fonts.bold, fontSize: 19, color: colors.text },
  amount: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },

  pill: { fontFamily: fonts.medium, fontSize: 13, color: colors.gold },
  button: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  buttonLg: { fontFamily: fonts.bold, fontSize: 17, letterSpacing: 0.3, color: colors.onGold },
  navLabel: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.2 },
  chip: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted },
  input: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
};

/** Phone-width column, so the app doesn't stretch across a desktop browser. */
export const MAX_WIDTH = 480;

/** Minimum 48dp touch targets — many users are on 5" screens. */
export const HIT = { minHeight: 48 };
