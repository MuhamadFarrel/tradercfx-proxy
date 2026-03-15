export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=30'); // cache 30 detik

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const results = {};

    // ── 1. CRYPTO: Binance ──
    try {
      const symbols = ['BTCUSDT', 'ETHUSDT'];
      const cryptoData = await Promise.all(
        symbols.map(s =>
          fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`)
            .then(r => r.json())
        )
      );
      if (cryptoData[0]?.price) results['BTC/USD'] = parseFloat(cryptoData[0].price);
      if (cryptoData[1]?.price) results['ETH/USD'] = parseFloat(cryptoData[1].price);
    } catch (e) {
      console.warn('Binance error:', e.message);
    }

    // ── 2. GOLD: Binance XAUUSDT ──
    try {
      const goldRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XAUUSDT');
      const goldData = await goldRes.json();
      if (goldData?.price) results['XAU/USD'] = parseFloat(parseFloat(goldData.price).toFixed(2));
    } catch (e) {
      // Gold tidak ada di Binance, skip
    }

    // ── 3. SILVER: Binance XAGUSDT ──
    try {
      const silverRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=XAGUSDT');
      const silverData = await silverRes.json();
      if (silverData?.price) results['XAG/USD'] = parseFloat(parseFloat(silverData.price).toFixed(2));
    } catch (e) {}

    // ── 4. FOREX: Open ER API ──
    try {
      const fxRes = await fetch('https://open.er-api.com/v6/latest/USD');
      const fx = await fxRes.json();
      const r = fx.rates;
      if (r) {
        if (r.EUR) results['EUR/USD'] = parseFloat((1/r.EUR).toFixed(5));
        if (r.GBP) results['GBP/USD'] = parseFloat((1/r.GBP).toFixed(5));
        if (r.JPY) results['USD/JPY'] = parseFloat(r.JPY.toFixed(3));
        if (r.AUD) results['AUD/USD'] = parseFloat((1/r.AUD).toFixed(5));
        if (r.CAD) results['USD/CAD'] = parseFloat(r.CAD.toFixed(5));
        if (r.NZD) results['NZD/USD'] = parseFloat((1/r.NZD).toFixed(5));
        if (r.CHF) results['USD/CHF'] = parseFloat(r.CHF.toFixed(5));
        if (r.EUR && r.GBP) results['EUR/GBP'] = parseFloat((r.GBP/r.EUR).toFixed(5));
        if (r.EUR && r.JPY) results['EUR/JPY'] = parseFloat((r.JPY/r.EUR).toFixed(3));
        if (r.GBP && r.JPY) results['GBP/JPY'] = parseFloat((r.JPY/r.GBP).toFixed(3));
        if (r.AUD && r.JPY) results['AUD/JPY'] = parseFloat((r.JPY/r.AUD).toFixed(3));
      }
    } catch (e) {
      console.warn('ER API error:', e.message);
      // Fallback frankfurter
      try {
        const f2 = await fetch('https://api.frankfurter.app/latest?base=USD&symbols=EUR,GBP,JPY,AUD,CAD,NZD,CHF');
        const fx2 = await f2.json();
        const rt = fx2.rates;
        if (rt.EUR) results['EUR/USD'] = parseFloat((1/rt.EUR).toFixed(5));
        if (rt.GBP) results['GBP/USD'] = parseFloat((1/rt.GBP).toFixed(5));
        if (rt.JPY) results['USD/JPY'] = parseFloat(rt.JPY.toFixed(3));
        if (rt.AUD) results['AUD/USD'] = parseFloat((1/rt.AUD).toFixed(5));
        if (rt.CAD) results['USD/CAD'] = parseFloat(rt.CAD.toFixed(5));
        if (rt.NZD) results['NZD/USD'] = parseFloat((1/rt.NZD).toFixed(5));
        if (rt.CHF) results['USD/CHF'] = parseFloat(rt.CHF.toFixed(5));
      } catch (e2) {
        console.warn('Frankfurter error:', e2.message);
      }
    }

    return res.status(200).json({
      success: true,
      prices: results,
      timestamp: Date.now()
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
    }
