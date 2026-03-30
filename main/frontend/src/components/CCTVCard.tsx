import { useEffect, useRef } from 'react';
import type { CCTV } from '../types';

interface CCTVCardProps {
  cctv: CCTV;
  isEmergency: boolean;
  routeStatus: 'passed' | 'current' | 'next' | 'pending' | null;
}

const statusLabels = {
  normal: 'NORMAL',
  high_traffic: 'HIGH TRAFFIC',
  emergency: 'EMERGENCY',
};

// Regular traffic vehicle
interface PerspVehicle {
  z: number;        // 0 = far (horizon), 1 = near (camera)
  lane: number;      // 0 = left, 1 = center, 2 = right
  speed: number;
  color: string;
  type: 'car' | 'truck' | 'suv';
}

// Ambulance (shown only on emergency CCTVs)
interface AmbulanceVehicle {
  z: number;
  lane: number;
  speed: number;
  isFlashing: boolean;
  flashTimer: number;
}

// Pre-computed building stored with relative positions (0-1 range)
interface BuildingData {
  relX: number;      // relative x position (0-1 of canvas width)
  relY: number;       // relative y offset from horizon
  relW: number;       // relative width
  relH: number;       // relative height
  colorIdx: number;
  windowPattern: number[][];  // 0=dark, 1=warm, 2=cool
}

interface CCTVScene {
  vehicles: PerspVehicle[];
  buildings: { left: BuildingData[]; right: BuildingData[] };
  ambulance: AmbulanceVehicle | null;
  sceneSeed: number;    // stable seed for this CCTV
}

const SEED_COLORS = [
  '#c92a2a', '#fd7e14', '#2b8a3e', '#1c7ed6', '#7048e8', '#f72585',
  '#20c997', '#e599f7', '#f03e3e', '#0dcaf0',
];

const BUILDING_COLORS = [
  '#1a1f2e', '#1f2533', '#232938', '#1c2230', '#252d3d',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function createScene(seed: number): CCTVScene {
  const rng = seededRandom(seed);
  const vehicles: PerspVehicle[] = [];
  const types: ('car' | 'truck' | 'suv')[] = ['car', 'truck', 'suv'];

  for (let i = 0; i < 8; i++) {
    vehicles.push({
      z: rng(),
      lane: Math.floor(rng() * 3),
      speed: 0.003 + rng() * 0.006,
      color: SEED_COLORS[Math.floor(rng() * SEED_COLORS.length)],
      type: types[Math.floor(rng() * types.length)],
    });
  }

  // Pre-compute buildings with RELATIVE positions (scale to canvas at draw time)
  // This prevents flickering — building positions are fixed, not re-randomized each frame
  const buildingCount = 4;
  const leftBuildings: BuildingData[] = [];
  const rightBuildings: BuildingData[] = [];

  for (let i = 0; i < buildingCount; i++) {
    const height = 25 + rng() * 55;
    const width = 30 + rng() * 40;
    const colorIdx = Math.floor(rng() * BUILDING_COLORS.length);

    // Window pattern (stable once generated)
    const windowRows = Math.floor(height / 12);
    const windowCols = Math.floor(width / 14);
    const windowPattern: number[][] = [];
    for (let row = 0; row < windowRows; row++) {
      const rowPattern: number[] = [];
      for (let col = 0; col < windowCols; col++) {
        rowPattern.push(rng() > 0.35 ? (rng() > 0.5 ? 1 : 2) : 0);
      }
      windowPattern.push(rowPattern);
    }

    // Left buildings: x relative to left edge
    leftBuildings.push({
      relX: rng() * 0.33,
      relY: 0, // set from horizon in draw
      relW: width,
      relH: height,
      colorIdx,
      windowPattern,
    });

    // Right buildings: x relative to right portion of canvas
    rightBuildings.push({
      relX: 0.70 + rng() * 0.30 - (width / 400),
      relY: 0,
      relW: width,
      relH: height,
      colorIdx,
      windowPattern,
    });
  }

  return {
    vehicles,
    buildings: { left: leftBuildings, right: rightBuildings },
    ambulance: null,
    sceneSeed: seed,
    // rng state not stored — we use seededRandom at draw time for vehicle respawn only
  };
}

function drawPerspectiveScene(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  scene: CCTVScene,
  isEmergency: boolean,
  time: number
) {
  const horizonY = H * 0.42;
  const vpX = W * 0.5;

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#0a0e1a');
  skyGrad.addColorStop(0.5, '#141b2d');
  skyGrad.addColorStop(1, '#1a2235');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, horizonY);

  // Ground / sidewalk area
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
  groundGrad.addColorStop(0, '#1c2030');
  groundGrad.addColorStop(1, '#0d1018');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, horizonY, W, H - horizonY);

  // Road vanishing point
  const roadBottomLeft = { x: W * 0.05, y: H };
  const roadBottomRight = { x: W * 0.95, y: H };
  const roadTopLeft = { x: W * 0.42, y: horizonY };
  const roadTopRight = { x: W * 0.58, y: horizonY };

  // Road surface
  ctx.beginPath();
  ctx.moveTo(roadTopLeft.x, roadTopLeft.y);
  ctx.lineTo(roadTopRight.x, roadTopRight.y);
  ctx.lineTo(roadBottomRight.x, roadBottomRight.y);
  ctx.lineTo(roadBottomLeft.x, roadBottomLeft.y);
  ctx.closePath();
  ctx.fillStyle = '#252a33';
  ctx.fill();

  // Road edge lines
  ctx.beginPath();
  ctx.moveTo(roadTopLeft.x, roadTopLeft.y);
  ctx.lineTo(roadBottomLeft.x, roadBottomLeft.y);
  ctx.strokeStyle = '#3a4050';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(roadTopRight.x, roadTopRight.y);
  ctx.lineTo(roadBottomRight.x, roadBottomRight.y);
  ctx.stroke();

  // Lane dividers (dashed center lines with perspective)
  const laneWidthAtBottom = (roadBottomRight.x - roadBottomLeft.x) / 3;

  for (let lane = 1; lane <= 2; lane++) {
    const bottomX = roadBottomLeft.x + lane * laneWidthAtBottom;
    const t = lane / 3;
    const topX = roadTopLeft.x + t * (roadTopRight.x - roadTopLeft.x);

    ctx.beginPath();
    ctx.moveTo(topX, horizonY);
    ctx.lineTo(bottomX, H);
    ctx.strokeStyle = 'rgba(255, 220, 100, 0.6)';
    ctx.lineWidth = 1.5;

    // Draw dashed segments with perspective
    const dashLength = 15;
    const gapLength = 20;
    let currentZ = 0;
    let drawing = true;

    while (currentZ < 1) {
      const segLength = drawing ? dashLength : gapLength;
      const nextZ = currentZ + segLength / (H - horizonY);
      if (drawing) {
        const y1 = horizonY + currentZ * (H - horizonY);
        const y2 = horizonY + Math.min(nextZ, 1) * (H - horizonY);
        const x1 = topX + (bottomX - topX) * currentZ;
        const x2 = topX + (bottomX - topX) * Math.min(nextZ, 1);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      currentZ = nextZ;
      drawing = !drawing;
    }
  }

  // Draw buildings — using PRE-COMPUTED relative positions (no flickering)
  drawBuildings(ctx, W, horizonY, scene.buildings);

  // Draw regular vehicles with perspective depth
  const sortedVehicles = [...scene.vehicles].sort((a, b) => a.z - b.z);
  for (const v of sortedVehicles) {
    drawVehicle(ctx, W, H, horizonY, v, vpX);
  }

  // Draw ambulance if this CCTV is in emergency state
  if (isEmergency && scene.ambulance) {
    drawAmbulance(ctx, W, H, horizonY, scene.ambulance, vpX, time);
  }

  // Ambient lighting at top
  const ambientTop = ctx.createLinearGradient(0, 0, 0, H * 0.15);
  ambientTop.addColorStop(0, 'rgba(0,0,0,0.25)');
  ambientTop.addColorStop(1, 'transparent');
  ctx.fillStyle = ambientTop;
  ctx.fillRect(0, 0, W, H * 0.15);

  // Vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H * 0.5, H * 0.85);
  vig.addColorStop(0, 'transparent');
  vig.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Lens edge darkening
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, 0, W, 3);
  ctx.fillRect(0, H - 3, W, 3);
  ctx.fillRect(0, 0, 3, H);
  ctx.fillRect(W - 3, 0, 3, H);
}

function drawBuildings(ctx: CanvasRenderingContext2D, W: number, horizonY: number, buildings: { left: BuildingData[]; right: BuildingData[] }) {
  // Left buildings
  for (const b of buildings.left) {
    const x = b.relX * W;
    const y = horizonY - b.relH;
    const w = b.relW;
    const h = b.relH;

    // Building body
    ctx.fillStyle = BUILDING_COLORS[b.colorIdx];
    ctx.fillRect(x, y, w, h);

    // Windows
    const windowRows = b.windowPattern.length;
    const windowCols = b.windowPattern[0]?.length ?? 0;
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const state = b.windowPattern[row][col];
        if (state === 1) ctx.fillStyle = 'rgba(255, 230, 150, 0.7)';
        else if (state === 2) ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
        else ctx.fillStyle = 'rgba(30, 40, 60, 0.8)';
        ctx.fillRect(x + 4 + col * 13, y + 5 + row * 11, 8, 6);
      }
    }

    // Rooftop detail
    ctx.fillStyle = '#252d3d';
    ctx.fillRect(x + w * 0.3, y - 4, w * 0.4, 4);
  }

  // Right buildings
  for (const b of buildings.right) {
    const x = b.relX * W;
    const y = horizonY - b.relH;
    const w = b.relW;
    const h = b.relH;

    ctx.fillStyle = BUILDING_COLORS[b.colorIdx];
    ctx.fillRect(x, y, w, h);

    const windowRows = b.windowPattern.length;
    const windowCols = b.windowPattern[0]?.length ?? 0;
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const state = b.windowPattern[row][col];
        if (state === 1) ctx.fillStyle = 'rgba(255, 230, 150, 0.7)';
        else if (state === 2) ctx.fillStyle = 'rgba(150, 200, 255, 0.5)';
        else ctx.fillStyle = 'rgba(30, 40, 60, 0.8)';
        ctx.fillRect(x + 4 + col * 13, y + 5 + row * 11, 8, 6);
      }
    }

    ctx.fillStyle = '#252d3d';
    ctx.fillRect(x + w * 0.3, y - 4, w * 0.4, 4);
  }
}

function drawVehicle(ctx: CanvasRenderingContext2D, W: number, H: number, horizonY: number, v: PerspVehicle, vpX: number) {
  const scale = 0.12 + v.z * 0.88;
  const laneOffset = (v.lane - 1) * (W * 0.05 + v.z * W * 0.10);
  const centerX = vpX + laneOffset;
  const screenY = horizonY + v.z * (H - horizonY);

  const baseW = v.type === 'truck' ? 32 : v.type === 'suv' ? 26 : 20;
  const baseH = v.type === 'truck' ? 18 : v.type === 'suv' ? 14 : 11;
  const vw = baseW * scale;
  const vh = baseH * scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, screenY + 2, vw * 0.6, vh * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Car body
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = v.color;
  ctx.beginPath();
  ctx.roundRect(centerX - vw / 2, screenY - vh, vw, vh, Math.max(2, vh * 0.2));
  ctx.fill();
  ctx.shadowBlur = 0;

  // Windshield
  ctx.fillStyle = 'rgba(80, 120, 160, 0.6)';
  ctx.beginPath();
  ctx.roundRect(centerX - vw / 2 + vw * 0.15, screenY - vh * 0.85, vw * 0.45, vh * 0.4, Math.max(1, vh * 0.1));
  ctx.fill();

  // Headlights (approaching camera)
  if (v.z > 0.25) {
    const headlightAlpha = Math.min(0.9, (v.z - 0.25) * 1.5);
    ctx.fillStyle = `rgba(255, 255, 220, ${headlightAlpha})`;
    ctx.beginPath();
    ctx.ellipse(centerX - vw * 0.3, screenY - vh * 0.15, vw * 0.1, vh * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + vw * 0.3, screenY - vh * 0.15, vw * 0.1, vh * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Headlight glow
    const glowGrad = ctx.createRadialGradient(centerX, screenY - vh * 0.5, 0, centerX, screenY - vh * 0.5, vw);
    glowGrad.addColorStop(0, `rgba(255, 255, 200, ${headlightAlpha * 0.15})`);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(centerX - vw, screenY - vh * 2, vw * 2, vh * 1.5);
  }

  // Tail lights (away from camera)
  if (v.z < 0.75) {
    const tailAlpha = Math.min(0.8, (0.75 - v.z) * 2);
    ctx.fillStyle = `rgba(255, 30, 30, ${tailAlpha})`;
    ctx.fillRect(centerX - vw * 0.4, screenY - vh * 0.95, vw * 0.15, vh * 0.18);
    ctx.fillRect(centerX + vw * 0.25, screenY - vh * 0.95, vw * 0.15, vh * 0.18);
  }
}

function drawAmbulance(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  horizonY: number,
  amb: AmbulanceVehicle,
  vpX: number,
  time: number
) {
  const scale = 0.15 + amb.z * 0.85;
  // Ambulance always in center lane for visibility
  const centerX = vpX + (amb.lane - 1) * (W * 0.05 + amb.z * W * 0.10);
  const screenY = horizonY + amb.z * (H - horizonY);

  const baseW = 34 * scale;
  const baseH = 20 * scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(centerX, screenY + 2, baseW * 0.6, baseH * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // === Flashing lights on top ===
  const flashState = Math.floor(time / 8) % 2 === 0;
  const lightSize = Math.max(3, baseW * 0.12);

  // Red light (left)
  ctx.shadowColor = flashState ? '#ff2020' : '#880000';
  ctx.shadowBlur = flashState ? 12 : 4;
  ctx.fillStyle = flashState ? '#ff2020' : '#aa0000';
  ctx.beginPath();
  ctx.arc(centerX - baseW * 0.22, screenY - baseH * 0.85, lightSize, 0, Math.PI * 2);
  ctx.fill();

  // Blue light (right)
  ctx.shadowColor = !flashState ? '#2060ff' : '#001488';
  ctx.shadowBlur = !flashState ? 12 : 4;
  ctx.fillStyle = !flashState ? '#2060ff' : '#0022aa';
  ctx.beginPath();
  ctx.arc(centerX + baseW * 0.22, screenY - baseH * 0.85, lightSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;

  // === Ambulance body (white) ===
  ctx.fillStyle = '#f0f0f0';
  ctx.beginPath();
  ctx.roundRect(centerX - baseW / 2, screenY - baseH, baseW, baseH, Math.max(2, baseH * 0.15));
  ctx.fill();

  // Body outline
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(centerX - baseW / 2, screenY - baseH, baseW, baseH, Math.max(2, baseH * 0.15));
  ctx.stroke();

  // === Red cross on sides ===
  const crossW = baseW * 0.35;
  const crossH = baseH * 0.55;
  const crossThick = baseW * 0.08;
  ctx.fillStyle = '#cc1111';

  // Front side cross (near camera)
  const frontX = centerX - baseW * 0.2;
  // Vertical bar
  ctx.fillRect(frontX - crossThick / 2, screenY - baseH * 0.85, crossThick, crossH);
  // Horizontal bar
  ctx.fillRect(frontX - crossW / 2, screenY - baseH * 0.85 + crossH * 0.25, crossW, crossThick);

  // === Windshield ===
  ctx.fillStyle = 'rgba(100, 150, 200, 0.7)';
  ctx.beginPath();
  ctx.roundRect(centerX - baseW * 0.35, screenY - baseH * 0.8, baseW * 0.38, baseH * 0.35, Math.max(1, baseH * 0.1));
  ctx.fill();

  // === Headlights ===
  if (amb.z > 0.3) {
    const headAlpha = Math.min(0.9, (amb.z - 0.3) * 1.5);
    ctx.fillStyle = `rgba(255, 255, 220, ${headAlpha})`;
    ctx.beginPath();
    ctx.ellipse(centerX - baseW * 0.35, screenY - baseH * 0.15, baseW * 0.08, baseH * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + baseW * 0.35, screenY - baseH * 0.15, baseW * 0.08, baseH * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // === Light bar on top ===
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.roundRect(centerX - baseW * 0.3, screenY - baseH - 3, baseW * 0.6, 4, 2);
  ctx.fill();
}

export default function CCTVCard({ cctv, isEmergency, routeStatus }: CCTVCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CCTVScene | null>(null);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const seed = cctv.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    sceneRef.current = createScene(seed);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!canvas || !ctx || !sceneRef.current) return;
      const scene = sceneRef.current;
      const W = canvas.width;
      const H = canvas.height;

      const isEmergency = cctv.status === 'emergency';
      drawPerspectiveScene(ctx, W, H, scene, isEmergency, scene.time);

      // Update regular vehicle positions using seeded random (deterministic respawn)
      const rng = seededRandom(seed + scene.time);
      for (const v of scene.vehicles) {
        v.z += v.speed;
        if (v.z > 1.15) {
          // Respawn at horizon with deterministic values (no Math.random)
          v.z = -0.05 + rng() * 0.08;
          v.lane = Math.floor(rng() * 3);
          v.color = SEED_COLORS[Math.floor(rng() * SEED_COLORS.length)];
        }
      }

      // Update ambulance position if active
      if (isEmergency) {
        if (!scene.ambulance) {
          // Spawn ambulance at horizon
          scene.ambulance = {
            z: -0.05,
            lane: 1,  // center lane
            speed: 0.004,
            isFlashing: true,
            flashTimer: 0,
          };
        }
        if (scene.ambulance) {
          scene.ambulance.z += scene.ambulance.speed;
          scene.ambulance.flashTimer++;
          if (scene.ambulance.z > 1.15) {
            // Respawn at horizon
            scene.ambulance.z = -0.05;
          }
        }
      } else {
        scene.ambulance = null;
      }

      scene.time++;
      rafRef.current = requestAnimationFrame(draw);
    };

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const ro = new ResizeObserver(resize);
    if (containerRef.current) {
      ro.observe(containerRef.current);
      resize();
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [cctv.id, cctv.status]);

  // Determine highlight: current (red), next (yellow), passed (green)
  // If status is 'emergency' it means ambulance is present at this CCTV
  const highlightClass = routeStatus === 'current' ? 'highlight-current'
    : routeStatus === 'next' ? 'highlight-next'
    : routeStatus === 'passed' ? 'highlight-passed'
    : '';

  return (
    <div className={`cctv-card ${cctv.status} ${highlightClass}`}>
      <div className="cctv-header">
        <div className="cctv-title">CCTV {cctv.id}</div>
        <div className="cctv-live-badge">
          <span className="cctv-live-dot" />
          LIVE
        </div>
      </div>
      <div className="cctv-feed" ref={containerRef}>
        <canvas ref={canvasRef} className="cctv-canvas" />
        <div className="cctv-feed-overlay">
          <span className="cctv-feed-tag">REC</span>
          <span className={`cctv-feed-tag status-${cctv.status}`}>{cameraStatus(cctv.status)}</span>
        </div>
      </div>
      <div className="cctv-footer">
        <div className={`cctv-status ${cctv.status}`}>
          <span className={`cctv-status-dot ${cctv.status === 'emergency' ? 'emergency' : ''}`} />
          {statusLabels[cctv.status]}
        </div>
      </div>
    </div>
  );
}

function cameraStatus(status: CCTV['status']): string {
  switch (status) {
    case 'normal': return 'CAM OK';
    case 'high_traffic': return 'TRAFFIC';
    case 'emergency': return 'ALERT';
  }
}
