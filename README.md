# In Season

What seafood, fruit and vegetables are in season where you are, right now. Built for a phone in a grocery store or a city you don't know. Use your location, or search a city, ZIP, state or food. Static site, no backend, no accounts, no tracking. Your location is resolved in the browser and never sent anywhere.

Live: https://jaster4000a.github.io/in-season/

- `data/items.json`: items with season windows per region or climate band (`[start, end, peakStart, peakEnd]` months)
- `data/regions.json`: 14 seasonal regions, state to region mapping, county overrides
- `data/places.json`: county names, US cities of 5,000+ people and ZIP3 prefixes, each resolved to a county. Rebuild with `tools/build-places.cjs`
- `data/icons.svg`: one hand-drawn flat-color icon per item, as an SVG sprite keyed by item id
- `data/counties-10m.json`: US counties from us-atlas (TopoJSON), loaded only for the map or a location lookup

Season windows are regional estimates. Texas and the Gulf Coast are the most reviewed, other regions are rough.

City and ZIP data from [GeoNames](https://www.geonames.org/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
