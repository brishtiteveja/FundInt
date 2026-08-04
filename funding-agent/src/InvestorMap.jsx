import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { ArrowSquareOut, CheckCircle, MapPin } from "@phosphor-icons/react";

function FitInvestorBounds({ firms, city }) {
  const map = useMap();
  useEffect(() => {
    const points = firms.map((firm) => [firm.lat, firm.lng]);
    if (points.length > 20) map.setView(city === "San Francisco" ? [37.7749, -122.4194] : [30.2672, -97.7431], city === "Austin" ? 10 : 11);
    else if (points.length > 1) map.fitBounds(points, { padding: [24, 24], maxZoom: city === "Austin" ? 12 : 11 });
    else if (points.length === 1) map.setView(points[0], 12);
    else map.setView(city === "San Francisco" ? [37.7749, -122.4194] : [30.2672, -97.7431], 11);
  }, [city, firms, map]);
  return null;
}

export function InvestorMap({ firms, selectedFirmId, onSelect, city }) {
  const mappable = firms.filter((firm) => Number.isFinite(firm.lat) && Number.isFinite(firm.lng));
  const sourceCoordinates = mappable.filter((firm) => firm.coordinateSource === "Eddy source").length;
  const fallbackCoordinates = mappable.length - sourceCoordinates;
  const center = city === "San Francisco" ? [37.7749, -122.4194] : [30.2672, -97.7431];

  return <div className="investor-map-layout">
    <aside className="map-firm-list"><header><MapPin weight="fill" /><div><strong>{mappable.length} mapped firms</strong><span>Click a firm or marker</span></div></header>{mappable.map((firm) => <button key={firm.id} className={selectedFirmId === firm.id ? "active" : ""} onClick={() => onSelect(firm.id)}><span className="map-list-mark">{firm.initials}</span><span><strong>{firm.name}</strong><small>{firm.location}</small></span><b>{firm.fit}</b></button>)}</aside>
    <div className="leaflet-shell">
      <MapContainer center={center} zoom={11} scrollWheelZoom className="investor-leaflet-map" attributionControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap &copy; CARTO' />
        <FitInvestorBounds firms={mappable} city={city} />
        {mappable.map((firm) => <CircleMarker key={firm.id} center={[firm.lat, firm.lng]} radius={selectedFirmId === firm.id ? 9 : 6} pathOptions={{ color: selectedFirmId === firm.id ? "#c6f000" : "#68e0e0", fillColor: selectedFirmId === firm.id ? "#c6f000" : "#1b8f9a", fillOpacity: selectedFirmId === firm.id ? .95 : .72, weight: selectedFirmId === firm.id ? 3 : 1 }} eventHandlers={{ click: () => onSelect(firm.id) }}>
          <Popup><div className="investor-map-popup"><header><span>{firm.initials}</span><div><strong>{firm.name}</strong><small>{firm.location}</small></div></header><p>{firm.description || `${firm.stage} investor focused on ${firm.skills.join(", ")}.`}</p><div className="popup-tags">{firm.skills.slice(0, 3).map((skill) => <b key={skill}>{skill}</b>)}</div><dl><div><dt>Fit</dt><dd>{firm.fit}</dd></div><div><dt>Check</dt><dd>{firm.check}</dd></div><div><dt>Access</dt><dd>{firm.access}</dd></div></dl><footer><span><CheckCircle weight="fill" /> {firm.deadline}</span>{firm.websiteUrl && <a href={firm.websiteUrl} target="_blank" rel="noreferrer">Website <ArrowSquareOut /></a>}</footer></div></Popup>
        </CircleMarker>)}
      </MapContainer>
      <div className="map-provenance"><CheckCircle weight="fill" /> {sourceCoordinates} Eddy source coordinates{fallbackCoordinates ? ` · ${fallbackCoordinates} city fallback` : ""} · Aug 4</div>
    </div>
  </div>;
}
