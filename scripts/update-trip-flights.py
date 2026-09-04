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
    "barcelona": {"name": "Barcelone", "dest": "BCN", "origins": ["ORY", "CDG", "BVA"], "transfer": 30, "airport_buffer": 120},
    "bucharest": {"name": "Bucarest", "dest": "OTP", "origins": ["CDG", "ORY", "BVA"], "transfer": 40, "airport_buffer": 120},
    "vilnius": {"name": "Vilnius", "dest": "VNO", "origins": ["CDG", "ORY", "BVA"], "transfer": 25, "airport_buffer": 120},
    "lisbon": {"name": "Lisbonne", "dest": "LIS", "origins": ["ORY", "CDG"], "transfer": 25, "airport_buffer": 120},
    "porto": {"name": "Porto", "dest": "OPO", "origins": ["ORY", "CDG", "BVA"], "transfer": 35, "airport_buffer": 120},
    "mallorca": {"name": "Majorque", "dest": "PMI", "origins": ["ORY", "CDG", "BVA"], "transfer": 20, "airport_buffer": 120},
    "tallinn": {"name": "Tallinn", "dest": "TLL", "origins": ["CDG", "ORY", "BVA"], "transfer": 20, "airport_buffer": 120},
    "riga": {"name": "Riga", "dest": "RIX", "origins": ["CDG", "ORY", "BVA"], "transfer": 25, "airport_buffer": 120},
    "split": {"name": "Split", "dest": "SPU", "origins": ["CDG", "ORY"], "transfer": 35, "airport_buffer": 120},
    "liverpool": {"name": "Liverpool", "dest": "LPL", "origins": ["CDG"], "transfer": 40, "airport_buffer": 120},
    "krakow": {"name": "Cracovie", "dest": "KRK", "origins": ["CDG", "BVA", "ORY"], "transfer": 30, "airport_buffer": 120},
    "bologna": {"name": "Bologne", "dest": "BLQ", "origins": ["ORY", "CDG", "BVA"], "transfer": 25, "airport_buffer": 120},
    "tirana": {"name": "Tirana", "dest": "TIA", "origins": ["ORY", "CDG", "BVA"], "transfer": 35, "airport_buffer": 120},
    "prague": {"name": "Prague", "dest": "PRG", "origins": ["CDG", "ORY", "BVA"], "transfer": 35, "airport_buffer": 120},
    "vienna": {"name": "Vienne", "dest": "VIE", "origins": ["CDG", "ORY"], "transfer": 35, "airport_buffer": 120},
    "valencia": {"name": "Valence", "dest": "VLC", "origins": ["ORY", "CDG"], "transfer": 35, "airport_buffer": 120},
    "belgrade": {"name": "Belgrade", "dest": "BEG", "origins": ["CDG"], "transfer": 40, "airport_buffer": 120},
    "sarajevo": {"name": "Sarajevo", "dest": "SJJ", "origins": ["ORY", "BVA", "CDG"], "transfer": 30, "airport_buffer": 120},
}

# Pool plus large pour repérer les vrais bons plans du week-end. Uniquement vols directs.
# local_cost = milieu de la fourchette 2 nuits + repas + bars + local + activités.
DEAL_POOL = {
    "budapest": {"name":"Budapest","dest":"BUD","origins":["CDG","ORY","BVA"],"transfer":35,"airport_buffer":120,"local_cost":225,"local_cost_min":185,"local_cost_max":265,"vibe":"♨️ bains + ruin bars + Danube"},
    "naples": {"name":"Naples","dest":"NAP","origins":["ORY","CDG"],"transfer":30,"airport_buffer":120,"local_cost":260,"local_cost_min":215,"local_cost_max":305,"vibe":"🍕 chaos, pizza, mer, énergie"},
    "malaga": {"name":"Málaga","dest":"AGP","origins":["ORY","CDG","BVA"],"transfer":25,"airport_buffer":120,"local_cost":260,"local_cost_min":215,"local_cost_max":305,"vibe":"☀️ terrasse + tapas + mer"},
    "alicante": {"name":"Alicante","dest":"ALC","origins":["ORY","BVA"],"transfer":25,"airport_buffer":120,"local_cost":245,"local_cost_min":205,"local_cost_max":285,"vibe":"🌴 simple, solaire, pas ruineux"},
    "seville": {"name":"Séville","dest":"SVQ","origins":["ORY","CDG"],"transfer":25,"airport_buffer":120,"local_cost":270,"local_cost_min":225,"local_cost_max":315,"vibe":"💃 tapas, chaleur, très beau centre"},
    "munich": {"name":"Munich","dest":"MUC","origins":["CDG","ORY"],"transfer":45,"airport_buffer":120,"local_cost":360,"local_cost_min":300,"local_cost_max":420,"vibe":"🍺 brasseries + musées + centre bavarois"},
    "milan": {"name":"Milan","dest":"MXP","origins":["CDG","ORY","BVA"],"transfer":55,"airport_buffer":120,"local_cost":360,"local_cost_min":300,"local_cost_max":420,"vibe":"🍸 design + aperitivo + grands quartiers"},
    "bilbao": {"name":"Bilbao","dest":"BIO","origins":["CDG","ORY"],"transfer":30,"airport_buffer":120,"local_cost":295,"local_cost_min":250,"local_cost_max":340,"vibe":"🍢 pintxos + architecture + centre compact"},
}


def load_previous():
    try:
        return json.loads(OUT.read_text(encoding="utf-8"))
    except Exception:
        return {"cities": {}, "dealScout": {}}


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
    # DIRECT ONLY : pas d'escale, pas de self-transfer, pas de trajet absurde.
    if len(segments) != 1:
        return None
    seg = segments[0]
    if seg.from_airport.code != origin or seg.to_airport.code != dest:
        return None
    dep = to_dt(seg.departure)
    arr = to_dt(seg.arrival)
    return {
        "price": float(item.price),
        "from": origin,
        "to": dest,
        "departureDt": dep,
        "arrivalDt": arr,
        "stops": 0,
        "durationMinutes": int(seg.duration),
        "carrier": ", ".join(item.airlines) if item.airlines else "Compagnie",
        "segments": [compact_segment(seg)],
    }


def fetch_one_way(origin, dest, date):
    q = create_query(
        flights=[FlightQuery(date=date, from_airport=origin, to_airport=dest, max_stops=0)],
        seat="economy",
        trip="one-way",
        passengers=Passengers(adults=1),
        language="fr",
        currency="EUR",
        max_stops=0,
        hide_separate_and_self_transfer=True,
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
    cheapest = sorted(rows, key=lambda x: (x["price"], x["durationMinutes"]))[:8]
    if direction == "out":
        time_best = sorted(rows, key=lambda x: (x["arrivalDt"], x["price"]))[:6]
    else:
        time_best = sorted(rows, key=lambda x: (-x["departureDt"].timestamp(), x["price"]))[:6]
    chosen, seen = [], set()
    for r in cheapest + time_best:
        key = (r["departureDt"], r["arrivalDt"], r["price"], r["carrier"])
        if key not in seen:
            seen.add(key)
            chosen.append(r)
    return chosen[:12]


def leg_summary(row):
    return {
        "from": row["from"], "to": row["to"],
        "departure": row["departureDt"].isoformat(timespec="minutes"),
        "arrival": row["arrivalDt"].isoformat(timespec="minutes"),
        "stops": 0, "durationMinutes": row["durationMinutes"],
        "carrier": row["carrier"], "segments": row["segments"],
    }


def combine(outbound, inbound, cfg):
    center_arrival = outbound["arrivalDt"] + dt.timedelta(minutes=cfg["transfer"] + 15)
    leave_center = inbound["departureDt"] - dt.timedelta(minutes=cfg["transfer"] + cfg["airport_buffer"])
    useful = max(0.0, (leave_center - center_arrival).total_seconds() / 3600)
    price = outbound["price"] + inbound["price"]
    early_leave_penalty = max(0, 8 * 60 - (leave_center.hour * 60 + leave_center.minute)) * 0.8
    late_friday_penalty = max(0, (center_arrival.hour * 60 + center_arrival.minute) - 22 * 60) * 0.35
    score = price + max(0, 46 - useful) * 4 + early_leave_penalty + late_friday_penalty
    ident = f"{outbound['from']}-{cfg['dest']}-{outbound['departureDt'].isoformat()}-{inbound['departureDt'].isoformat()}-{round(price,2)}"
    return {
        "id": ident,
        "price": round(price, 2),
        "currency": "EUR",
        "pricingMode": "two_direct_one_ways",
        "priceNote": "Total des deux vols directs observés au dernier refresh.",
        "outbound": leg_summary(outbound), "return": leg_summary(inbound),
        "centerArrival": center_arrival.isoformat(timespec="minutes"),
        "leaveCenter": leave_center.isoformat(timespec="minutes"),
        "usefulHours": round(useful, 1), "totalStops": 0,
        "score": round(score, 2), "earlyReturn": leave_center.hour < 8,
    }


def unique_options(rows):
    if not rows:
        return []
    cheapest = min(rows, key=lambda x: x["price"])
    max_weekend = max(rows, key=lambda x: (x["usefulHours"], -x["price"]))
    humane = []
    for row in rows:
        leave = dt.datetime.fromisoformat(row["leaveCenter"])
        arrive = dt.datetime.fromisoformat(row["centerArrival"])
        if (leave.hour, leave.minute) >= (8, 0) and (arrive.hour, arrive.minute) <= (22, 30):
            humane.append(row)
    recommended = min(humane or rows, key=lambda x: x["score"])
    selected = []
    for label, row in (("recommended", recommended), ("cheapest", cheapest), ("max_weekend", max_weekend)):
        if not any(x["id"] == row["id"] for x in selected):
            x = dict(row); x["kind"] = label; selected.append(x)
    return selected


def search_origin(origin, cfg):
    outbound = shortlist(fetch_one_way(origin, cfg["dest"], DEPART), "out")
    time.sleep(0.25)
    inbound = shortlist(fetch_one_way(cfg["dest"], origin, RETURN), "back")
    rows = []
    for out in outbound:
        for back in inbound:
            row = combine(out, back, cfg)
            if row["usefulHours"] > 0:
                rows.append(row)
    return rows, len(outbound), len(inbound)


def search_city(cfg):
    all_rows, errors, searched = [], [], []
    for origin in cfg["origins"]:
        try:
            rows, out_count, back_count = search_origin(origin, cfg)
            all_rows.extend(rows)
            searched.append({"origin": origin, "outboundCandidates": out_count, "returnCandidates": back_count})
            time.sleep(0.35)
        except Exception as exc:
            errors.append(f"{origin}: {type(exc).__name__}: {exc}")
    dedup = {}
    for row in all_rows:
        dedup[(row["outbound"]["departure"], row["return"]["departure"], row["price"])] = row
    rows = list(dedup.values())
    return {
        "name": cfg["name"], "destination": cfg["dest"], "searchedOrigins": cfg["origins"],
        "searchDetails": searched, "pricingMode": "two_direct_one_ways",
        "options": unique_options(rows), "combinationsSeen": len(rows),
        "errors": errors[-3:], "stale": False,
    }


def deal_candidate(key, cfg):
    result = search_city(cfg)
    options = result.get("options") or []
    if not options:
        return None
    rec = next((x for x in options if x.get("kind") == "recommended"), options[0])
    leave = dt.datetime.fromisoformat(rec["leaveCenter"])
    arrive = dt.datetime.fromisoformat(rec["centerArrival"])
    if leave.hour < 8 or arrive.hour >= 23:
        return None
    total_weekend = rec["price"] + cfg["local_cost"]
    # Un bon deal n'est pas juste un billet pas cher : on récompense aussi le temps réellement disponible.
    value_score = total_weekend + max(0, 48 - rec["usefulHours"]) * 4
    return {
        "id": key, "name": cfg["name"], "vibe": cfg["vibe"],
        "flightPrice": rec["price"], "estimatedWeekend": round(total_weekend),
        "localCostEstimate": cfg["local_cost"], "usefulHours": rec["usefulHours"],
        "onSiteBudget": {"min": cfg["local_cost_min"], "max": cfg["local_cost_max"]},
        "outbound": rec["outbound"], "return": rec["return"],
        "centerArrival": rec["centerArrival"], "leaveCenter": rec["leaveCenter"],
        "valueScore": round(value_score, 1), "currency":"EUR"
    }


def build_deal_scout(previous):
    candidates, errors = [], []
    for key, cfg in DEAL_POOL.items():
        try:
            c = deal_candidate(key, cfg)
            if c:
                candidates.append(c)
                print(f"deal {key}: {c['flightPrice']} €, {c['usefulHours']} h utiles")
            else:
                print(f"deal {key}: aucun direct aller+retour exploitable")
        except Exception as exc:
            errors.append(f"{key}: {type(exc).__name__}: {exc}")
            print(f"deal {key}: ECHEC {exc}", file=sys.stderr)
    if not candidates:
        old = previous.get("dealScout") or {}
        if old.get("candidates"):
            old = dict(old); old["stale"] = True; old["errors"] = errors[-5:]
            return old
        return {"candidates":[],"stale":True,"errors":errors[-5:]}

    return {"candidates":candidates,"stale":False,"errors":errors[-5:]}


def main():
    previous = load_previous(); previous_cities = previous.get("cities") or {}
    cities, ok = {}, 0
    for key, cfg in CITIES.items():
        try:
            result = search_city(cfg)
            if not result["options"]:
                raise RuntimeError("aucun vol direct aller+retour exploitable")
            cities[key] = result; ok += 1
            print(f"{key}: {len(result['options'])} option(s) directes, {result['combinationsSeen']} combinaisons")
        except Exception as exc:
            old = previous_cities.get(key)
            # Ne jamais recycler un ancien snapshot contenant des escales.
            old_direct = old and old.get("options") and all((o.get("totalStops") == 0) for o in old.get("options", []))
            if old_direct:
                old = dict(old); old["stale"] = True; old["refreshError"] = f"{type(exc).__name__}: {exc}"; cities[key] = old
            else:
                cities[key] = {"name":cfg["name"],"destination":cfg["dest"],"options":[],"stale":True,"refreshError":f"{type(exc).__name__}: {exc}"}
            print(f"{key}: ECHEC {exc}", file=sys.stderr)

    deal_scout = build_deal_scout(previous)
    payload = {
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "departDate": DEPART, "returnDate": RETURN,
        "source": "Google Flights via fast-flights (scraper non officiel, sans clé API)",
        "pricingMode": "two_direct_one_ways", "directOnly": True,
        "priceDisclaimer": "Transport A/R = somme des deux trajets directs observés au dernier refresh ; tarif final à revérifier avant achat.",
        "successfulCities": ok, "cities": cities, "dealScout": deal_scout,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Écrit {OUT} ({ok}/{len(CITIES)} villes principales actualisées + deal scout)")


if __name__ == "__main__":
    main()
