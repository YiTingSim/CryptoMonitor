const API_URL = 'https://api.coingecko.com/api/v3';
const API_KEY = 'CG-hHSu97amg2kZX18yqWC4mRpT';
const API_OPTIONS = {
  method: 'GET'
};

function loadPortfolio() {
  let saved = localStorage.getItem('cryptoPortfolio');
  if (!saved) return {};
  try {
    let data = JSON.parse(saved);
    for (let id in data) {
      if (data[id].holdings !== undefined && data[id].amount === undefined) {
        data[id].amount = Number(data[id].holdings) || 0;
      }
      if (data[id].avgPrice !== undefined && data[id].buyPrice === undefined) {
        data[id].buyPrice = Number(data[id].avgPrice) || 0;
      }
    }
    return data;
  } catch (error) {
    console.log(error);
    return {};
  }
}

function savePortfolio() {
  localStorage.setItem('cryptoPortfolio', JSON.stringify(portfolio));
}

function loadDrawings() {
  let saved = localStorage.getItem('cryptoChartDrawings');
  if (saved) {
    try { return JSON.parse(saved); } 
    catch (error) { console.log(error); }
  }
  return [];
}

function saveDrawings() {
  localStorage.setItem('cryptoChartDrawings', JSON.stringify(drawings));
}

let coins = [];
let coinMap = {};
let portfolio = loadPortfolio();
let drawings = loadDrawings();
let priceChart = null;
let currentCoinId = 'bitcoin';
let currentCoinName = 'Bitcoin';
let currentCoinMarket = null;
let currentDays = 30;
let currentTool = 'pointer';
let lineStart = null;
let chartLabels = {};

function $(id) {
  return document.getElementById(id);
}

function cleanText(text) {
  return String(text || '').replace(/[<>&"']/g, function (letter) {
    return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#039;' }[letter];
  });
}

function formatMoney(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return Number(value).toFixed(2) + '%';
}

function formatLarge(value) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  if (value >= 1000000000000) return '$' + (value / 1000000000000).toFixed(2) + 'T';
  if (value >= 1000000000) return '$' + (value / 1000000000).toFixed(2) + 'B';
  if (value >= 1000000) return '$' + (value / 1000000).toFixed(2) + 'M';
  return formatMoney(value);
}

function showMessage(id, text) {
  $(id).textContent = text;
}

function showTab(tabName) {
  document.querySelectorAll('.page').forEach(function (page) {
    page.classList.remove('active');
  });
  document.querySelectorAll('.tabButton').forEach(function (button) {
    button.classList.remove('active');
    if (button.dataset.tab === tabName) {
      button.classList.add('active');
    }
  });
  $(tabName).classList.add('active');
  if (tabName === 'portfolio') {
    showPortfolio();
  }
}