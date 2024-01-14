import mapboxgl from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import Stats from "./Stats";

const layerStatDict = {
  "per-capita-consumption": "kcal_consumed_per_capita_per_day",
  "per-capita-production": "kcal_produced_per_capita_per_day",
  "total-production": "total_kcal_produced",
  "total-consumption": "total_kcal_consumed",
};

const hoverLabelDict = {
  "per-capita-consumption": "Per Capita Consumption",
  "per-capita-production": "Per Capita Production",
  "total-production": "Total Production",
  "total-consumption": "Total Consumption",
};

const hoverUnitDict = {
  "per-capita-consumption": "Kcal/person/day",
  "per-capita-production": "Kcal/person/day",
  "total-production": "Kcal/year",
  "total-consumption": "Kcal/year",
};

function formatNumber(value) {
  const trillion = 1e12;
  const billion = 1e9;
  const million = 1e6;

  if (value >= trillion) {
    return (value / trillion).toFixed(2) + "T";
  } else if (value >= billion) {
    return (value / billion).toFixed(2) + "B";
  } else if (value >= million) {
    return (value / million).toFixed(2) + "M";
  } else {
    return value.toFixed(2);
  }
}

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;
function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  // const tilesetSource = "mapbox://mikey1001.food-tiles";

  const [mapView, setMapView] = useState("per-capita-consumption");
  const [hoverLocation, setHoverLocation] = useState(null);
  const [countyStats, setCountyStats] = useState(null);

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mikey1001/clqzyme2700sy01qrhdda6qjx",
      center: [-98.5795, 39.8283],
      maxBounds: [
        [-125.0011, 24.9493], // Southwest coordinates of the bounding box
        [-66.9326, 49.5904], // Northeast coordinates of the bounding box
      ],
      zoom: 4,
      minZoom: 2,
      maxZoom: 10,
    });
    const currentMap = map.current;
    currentMap.on("load", () => {
      currentMap.on("mousemove", "per-capita-consumption", (e) => {
        setHoverLocation(e.point);
        setCountyStats(e.features[0].properties);
      });

      currentMap.on("mouseleave", "per-capita-consumption", () => {
        setHoverLocation(null);
        setCountyStats(null);
      });
    });
  }, []);

  useEffect(() => {
    const currentMap = map.current;
    if (currentMap && currentMap.isStyleLoaded()) {
      currentMap.moveLayer(mapView);
    } else if (currentMap) {
      currentMap.once("style.load", () => {
        currentMap.moveLayer(mapView);
      });
    }
  }, [mapView]);

  let legendMax = "";
  let legendMin = "";
  switch (mapView) {
    case "per-capita-consumption":
      legendMax = "846.03 KCal/person/day";
      legendMin = "782.01 KCal/person/day";
      break;
    case "per-capita-production":
      legendMax = "660069.70 Kcal/person/day";
      legendMin = "0 Kcal/person/day";
      break;
    case "total-consumption":
      legendMax = "3.01T Kcal/year";
      legendMin = "25.63M Kcal/year";
      break;
    case "total-production":
      legendMax = "1.04T Kcal/year";
      legendMin = "0 Kcal/year";
      break;
  }
  const [countyData, setCountyData] = useState(null);

  useEffect(() => {
    if (countyStats) {
      console.log(countyStats);
      const fieldsToKeep = [
        "kcal_consumed_fruit",
        "kcal_consumed_grain",
        "kcal_consumed_nuts",
        "kcal_consumed_potatoes",
        "kcal_consumed_vegetables",
        "geographic_area_name",
        "pct_black",
        "pct_hispanic_latino",
        "pct_white",
        "pct_low_income",
        "pct_high_income",
      ];

      const newCountyData = Object.fromEntries(
        Object.entries(countyStats).filter(([key]) =>
          fieldsToKeep.includes(key)
        )
      );

      setCountyData(newCountyData);
    } else {
      setCountyData(null);
    }
  }, [countyStats]);

  return (
    <div className="App">
      <div className="intro">
        <h1>U.S. Food Consumption and Production</h1>
      </div>
      <div className="settings">
        <h3>Settings</h3>
        <div className="select-wrapper">
          <label htmlFor="data-type" className="label">
            <b>Map Visualization: </b>
          </label>
          <select
            value={mapView}
            onChange={(e) => setMapView(e.target.value)}
            id="data-type"
            className="label custom-dropdown"
          >
            <option value="total-production" className="label">
              Total Production (kcal/year)
            </option>
            <option value="total-consumption">
              Total Consumption (kcal/year)
            </option>
            <option value="per-capita-production">
              Per Capita Production (kcal/person/day)
            </option>
            <option value="per-capita-consumption">
              Per Capita Consumption (kcal/person/day)
            </option>
          </select>
        </div>
      </div>
      <div ref={mapContainer} className="map-container" />
      {hoverLocation && countyStats ? (
        <div
          style={{
            position: "absolute",
            left: hoverLocation.x, // Adjust the position as needed
            top: hoverLocation.y - 75, // Adjust the position as needed
          }}
          className="label hover-tooltip"
        >
          <h3>{countyStats.geographic_area_name || ""}</h3>
          <p>
            <b>{hoverLabelDict[mapView] || ""}: </b>
            {formatNumber(countyStats[layerStatDict[mapView]]) || ""} {` `}
            {hoverUnitDict[mapView] || ""}
          </p>
        </div>
      ) : (
        <></>
      )}
      <Stats data={countyData} />
      <div className="legend">
        <div className="label">{legendMax}</div>
        <div className="gradient" />
        <div className="label">{legendMin}</div>
      </div>
    </div>
  );
}

export default App;
