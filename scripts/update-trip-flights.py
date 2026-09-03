import datetime as dt
import json
import math
import os
import sys
import time
from pathlib import Path

from skyscanner import SkyScanner
from skyscanner.types import CabinClass

OUT = Path("dublin-2026/flights-live.json")
DEPART = dt.datetime(2026, 10, 23, 0, 0)
RETURN = dt.datetime(2026, 10, 25, 0, 0)

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


def iso(v):
    if not v:
        return None
    if isinstance(v, str):
        try:
            return dt.datetime.fromisoformat(v.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            return None
    return None


def money(item):
    p = item.get("price") or {}
    for key in ("raw", "amount", "value"):
        try:
            return float(p[key])
        except Exception:
            pass
    try:
        return float(item.get("rawPrice"))
    except Exception:
        return None


def carrier_name(leg):
    carriers = leg.get("carriers") or {}
    marketing = carriers.get("marketing") or carriers.get("operating") or []
    if marketing:
        c = marketing[0]
        code = ((c.get("alternateId") or {}).get("code") or c.get("iata") or "").strip()
        name = (c.get("name") or code or "Compagnie").strip()
        return f"{name} ({code})" if code and code.lower() not in name.lower() else name
    segments = leg.get("segments") or []
    if segments:
        c = (segments[0].get("marketingCarrier") or segments[0].get("operatingCarrier") or {})
        code = ((c.get("alternateId") or {}).get("code") or c.get("iata") or "").strip()
        return (c.get("name") or code or "Compagnie").strip()
    return "Compagnie"


def airport_code(place):
    if isinstance(place, str):
        return place
    if not isinstance(place, dict):
        return "?"
    return (place.get("displayCode") or place.get("skyId") or place.get("iata") or place.get("id") or "?").split("-")[0]


def compact_leg(leg):
    dep = iso(leg.get("departure"))
    arr = iso(leg.get("arrival"))
    return {
        "from": airport_code(leg.get("origin")),
        "to": airport_code(leg.get("destination")),
        "departure": dep.isoformat(timespec="minutes") if dep else leg.get("departure"),
        "arrival": arr.isoformat(timespec="minutes") if arr else leg.get("arrival"),
        "stops": int(leg.get("stopCount") or max(0, len(leg.get("segments") or []) - 1)),
        "durationMinutes": leg.get("durationInMinutes"),
        "carrier": carrier_name(leg),
    }


def iter_items(payload):
    itineraries = payload.get("itineraries") or {}
    buckets = itineraries.get("buckets") or []
    seen = set()
    for bucket in buckets:
        for item in bucket.get("items") or []:
            ident = item.get("id") or json.dumps(item, sort_keys=True)[:200]
            if ident in seen:
                continue
            seen.add(ident)
            yield item


def simplify(item, cfg):
    legs = item.get("legs") or []
    if len(legs) < 2:
        return None
    out, back = compact_leg(legs[0]), compact_leg(legs[1])
    out_arr = iso(out.get("arrival"))
    back_dep = iso(back.get("departure"))
    price = money(item)
    if not out_arr or not back_dep or price is None:
        return None

    center_arrival = out_arr + dt.timedelta(minutes=cfg["transfer"] + 15)
    leave_center = back_dep - dt.timedelta(minutes=cfg["transfer"] + cfg["airport_buffer"])
    useful = max(0.0, (leave_center - center_arrival).total_seconds() / 3600)
    stops = out["stops"] + back["stops"]
    # Encourage useful time and direct flights, while keeping price meaningful.
    score = price + stops * 55 + max(0, 46 - useful) * 4
    return {
        "id": item.get("id"),
        "price": round(price, 2),
        "currency": "EUR",
        "outbound": out,
        "return": back,
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


def search_city(scanner, key, cfg):
    dest = scanner.get_airport_by_code(cfg["dest"])
    all_rows = []
    errors = []
    for origin_code in cfg["origins"]:
        try:
            origin = scanner.get_airport_by_code(origin_code)
            response = scanner.get_flight_prices(
                origin=origin,
                destination=dest,
                depart_date=DEPART,
                return_date=RETURN,
                cabinClass=CabinClass.ECONOMY,
                adults=1,
            )
            parsed = [simplify(item, cfg) for item in iter_items(response.json)]
            all_rows.extend([x for x in parsed if x])
            time.sleep(1.0)
        except Exception as exc:
            errors.append(f"{origin_code}: {type(exc).__name__}: {exc}")
    # De-duplicate equivalent itineraries/prices.
    dedup = {}
    for r in all_rows:
        k = (r["outbound"]["departure"], r["return"]["departure"], r["price"])
        dedup[k] = r
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
    scanner = SkyScanner(locale="fr-FR", currency="EUR", market="FR", retry_delay=2, max_retries=8)
    cities = {}
    ok = 0
    for key, cfg in CITIES.items():
        try:
            result = search_city(scanner, key, cfg)
            if result["options"]:
                cities[key] = result
                ok += 1
                print(f"{key}: {len(result['options'])} option(s), {result['offersSeen']} offres vues")
            else:
                raise RuntimeError("aucune offre exploitable")
        except Exception as exc:
            old = previous_cities.get(key)
            if old:
                old = dict(old)
                old["stale"] = True
                old["refreshError"] = f"{type(exc).__name__}: {exc}"
                cities[key] = old
            else:
                cities[key] = {"name": cfg["name"], "destination": cfg["dest"], "options": [], "stale": True, "refreshError": str(exc)}
            print(f"{key}: ECHEC {exc}", file=sys.stderr)

    payload = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "departDate": "2026-10-23",
        "returnDate": "2026-10-25",
        "source": "Skyscanner Android API non officielle via irrisolto/skyscanner",
        "sourceRevision": "cb0946b2f6107128ee7968ec4525e4f167dd4945",
        "successfulCities": ok,
        "cities": cities,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {OUT} ({ok}/{len(CITIES)} villes actualisées)")


if __name__ == "__main__":
    main()
