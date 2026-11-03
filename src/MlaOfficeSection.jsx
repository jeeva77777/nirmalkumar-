import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  Mail,
  Phone,
  Share2,
  GitFork,
  Check
} from "lucide-react";

// ============================================================
// MLA CONSTITUENCY OFFICE - C.T.R. NIRMAL KUMAR (AC 195)
// Precise Coordinates: Tirunagar Main Rd, Thiruparankundram
// ============================================================
const MLA_OFFICE = {
  titleEn: "MLA Office",
  titleTa: "எம்.எல்.ஏ அலுவலகம்",
  fullTitleEn: "CTR Nirmal Kumar MLA Constituency Office & Citizen Hub",
  fullTitleTa: "சி.டி.ஆர். நிர்மல் குமார் எம்.எல்.ஏ அலுவலகம் & மக்கள் மையம்",
  addressEn: "No. 45, Tirunagar Main Rd, (Near 2nd Bus Stop), Thiruparankundram, Madurai, Tamil Nadu 625006",
  addressTa: "எண். 45, திருநகர் பிரதான சாலை (2வது பேருந்து நிறுத்தம் அருகில்), திருப்பரங்குன்றம், மதுரை, தமிழ்நாடு 625006",
  email: "mlathiruparankundram@ctrnirmalkumar.com",
  phone: "94444 88888",
  phoneDisplay: "94444 88888",
  phoneBadge: "24/7",
  lat: 9.8765,
  lng: 78.0675
};

export default function MlaOfficeSection({ tamil = true }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const lastNavigatedRef = useRef(0);
  const [copied, setCopied] = useState(false);

  // Directly open Google Maps directions to the MLA Office
  const openDirections = () => {
    const now = Date.now();
    if (now - lastNavigatedRef.current < 600) return;
    lastNavigatedRef.current = now;

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${MLA_OFFICE.lat},${MLA_OFFICE.lng}`;

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

  // Handle location sharing
  const handleShareLocation = async () => {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${MLA_OFFICE.lat},${MLA_OFFICE.lng}`;
    const shareTitle = tamil ? MLA_OFFICE.fullTitleTa : MLA_OFFICE.fullTitleEn;
    const shareText = tamil
      ? `${MLA_OFFICE.fullTitleTa} - ${MLA_OFFICE.addressTa}`
      : `${MLA_OFFICE.fullTitleEn} - ${MLA_OFFICE.addressEn}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: directionsUrl
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(directionsUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  // Initialize Leaflet Map focused specifically on MLA Office
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [MLA_OFFICE.lat, MLA_OFFICE.lng],
      zoom: 15,
      minZoom: 12,
      maxZoom: 18,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: false
    });

    // Zoom control at top right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Clean Google Maps Road tile layer
    L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
      maxZoom: 19
    }).addTo(map);

    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${MLA_OFFICE.lat},${MLA_OFFICE.lng}`;

    // Target Bullseye Pin matching Deep Ministerial Maroon theme
    const pinHtml = `
      <a
        href="${directionsUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="mla-target-pin"
        style="display: block; text-decoration: none;"
        title="${tamil ? MLA_OFFICE.fullTitleTa : MLA_OFFICE.fullTitleEn}"
      >
        <svg class="target-pin-svg" width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="21" cy="21" r="19" fill="#2c090b" stroke="#eec84b" stroke-width="3.5" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.4))"/>
          <circle cx="21" cy="21" r="11" fill="#eec84b"/>
          <circle cx="21" cy="21" r="4.5" fill="#2c090b"/>
        </svg>
      </a>
    `;

    const targetIcon = L.divIcon({
      className: "mla-pin-container",
      html: pinHtml,
      iconSize: [42, 42],
      iconAnchor: [21, 21]
    });

    const marker = L.marker([MLA_OFFICE.lat, MLA_OFFICE.lng], {
      icon: targetIcon,
      zIndexOffset: 1000
    });

    marker.bindTooltip(
      tamil
        ? `<strong>${MLA_OFFICE.titleTa}</strong><br/><span style="color:#fcd34d;">📍 வழிகாட்டலுக்கு கிளிக் செய்க</span>`
        : `<strong>${MLA_OFFICE.titleEn}</strong><br/><span style="color:#fcd34d;">📍 Click for Directions</span>`,
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
      openDirections();
    });

    marker.addTo(map);

    const el = marker.getElement();
    if (el) {
      el.style.cursor = "pointer";
      el.addEventListener("click", (domEvent) => {
        domEvent.stopPropagation();
        openDirections();
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [tamil]);

  return (
    <section className="mla-office-banner-section" id="mla-office">
      {/* Main Ministerial Maroon & Gold Showcase Card */}
      <div className="mla-office-card">
        {/* Background decorative luxury ring watermark */}
        <div className="mla-card-watermark" aria-hidden="true" />

        {/* Left Column: Office Details */}
        <div className="mla-office-details">
          <span className="mla-eyebrow">
            {tamil ? "மக்கள் தொடர்பு & சட்டமன்ற உறுப்பினர் அலுவலகம்" : "CONSTITUENCY CITIZEN HUB & MLA OFFICE"}
          </span>

          <h2 className="mla-office-title">
            {tamil ? MLA_OFFICE.titleTa : MLA_OFFICE.titleEn}
          </h2>

          <p className="mla-office-sub">
            {tamil ? MLA_OFFICE.fullTitleTa : MLA_OFFICE.fullTitleEn}
          </p>

          <div className="mla-info-list">
            {/* Address */}
            <div className="mla-info-item">
              <span className="mla-info-icon" aria-hidden="true">
                <MapPin size={22} strokeWidth={2.4} />
              </span>
              <p className="mla-info-text">
                {tamil ? MLA_OFFICE.addressTa : MLA_OFFICE.addressEn}
              </p>
            </div>

            {/* Email */}
            <div className="mla-info-item">
              <span className="mla-info-icon" aria-hidden="true">
                <Mail size={22} strokeWidth={2.4} />
              </span>
              <a
                href={`mailto:${MLA_OFFICE.email}`}
                className="mla-info-link"
                title={MLA_OFFICE.email}
              >
                {MLA_OFFICE.email}
              </a>
            </div>

            {/* 24/7 Phone */}
            <div className="mla-info-item">
              <span className="mla-info-icon" aria-hidden="true">
                <Phone size={22} strokeWidth={2.4} />
              </span>
              <div className="mla-phone-row">
                <span className="mla-badge-247">{MLA_OFFICE.phoneBadge}</span>
                <a
                  href={`tel:${MLA_OFFICE.phone.replace(/[^0-9+]/g, "")}`}
                  className="mla-info-link mla-phone-link"
                >
                  {MLA_OFFICE.phoneDisplay}
                </a>
              </div>
            </div>

            {/* Share this location */}
            <div className="mla-info-item">
              <span className="mla-info-icon" aria-hidden="true">
                <Share2 size={22} strokeWidth={2.4} />
              </span>
              <button
                type="button"
                className="mla-share-btn"
                onClick={handleShareLocation}
                title={tamil ? "இடத்தைப் பகிரவும்" : "Share this location"}
              >
                {copied ? (
                  <span className="mla-copied-feedback">
                    <Check size={16} /> {tamil ? "இணைப்பு நகலெடுக்கப்பட்டது!" : "Link copied!"}
                  </span>
                ) : (
                  <span>{tamil ? "இடத்தைப் பகிரவும்" : "Share this location"}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map with Floating Directions Button */}
        <div className="mla-map-wrapper">
          <div ref={mapContainerRef} className="mla-leaflet-map" />

          {/* Floating Directions Button matching reference image */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${MLA_OFFICE.lat},${MLA_OFFICE.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mla-directions-btn"
            onClick={(e) => {
              e.preventDefault();
              openDirections();
            }}
            title={tamil ? "Google Maps வழிகாட்டல் பெறுக" : "Get Directions in Google Maps"}
          >
            <GitFork size={18} className="directions-icon" />
            <span>{tamil ? "வழிகாட்டல்" : "Directions"}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
