/**
 * ==========================================================================
 * DIETPI COMMAND CENTER (BMB20) - 3D MULTI-VIEW HOLOGRAPHIC STAGE
 * Modes: Planetary (Earth), Solar System (Helios), Starfleet Galaxy Map
 * High-performance lightweight Three.js WebGL (< 5% CPU on Raspberry Pi 3)
 * ==========================================================================
 */

let scene, camera, renderer;
let earthGroup, solarGroup, galaxyGroup;
let currentHologramView = 'earth';

// Earth View Variables
let earthPoints, globeMesh, ringMesh, beaconMesh, satelliteMesh;
let satAngle = 0;

// Solar System View Variables
let solarPlanets = [];
let solarSunMesh;

// Galaxy View Variables
let galaxyPoints;

// Alert Color State (Default Cyan)
let currentStageColor = 0x66ccff;
let currentCoreColor = 0x1e4585;

// Color Theme Palettes for Alert Modes
const HOLO_COLORS = {
    green: { primary: 0x66ccff, core: 0x1e4585, glow: 0xaaddff },
    yellow: { primary: 0xffcc66, core: 0x554400, glow: 0xffeeaa },
    red: { primary: 0xcc3333, core: 0x4a0e0e, glow: 0xff6666 }
};

function initEarth() {
    const container = document.getElementById('earth-container');
    if (!container) return;

    // Clear previous elements if re-initializing
    container.innerHTML = '';

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // 1. Scene & Camera Setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 240;

    // 2. Renderer with High Performance Optimizations
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 3. Create Root Model Groups
    earthGroup = new THREE.Group();
    solarGroup = new THREE.Group();
    galaxyGroup = new THREE.Group();

    scene.add(earthGroup);
    scene.add(solarGroup);
    scene.add(galaxyGroup);

    // Build the 3 Models
    buildEarthModel();
    buildSolarModel();
    buildGalaxyModel();

    // Set Initial Visibility
    earthGroup.visible = true;
    solarGroup.visible = false;
    galaxyGroup.visible = false;

    // Handle Window Resize
    window.addEventListener('resize', onWindowResize, false);

    // Start Master Render Loop
    animate();
}

/**
 * ==========================================================================
 * MODEL 1: PLANETARY POINT-CLOUD EARTH
 * ==========================================================================
 */
function buildEarthModel() {
    const radius = 62;

    // A. Inner Translucent Wireframe Core
    const sphereGeo = new THREE.SphereGeometry(radius - 1, 24, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: HOLO_COLORS.green.core,
        wireframe: true,
        transparent: true,
        opacity: 0.18
    });
    globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    earthGroup.add(globeMesh);

    // B. Point-Cloud Continent Geometry
    const particleCount = 3600;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const baseColor = new THREE.Color(HOLO_COLORS.green.primary);

    let pIdx = 0;
    for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const lat = (0.5 * Math.PI - phi) * (180 / Math.PI);
        const lon = (theta - Math.PI) * (180 / Math.PI);

        // Continental density weighting
        const isLand = checkContinentalWeight(lat, lon);
        if (isLand || Math.random() < 0.14) {
            const r = radius + (Math.random() * 1.5);
            positions[pIdx * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[pIdx * 3 + 1] = r * Math.cos(phi);
            positions[pIdx * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

            colors[pIdx * 3] = baseColor.r;
            colors[pIdx * 3 + 1] = baseColor.g;
            colors[pIdx * 3 + 2] = baseColor.b;
            pIdx++;
        }
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, pIdx * 3), 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors.subarray(0, pIdx * 3), 3));

    const particleMat = new THREE.PointsMaterial({
        size: 2.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.85
    });

    earthPoints = new THREE.Points(particleGeo, particleMat);
    earthGroup.add(earthPoints);

    // C. Orbital Equator Ring
    const ringGeo = new THREE.RingGeometry(radius + 14, radius + 15.5, 48);
    const ringMat = new THREE.MeshBasicMaterial({
        color: HOLO_COLORS.green.primary,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
        wireframe: true
    });
    ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.3;
    earthGroup.add(ringMesh);

    // D. Sector 001 Tactical Malaysia Beacon
    const bLat = 3.1390 * (Math.PI / 180);
    const bLon = 101.6869 * (Math.PI / 180);
    const bx = (radius + 2) * Math.cos(bLat) * Math.sin(bLon + Math.PI / 2);
    const by = (radius + 2) * Math.sin(bLat);
    const bz = (radius + 2) * Math.cos(bLat) * Math.cos(bLon + Math.PI / 2);

    const bGeo = new THREE.SphereGeometry(2.2, 8, 8);
    const bMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 });
    beaconMesh = new THREE.Mesh(bGeo, bMat);
    beaconMesh.position.set(bx, by, bz);
    earthGroup.add(beaconMesh);

    // E. Tactical Orbiting Satellite
    const satGeo = new THREE.BoxGeometry(2.5, 1.2, 1.2);
    const satMat = new THREE.MeshBasicMaterial({ color: 0xffddaa });
    satelliteMesh = new THREE.Mesh(satGeo, satMat);
    earthGroup.add(satelliteMesh);
}

function checkContinentalWeight(lat, lon) {
    if (lat > 35 && lat < 70 && lon > -10 && lon < 40) return true; // Europe
    if (lat > 5 && lat < 70 && lon > 40 && lon < 145) return true; // Asia
    if (lat > -10 && lat < 8 && lon > 95 && lon < 120) return true; // SE Asia / MY
    if (lat > -35 && lat < 37 && lon > -18 && lon < 52) return true; // Africa
    if (lat > 15 && lat < 72 && lon > -168 && lon < -52) return true; // N. America
    if (lat > -55 && lat < 12 && lon > -82 && lon < -34) return true; // S. America
    if (lat > -45 && lat < -10 && lon > 112 && lon < 155) return true; // Australia
    return false;
}

/**
 * ==========================================================================
 * MODEL 2: SOLAR SYSTEM HELIOS ORBIT VIEW
 * ==========================================================================
 */
function buildSolarModel() {
    // A. Central Sol Star
    const sunGeo = new THREE.SphereGeometry(14, 20, 20);
    const sunMat = new THREE.MeshBasicMaterial({
        color: 0xffcc44,
        wireframe: true,
        transparent: true,
        opacity: 0.9
    });
    solarSunMesh = new THREE.Mesh(sunGeo, sunMat);
    solarGroup.add(solarSunMesh);

    // B. 8 Planetary Bodies & Orbit Rings
    const planetsConfig = [
        { name: "Mercury", dist: 26, size: 1.6, color: 0xaaaaaa, speed: 0.040 },
        { name: "Venus", dist: 36, size: 2.4, color: 0xffcc88, speed: 0.028 },
        { name: "Earth", dist: 48, size: 2.8, color: 0x66ccff, speed: 0.020 },
        { name: "Mars", dist: 60, size: 2.0, color: 0xff5533, speed: 0.015 },
        { name: "Jupiter", dist: 78, size: 5.5, color: 0xddaa77, speed: 0.009 },
        { name: "Saturn", dist: 96, size: 4.8, color: 0xeeddbb, speed: 0.006, hasRing: true },
        { name: "Uranus", dist: 112, size: 3.6, color: 0x66ddff, speed: 0.004 },
        { name: "Neptune", dist: 126, size: 3.4, color: 0x3366ff, speed: 0.003 }
    ];

    solarPlanets = [];

    planetsConfig.forEach(p => {
        // Orbit Path Wireframe Ring
        const oGeo = new THREE.RingGeometry(p.dist - 0.2, p.dist + 0.2, 64);
        const oMat = new THREE.MeshBasicMaterial({
            color: HOLO_COLORS.green.primary,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.22,
            wireframe: true
        });
        const orbitMesh = new THREE.Mesh(oGeo, oMat);
        orbitMesh.rotation.x = Math.PI / 2.15;
        solarGroup.add(orbitMesh);

        // Planet Sphere
        const pGeo = new THREE.SphereGeometry(p.size, 10, 10);
        const pMat = new THREE.MeshBasicMaterial({ color: p.color, wireframe: true });
        const pMesh = new THREE.Mesh(pGeo, pMat);

        // Saturn Ring
        if (p.hasRing) {
            const rGeo = new THREE.RingGeometry(p.size + 1.5, p.size + 4.0, 24);
            const rMat = new THREE.MeshBasicMaterial({ color: 0xddcc99, side: THREE.DoubleSide, wireframe: true });
            const sRing = new THREE.Mesh(rGeo, rMat);
            sRing.rotation.x = Math.PI / 3;
            pMesh.add(sRing);
        }

        solarGroup.add(pMesh);

        solarPlanets.push({
            mesh: pMesh,
            dist: p.dist,
            speed: p.speed,
            angle: Math.random() * Math.PI * 2
        });
    });

    solarGroup.rotation.x = 0.35;
}

/**
 * ==========================================================================
 * MODEL 3: STARFLEET GALAXY MAP (SECTOR 001 DISK)
 * ==========================================================================
 */
function buildGalaxyModel() {
    const starCount = 3800;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const baseColor = new THREE.Color(HOLO_COLORS.green.primary);
    const coreColor = new THREE.Color(0xffffff);

    for (let i = 0; i < starCount; i++) {
        // 2-arm Logarithmic Spiral
        const arm = (i % 2) * Math.PI;
        const dist = Math.pow(Math.random(), 2.0) * 110 + 2;
        const angle = arm + dist * 0.08 + (Math.random() - 0.5) * 0.45;

        const x = Math.cos(angle) * dist;
        const z = Math.sin(angle) * dist;
        const y = (Math.random() - 0.5) * (18 - (dist * 0.12));

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        if (dist < 20) {
            colors[i * 3] = coreColor.r;
            colors[i * 3 + 1] = coreColor.g;
            colors[i * 3 + 2] = coreColor.b;
        } else {
            colors[i * 3] = baseColor.r;
            colors[i * 3 + 1] = baseColor.g;
            colors[i * 3 + 2] = baseColor.b;
        }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
        size: 1.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.85
    });

    galaxyPoints = new THREE.Points(geo, mat);
    galaxyGroup.add(galaxyPoints);

    // Galaxy Quadrant Crosshair Grid
    const gridGeo = new THREE.RingGeometry(118, 120, 48);
    const gridMat = new THREE.MeshBasicMaterial({ color: HOLO_COLORS.green.primary, wireframe: true, transparent: true, opacity: 0.3 });
    const gridRing = new THREE.Mesh(gridGeo, gridMat);
    gridRing.rotation.x = Math.PI / 2;
    galaxyGroup.add(gridRing);

    galaxyGroup.rotation.x = 0.55;
}

/**
 * ==========================================================================
 * INTERACTIVE VIEW SWITCHER ENGINE
 * ==========================================================================
 */
function switchHologramView(mode) {
    if (!['earth', 'solar', 'galaxy'].includes(mode)) return;
    currentHologramView = mode;

    if (earthGroup) earthGroup.visible = (mode === 'earth');
    if (solarGroup) solarGroup.visible = (mode === 'solar');
    if (galaxyGroup) galaxyGroup.visible = (mode === 'galaxy');

    // Update Stage Buttons
    const btnPlanet = document.getElementById('holo-btn-planet');
    const btnSystem = document.getElementById('holo-btn-system');
    const btnGalaxy = document.getElementById('holo-btn-galaxy');
    const subtitle = document.getElementById('hero-subtitle');

    [btnPlanet, btnSystem, btnGalaxy].forEach(b => {
        if (b) {
            b.classList.remove('bg-primary', 'text-black', 'active-condition');
            b.classList.add('bg-surface-bright', 'text-on-surface-variant');
        }
    });

    const coords = document.getElementById('hero-coords');

    if (mode === 'earth') {
        if (btnPlanet) {
            btnPlanet.classList.add('bg-primary', 'text-black', 'active-condition');
            btnPlanet.classList.remove('bg-surface-bright', 'text-on-surface-variant');
        }
        if (subtitle) subtitle.innerText = "TARGET: SECTOR 001 [MALAYSIA]";
        if (coords) coords.innerText = "GEO-COORD: 02° 48' N, 101° 30' E // INCL: 23.4°";
        if (window.speakComputerVoice) window.speakComputerVoice("Sector 001 Earth telemetry active.");
    } else if (mode === 'solar') {
        if (btnSystem) {
            btnSystem.classList.add('bg-primary', 'text-black', 'active-condition');
            btnSystem.classList.remove('bg-surface-bright', 'text-on-surface-variant');
        }
        if (subtitle) subtitle.innerText = "TARGET: SOL SYSTEM [8 PLANETS]";
        if (coords) coords.innerText = "HELIOCENTRIC: 0.00 AU // SOLAR FLUX: 1361 W/M²";
        if (window.speakComputerVoice) window.speakComputerVoice("Sol system orbital chart active.");
    } else if (mode === 'galaxy') {
        if (btnGalaxy) {
            btnGalaxy.classList.add('bg-primary', 'text-black', 'active-condition');
            btnGalaxy.classList.remove('bg-surface-bright', 'text-on-surface-variant');
        }
        if (subtitle) subtitle.innerText = "TARGET: MILKY WAY [ALPHA / BETA QUADRANTS]";
        if (coords) coords.innerText = "GALACTIC: RA 17h 45m / DEC -29° 00' // QUAD: ALPHA";
        if (window.speakComputerVoice) window.speakComputerVoice("Milky Way galactic chart active.");
    }

    if (window.playSound) window.playSound('beep2');
}

/**
 * ==========================================================================
 * DYNAMIC COLOR PALETTE SHIFTING (TACTICAL ALERT SYSTEM)
 * ==========================================================================
 */
function setGlobeAlertColor(condition) {
    const palette = HOLO_COLORS[condition] || HOLO_COLORS.green;
    currentStageColor = palette.primary;
    currentCoreColor = palette.core;

    const newCol = new THREE.Color(palette.primary);
    const newCore = new THREE.Color(palette.core);

    // Update Earth Group
    if (globeMesh) globeMesh.material.color = newCore;
    if (ringMesh) ringMesh.material.color = newCol;
    if (earthPoints && earthPoints.geometry.attributes.color) {
        const colors = earthPoints.geometry.attributes.color.array;
        for (let i = 0; i < colors.length; i += 3) {
            colors[i] = newCol.r;
            colors[i + 1] = newCol.g;
            colors[i + 2] = newCol.b;
        }
        earthPoints.geometry.attributes.color.needsUpdate = true;
    }

    // Update Galaxy Group
    if (galaxyPoints && galaxyPoints.geometry.attributes.color) {
        const gColors = galaxyPoints.geometry.attributes.color.array;
        for (let i = 0; i < gColors.length; i += 3) {
            gColors[i] = newCol.r;
            gColors[i + 1] = newCol.g;
            gColors[i + 2] = newCol.b;
        }
        galaxyPoints.geometry.attributes.color.needsUpdate = true;
    }
}

/**
 * ==========================================================================
 * 3D TACTICAL LINE CALLOUT NOTATIONS ENGINE
 * ==========================================================================
 */
const tempVector = new THREE.Vector3();

function toScreenCoord(object3D) {
    if (!object3D || !camera || !renderer) return null;
    const container = document.getElementById('earth-container');
    if (!container) return null;

    object3D.getWorldPosition(tempVector);
    const v = tempVector.clone();
    v.project(camera);

    const w = container.clientWidth;
    const h = container.clientHeight;

    // Check if behind camera
    if (v.z > 1.0) return null;

    return {
        x: (v.x * 0.5 + 0.5) * w,
        y: (-(v.y * 0.5) + 0.5) * h,
        visible: v.z < 1.0
    };
}

function updateCallouts() {
    const svg = document.getElementById('holo-callouts-svg');
    const dom = document.getElementById('holo-callout-dom');
    if (!svg || !dom) return;

    let svgLines = '';
    let domBadges = '';

    const renderCallout = (targetObj, title, sub, dx1, dy1, dx2, dy2) => {
        const pt = toScreenCoord(targetObj);
        if (!pt || !pt.visible) return;

        const x0 = Math.round(pt.x);
        const y0 = Math.round(pt.y);
        const x1 = Math.round(x0 + dx1);
        const y1 = Math.round(y0 + dy1);
        const x2 = Math.round(x1 + dx2);
        const y2 = y1;

        svgLines += `<circle cx="${x0}" cy="${y0}" r="2.5" class="callout-dot"/><path d="M ${x0},${y0} L ${x1},${y1} L ${x2},${y2}" class="callout-line"/>`;

        const badgeLeft = dx2 >= 0 ? x2 + 4 : x2 - 4;
        const transformX = dx2 >= 0 ? '0%' : '-100%';

        domBadges += `<div class="callout-badge" style="left: ${badgeLeft}px; top: ${y2}px; transform: translate(${transformX}, -50%);"><div class="callout-title">${title}</div><div class="callout-sub">${sub}</div></div>`;
    };

    if (currentHologramView === 'earth') {
        if (beaconMesh) {
            renderCallout(beaconMesh, "SECTOR 001", "MALAYSIA BASE [02.81°N]", 30, -22, 40, 0);
        }
        if (satelliteMesh) {
            renderCallout(satelliteMesh, "SAT-BMB20", "ALT: 420 KM // GEO-SYNC", -25, 20, -35, 0);
        }
    } else if (currentHologramView === 'solar') {
        if (solarSunMesh) {
            renderCallout(solarSunMesh, "SOL PRIMARY", "CLASS G2V // 5778 K", 25, -25, 45, 0);
        }
        if (solarPlanets[2] && solarPlanets[2].mesh) {
            renderCallout(solarPlanets[2].mesh, "PLANET III [TERRA]", "ORBIT: 1.00 AU // 29.8 KM/S", -20, 20, -40, 0);
        }
        if (solarPlanets[4] && solarPlanets[4].mesh) {
            renderCallout(solarPlanets[4].mesh, "JOVIAN SYSTEM", "5.20 AU // MASS: 318 EM", 30, 25, 35, 0);
        }
    } else if (currentHologramView === 'galaxy') {
        if (galaxyGroup) {
            renderCallout(galaxyGroup, "SAGITTARIUS A*", "SMBH // MASS: 4.1M SOL", 35, -25, 45, 0);
        }
    }

    svg.innerHTML = svgLines;
    dom.innerHTML = domBadges;
}

/**
 * ==========================================================================
 * MASTER ANIMATION LOOP
 * ==========================================================================
 */
function animate() {
    requestAnimationFrame(animate);

    if (!scene || !camera || !renderer) return;

    if (currentHologramView === 'earth') {
        // Planetary Rotation
        if (earthGroup) earthGroup.rotation.y += 0.0035;

        // Satellite Orbit Motion
        if (satelliteMesh) {
            satAngle += 0.018;
            const satRadius = 78;
            satelliteMesh.position.x = satRadius * Math.cos(satAngle);
            satelliteMesh.position.z = satRadius * Math.sin(satAngle);
            satelliteMesh.position.y = 18 * Math.sin(satAngle * 1.5);
            satelliteMesh.rotation.y = satAngle + Math.PI / 2;
        }
    } else if (currentHologramView === 'solar') {
        // Sol Star Pulse & Rotation
        if (solarSunMesh) solarSunMesh.rotation.y += 0.006;

        // Planets Orbit Propagation
        solarPlanets.forEach(p => {
            p.angle += p.speed;
            p.mesh.position.x = p.dist * Math.cos(p.angle);
            p.mesh.position.z = p.dist * Math.sin(p.angle);
            p.mesh.position.y = 0;
            p.mesh.rotation.y += 0.02;
        });

        if (solarGroup) solarGroup.rotation.y += 0.001;
    } else if (currentHologramView === 'galaxy') {
        // Galaxy Disk Rotation
        if (galaxyGroup) galaxyGroup.rotation.y += 0.0022;
    }

    renderer.render(scene, camera);
    updateCallouts();
}

function onWindowResize() {
    const container = document.getElementById('earth-container');
    if (!container || !renderer || !camera) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// Window Global Exports
window.initEarth = initEarth;
window.setGlobeAlertColor = setGlobeAlertColor;
window.switchHologramView = switchHologramView;
