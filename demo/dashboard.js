"use strict";

const tickerInput = document.querySelector("#ticker");
const analyzeButton = document.querySelector("#analyze");
const feedback = document.querySelector("#ticker-feedback");
const results = document.querySelector("#results");
const loadError = document.querySelector("#load-error");

function setFeedback(message, invalid = false) {
  feedback.textContent = message;
  feedback.classList.toggle("error", invalid);
  tickerInput.setAttribute("aria-invalid", String(invalid));
}

function drawComparison(price, forecast, formatCents) {
  const axisStart = Math.floor(Math.min(price, forecast) / 100) * 100;
  const axisEnd = Math.max(axisStart + 100, Math.ceil(Math.max(price, forecast) / 100) * 100);
  const axisWidth = axisEnd - axisStart;
  const position = (cents) => `${((cents - axisStart) / axisWidth) * 100}%`;
  document.querySelector("#price-marker").style.left = position(price);
  document.querySelector("#forecast-marker").style.left = position(forecast);

  const ticks = [];
  for (let tick = 0; tick <= 4; tick += 1) {
    const value = axisStart + (tick * axisWidth) / 4;
    const label = document.createElement("span");
    label.style.left = position(value);
    label.textContent = formatCents(value);
    ticks.push(label);
  }
  document.querySelector("#axis-ticks").replaceChildren(...ticks);
}

function renderRun(run) {
  const { priceCents, forecastCents, currency } = run;
  const moneyOptions = { style: "currency", currency };
  const money = new Intl.NumberFormat("en-US", moneyOptions);
  const cashFlow = new Intl.NumberFormat("en-US", { ...moneyOptions, maximumFractionDigits: 0 });
  const margin = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 3 });
  const beta = new Intl.NumberFormat("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const formatCents = (cents) => money.format(cents / 100);
  const fields = {
    ticker: run.ticker,
    company: run.company,
    currency,
    price: formatCents(priceCents),
    forecast: formatCents(forecastCents),
    delta: formatCents(forecastCents - priceCents),
    model: `ARIMA(${run.arimaOrder.join(",")})`,
    "revenue-growth": margin.format(run.revenueGrowth),
    "gross-margin": margin.format(run.grossMargin),
    "cash-flow": cashFlow.format(run.operatingCashFlow),
    beta: beta.format(run.beta),
  };

  for (const element of document.querySelectorAll("[data-field]")) {
    element.textContent = fields[element.dataset.field];
  }

  const date = document.querySelector("#run-date");
  date.dateTime = run.date;
  date.textContent = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${run.date}T00:00:00Z`));
  drawComparison(priceCents, forecastCents, formatCents);
  results.hidden = false;
}

async function initialize() {
  try {
    const response = await fetch("recorded-run.json");
    if (!response.ok) {
      throw new Error(`Archive request failed (${response.status})`);
    }

    const run = await response.json();
    tickerInput.value = run.ticker;
    setFeedback(`The archive contains ${run.ticker}.`);
    renderRun(run);

    document.querySelector("#ticker-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const ticker = tickerInput.value.trim().toUpperCase();
      if (ticker !== run.ticker) {
        setFeedback(`Enter ${run.ticker} to replay the available run.`, true);
        return;
      }
      tickerInput.value = ticker;
      setFeedback(`Showing the recorded ${ticker} run.`);
      renderRun(run);
    });
    analyzeButton.disabled = false;
  } catch (error) {
    console.error(error);
    loadError.textContent = "The archived run could not load. Serve the repository over HTTP or open the GitHub case study.";
    loadError.hidden = false;
  }
}

initialize();
