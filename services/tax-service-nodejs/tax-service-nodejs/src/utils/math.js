function round2(x){ return Math.round((Number(x) + Number.EPSILON) * 100) / 100; }
function toNumber(x){ const n = Number(x); if(Number.isNaN(n)) throw new Error('Invalid number'); return n; }
module.exports = { round2, toNumber };
