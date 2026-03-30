import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1484/1484822.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const ambulanceIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
  iconSize: [35, 35],
});

// CCTV icon — two variants: default (grey) and active (green)
const cctvIconBase = {
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1532/1532688.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -24],
};

const defaultCCTVIcon = new L.Icon({
  ...cctvIconBase,
});

const activeCCTVIcon = new L.Icon({
  ...cctvIconBase,
  iconUrl: "https://cdn-icons-png.flaticon.com/512/564/564445.png", // green camera icon
});

// Creates a divIcon label placed next to the marker
function cctvLabelIcon(label, isActive) {
  return new L.DivIcon({
    html: `<div style="
      background: ${isActive ? "#22c55e" : "#64748b"};
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
      border: 1px solid ${isActive ? "#16a34a" : "#475569"};
    ">${label}</div>`,
    className: "",
    iconSize: [60, 18],
    iconAnchor: [30, -5],
  });
}

const altColors = ["#277DA1", "#F3722C", "#577590", "#F8961E", "#43AA8B"];

export default function MapView({
  hospitals = [],
  route,
  allRoutes = [],
  shortestRouteIndex = null,
  ambulancePos,
  activeCCTVId = null,
  bestRouteCCTVs = [],
}) {
  // Build a quick lookup: cctvId → index label
  const cctvLabelMap = {};
  bestRouteCCTVs.forEach((cctv, i) => {
    cctvLabelMap[cctv.id] = i + 1;
  });

  return (
    <MapContainer
      center={[19.8762, 75.3433]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Hospitals from backend */}
      {hospitals.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
          <Popup>🏥 {h.name}</Popup>
        </Marker>
      ))}

      {/* Alternative routes */}
      {allRoutes.map((routeItem, idx) => {
        const isShortest = routeItem.index === shortestRouteIndex;
        const color = isShortest ? "lime" : altColors[idx % altColors.length];

        return (
          <Polyline
            key={`route-${routeItem.index}`}
            positions={routeItem.path}
            pathOptions={{
              color,
              weight: isShortest ? 6 : 4,
              opacity: isShortest ? 0.95 : 0.5,
              dashArray: isShortest ? undefined : "6, 8",
            }}
          />
        );
      })}

      {/* CCTV markers for ALL routes */}
      {allRoutes.map((routeItem) =>
        (routeItem.cctvs || []).map((cctv) => {
          const isActive = cctv.id === activeCCTVId;
          const labelNum = cctvLabelMap[cctv.id] ?? cctv.id;
          const label = `CCTV ${labelNum}`;

          return (
            <Marker
              key={`cctv-${routeItem.index}-${cctv.id}`}
              position={[cctv.lat, cctv.lng]}
              icon={isActive ? activeCCTVIcon : defaultCCTVIcon}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 4,
                      color: isActive ? "#22c55e" : "#334155",
                    }}
                  >
                    {label}
                  </div>
                  <div>Route: {routeItem.index + 1}</div>
                  <div>Status: {cctv.status}</div>
                  {typeof cctv.turnAngleDeg === "number" && (
                    <div>Turn: {cctv.turnAngleDeg.toFixed(1)} deg</div>
                  )}
                  <div style={{ marginTop: 6 }}>
                    {routeItem.index === shortestRouteIndex
                      ? "🟢 Best route"
                      : "🔵 Alternative route"}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })
      )}

      {/* CCTV label overlays — only for best route CCTV nodes */}
      {bestRouteCCTVs.map((cctv) => {
        const isActive = cctv.id === activeCCTVId;
        const labelNum = cctvLabelMap[cctv.id] ?? cctv.id;
        return (
          <Marker
            key={`cctv-label-${cctv.id}`}
            position={[cctv.lat, cctv.lng]}
            icon={cctvLabelIcon(`CCTV ${labelNum}`, isActive)}
            interactive={false}
          />
        );
      })}

      {/* Fallback route renderer */}
      {allRoutes.length === 0 && route.length > 0 && (
        <Polyline positions={route} pathOptions={{ color: "lime", weight: 5 }} />
      )}

      {/* Ambulance */}
      {ambulancePos && (
        <Marker position={ambulancePos} icon={ambulanceIcon}>
          <Popup>🚑 Ambulance Active</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
