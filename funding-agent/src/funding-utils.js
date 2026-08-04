const CHECK_BANDS = {
  "Under $250K": [0, 250_000],
  "$250K – $1M": [250_000, 1_000_000],
  "$1M – $5M": [1_000_000, 5_000_000],
  "$5M+": [5_000_000, Number.POSITIVE_INFINITY],
};

function parseMoney(value) {
  const match = value.match(/\$([\d.]+)([KMB])/i);
  if (!match) return null;
  const multipliers = { K: 1_000, M: 1_000_000, B: 1_000_000_000 };
  return Number(match[1]) * multipliers[match[2].toUpperCase()];
}

export function getPaginationItems(currentPage, pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  if (currentPage <= 3) return [1, 2, 3, "ellipsis-end", pageCount];
  if (currentPage >= pageCount - 2) return [1, "ellipsis-start", pageCount - 2, pageCount - 1, pageCount];
  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", pageCount];
}

export function matchesCheckFilter(check, filter) {
  if (filter === "Any check size") return true;
  if (filter === "Not listed") return check === "Not listed";
  if (check === "Not listed" || !CHECK_BANDS[filter]) return false;

  const amounts = [...check.matchAll(/\$[\d.]+[KMB]/gi)].map((match) => parseMoney(match[0])).filter((value) => value != null);
  if (!amounts.length) return false;

  const firmMin = amounts[0];
  const firmMax = check.includes("+") ? Number.POSITIVE_INFINITY : amounts.at(-1);
  const [filterMin, filterMax] = CHECK_BANDS[filter];
  return firmMin <= filterMax && firmMax >= filterMin;
}
