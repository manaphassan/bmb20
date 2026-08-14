/**
 * ==========================================================================
 * DIETPI COMMAND CENTER (BMB20) - CONFIGURATION & DESIGN TOKENS
 * ==========================================================================
 */

// Tailwind CSS Theme Extension Token Map
tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "surface": "#131319",
                "surface-dim": "#0e0e14",
                "surface-bright": "#2a2930",
                "surface-container-lowest": "#0a0a0f",
                "surface-container-low": "#16161d",
                "surface-container": "#1b1b22",
                "surface-container-high": "#24232c",
                "surface-container-highest": "#302f3a",
                "on-surface": "#e4e1ea",
                "on-surface-variant": "#c7c5d4",
                "outline": "#918f9d",
                "outline-variant": "#464552",
                "primary": "#66ccff",
                "primary-container": "#1e4585",
                "on-primary": "#002e69",
                "secondary": "#adc6ff",
                "secondary-container": "#1e4585",
                "tertiary": "#ffcc66",
                "tertiary-container": "#bca30e",
                "on-tertiary": "#393000",
                "error": "#cc3333",
                "error-container": "#93000a",
                "on-error": "#ffdad6",
                "background": "#000000",
                "lcars-orange": "#ff9900",
                "lcars-gold": "#ffcc66",
                "lcars-blue": "#66ccff",
                "lcars-purple": "#cc6699",
                "lcars-red": "#cc3333",
                "lcars-tan": "#ffddaa"
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px",
                "hop": "24px"
            },
            fontFamily: {
                "body-sm": ["JetBrains Mono", "monospace"],
                "data-mono": ["Share Tech Mono", "JetBrains Mono", "monospace"],
                "headline-md": ["Antonio", "Anton", "sans-serif"],
                "label-caps": ["Space Mono", "monospace"],
                "headline-sm": ["Antonio", "Anton", "sans-serif"],
                "body-md": ["JetBrains Mono", "monospace"],
                "display-lg": ["Antonio", "Anton", "sans-serif"]
            }
        }
    }
};

// Global App Configuration
window.BMB20_CONFIG = {
    host: "192.168.0.100",
    hostname: "dietpi.local",
    telemetryEndpoint: "api.json",
    pollIntervalMs: 1000,
    services: {
        pihole: "http://dietpi.local:8089/admin/login",
        syncthing: "http://192.168.0.100:8384",
        filebrowser: "http://192.168.0.100:8084",
        tailscale: "https://login.tailscale.com/admin/machines",
        cockpit: "http://192.168.0.100:5252"
    },
    defaultLocation: {
        lat: 2.8125,
        lon: 101.5018,
        city: "BANTING / KL",
        country: "MY"
    }
};
