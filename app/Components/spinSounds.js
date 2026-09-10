"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

const SpinSounds = forwardRef(function SpinSounds(props, ref) {
  const audioCtxRef = useRef(null);

  const getAudioContext = () => {
    if (typeof window === "undefined") return null;

    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;

      if (!AudioCtx) return null;

      audioCtxRef.current = new AudioCtx();
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  };

  const playTickSound = (speedFactor = 0) => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 800 + speedFactor * 600;

      osc.type = "square";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + 0.02
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.025);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  const playRevealSound = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Main clunk
      const clunkOsc = ctx.createOscillator();
      const clunkGain = ctx.createGain();

      clunkOsc.type = "triangle";
      clunkOsc.frequency.setValueAtTime(180, now);
      clunkOsc.frequency.exponentialRampToValueAtTime(
        60,
        now + 0.15
      );

      clunkGain.gain.setValueAtTime(0.3, now);
      clunkGain.gain.exponentialRampToValueAtTime(
        0.001,
        now + 0.18
      );

      clunkOsc.connect(clunkGain);
      clunkGain.connect(ctx.destination);

      clunkOsc.start(now);
      clunkOsc.stop(now + 0.2);

      // Shimmer
      const shimmerStart = now + 0.08;

      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();

      shimmerOsc.type = "sine";
      shimmerOsc.frequency.setValueAtTime(500, shimmerStart);
      shimmerOsc.frequency.exponentialRampToValueAtTime(
        1400,
        shimmerStart + 0.35
      );

      shimmerGain.gain.setValueAtTime(0.0001, shimmerStart);
      shimmerGain.gain.exponentialRampToValueAtTime(
        0.2,
        shimmerStart + 0.05
      );
      shimmerGain.gain.exponentialRampToValueAtTime(
        0.001,
        shimmerStart + 0.4
      );

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);

      shimmerOsc.start(shimmerStart);
      shimmerOsc.stop(shimmerStart + 0.4);

      // Sparkle
      const sparkleStart = now + 0.12;

      const sparkleOsc = ctx.createOscillator();
      const sparkleGain = ctx.createGain();

      sparkleOsc.type = "sine";
      sparkleOsc.frequency.setValueAtTime(2100, sparkleStart);

      sparkleGain.gain.setValueAtTime(0.0001, sparkleStart);
      sparkleGain.gain.exponentialRampToValueAtTime(
        0.08,
        sparkleStart + 0.03
      );
      sparkleGain.gain.exponentialRampToValueAtTime(
        0.001,
        sparkleStart + 0.3
      );

      sparkleOsc.connect(sparkleGain);
      sparkleGain.connect(ctx.destination);

      sparkleOsc.start(sparkleStart);
      sparkleOsc.stop(sparkleStart + 0.3);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  useImperativeHandle(ref, () => ({
    playTickSound,
    playRevealSound,
  }));

  return null;
});

export default SpinSounds;