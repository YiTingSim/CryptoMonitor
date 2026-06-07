function makeMovingAveragePoints(values, period) {
  return values.map(function (value, index) {
    if (index + 1 < period) return { x: index, y: null };
    let total = 0;
    for (let i = index - period + 1; i <= index; i++) {
      total += values[i];
    }
    return { x: index, y: total / period };
  });
}

function getDailyPrices(priceData) {
  let daily = {};
  priceData.forEach(function (item) {
    let key = new Date(item[0]).toISOString().slice(0, 10);
    daily[key] = item[1];
  });
  return Object.values(daily);
}

function getAverage(values, period) {
  if (values.length < period) return null;
  let total = 0;
  for (let i = values.length - period; i < values.length; i++) {
    total += values[i];
  }
  return total / period;
}

function getRSI(values, period) {
  if (values.length <= period) return null;
  let gain = 0, loss = 0;
  for (let i = values.length - period; i < values.length; i++) {
    let change = values[i] - values[i - 1];
    if (change >= 0) gain += change;
    else loss += Math.abs(change);
  }
  let averageGain = gain / period;
  let averageLoss = loss / period;
  if (averageLoss === 0) return 100;
  let rs = averageGain / averageLoss;
  return 100 - (100 / (1 + rs));
}

function getEMA(values, period) {
  if (values.length < period) return [];
  let ema = [];
  let multiplier = 2 / (period + 1);
  let firstAverage = getAverage(values.slice(0, period), period);
  ema[period - 1] = firstAverage;
  for (let i = period; i < values.length; i++) {
    ema[i] = ((values[i] - ema[i - 1]) * multiplier) + ema[i - 1];
  }
  return ema;
}

function getMACD(values) {
  if (values.length < 26) return null;
  let ema12 = getEMA(values, 12);
  let ema26 = getEMA(values, 26);
  let macdLine = [];
  for (let i = 0; i < values.length; i++) {
    if (ema12[i] !== undefined && ema26[i] !== undefined) {
      macdLine.push(ema12[i] - ema26[i]);
    }
  }
  let signal = macdLine.length >= 9 ? getEMA(macdLine, 9) : [];
  let lastMacd = macdLine[macdLine.length - 1];
  let lastSignal = signal[signal.length - 1] || 0;
  return { macd: lastMacd, signal: lastSignal, histogram: lastMacd - lastSignal };
}

function makePrediction(values, days) {
  if (values.length < 2) return null;
  let recent = values.slice(-30);
  let n = recent.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += recent[i];
    sumXY += i * recent[i]; sumXX += i * i;
  }
  let slope = ((n * sumXY) - (sumX * sumY)) / ((n * sumXX) - (sumX * sumX));
  let intercept = (sumY - (slope * sumX)) / n;
  let predicted = [];
  for (let day = 1; day <= days; day++) {
    predicted.push(intercept + slope * (n - 1 + day));
  }
  return { slope: slope, predicted: predicted };
}