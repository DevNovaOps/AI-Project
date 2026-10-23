import React, { useEffect, useRef, useState } from 'react';
import '../../styles/plasma-cursor.css';

const TRAIL_LENGTH = 5;
const TRAIL_CONFIGS = [
  { size: 14, opacity: 0.38, color: 'rgba(56, 189, 248, 0.75)' },
  { size: 11, opacity: 0.28, color: 'rgba(99, 102, 241, 0.65)' },
  { size: 8,  opacity: 0.20, color: 'rgba(139, 92, 246, 0.55)' },
  { size: 6,  opacity: 0.12, color: 'rgba(168, 85, 247, 0.45)' },
  { size: 4,  opacity: 0.06, color: 'rgba(217, 70, 239, 0.35)' },
];

export default function PlasmaCursor() {
  const [ripples, setRipples] = useState([]);
  const [isHovering, setIsHovering] = useState(false);
  const [inNativeZone, setInNativeZone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  // Animation references
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const trailPositions = useRef(
    Array.from({ length: TRAIL_LENGTH }, () => ({ x: -100, y: -100 }))
  );
  
  const orbRef = useRef(null);
  const trailRefs = useRef([]);
  const animFrameId = useRef(null);

  // Check touch devices & prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) {
      setIsSupported(false);
      return;
    }

    document.documentElement.classList.add('plasma-cursor-active');

    return () => {
      document.documentElement.classList.remove('plasma-cursor-active');
    };
  }, []);

  // Mouse & interaction listeners
  useEffect(() => {
    if (!isSupported) return;

    const checkNativeTarget = (el) => {
      if (!el) return false;
      // Monaco editor lines, content, margin, or cursor elements
      if (el.closest('.monaco-editor, .monaco-mouse-cursor-text, .view-lines, .view-line, .margin, .monaco-scrollable-element')) {
        return true;
      }
      // Native text inputs and textareas
      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable) {
        return true;
      }
      // Resizer handles & native cursor zones
      if (el.closest('.resizer, [data-resize]') || (el.className && typeof el.className === 'string' && el.className.includes('resize'))) {
        return true;
      }
      return false;
    };

    const checkClickable = (el) => {
      if (!el) return false;
      if (el.closest('button, a, [role="button"], .btn, input[type="submit"], input[type="button"], .tab, .tree-node, .activity-item, .palette-item, [onclick]')) {
        return true;
      }
      try {
        const style = window.getComputedStyle(el);
        if (style.cursor === 'pointer') return true;
      } catch (e) {}
      return false;
    };

    const handlePointerMove = (e) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;

      if (!isVisible) setIsVisible(true);

      const targetEl = e.target;
      const isNative = checkNativeTarget(targetEl);
      setInNativeZone(isNative);

      if (!isNative) {
        const clickable = checkClickable(targetEl);
        setIsHovering(clickable);
      } else {
        setIsHovering(false);
      }
    };

    const handlePointerDown = (e) => {
      if (checkNativeTarget(e.target)) return;
      
      const newRipple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY
      };
      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 480);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isSupported, isVisible]);

  // High-performance RAF lerp render loop (modifies transform without React state thrashing)
  useEffect(() => {
    if (!isSupported) return;

    let isRunning = true;

    const renderLoop = () => {
      if (!isRunning) return;

      const target = targetPos.current;
      const current = currentPos.current;

      // Initialize position on first move
      if (current.x === -100 && target.x !== -100) {
        current.x = target.x;
        current.y = target.y;
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          trailPositions.current[i].x = target.x;
          trailPositions.current[i].y = target.y;
        }
      }

      // Smooth lerp easing for main orb
      current.x += (target.x - current.x) * 0.44;
      current.y += (target.y - current.y) * 0.44;

      if (orbRef.current) {
        orbRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }

      // Smooth trailing nodes
      let prevX = current.x;
      let prevY = current.y;

      for (let i = 0; i < TRAIL_LENGTH; i++) {
        const nodePos = trailPositions.current[i];
        nodePos.x += (prevX - nodePos.x) * 0.54;
        nodePos.y += (prevY - nodePos.y) * 0.54;

        const nodeEl = trailRefs.current[i];
        if (nodeEl) {
          nodeEl.style.transform = `translate3d(${nodePos.x}px, ${nodePos.y}px, 0) translate(-50%, -50%)`;
        }

        prevX = nodePos.x;
        prevY = nodePos.y;
      }

      animFrameId.current = requestAnimationFrame(renderLoop);
    };

    animFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [isSupported]);

  if (!isSupported) return null;

  return (
    <div 
      className="plasma-cursor-layer"
      style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.2s ease' }}
      aria-hidden="true"
    >
      {/* Trailing Energy Nodes */}
      {!inNativeZone &&
        TRAIL_CONFIGS.map((cfg, idx) => (
          <div
            key={idx}
            ref={(el) => (trailRefs.current[idx] = el)}
            className="plasma-trail-node"
            style={{
              width: cfg.size,
              height: cfg.size,
              opacity: cfg.opacity,
              background: `radial-gradient(circle, ${cfg.color} 0%, transparent 80%)`,
            }}
          />
        ))}

      {/* Main Glowing Plasma Orb */}
      <div
        ref={orbRef}
        className={`plasma-cursor-orb ${isHovering ? 'is-hovering' : ''} ${inNativeZone ? 'in-native-zone' : ''}`}
      >
        {/* Ambient Volumetric Glow */}
        <div className="plasma-ambient-glow" />

        {/* Outer Translucent Glass Corona */}
        <div className="plasma-corona" />

        {/* Two Delicate 3D Orbital Rings */}
        <div className="plasma-orbit-ring plasma-orbit-ring-1" />
        <div className="plasma-orbit-ring plasma-orbit-ring-2" />

        {/* Inner Morphing Plasma Ribbons SVG */}
        <svg className="plasma-orb-svg" viewBox="0 0 64 64" fill="none">
          <defs>
            {/* Electric Blue to Neon Cyan Gradient */}
            <linearGradient id="plasmaGradCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.95" />
              <stop offset="45%" stopColor="#2563eb" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
            </linearGradient>

            {/* Violet to Magenta Flowing Gradient */}
            <linearGradient id="plasmaGradMagenta" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#d946ef" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.65" />
            </linearGradient>

            {/* Core Hot Filament Gradient */}
            <linearGradient id="plasmaGradCore" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.2" />
            </linearGradient>

            {/* Glass Corona Rim Radial */}
            <radialGradient id="plasmaCoronaGrad" cx="50%" cy="50%" r="50%">
              <stop offset="68%" stopColor="transparent" />
              <stop offset="88%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="96%" stopColor="#a855f7" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95" />
            </radialGradient>

            {/* High-intensity Glow Filter */}
            <filter id="plasmaGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Deep Translucent Dark Glass Sphere Core */}
          <circle cx="32" cy="32" r="27" fill="rgba(6, 11, 24, 0.45)" />

          {/* Ribbon 1: Electric Blue / Cyan wave loop */}
          <path
            className="plasma-ribbon plasma-ribbon-1"
            d="M 17,34 C 18,21 28,15 37,18 C 46,20 49,29 46,37 C 43,45 31,46 25,41 C 19,36 16,35 17,34 Z"
            fill="url(#plasmaGradCyan)"
            filter="url(#plasmaGlowFilter)"
          />

          {/* Ribbon 2: Violet / Magenta flowing wing */}
          <path
            className="plasma-ribbon plasma-ribbon-2"
            d="M 32,15 C 43,15 49,23 45,33 C 41,43 27,45 20,37 C 13,29 21,19 29,21 C 34,22 36,27 32,32 Z"
            fill="url(#plasmaGradMagenta)"
            filter="url(#plasmaGlowFilter)"
          />

          {/* Ribbon 3: Center hot fold vertical filament */}
          <path
            className="plasma-ribbon plasma-ribbon-3"
            d="M 32,18 C 36,25 37,32 34,39 C 33,42 29,45 27,42 C 25,39 26,34 30,28 C 32,24 32,20 32,18 Z"
            fill="url(#plasmaGradCore)"
          />

          {/* Spherical Crescent Edge Arc (Exact reproduction of reference highlight) */}
          <path
            d="M 12,38 A 26,26 0 0,0 50,42"
            fill="none"
            stroke="url(#plasmaGradCyan)"
            strokeWidth="1.6"
            strokeLinecap="round"
            filter="url(#plasmaGlowFilter)"
          />
          <path
            d="M 15,39 A 26,26 0 0,0 47,43"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.7"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Corona rim boundary */}
          <circle cx="32" cy="32" r="27" fill="url(#plasmaCoronaGrad)" />
        </svg>

        {/* Central Precision Click Pinpoint Dot */}
        <div className="plasma-pointer-dot" />
      </div>

      {/* Click Shockwave Energy Ripples */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="plasma-click-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}
    </div>
  );
}
