# In Season

Find out what seafood, fruit and vegetables are in season where you live. Pick a state or county on the map, search, or use your location. Static site, no backend.

- `data/items.json`: items with season windows per region or climate band (`[start, end, peakStart, peakEnd]` months)
- `data/regions.json`: 14 seasonal regions, state to region mapping, county overrides
- `data/counties-10m.json`: US counties from us-atlas (TopoJSON)

Season windows are regional estimates. Texas and the Gulf Coast are the most reviewed, other regions are rough.
