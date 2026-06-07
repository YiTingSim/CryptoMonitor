async function loadChart(coinId, coinName, openTab) {
  currentCoinId = coinId;
  currentCoinName = coinName;
  currentDays = 30;
  
  if (openTab) showTab('chart');
  
  $('chartTitle').textContent = coinName + ' Chart';
  $('chartSubTitle').textContent = currentDays + ' day price history';
  $('chartMessage').textContent = 'Loading chart data...';

  try {
    let historyUrl = API_URL + '/coins/' + coinId + '/market_chart?vs_currency=usd&days=' + currentDays;
    let marketUrl = API_URL + '/coins/markets?vs_currency=usd&ids=' + coinId;
    let history = await getData(historyUrl);
    let market = await getData(marketUrl);
    let prices = history.prices || [];
    let volumes = history.total_volumes || [];

    if (prices.length === 0) {
      $('chartMessage').textContent = 'No historical data found for this coin.';
      return;
    }

    currentCoinMarket = market[0] || null;
    showChartInfo(currentCoinMarket);
    buildChart(prices, volumes, coinName);
    $('chartMessage').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
    updateAddButton();
  } catch (error) {
    $('chartMessage').textContent = 'Chart data could not be loaded.';
    console.log(error);
  }
}

function showChartInfo(coin) {
  if (!coin) return;
  let change = coin.price_change_percentage_24h || 0;
  $('chartPrice').textContent = formatMoney(coin.current_price);
  $('chartChange').textContent = formatPercent(change);
  $('chartChange').className = change >= 0 ? 'good' : 'bad';
  $('chartVolume').textContent = formatLarge(coin.total_volume);
}

function buildChart(priceData, volumeData, coinName) {
  if (typeof Chart === 'undefined') {
    $('chartMessage').textContent = 'Chart library could not be loaded.';
    return;
  }

  let prices = priceData.map(item => item[1]);
  let dailyPrices = getDailyPrices(priceData);
  let prediction = makePrediction(dailyPrices, 7);

  chartLabels = {};

  let pricePoints = priceData.map(function (item, index) {
    chartLabels[index] = makeDateLabel(item[0]);
    return { x: index, y: item[1] };
  });

  let volumePoints = volumeData.map(function (item, index) {
    return { x: index, y: item[1] };
  });

  let ma7Points = makeMovingAveragePoints(prices, 7);
  let ma25Points = makeMovingAveragePoints(prices, 25);
  let predictionPoints = [];
  let step = Math.max(1, Math.round(priceData.length / Math.max(dailyPrices.length, 1)));
  let lastX = priceData.length - 1;

  if (prediction) {
    prediction.predicted.forEach(function (value, index) {
      let x = lastX + step * (index + 1);
      chartLabels[x] = 'Day +' + (index + 1);
      predictionPoints.push({ x: x, y: value });
    });
  }

  showIndicators(dailyPrices, prediction);

  if (priceChart) {
    priceChart.destroy();
  }

  priceChart = new Chart($('priceChart'), {
    data: {
      datasets: [
        { type: 'bar', label: 'Volume', data: volumePoints, yAxisID: 'yVolume', backgroundColor: 'cadetblue', borderWidth: 0 },
        { type: 'line', label: coinName + ' Price', data: pricePoints, yAxisID: 'yPrice', borderColor: 'royalblue', backgroundColor: 'lightblue', borderWidth: 2, pointRadius: 0, tension: 0.25, fill: true },
        { type: 'line', label: 'MA 7', data: ma7Points, yAxisID: 'yPrice', borderColor: 'orange', borderWidth: 1.5, pointRadius: 0, borderDash: [6, 4] },
        { type: 'line', label: 'MA 25', data: ma25Points, yAxisID: 'yPrice', borderColor: 'forestgreen', borderWidth: 1.5, pointRadius: 0, borderDash: [6, 4] },
        { type: 'line', label: 'Prediction', data: predictionPoints, yAxisID: 'yPrice', borderColor: 'darkviolet', borderWidth: 2, pointRadius: 2, borderDash: [4, 4] }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      onClick: chartClicked,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            title: items => getChartLabel(items[0].parsed.x),
            label: function (item) {
              if (item.dataset.yAxisID === 'yVolume') return item.dataset.label + ': ' + formatLarge(item.parsed.y);
              return item.dataset.label + ': ' + formatMoney(item.parsed.y);
            }
          }
        },
        zoom: {
          pan: { enabled: true, mode: 'x' },
          zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' }
        },
        annotation: { annotations: getChartAnnotations() }
      },
      scales: {
        x: { type: 'linear', ticks: { maxTicksLimit: 8, callback: value => getChartLabel(value) } },
        yPrice: { position: 'left', ticks: { callback: value => '$' + Number(value).toLocaleString() } },
        yVolume: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: value => formatLarge(value).replace('$', '') } }
      }
    }
  });
}

function showIndicators(values, prediction) {
  let ma7 = getAverage(values, 7);
  let ma25 = getAverage(values, 25);
  let rsi = getRSI(values, 14);
  let macd = getMACD(values);

  $('ma7Value').textContent = ma7 ? formatMoney(ma7) : '-';
  $('ma25Value').textContent = ma25 ? formatMoney(ma25) : '-';
  $('rsiValue').textContent = rsi ? rsi.toFixed(1) : '-';
  $('macdValue').textContent = macd ? macd.macd.toFixed(4) : '-';

  if (prediction) {
    let lastPrediction = prediction.predicted[prediction.predicted.length - 1];
    $('predictionPrice').textContent = formatMoney(lastPrediction);
    $('trendText').textContent = prediction.slope >= 0 ? 'Up trend' : 'Down trend';
    $('trendText').className = prediction.slope >= 0 ? 'good' : 'bad';
  } else {
    $('predictionPrice').textContent = '-';
    $('trendText').textContent = '-';
    $('trendText').className = 'neutral';
  }
}

function getChartLabel(value) {
  let index = Math.round(Number(value));
  return chartLabels[index] ? chartLabels[index] : '';
}

function makeDateLabel(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function setTool(toolName) {
  currentTool = toolName;
  lineStart = null;
  document.querySelectorAll('.toolButton').forEach(function (button) {
    button.classList.remove('active');
    if (button.dataset.tool === toolName) button.classList.add('active');
  });

  if (toolName === 'pointer') $('toolStatus').textContent = 'Ready';
  else if (toolName === 'trend') $('toolStatus').textContent = 'Click first point on the chart.';
  else if (toolName === 'support') $('toolStatus').textContent = 'Click a support or resistance level.';
  else if (toolName === 'note') $('toolStatus').textContent = 'Click a point to add a note.';
}

function chartClicked(event) {
  if (!priceChart || currentTool === 'pointer') return;

  let area = priceChart.chartArea;
  if (event.x < area.left || event.x > area.right || event.y < area.top || event.y > area.bottom) return;

  let x = Math.round(priceChart.scales.x.getValueForPixel(event.x));
  let y = priceChart.scales.yPrice.getValueForPixel(event.y);

  if (!isFinite(x) || !isFinite(y)) return;

  if (currentTool === 'trend') {
    if (!lineStart) {
      lineStart = { x: x, y: y };
      $('toolStatus').textContent = 'Click second point on the chart.';
      return;
    }
    drawings.push({ id: Date.now(), coin: currentCoinId, type: 'trend', x1: lineStart.x, y1: lineStart.y, x2: x, y2: y, text: 'Trend' });
    lineStart = null;
    saveDrawings();
    refreshAnnotations();
    $('toolStatus').textContent = 'Trend line added.';
  }

  if (currentTool === 'support') {
    drawings.push({ id: Date.now(), coin: currentCoinId, type: 'support', x1: x, y1: y, text: 'Level ' + formatMoney(y) });
    saveDrawings();
    refreshAnnotations();
    $('toolStatus').textContent = 'Support / resistance line added.';
  }

  if (currentTool === 'note') {
    let text = prompt('Enter note:');
    if (text && text.trim()) {
      drawings.push({ id: Date.now(), coin: currentCoinId, type: 'note', x1: x, y1: y, text: text.trim().slice(0, 50) });
      saveDrawings();
      refreshAnnotations();
      $('toolStatus').textContent = 'Note added.';
    }
  }
}

function getChartAnnotations() {
  let annotations = {};
  let coinDrawings = drawings.filter(item => item.coin === currentCoinId);

  coinDrawings.forEach(function (item) {
    if (item.type === 'trend') {
      annotations['trend_' + item.id] = { type: 'line', xScaleID: 'x', yScaleID: 'yPrice', xMin: item.x1, xMax: item.x2, yMin: item.y1, yMax: item.y2, borderColor: 'orange', borderWidth: 2, label: { display: true, content: item.text } };
    }
    if (item.type === 'support') {
      annotations['support_' + item.id] = { type: 'line', yScaleID: 'yPrice', yMin: item.y1, yMax: item.y1, borderColor: 'limegreen', borderWidth: 2, borderDash: [6, 6], label: { display: true, content: item.text } };
    }
    if (item.type === 'note') {
      annotations['note_' + item.id] = { type: 'label', xScaleID: 'x', yScaleID: 'yPrice', xValue: item.x1, yValue: item.y1, content: [item.text], backgroundColor: 'royalblue', color: 'white', padding: 6 };
    }
  });
  return annotations;
}

function refreshAnnotations() {
  if (!priceChart) return;
  priceChart.options.plugins.annotation.annotations = getChartAnnotations();
  priceChart.update();
}

function clearDrawings() {
  if (!confirm('Clear all chart marks for this coin?')) return;
  drawings = drawings.filter(item => item.coin !== currentCoinId);
  saveDrawings();
  refreshAnnotations();
  $('toolStatus').textContent = 'Chart marks cleared.';
}

function zoomChart(amount) {
  if (priceChart && priceChart.zoom) priceChart.zoom(amount);
}

function resetChartZoom() {
  if (priceChart && priceChart.resetZoom) priceChart.resetZoom();
}