// utils/nextArrival.js
function formatNextArrival(now = new Date(), headwayMin = 3) {
  if (typeof headwayMin !== "number" || headwayMin <= 0) return null;

  const next = new Date(now.getTime() + headwayMin * 60 * 1000);

  const pad = (n) => String(n).padStart(2, "0");

  return `${pad(next.getHours())}:${pad(next.getMinutes())}`;
}

module.exports = { formatNextArrival };
