const { round2, toNumber } = require('../utils/math');

function computeLine({ amount, rate, taxInclusive }){
  const amt = toNumber(amount);
  const r = toNumber(rate);
  if (r < 0) throw new Error('rate must be >= 0');

  if (taxInclusive){
    const net = round2(amt / (1 + r));
    const tax = round2(amt - net);
    const gross = round2(net + tax);
    return { net, tax, gross };
  } else {
    const tax = round2(amt * r);
    const gross = round2(amt + tax);
    return { net: round2(amt), tax, gross };
  }
}

function computeDocument(lines, roundingMode='line'){
  const out = [];
  let sumNet=0, sumTax=0, sumGross=0;
  for(const ln of lines){
    const res = computeLine(ln);
    out.push({ ...ln, ...res });
    sumNet += res.net; sumTax += res.tax; sumGross += res.gross;
  }
  if (roundingMode === 'document'){
    sumNet = round2(sumNet); sumTax = round2(sumTax); sumGross = round2(sumGross);
  }
  return { lines: out, totals: { net: round2(sumNet), tax: round2(sumTax), gross: round2(sumGross) } };
}

module.exports = { computeLine, computeDocument };
