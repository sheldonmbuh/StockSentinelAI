"""Display the archived StockSentinelAI run in the terminal."""

import argparse
import json
from datetime import date
from pathlib import Path


def usd_from_cents(cents):
    dollars, remainder = divmod(abs(cents), 100)
    sign = "-" if cents < 0 else ""
    return f"{sign}${dollars:,}.{remainder:02d}"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ticker", nargs="?", help="Ticker to replay (GOOG)")
    args = parser.parse_args()

    fixture = Path(__file__).resolve().parent / "demo" / "recorded-run.json"
    try:
        run = json.loads(fixture.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        parser.exit(1, f"Could not read the recorded run: {error}\n")

    ticker = run["ticker"]
    if args.ticker is not None and args.ticker.strip().upper() != ticker:
        parser.error(f"the archive contains only {ticker}")

    model = "ARIMA(" + ",".join(map(str, run["arimaOrder"])) + ")"
    gap = run["forecastCents"] - run["priceCents"]
    run_date = date.fromisoformat(run["date"])
    date_label = f"{run_date:%B} {run_date.day}, {run_date.year}"
    rows = [
        ("Recorded price", usd_from_cents(run["priceCents"])),
        (f"{model} estimate", usd_from_cents(run["forecastCents"])),
        ("Estimate minus price", usd_from_cents(gap)),
        ("Revenue growth", f'{run["revenueGrowth"]:.0%}'),
        ("Gross margin", f'{run["grossMargin"]:.3%}'),
        ("Operating cash flow", f'${run["operatingCashFlow"]:,}'),
        ("Beta", f'{run["beta"]:.3f}'),
    ]

    print(f"{ticker} | {run['company']} | {date_label}")
    print(f"Archived output in {run['currency']}")
    for label, value in rows:
        print(f"{label:<23} {value}")
    print("Forecast horizon was not recorded.")


if __name__ == "__main__":
    main()
