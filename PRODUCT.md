# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Visitors at Hippodrome Paris-Vincennes who are deciding how to leave and need a quick answer from a shared passenger-information display.

## Product Purpose

Mobili presents live mobility information from and around the hippodrome so visitors can choose a practical departure. Success means a visitor can identify useful, reachable transport options without interpreting raw transit feeds.

## Positioning

Mobili filters local live departures through the time needed to reach each stop, making the displayed options actionable from the hippodrome rather than merely listing nearby transport data.

## Operating Context

The primary surface is a 1920 x 910 passenger-information screen at Paris-Vincennes. It presents transport departures, disruption status, weather, news, Velib availability, and Vincennes race information using live external data sources.

## Capabilities and Constraints

- The product is French-language and uses Paris-Vincennes and local stop terminology.
- It covers RER A, local bus services, Velib availability, weather, traffic disruptions, news, and race information.
- Departure information must account for walking/access time so visitors see options they can realistically reach.
- External feeds can be unavailable, delayed, incomplete, or stale; the interface must preserve useful cached information and communicate degraded states.
- The wide 1920 x 910 display is the primary target and must remain readable at a distance.

## Evidence on Hand

- The active display entry point is `recette.html`.
- Live display/data behavior is implemented in `recette.js`, `recette-live.js`, and `mobility-data.js`.
- Current display styling is implemented in `recette.css`, `recette-ratp.css`, and `recette-display-fix.css`.
- The repository contains live integrations for PRIM/IDFM, weather, France Info RSS, PMU, and Velib data.
- No testimonials, customer studies, or other proof assets are present; future work must not invent them.

## Product Principles

- Show what a visitor can actually use now.
- Prioritize fast scanning over raw data completeness.
- Make live, stale, and unavailable states explicit.
- Preserve local context so transport information supports the visit rather than distracting from it.
- Keep information legible in a shared public display environment.

## Accessibility & Inclusion

The display must remain readable at a distance, maintain strong contrast, use clear hierarchy, and avoid relying on color alone to communicate transport or data status.