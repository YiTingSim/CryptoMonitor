async function getData(url) {
  const separator = url.includes('?') ? '&' : '?';
  const urlWithAuth = `${url}${separator}x_cg_demo_api_key=${API_KEY}`;
  let response = await fetch(urlWithAuth, API_OPTIONS);
  if (!response.ok) {
    throw new Error('API request failed: ' + response.status);
  }
  return response.json();
}

async function loadCoinMap() {
  let list = await getData(API_URL + '/coins/list');
  list.forEach(function (coin) {
    coinMap[coin.id.toLowerCase()] = coin.id;
    coinMap[coin.symbol.toLowerCase()] = coin.id;
    coinMap[coin.name.toLowerCase()] = coin.id;
  });
}

function findCoin(searchText) {
  let text = searchText.toLowerCase().trim();
  if (!text) return null;
  if (coinMap[text]) return coinMap[text];

  let marketCoin = coins.find(function (coin) {
    return coin.id === text || coin.symbol.toLowerCase() === text || coin.name.toLowerCase() === text;
  });
  if (marketCoin) return marketCoin.id;

  for (let name in coinMap) {
    if (name.includes(text)) return coinMap[name];
  }
  return null;
}

async function loadGlobalStats() {
  try {
    let result = await getData(API_URL + '/global');
    let data = result.data;
    $('marketCap').textContent = formatLarge(data.total_market_cap.usd);
    $('marketVolume').textContent = formatLarge(data.total_volume.usd);
    $('btcDominance').textContent = data.market_cap_percentage.btc.toFixed(1) + '%';
  } catch (error) {
    $('marketCap').textContent = '-';
    $('marketVolume').textContent = '-';
    $('btcDominance').textContent = '-';
    console.log(error);
  }
}

async function loadMarket() {
  $('marketMessage').textContent = 'Loading market data...';
  try {
    let url = API_URL + '/coins/markets?vs_currency=usd&symbols=btc&category=layer-1&price_change_percentage=24h&include_tokens=top';
    coins = await getData(url);
    showMarketTable();
    $('marketMessage').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
  } catch (error) {
    $('coinList').innerHTML = '<tr><td colspan="6">Could not load market data. Please try again later.</td></tr>';
    $('marketMessage').textContent = 'Market data is not available right now.';
    console.log(error);
  }
}

function showMarketTable() {
  let table = $('coinList');
  table.innerHTML = '';
  if (coins.length === 0) {
    table.innerHTML = '<tr><td colspan="6">No coin data found.</td></tr>';
    return;
  }
  coins.forEach(function (coin, index) {
    let oneDay = coin.price_change_percentage_24h_in_currency || coin.price_change_percentage_24h || 0;
    let row = table.insertRow();
    row.className = 'coinRow';
    row.innerHTML = `
      <td>${index + 1}</td>
      <td class="left coinName">
        <img src="${coin.image}" alt="${cleanText(coin.name)}">
        <span>${cleanText(coin.name)}<small>${cleanText(coin.symbol.toUpperCase())}</small></span>
      </td>
      <td>${formatMoney(coin.current_price)}</td>
      <td class="${oneDay >= 0 ? 'good' : 'bad'}">${formatPercent(oneDay)}</td>
      <td>${formatLarge(coin.market_cap)}</td>
      <td><button class="smallBtn">${portfolio[coin.id] ? 'Remove' : 'Add'}</button></td>
    `;
    row.onclick = function () {
      loadChart(coin.id, coin.name, true);
    };
    row.querySelector('button').onclick = function (event) {
      event.stopPropagation();
      togglePortfolio(coin);
    };
  });
}

async function searchCoin() {
  let text = $('coinInput').value.trim();
  if (!text) {
    showMessage('marketMessage', 'Please enter a coin name or symbol.');
    alert('Please enter a coin name or symbol.');
    return;
  }
  try {
    let id = findCoin(text);
    if (!id) {
      let searchResult = await getData(API_URL + '/search?query=' + encodeURIComponent(text));
      if (searchResult.coins && searchResult.coins.length > 0) id = searchResult.coins[0].id;
    }
    if (!id) {
      alert('Coin not found. Try existing coin name or symbols from the coin list.');
      return;
    }
    let result = await getData(API_URL + '/coins/markets?vs_currency=usd&ids=' + id);
    if (result.length === 0) {
      alert('Coin data was not found.');
      return;
    }
    loadChart(id, result[0].name, true);
  } catch (error) {
    alert('Search failed. Please check your internet connection or try again later.');
    console.log(error);
  }
}