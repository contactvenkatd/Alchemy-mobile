/** All money is stored as integer paise. Never use floats for balances. */
export const rupees = (paise) => paise / 100;
export const paise = (rs) => Math.round(rs * 100);

/**
 * Split an amount by ratios without losing a paisa — the remainder from
 * rounding goes to the first key.
 */
export function splitAmount(total, ratios) {
  const keys = Object.keys(ratios);
  const parts = {};
  let allocated = 0;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      parts[key] = total - allocated;
    } else {
      parts[key] = Math.floor(total * ratios[key]);
      allocated += parts[key];
    }
  });
  return parts;
}
