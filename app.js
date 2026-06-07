async function refreshAll() {
  await loadGlobalStats();
  await loadMarket();

  if ($('portfolio').classList.contains('active')) {
    await showPortfolio();
  }
}

async function startApp() {
  // Event Listeners
  $('searchBtn').onclick = searchCoin;
  $('refreshMarketBtn').onclick = loadMarket;
  $('refreshChartBtn').onclick = function () { loadChart(currentCoinId, currentCoinName, true); };
  $('refreshPortfolioBtn').onclick = showPortfolio;
  $('addCurrentBtn').onclick = toggleCurrentCoin;
  $('coinInput').onkeydown = function (event) {
    if (event.key === 'Enter') { searchCoin(); }
  };

  try {
    await loadCoinMap();
  } catch (error) {
    console.log(error);
  }

  await loadGlobalStats();
  await loadMarket();
  await loadChart('bitcoin', 'Bitcoin', false);
  showTab('market');

  window.refreshTimer = setInterval(refreshAll, 60000);

  $('refreshMarketBtn').onclick = function() {
    clearInterval(window.refreshTimer);
    loadMarket();
    window.refreshTimer = setInterval(refreshAll, 60000);
  };
}

window.onload = startApp;
window.showTab = showTab;
window.setTool = setTool;
window.clearDrawings = clearDrawings;
window.zoomChart = zoomChart;
window.resetChartZoom = resetChartZoom;