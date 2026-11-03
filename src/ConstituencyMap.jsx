import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  ExternalLink,
  Layers,
  RotateCcw,
  Navigation
} from "lucide-react";

// ============================================================
// THIRUPARANKUNDRAM CONSTITUENCY & WARD BOUNDARY COORDINATES
// Assembly Constituency No. 195 - Madurai District, Tamil Nadu
// ============================================================
const CONSTITUENCY_CENTER = [9.8735, 78.0715];

// Precise perimeter polygon of Thiruparankundram constituency in Madurai
const WARD_BOUNDARY_POLYGON = [
  [9.9065, 78.0835], // North: Pasumalai North & Pykara
  [9.9015, 78.1015], // North-East: Villapuram border
  [9.8895, 78.1175], // East: Avaniyapuram junction
  [9.8715, 78.1215], // East-South: Airport Road junction
  [9.8495, 78.1065], // South-East: Perungudi East
  [9.8335, 78.0865], // South: Nilaiyur South
  [9.8215, 78.0645], // South-West: Thoppur
  [9.8285, 78.0375], // South-West: Kappalur Industrial Estate
  [9.8515, 78.0315], // West: Austinpatti
  [9.8695, 78.0415], // West-North: Thanakkankulam
  [9.8865, 78.0475], // North-West: Harveypatti
  [9.8995, 78.0615], // North-West: Vilacheri
  [9.9065, 78.0835]  // Closed back to Pasumalai
];

// Inner sectors delineating key wards/zones
const SUB_WARD_SECTORS = [
  {
    nameTa: "திருப்பரங்குன்றம் அருள்மிகு முருகன் கோவில் & மலை மண்டலம்",
    nameEn: "Thiruparankundram Temple & Heritage Zone",
    coords: [
      [9.8885, 78.0655],
      [9.8875, 78.0825],
      [9.8685, 78.0835],
      [9.8695, 78.0665]
    ]
  },
  {
    nameTa: "திருநகர் & ஹார்விபட்டி குடியிருப்பு மண்டலம்",
    nameEn: "Tirunagar & Harveypatti Residential Zone",
    coords: [
      [9.8795, 78.0465],
      [9.8795, 78.0645],
      [9.8565, 78.0635],
      [9.8575, 78.0455]
    ]
  },
  {
    nameTa: "நிலையூர் நீர்ப்பாசனம் & கண்மாய் விவசாய மண்டலம்",
    nameEn: "Nilaiyur Reservoir & Agricultural Belt",
    coords: [
      [9.8615, 78.0665],
      [9.8625, 78.0945],
      [9.8365, 78.0935],
      [9.8375, 78.0675]
    ]
  }
];

// ============================================================
// VERIFIED CONSTITUENCY LOCATIONS (4 EXCLUSIVE KEY POINTS)
// ============================================================
const WARD_MARKERS = [
  {
    id: "mla-office",
    category: "office",
    categoryTa: "தொகுதி அலுவலகம்",
    categoryEn: "MLA Constituency Office",
    color: "#f59e0b", // Warm Amber
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><line x1="2" y1="21" x2="22" y2="21"/><path d="M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11M12 2L2 7h20L12 2z"/></svg>`,
    titleTa: "சி.டி.ஆர். நிர்மல் குமார் எம்.எல்.ஏ அலுவலகம் & மக்கள் மையம்",
    titleEn: "CTR Nirmal Kumar MLA Constituency Office & Citizen Hub",
    locationTa: "திருநகர் பிரதான சாலை (Tirunagar Main Rd), திருப்பரங்குன்றம், மதுரை",
    locationEn: "Tirunagar Main Road, Thiruparankundram, Madurai",
    descTa: "பொதுமக்கள் குறைகேட்பு, மனுக்கள் பதிவு, அரசு நலத்திட்ட உதவிகள் மற்றும் தொகுதி வளர்ச்சிப் பணிகளுக்கான தலைமை மையம்.",
    descEn: "Headquarters for citizen grievance redressal, petition registration, and constituency welfare coordination.",
    lat: 9.8765,
    lng: 78.0675,
    isPrimary: true
  },
  {
    id: "hospital-health",
    category: "health",
    categoryTa: "மக்கள் நல்வாழ்வு",
    categoryEn: "Government Hospital",
    color: "#ec4899", // Rose / Pink
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M12 5v14M5 12h14"/></svg>`,
    titleTa: "அரசு தாலுகா தலைமை மருத்துவமனை & தாய்-சேய் நலம்",
    titleEn: "Government Taluk Hospital & Emergency Medical Center",
    locationTa: "இரயில்வே பீடர் ரோடு, திருப்பரங்குன்றம், மதுரை",
    locationEn: "Railway Feeder Road, Thiruparankundram, Madurai",
    descTa: "24 மணி நேர அவசர விபத்து சிகிச்சை, நவீன ஸ்கேன் மையம், பிரசவ வார்டு மற்றும் இலவச மருந்து வழங்கும் மையம்.",
    descEn: "24/7 trauma & emergency services, neonatal care, digital imaging, and government subsidized pharmacy.",
    lat: 9.8735,
    lng: 78.0815
  },
  {
    id: "fire-station",
    category: "fire",
    categoryTa: "தீயணைப்பு & மீட்பு",
    categoryEn: "Fire & Rescue Station",
    color: "#ea580c", // Energetic Blaze Orange / Red
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
    titleTa: "திருப்பரங்குன்றம் தீயணைப்பு & மீட்புப் பணிகள் நிலையம்",
    titleEn: "Thiruparankundram Fire & Rescue Services Station",
    locationTa: "மெயின் ரோடு, திருப்பரங்குன்றம், மதுரை (ஹெல்ப்லைன்: 101)",
    locationEn: "Main Road, Thiruparankundram, Madurai (Helpline: 101)",
    descTa: "24/7 அவசர தீயணைப்பு, பேரிடர் மற்றும் விபத்து மீட்புப் பணிகள், நவீன அவசரகால வாகன வசதிகள் மற்றும் பாதுகாப்பு வழிகாட்டல் மையம்.",
    descEn: "24/7 emergency firefighting, disaster and accident rescue operations, modern emergency vehicles, and public safety coordination.",
    lat: 9.8828,
    lng: 78.0682
  },
  {
    id: "eb-office",
    category: "eb",
    categoryTa: "மின்சார வாரியம் (EB)",
    categoryEn: "EB Office (TANGEDCO)",
    color: "#0284c7", // Electric Sky Blue
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    titleTa: "திருப்பரங்குன்றம் மின்சார வாரிய அலுவலகம் (TANGEDCO / TNEB EB Office)",
    titleEn: "Thiruparankundram TANGEDCO Electricity Board (EB) Office",
    locationTa: "சி.எஸ். சாலை (அஞ்சலகம் அருகில்), திருப்பரங்குன்றம், மதுரை (ஹெல்ப்லைன்: 1912)",
    locationEn: "C.S. Road (Near Post Office), Thiruparankundram, Madurai (Helpline: 1912)",
    descTa: "புதிய மின் இணைப்பு, மின் கட்டணம் செலுத்துதல், 24/7 மின் விநியோகப் பராமரிப்பு, மின் மாற்றிகள் சீரமைப்பு மற்றும் அவசர மின்தடை புகார்கள் தீர்வு மையம் (மின்னகம்: 94987 94987 / 0452-2482443).",
    descEn: "TANGEDCO section office for new power connections, billing, grid maintenance, transformer services, and 24/7 power outage assistance (Minnagam: 1912 / 0452-2482443).",
    lat: 9.8752,
    lng: 78.0734
  },
  {
    id: "police-safety",
    category: "safety",
    categoryTa: "காவல் & பாதுகாப்பு",
    categoryEn: "Police & Public Safety",
    color: "#7c3aed", // Imperial Purple
    iconSvg: `<svg viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    titleTa: "திருப்பரங்குன்றம் காவல் நிலையம் & மகளிர் பாதுகாப்பு மையம்",
    titleEn: "Thiruparankundram Police Station & Women Safety Hub",
    locationTa: "சன்னதி தெரு (Sannathi St), திருப்பரங்குன்றம், மதுரை",
    locationEn: "Sannathi Street, Thiruparankundram, Madurai",
    descTa: "24/7 பொதுப் பாதுகாப்பு, மகளிர் உதவி மையம், குற்றத் தடுப்பு பிரிவு மற்றும் நவீன ரோந்து கண்காணிப்பு வலையமைப்பு.",
    descEn: "24/7 public vigilance, women's safety desk, automated patrolling, and modern surveillance.",
    lat: 9.8805,
    lng: 78.0748
  }
];

export default function ConstituencyMap({ tamil = true }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const boundaryLayerRef = useRef(null);
  const lastNavigatedRef = useRef(0);

  const [activeMarker, setActiveMarker] = useState(WARD_MARKERS[0]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [mapType, setMapType] = useState("google"); // "google", "satellite", "clean"
  const [showBoundary, setShowBoundary] = useState(true);

  // Directly open Google Maps directions to the exact coordinates
  const openDirections = (marker) => {
    if (!marker) return;
    const now = Date.now();
    if (now - lastNavigatedRef.current < 600) return;
    lastNavigatedRef.current = now;

    setActiveMarker(marker);

    // Pan map to marker smoothly
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([marker.lat, marker.lng], {
        animate: true,
        duration: 0.3
      });
    }

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${marker.lat},${marker.lng}`;

    const isMobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent) ||
      (typeof window !== "undefined" && window.innerWidth <= 768);

    if (isMobile) {
      window.location.href = directionsUrl;
    } else {
      let win = null;
      try {
        win = window.open(directionsUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        win = null;
      }
      if (!win || win.closed || typeof win.closed === "undefined") {
        window.location.href = directionsUrl;
      }
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CONSTITUENCY_CENTER,
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      zoomControl: false,
      scrollWheelZoom: false
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    const boundaryLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    boundaryLayerRef.current = boundaryLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer when mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    let attribution = '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>';

    if (mapType === "satellite") {
      tileUrl = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
      attribution = '&copy; <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Satellite</a>';
    } else if (mapType === "clean") {
      tileUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      attribution = '&copy; <a href="https://carto.com/">CARTO</a>';
    }

    L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution
    }).addTo(map);
  }, [mapType]);

  // Render Constituency Boundary Polygon
  useEffect(() => {
    const boundaryLayer = boundaryLayerRef.current;
    if (!boundaryLayer) return;

    boundaryLayer.clearLayers();

    if (!showBoundary) return;

    // Main Constituency Boundary Polygon
    const mainPolygon = L.polygon(WARD_BOUNDARY_POLYGON, {
      color: "#a4262a",
      weight: 2.8,
      opacity: 0.95,
      fillColor: "#831d20",
      fillOpacity: 0.18,
      smoothFactor: 1,
      interactive: false
    });

    boundaryLayer.addLayer(mainPolygon);

    // Subtle sub-ward sector lines
    SUB_WARD_SECTORS.forEach((sec) => {
      const secPoly = L.polygon(sec.coords, {
        color: "#c2410c",
        dashArray: "4, 6",
        weight: 1.5,
        opacity: 0.65,
        fillColor: "#f97316",
        fillOpacity: 0.05,
        interactive: false
      });
      boundaryLayer.addLayer(secPoly);
    });
  }, [showBoundary, tamil]);

  // Render Markers on Map with Direct Google Maps Click Action
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    const map = mapInstanceRef.current;
    if (!markersLayer || !map) return;

    markersLayer.clearLayers();

    const filtered = selectedCategory === "all"
      ? WARD_MARKERS
      : WARD_MARKERS.filter((m) => m.category === selectedCategory);

    filtered.forEach((m) => {
      const isSelected = activeMarker && activeMarker.id === m.id;
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`;

      const pinHtml = `
        <a
          href="${directionsUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="custom-map-pin ${isSelected ? "is-active" : ""}"
          data-id="${m.id}"
          style="--pin-color: ${m.color}; display: block; text-decoration: none;"
          title="${tamil ? m.titleTa : m.titleEn}"
        >
          <div class="pin-halo"></div>
          <svg class="pin-shape" width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 0C7.611 0 0 7.611 0 17C0 27.5 14.5 40.5 16.2 41.9C16.65 42.27 17.35 42.27 17.8 41.9C19.5 40.5 34 27.5 34 17C34 7.611 26.389 0 17 0Z" fill="${m.color}"/>
            <circle cx="17" cy="16" r="10.5" fill="rgba(0,0,0,0.18)"/>
            <circle cx="17" cy="16" r="12" stroke="#ffffff" stroke-width="1.6" opacity="0.9"/>
          </svg>
          <div class="pin-icon-wrap">${m.iconSvg}</div>
        </a>
      `;

      const customIcon = L.divIcon({
        className: "pin-wrapper",
        html: pinHtml,
        iconSize: [34, 42],
        iconAnchor: [17, 42],
        popupAnchor: [0, -42]
      });

      const marker = L.marker([m.lat, m.lng], {
        icon: customIcon,
        zIndexOffset: 1000,
        riseOnHover: true
      });

      marker.bindTooltip(
        tamil
          ? `<strong>${m.titleTa}</strong><br/><span style="color:#fcd34d;">📍 வழிகாட்டலுக்கு கிளிக் செய்க</span>`
          : `<strong>${m.titleEn}</strong><br/><span style="color:#fcd34d;">📍 Click for Directions</span>`,
        {
          sticky: true,
          interactive: false,
          className: "constituency-map-tooltip"
        }
      );

      marker.on("click", (e) => {
        if (e && e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        openDirections(m);
      });

      markersLayer.addLayer(marker);

      const el = marker.getElement();
      if (el) {
        el.style.cursor = "pointer";
        el.addEventListener("click", (domEvent) => {
          domEvent.stopPropagation();
          openDirections(m);
        });
      }
    });
  }, [selectedCategory, tamil]);

  // Update active pin visual highlight without destroying marker instances
  useEffect(() => {
    const activeId = activeMarker?.id;
    if (!activeId) return;
    document.querySelectorAll(".custom-map-pin").forEach((pinEl) => {
      if (pinEl.getAttribute("data-id") === activeId) {
        pinEl.classList.add("is-active");
      } else {
        pinEl.classList.remove("is-active");
      }
    });
  }, [activeMarker]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(CONSTITUENCY_CENTER, 13, {
        animate: true,
        duration: 0.6
      });
    }
  };

  const categories = [
    { id: "all", labelTa: "அனைத்தும்", labelEn: "All Locations" },
    { id: "office", labelTa: "தொகுதி அலுவலகம்", labelEn: "MLA Office" },
    { id: "health", labelTa: "மக்கள் நல்வாழ்வு", labelEn: "Government Hospital" },
    { id: "fire", labelTa: "தீயணைப்பு நிலையம்", labelEn: "Fire Station" },
    { id: "eb", labelTa: "மின்சார வாரியம் (EB)", labelEn: "EB Office (TANGEDCO)" },
    { id: "safety", labelTa: "காவல் & பாதுகாப்பு", labelEn: "Police & Safety" }
  ];

  return (
    <section className="constituency-map-section section-pad" id="ward-map">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {tamil ? "தொகுதி உள்கட்டமைப்பு வரைபடம்" : "Constituency Ward Boundaries"}
          </span>
          <h2>
            {tamil ? "திருப்பரங்குன்றம் தொகுதி வரைபடம்." : "Thiruparankundram Ward Map."}
            <br />
            <em>{tamil ? "வளர்ச்சித் திட்டங்கள் & மக்கள் சேவைகள்" : "Development Works & Public Amenities"}</em>
          </h2>
        </div>
        <p>
          {tamil
            ? "மாண்புமிகு அமைச்சர் சி.டி.ஆர். நிர்மல் குமார் அவர்களின் திருப்பரங்குன்றம் சட்டமன்ற தொகுதிக்குட்பட்ட முக்கிய வார்டு எல்லைகள், குடிமக்கள் சேவை மையங்கள், மருத்துவமனை, தீயணைப்பு, மின்சார வாரிய அலுவலகம் (EB Office) மற்றும் காவல் நிலையங்களின் ஒருங்கிணைந்த வரைபடம். எந்தவொரு இடத்தையும் கிளிக் செய்தால் நேரடியாக Google Maps வழிகாட்டல் (Directions) திறக்கும்."
            : "Interactive ward boundary map of Thiruparankundram Assembly Constituency, Madurai, highlighting key administrative offices, healthcare facilities, fire and rescue station, TANGEDCO EB office, and public safety centers. Click any location to open Google Maps directions directly."}
        </p>
      </div>

      {/* Control Header Strip */}
      <div className="map-toolbar">
        {/* Category Filters */}
        <div className="map-category-pills" role="tablist" aria-label="Map categories">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? "is-active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {tamil ? cat.labelTa : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Map Actions & Layer Toggles */}
        <div className="map-actions-row">
          {/* Map Layer Switcher */}
          <div className="map-type-toggle">
            <button
              type="button"
              className={mapType === "google" ? "active" : ""}
              onClick={() => setMapType("google")}
              title="Google Maps Road View"
            >
              🗺️ {tamil ? "வரைபடம்" : "Roadmap"}
            </button>
            <button
              type="button"
              className={mapType === "satellite" ? "active" : ""}
              onClick={() => setMapType("satellite")}
              title="Satellite / Hybrid View"
            >
              🛰️ {tamil ? "செயற்கைக்கோள்" : "Satellite"}
            </button>
            <button
              type="button"
              className={mapType === "clean" ? "active" : ""}
              onClick={() => setMapType("clean")}
              title="Clean Minimalist Map"
            >
              🏛️ {tamil ? "மண்டல வரைபடம்" : "Clean"}
            </button>
          </div>

          <div className="map-button-group">
            <button
              type="button"
              className={`toolbar-btn ${showBoundary ? "active" : ""}`}
              onClick={() => setShowBoundary(!showBoundary)}
              title={tamil ? "தொகுதி எல்லைக் கோடு" : "Toggle Ward Boundary"}
            >
              <Layers size={14} />
              <span>{tamil ? "தொகுதி எல்லை" : "Boundary"}</span>
            </button>

            <button
              type="button"
              className="toolbar-btn"
              onClick={handleResetView}
              title={tamil ? "வரைபடத்தை மையப்படுத்து" : "Reset Map Center"}
            >
              <RotateCcw size={14} />
              <span>{tamil ? "மையப்படுத்து" : "Reset View"}</span>
            </button>

            <a
              href="https://www.google.com/maps/dir/?api=1&destination=9.8735,78.0715"
              target="_blank"
              rel="noopener noreferrer"
              className="toolbar-btn toolbar-btn-gold"
              title={tamil ? "முழு தொகுதிக்கும் Google Maps வழிகாட்டல்" : "Get Directions to Thiruparankundram on Google Maps"}
            >
              <Navigation size={14} />
              <span>{tamil ? "Google Maps வழிகாட்டல்" : "Open in Google Maps"}</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Map Interactive Canvas Grid */}
      <div className="map-workspace-grid">
        {/* Leaflet Canvas Container */}
        <div className="map-canvas-wrapper">
          <div ref={mapContainerRef} className="map-canvas" />

          {/* Quick Boundary Badge Overlay */}
          <div className="map-floating-badge">
            <span className="badge-dot"></span>
            <strong>{tamil ? "சட்டமன்ற தொகுதி எண்: 195" : "Constituency No. 195"}</strong>
            <small>{tamil ? "திருப்பரங்குன்றம் · மதுரை மாவட்டம்" : "Thiruparankundram · Madurai"}</small>
          </div>
        </div>

        {/* Selected Marker Detail Card */}
        {activeMarker && (
          <aside className="marker-detail-card" aria-label="Selected location details">
            <div className="detail-header" style={{ borderLeftColor: activeMarker.color }}>
              <div className="detail-tag" style={{ background: activeMarker.color }}>
                <span className="detail-tag-icon" dangerouslySetInnerHTML={{ __html: activeMarker.iconSvg }} />
                <span>{tamil ? activeMarker.categoryTa : activeMarker.categoryEn}</span>
              </div>
              <h3>{tamil ? activeMarker.titleTa : activeMarker.titleEn}</h3>
              <p className="detail-location">
                <MapPin size={13} style={{ color: activeMarker.color }} />
                <span>{tamil ? activeMarker.locationTa : activeMarker.locationEn}</span>
              </p>
            </div>

            <p className="detail-body">
              {tamil ? activeMarker.descTa : activeMarker.descEn}
            </p>

            <div className="detail-actions">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeMarker.lat},${activeMarker.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="detail-nav-btn"
                style={{ background: activeMarker.color }}
                onClick={(e) => {
                  e.preventDefault();
                  openDirections(activeMarker);
                }}
                title={tamil ? `${activeMarker.titleTa} - Google Maps வழிகாட்டல்` : `Get Directions to ${activeMarker.titleEn}`}
              >
                <Navigation size={14} />
                <span>{tamil ? "Google Maps-ல் வழிகாட்டல் பெறுக" : "Get Directions in Google Maps"}</span>
                <ExternalLink size={13} />
              </a>
            </div>

            {/* Quick List of 4 Ward Points - Each directly opens Google Maps Directions */}
            <div className="nearby-list-wrap">
              <span className="nearby-title">
                {tamil ? "தொகுதியின் முக்கிய இடங்கள் (வழிகாட்டல் பெற கிளிக் செய்யவும்)" : "Key Locations in this Ward (Click for Directions)"}
              </span>
              <div className="nearby-scroll">
                {WARD_MARKERS.map((wm) => (
                  <button
                    type="button"
                    key={wm.id}
                    className={`nearby-chip ${activeMarker?.id === wm.id ? "active" : ""}`}
                    onClick={() => openDirections(wm)}
                    title={tamil ? `${wm.titleTa} - Google Maps வழிகாட்டல் பெற கிளிக் செய்க` : `${wm.titleEn} - Click to open Google Maps Directions`}
                  >
                    <span className="chip-dot" style={{ background: wm.color }} />
                    <span className="chip-text">{tamil ? wm.titleTa : wm.titleEn}</span>
                    <Navigation size={12} className="chip-nav-icon" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Ward Highlights Strip Below Map */}
      <div className="ward-stats-strip">
        <div className="ward-stat-item">
          <small>{tamil ? "சட்டமன்ற தொகுதி" : "Constituency"}</small>
          <strong>{tamil ? "195 - திருப்பரங்குன்றம்" : "195 - Thiruparankundram"}</strong>
          <span>{tamil ? "மதுரை மாவட்டம் · தமிழ்நாடு" : "Madurai District · Tamil Nadu"}</span>
        </div>
        <div className="ward-stat-separator" />
        <div className="ward-stat-item">
          <small>{tamil ? "வாக்குச்சாவடிகள்" : "Polling Stations"}</small>
          <strong>280+ {tamil ? "வாக்குச்சாவடிகள்" : "Booths"}</strong>
          <span>{tamil ? "அனைத்து வார்டுகளிலும் மக்கள் சேவை" : "Full coverage across all wards"}</span>
        </div>
        <div className="ward-stat-separator" />
        <div className="ward-stat-item">
          <small>{tamil ? "முக்கிய பகுதிகள்" : "Major Localities"}</small>
          <strong>{tamil ? "திருநகர் · பசுமலை · நிலையூர்" : "Tirunagar · Pasumalai · Nilaiyur"}</strong>
          <span>{tamil ? "ஹார்விபட்டி · தனக்கன்குளம் · தோப்பூர்" : "Harveypatti · Thanakkankulam · Thoppur"}</span>
        </div>
        <div className="ward-stat-separator" />
        <div className="ward-stat-item">
          <small>{tamil ? "மக்கள் நலன் & திட்டங்கள்" : "Public Mandate"}</small>
          <strong>{tamil ? "எரிசக்தி, சட்டம் & உள்கட்டமைப்பு" : "Energy, Law & Infrastructure"}</strong>
          <span>{tamil ? "முழுமையான வளர்ச்சிப் பணிகள்" : "Comprehensive regional development"}</span>
        </div>
      </div>
    </section>
  );
}
