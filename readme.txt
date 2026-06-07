Project Title: Cryptocurrency Price Monitoring System (CryptoMonitor)

Description:
A web-based application that provides real-time monitoring of cryptocurrency prices, advanced interactive charting, historical data analysis, price trend prediction, and a comprehensive portfolio management module.

Features:
- Real-Time Market Data: Track top cryptocurrencies, view 24h changes, market cap, and volume.
- Interactive Charting: Visualize historical price data with pan/zoom features.
- Technical Indicators: Includes Simple Moving Averages (SMA 7, SMA 25), RSI, and MACD.
- Predictive Analytics: Provides a 7-day price prediction trend using linear regression based on historical data.
- Portfolio Manager: Add coins to your portfolio, track total cost, current value, and calculate profit/loss.
- Drawing Tools: Draw trend lines, support/resistance levels, and add custom notes directly on the charts.
- Local Storage: Automatically saves your portfolio and chart drawings directly in the browser.

Setup Instructions:
This is a purely client-side web application. No server-side installation or database setup is required.

1. Extract all the project files into a single directory. Ensure the following files are present together:
   - index.html
   - style.css
   - global.js
   - api.js
   - app.js
   - chart.js
   - math.js
   - portfolio.js

2. Prerequisites:
   - A modern web browser (Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari).
   - An active internet connection (Required to load external Chart.js libraries via CDN and to fetch live market data from the CoinGecko API).

3. How to Run:
   Option A (Direct Execution): 
   Simply double-click the `index.html` file to open it in your default web browser.
   
   Option B (Local Web Server - Recommended): 
   To avoid potential strict cross-origin browser policies when fetching data or accessing local storage, open the project folder in a code editor like VS Code and use an extension like "Live Server" to host the files locally (e.g., at http://127.0.0.1:5500).

Technologies Used:
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Chart.js, chartjs-plugin-zoom, chartjs-plugin-annotation (Loaded via CDN)
- CoinGecko API v3 (For live and historical cryptocurrency data)
