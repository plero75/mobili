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


def one_way_row(item, origin, dest):
    segments = list(item.flights)
    if not segments:
        return None
    if segments[0].from_airport.code != origin or segments[-1].to_airport.code != dest:
        return None
    dep = to_dt(segments[0].departure)
    arr = to_dt(segments[-1].arrival)
    return {
        "price": float(item.price),
        "from": origin,
        "to": dest,
        "departureDt": dep,
        "arrivalDt": arr,
        "stops": max(0, len(segments) - 1),
        "durationMinutes": int((arr - dep).total_seconds() // 60),
        "carrier": ", ".join(item.airlines) if item.airlines else "Compagnie",
        "segments": [compact_segment(s) for s in segments],
    }


def fetch_one_way(origin, dest, date):
    q = create_query(
        flights=[FlightQuery(date=date, from_airport=origin, to_airport=dest)],
        seat="economy",
        trip="one-way",
        passengers=Passengers(adults=1),
        language="fr",
        currency="EUR",
    )
    results = get_flights(q)
    rows = []
    for item in results:
        try:
            row = one_way_row(item, origin, dest)
            if row:
                rows.append(row)
        except Exception:
            continue
    return rows


def shortlist(rows, direction):
    if not rows:
        return []
    dedup = {}
    for r in rows:
        key = (r["departureDt"], r["arrivalDt"], round(r["price"], 2), r["carrier"])
        dedup[key] = r
    rows = list(dedup.values())
    cheapest = sorted(rows, key=lambda x: (x["price"], x["stops"], x["durationMinutes"]))[:8]
    if direction == "out":
        time_best = sorted(rows, key=lambda x: (x["arrivalDt"], x["price"]))[:6]
    else:
        time_best = sorted(rows, key=lambda x: (-x["departureDt"].timestamp(), x["price"]))[:6]
    chosen = []
    seen = set()
    for r in cheapest + time_best:
        key = (r["departureDt"], r["arrivalDt"], r["price"], r["carrier"])
        if key not in seen:
            seen.add(key)
            chosen.append(r)
    return chosen[:12]


def leg_summary(row):
    return {
        "from": row["from"],
        "to": row["to"],
        "departure": row["departureDt"].isoformat(timespec="minutes"),
        "arrival": row["arrivalDt"].isoformat(timespec="minutes"),
        "stops": row["stops"],
        "durationMinutes": row["durationMinutes"],
        "carrier": row["carrier"],
        "segments": row["segments"],
    }


def combine(outbound, inbound, cfg):
    center_arrival = outbound["arrivalDt"] + dt.timedelta(minutes=cfg["transfer"] + 15)
    leave_center = inbound["departureDt"] - dt.timedelta(minutes=cfg["transfer"] + cfg["airport_buffer"])
    useful = max(0.0, (leave_center - center_arrival).total_seconds() / 3600)
    price = outbound["price"] + inbound["price"]
    stops = outbound["stops"] + inbound["stops"]
    score = price + stops * 55 + max(0, 46 - useful) * 4
    ident = f"{outbound['from']}-{cfg['dest']}-{outbound['departureDt'].isoformat()}-{inbound['departureDt'].isoformat()}-{round(price,2)}"
    return {
        "id": ident,
        "price": round(price, 2),
        "currency": "EUR",
        "pricingMode": "sum_of_one_ways",
        "priceNote": "Somme de 2 allers simples Google Flights ; vérifier le tarif final A/R avant achat.",
        "outbound": leg_summary(outbound),
        "return": leg_summary(inbound),
        "centerArrival": center_arrival.isoformat(timespec="minutes"),
        "leaveCenter": leave_center.isoformat(timespec="minutes"),
        "usefulHours": round(useful, 1),
        "totalStops": stops,
        "score": round(score, 2),
    }


def unique_options(rows):
    if not rows:
        return []
    cheapest = min(rows, key=lambda x: (x["price"], x["totalStops"]))
    max_weekend = max(rows, key=lambda x: (x["usefulHours"], -x["price"]))
    recommended = min(rows, key=lambda x: x["score"])
    selected = []
    for label, row in (("recommended", recommended), ("cheapest", cheapest), ("max_weekend", max_weekend)):
        if not any(x["id"] == row["id"] for x in selected):
            x = dict(row)
            x["kind"] = label
            selected.append(x)
    return selected


def search_origin(origin, cfg):
    outbound = shortlist(fetch_one_way(origin, cfg["dest"], DEPART), "out")
    time.sleep(0.4)
    inbound = shortlist(fetch_one_way(cfg["dest"], origin, RETURN), "back")
    rows = []
    for out in outbound:
        for back in inbound:
            row = combine(out, back, cfg)
            if row["usefulHours"] > 0:
                rows.append(row)
    return rows, len(outbound), len(inbound)


def search_city(cfg):
    all_rows = []
    errors = []
    searched = []
    for origin in cfg["origins"]:
        try:
            rows, out_count, back_count = search_origin(origin, cfg)
            all_rows.extend(rows)
            searched.append({"origin": origin, "outboundCandidates": out_count, "returnCandidates": back_count})
            time.sleep(0.6)
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
        "searchDetails": searched,
        "pricingMode": "sum_of_one_ways",
        "options": unique_options(rows),
        "combinationsSeen": len(rows),
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
                detail = " ; ".join(result.get("errors") or []) or "aucune combinaison retour exploitable"
                raise RuntimeError(detail)
            cities[key] = result
            ok += 1
            print(f"{key}: {len(result['options'])} option(s), {result['combinationsSeen']} combinaisons")
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
        "pricingMode": "sum_of_one_ways",
        "priceDisclaimer": "Les montants affichés additionnent deux recherches aller simple. Ils servent de snapshot comparatif ; le tarif A/R final doit être vérifié via Google Flights/compagnie.",
        "successfulCities": ok,
        "cities": cities,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {OUT} ({ok}/{len(CITIES)} villes actualisées)")


if __name__ == "__main__":
    main()
