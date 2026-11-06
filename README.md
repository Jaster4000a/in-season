# In Season

What seafood, fruit and vegetables are in season where you are, right now. Built for a phone in a grocery store or a city you don't know. Use your location, or search a city, ZIP, state or food. Static site, no backend, no accounts, no tracking. Your location is resolved in the browser and is not sent anywhere unless you send a feedback report.

Live: https://jaster4000a.github.io/in-season/

- `data/items.json`: items with season windows per region or climate band (`[start, end, peakStart, peakEnd]` months)
- `data/regions.json`: 14 seasonal regions, state to region mapping, county overrides
- `data/places.json`: county names, US cities of 5,000+ people and ZIP3 prefixes, each resolved to a county. Rebuild with `tools/build-places.cjs`
- `data/icons.svg`: one hand-drawn flat-color icon per item, as an SVG sprite keyed by item id
- `data/counties-10m.json`: US counties from us-atlas (TopoJSON), loaded only for the map or a location lookup

Feedback reports are emailed through [Web3Forms](https://web3forms.com/) only when someone taps Send. A report includes what they entered, the page address and their IP address. The access key in `index.html` is public by design and only sends mail to the site owner. Reports are reviewed by hand and never change the site automatically.

US territories are recognized by search and location but not covered yet, since there is no season data for them.

Development: `node tools/check-data.cjs` checks windows and icons. `python3 dev/serve.py` serves the site locally with a Demo / Worst case / Empty / One data toggle that never ships in the page.

Works offline after the first visit and can be installed to a home screen (`sw.js`, `manifest.webmanifest`). Bump `VERSION` in `sw.js` when changing the list of saved files. A feedback report written with no signal waits in the browser's local storage until the app next has a signal.

Season windows are regional estimates. Texas and the Gulf Coast are the most reviewed, other regions are rough.

City and ZIP data from [GeoNames](https://www.geonames.org/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
