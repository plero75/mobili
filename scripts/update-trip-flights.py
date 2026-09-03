import datetime as dt
import json
import sys
import time
from pathlib import Path

from fast_flights import FlightQuery, Passengers, create_query, get_flights

OUT = Path("dublin-2026/flights-live.json")
DEPART = "2026-10-23"
RETURN = "2026-10-25"

CITIES = {
    "dublin": {"name": "Dublin", "dest": "DUB", "origins": ["ORY", "CDG", "BVA"], "transfer": 35, "airport_buffer": 120},
    "liverpool": {"name": "Liverpool", "dest": "LPL", "origins": ["CDG"], "transfer": 40, "airport_buffer": 120},
    "krakow": {"name": "Cracovie", "dest": "KRK", "origins": ["CDG", "BVA", "ORY"], "transfer": 30, "airport_buffer": 120},
    "valencia": {"name": "Valence", "dest": "VLC", "origins": ["ORY", "CDG"], "transfer": 35, "airport_buffer": 120},
    "belgrade": {"name": "Belgrade", "dest": "BEG", "origins": ["CDG"], "transfer": 40, "airport_buffer": 120},
    "sarajevo": {"name": "Sarajevo", "dest": "SJJ", "origins": ["ORY", "BVA", "CDG"], "transfer": 30, "airport_buffer": 120},
}


def load_previous():
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        return {"cities": {}}


def to_dt(simple):
    y, m, d = simple.date
    hh, mm = simple.time
    return dt.datetime(y, m, d, hh, mm)


def compact_segment(seg):
    return {
        "from": seg.from_airport.code,
        "to": seg.to_airport.code,
        "departure": to_dt(seg.departure).isoformat(timespec="minutes"),
        "arrival": to_dt(seg.arrival).isoformat(timespec="minutes"),
        "durationMinutes": int(seg.duration),
        "planeType": seg.plane_type or "",
    }


def split_roundtrip(item, origin, dest):
    segments = list(item.flights)
    if not segments:
        return None

    cut = None
    for i, seg in enumerate(segments):
        if seg.to_airport.code == dest:
            cut = i + 1
            break
    if not cut or cut >= len(segments):
        return None

    outbound = segments[:cut]
    inbound = segments[cut:]
    if inbound[0].from_airport.code != dest:
        return None

    out_dep = to_dt(outbound[0].departure)
    out_arr = to_dt(outbound[-1].arrival)
    back_dep = to_dt(inbound[0].departure)
    back_arr = to_dt(inbound[-1].arrival)

    return outbound, inbound, out_dep, out_arr, back_dep, back_arr


def leg_summary(segments, airlines):
    first, last = segments[0], segments[-1]
    return {
        "from": first.from_airport.code,
        "to": last.to_airport.code,
        "departure": to_dt(first.departure).isoformat(timespec="minutes"),
        "arrival": to_dt(last.arrival).isoformat(timespec="minutes"),
        "stops": max(0, len(segments) - 1),
        "durationMinutes": int(sum(s.duration for s in segments)),
        "carrier": ", ".join(airlines) if airlines else "Compagnie",
        "segments": [compact_segment(s) for s in segments],
    }


def simplify(item, cfg, origin):
    parts = split_roundtrip(item, origin, cfg["dest"])
    if not parts:
        return None
    outbound, inbound, out_dep, out_arr, back_dep, back_arr = parts
    center_arrival = out_arr + dt.timedelta(minutes=cfg["transfer"] + 15)
    leave_center = back_dep - dt.timedelta(minutes=cfg["transfer"] + cfg["airport_buffer"])
    useful = max(0.0, (leave_center - center_arrival).total_seconds() / 3600)
    stops = max(0, len(outbound) - 1) + max(0, len(inbound) - 1)
    price = float(item.price)
    score = price + stops * 55 + max(0, 46 - useful) * 4
    ident = f"{origin}-{cfg['dest']}-{out_dep.isoformat()}-{back_dep.isoformat()}-{int(price)}"
    return {
        "id": ident,
        "price": round(price, 2),
        "currency": "EUR",
        "outbound": leg_summary(outbound, item.airlines),
        "return": leg_summary(inbound, item.airlines),
        "centerArrival": center_arrival.isoformat(timespec="minutes"),
        "leaveCenter": leave_center.isoformat(timespec="minutes"),
        "usefulHours": round(useful, 1),
        "totalStops": stops,
        "score": round(score, 2),
    }


def unique_options(rows):
    if not rows:
        return []
    cheapest = min(rows, key=lambda x: x["price"])
    max_weekend = max(rows, key=lambda x: x["usefulHours"])
    recommended = min(rows, key=lambda x: x["score"])
    selected = []
    for label, row in (("recommended", recommended), ("cheapest", cheapest), ("max_weekend", max_weekend)):
        if not any(x["id"] == row["id"] for x in selected):
            x = dict(row)
            x["kind"] = label
            selected.append(x)
    return selected


def search_origin(origin, cfg):
    q = create_query(
        flights=[
            FlightQuery(date=DEPART, from_airport=origin, to_airport=cfg["dest"]),
            FlightQuery(date=RETURN, from_airport=cfg["dest"], to_airport=origin),
        ],
        seat="economy",
        trip="round-trip",
        passengers=Passengers(adults=1),
        language="fr",
        currency="EUR",
    )
    results = get_flights(q)
    rows = []
    for item in results:
        try:
            row = simplify(item, cfg, origin)
            if row:
                rows.append(row)
        except Exception:
            continue
    return rows


def search_city(cfg):
    all_rows = []
    errors = []
    for origin in cfg["origins"]:
        try:
            rows = search_origin(origin, cfg)
            all_rows.extend(rows)
            time.sleep(0.8)
        except Exception as exc:
            errors.append(f"{origin}: {type(exc).__name__}: {exc}")
    dedup = {}
    for row in all_rows:
        key = (row["outbound"]["departure"], row["return"]["departure"], row["price"])
        dedup[key] = row
    rows = list(dedup.values())
    return {
        "name": cfg["name"],
        "destination": cfg["dest"],
        "searchedOrigins": cfg["origins"],
        "options": unique_options(rows),
        "offersSeen": len(rows),
        "errors": errors[-3:],
        "stale": False,
    }


def main():
    previous = load_previous()
    previous_cities = previous.get("cities") or {}
    cities = {}
    ok = 0

    for key, cfg in CITIES.items():
        try:
            result = search_city(cfg)
            if not result["options"]:
                raise RuntimeError("aucune offre exploitable")
            cities[key] = result
            ok += 1
            print(f"{key}: {len(result['options'])} option(s), {result['offersSeen']} offres vues")
        except Exception as exc:
            old = previous_cities.get(key)
            if old and old.get("options"):
                old = dict(old)
                old["stale"] = True
                old["refreshError"] = f"{type(exc).__name__}: {exc}"
                cities[key] = old
            else:
                cities[key] = {
                    "name": cfg["name"],
                    "destination": cfg["dest"],
                    "options": [],
                    "stale": True,
                    "refreshError": f"{type(exc).__name__}: {exc}",
                }
            print(f"{key}: ECHEC {exc}", file=sys.stderr)

    payload = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "departDate": DEPART,
        "returnDate": RETURN,
        "source": "Google Flights via fast-flights (scraper non officiel, sans clé API)",
        "successfulCities": ok,
        "cities": cities,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {OUT} ({ok}/{len(CITIES)} villes actualisées)")


if __name__ == "__main__":
    main()
