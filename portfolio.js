function updateAddButton() {
  if (!currentCoinMarket) {
    $('addCurrentBtn').disabled = true;
    return;
  }
  $('addCurrentBtn').disabled = false;
  $('addCurrentBtn').textContent = portfolio[currentCoinId] ? 'Remove Portfolio' : 'Add to Portfolio';
}

function toggleCurrentCoin() {
  if (currentCoinMarket) {
    togglePortfolio(currentCoinMarket);
    updateAddButton();
  }
}

function togglePortfolio(coin) {
  if (!coin || !coin.id) return;
  if (portfolio[coin.id]) {
    delete portfolio[coin.id];
  } else {
    portfolio[coin.id] = {
      name: coin.name,
      symbol: coin.symbol,
      amount: 0,
      buyPrice: coin.current_price || 0
    };
  }
  savePortfolio();
  showMarketTable();
  if ($('portfolio').classList.contains('active')) {
    showPortfolio();
  }
  updateAddButton();
}

async function showPortfolio() {
  let table = $('portfolioList');
  let ids = Object.keys(portfolio);
  let totalValue = 0;
  let totalCost = 0;
  table.innerHTML = '';

  if (ids.length === 0) {
    table.innerHTML = '<tr><td colspan="8">No coins added yet.</td></tr>';
    updatePortfolioSummary(0, 0);
    $('portfolioMessage').textContent = '';
    return;
  }

  $('portfolioMessage').textContent = 'Loading portfolio prices...';

  try {
    let market = await getData(API_URL + '/coins/markets?vs_currency=usd&ids=' + ids.join(','));
    ids.forEach(function (id) {
      let savedCoin = portfolio[id];
      let liveCoin = market.find(function (coin) { return coin.id === id; });
      if (!liveCoin) return;

      let amount = Number(savedCoin.amount) || Number(savedCoin.holdings) || 0;
      let buyPrice = Number(savedCoin.buyPrice) || Number(savedCoin.avgPrice) || liveCoin.current_price;

      portfolio[id].name = savedCoin.name || liveCoin.name;
      portfolio[id].symbol = savedCoin.symbol || liveCoin.symbol;
      portfolio[id].amount = amount;
      portfolio[id].buyPrice = buyPrice;

      let value = amount * liveCoin.current_price;
      let cost = amount * buyPrice;
      let profit = value - cost;
      let profitPercent = cost > 0 ? (profit / cost) * 100 : 0;
      
      totalValue += value;
      totalCost += cost;

      let row = table.insertRow();
      row.innerHTML = `
        <td class="left coinName">
          <img src="${liveCoin.image}" alt="${cleanText(liveCoin.name)}">
          <span>${cleanText(portfolio[id].name)}<small>${cleanText(portfolio[id].symbol.toUpperCase())}</small></span>
        </td>
        <td>${formatMoney(liveCoin.current_price)}</td>
        <td><input class="portfolioInput amount-input" type="number" min="0" step="0.01" value="${amount}"></td>
        <td><input class="portfolioInput price-input" type="number" min="0" step="0.01" value="${buyPrice}"></td>
        <td>${formatMoney(value)}</td>
        <td class="${profit >= 0 ? 'good' : 'bad'}">${formatPercent(profitPercent)}</td>
        <td class="${profit >= 0 ? 'good' : 'bad'}">${formatMoney(profit)}</td>
        <td><button class="clearBtn">Delete</button></td>
      `;

      row.querySelector('.amount-input').onchange = function (event) {
        let newAmount = Number(event.target.value);
        portfolio[id].amount = newAmount > 0 ? newAmount : 0;
        savePortfolio();
        showPortfolio();
      };
      row.querySelector('.price-input').onchange = function (event) {
        let newPrice = Number(event.target.value);
        portfolio[id].buyPrice = newPrice > 0 ? newPrice : liveCoin.current_price;
        savePortfolio();
        showPortfolio();
      };
      row.querySelector('.clearBtn').onclick = function () {
        delete portfolio[id];
        savePortfolio();
        showPortfolio();
        showMarketTable();
        updateAddButton();
      };
    });

    savePortfolio();
    updatePortfolioSummary(totalValue, totalCost);
    $('portfolioMessage').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
  } catch (error) {
    table.innerHTML = '<tr><td colspan="8">Could not load portfolio prices.</td></tr>';
    $('portfolioMessage').textContent = 'Portfolio prices are not available right now.';
    console.log(error);
  }
}

function updatePortfolioSummary(totalValue, totalCost) {
  let profit = totalValue - totalCost;
  $('portfolioTotal').textContent = formatMoney(totalValue);
  $('portfolioCost').textContent = formatMoney(totalCost);
  $('portfolioProfit').textContent = formatMoney(profit);
  $('portfolioProfit').className = profit >= 0 ? 'good' : 'bad';
}