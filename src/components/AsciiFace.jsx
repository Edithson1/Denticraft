import React, { useEffect, useRef, useState } from "react";

const CHARS = [" ", ".", ":", "-", "*", "=", "%", "#", "@"];
const WIDTH = 80;
const HEIGHT = 40;

export default function AsciiFace({ expression = "idle", micStream = null, isSpeaking = false }) {
  const canvasRef = useRef(null);
  const [asciiText, setAsciiText] = useState("");
  const stateRef = useRef({
    mouthOpen: 0,
    mouthCurve: 0,
    eyeOpen: 1,
    eyebrowHeight: 0,
    eyebrowTilt: 0,
    gazeX: 0,
    gazeY: 0,
    headTilt: 0,
    blinkTimer: 0,
    thoughtTimer: 0,
    speechTimer: 0,
    volume: 0,
  });

  const audioAnalyserRef = useRef(null);
  const audioContextRef = useRef(null);

  // Setup Web Audio API if micStream is active
  useEffect(() => {
    if (!micStream) {
      if (audioAnalyserRef.current) {
        audioAnalyserRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(micStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      audioAnalyserRef.current = analyser;
    } catch (e) {
      console.error("Failed to initialize Web Audio Analyser", e);
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [micStream]);

  // Main animation loop
  useEffect(() => {
    let animId;

    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");

    const updateParameters = () => {
      const state = stateRef.current;
      let target = {
        mouthOpen: 0,
        mouthCurve: 0,
        eyeOpen: 1,
        eyebrowHeight: 0,
        eyebrowTilt: 0,
        gazeX: 0,
        gazeY: 0,
        headTilt: 0,
      };

      // Gather audio volume if listening
      if (expression === "listening" && audioAnalyserRef.current) {
        const bufferLength = audioAnalyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        audioAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Map average volume to mouth openness (0 to 1)
        state.volume = Math.min(1.0, avg / 60);
      } else {
        state.volume = 0;
      }

      // Handle blink logic
      state.blinkTimer += 0.016;
      let isBlinking = false;
      if (state.blinkTimer > 4.0) {
        if (state.blinkTimer < 4.15) {
          isBlinking = true;
        } else {
          state.blinkTimer = 0;
        }
      }

      // Apply target values based on expression
      switch (expression) {
        case "listening":
          target.mouthOpen = state.volume > 0.05 ? state.volume * 0.8 : 0.05 + Math.sin(Date.now() * 0.01) * 0.02;
          target.mouthCurve = 0.2;
          target.eyeOpen = 1.1; // wide eyes
          target.eyebrowHeight = 0.1;
          target.eyebrowTilt = 0.05;
          target.gazeX = Math.sin(Date.now() * 0.0005) * 0.15;
          target.gazeY = Math.cos(Date.now() * 0.0003) * 0.1;
          target.headTilt = 0.05; // tilt slightly to the side (curious)
          break;

        case "thinking":
          target.mouthOpen = 0.02;
          target.mouthCurve = -0.15; // slightly focused/penseful frown
          target.eyeOpen = 0.8;
          target.eyebrowHeight = -0.15;
          target.eyebrowTilt = -0.1;
          // eyes scanning left to right
          state.thoughtTimer += 0.03;
          target.gazeX = Math.sin(state.thoughtTimer) * 0.4;
          target.gazeY = -0.1;
          target.headTilt = -0.02;
          break;

        case "speaking":
          // Open/close mouth rhythmically for speaking
          state.speechTimer += 0.25;
          target.mouthOpen = 0.2 + Math.abs(Math.sin(state.speechTimer)) * 0.6;
          target.mouthCurve = 0.3; // smile while talking
          target.eyeOpen = 0.95;
          target.eyebrowHeight = 0.1 + Math.sin(state.speechTimer * 0.4) * 0.15;
          target.eyebrowTilt = 0.05;
          target.gazeX = Math.sin(Date.now() * 0.001) * 0.1;
          target.gazeY = Math.cos(Date.now() * 0.0008) * 0.08;
          target.headTilt = Math.sin(state.speechTimer * 0.2) * 0.03;
          break;

        case "success":
          target.mouthOpen = 0.15;
          target.mouthCurve = 0.9; // big smile
          target.eyeOpen = 1.0;
          target.eyebrowHeight = 0.25;
          target.eyebrowTilt = 0.15;
          target.gazeX = 0;
          target.gazeY = -0.05;
          target.headTilt = 0.02;
          break;

        case "confused":
          target.mouthOpen = 0.1;
          target.mouthCurve = -0.4; // frown
          // asymmetrical eyes
          target.eyeOpen = 0.6; 
          target.eyebrowHeight = 0.3; // raise one eyebrow (simulated in drawing)
          target.eyebrowTilt = -0.2;
          target.gazeX = 0.2;
          target.gazeY = -0.15;
          target.headTilt = 0.15; // heavy tilt
          break;

        case "idle":
        default:
          target.mouthOpen = 0.0;
          target.mouthCurve = 0.1;
          target.eyeOpen = 1.0;
          target.eyebrowHeight = 0;
          target.eyebrowTilt = 0;
          target.gazeX = Math.sin(Date.now() * 0.0002) * 0.1;
          target.gazeY = Math.cos(Date.now() * 0.0001) * 0.05;
          target.headTilt = Math.sin(Date.now() * 0.001) * 0.015; // slow breathing tilt
          break;
      }

      // If blinking, override eye opening
      if (isBlinking && expression !== "success") {
        target.eyeOpen = 0.0;
      }

      // Smooth interpolation (linear lag)
      state.mouthOpen += (target.mouthOpen - state.mouthOpen) * 0.2;
      state.mouthCurve += (target.mouthCurve - state.mouthCurve) * 0.15;
      state.eyeOpen += (target.eyeOpen - state.eyeOpen) * 0.25;
      state.eyebrowHeight += (target.eyebrowHeight - state.eyebrowHeight) * 0.15;
      state.eyebrowTilt += (target.eyebrowTilt - state.eyebrowTilt) * 0.15;
      state.gazeX += (target.gazeX - state.gazeX) * 0.2;
      state.gazeY += (target.gazeY - state.gazeY) * 0.2;
      state.headTilt += (target.headTilt - state.headTilt) * 0.15;
    };

    const drawFace = () => {
      const state = stateRef.current;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.save();
      // Center of canvas coordinates
      ctx.translate(WIDTH / 2, HEIGHT / 2);
      ctx.rotate(state.headTilt);

      // Draw head contour outline
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Draw a rounded face shape (upscaled and centered)
      ctx.ellipse(0, -1.0, 28, 17.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Eyes coordinates
      const eyeSpacing = 10.0;
      const eyeY = -3.5;

      // Draw Left/Right Eye
      const drawEye = (x, isLeft) => {
        ctx.save();
        ctx.translate(x, eyeY);

        // Adjust eye opening
        const currentEyeOpen = isLeft && expression === "success" && Date.now() % 2000 < 800 ? 0.0 : state.eyeOpen;

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.0;

        if (currentEyeOpen < 0.1) {
          // Closed eye (a line)
          ctx.beginPath();
          ctx.moveTo(-3.5, 0);
          ctx.lineTo(3.5, 0);
          ctx.stroke();
        } else {
          // Open eye outer contour (larger)
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.5, 3.2 * currentEyeOpen, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Pupil (larger)
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          const pupilX = state.gazeX * 2.5;
          const pupilY = state.gazeY * 1.8 * currentEyeOpen;
          ctx.arc(pupilX, pupilY, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Eyebrows
        ctx.restore();
        ctx.save();
        ctx.translate(x, eyeY - 5.5 - state.eyebrowHeight * 2);

        // Confused expression makes one eyebrow raised
        const confOffset = expression === "confused" && !isLeft ? 2.5 : 0;
        ctx.translate(0, -confOffset);

        const tiltSign = isLeft ? 1 : -1;
        const currentTilt = state.eyebrowTilt * tiltSign;
        ctx.rotate(currentTilt);

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-4, 0.5);
        ctx.lineTo(4, -0.5);
        ctx.stroke();

        ctx.restore();
      };

      drawEye(-eyeSpacing, true);
      drawEye(eyeSpacing, false);

      // Nose
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(0, -1.5);
      ctx.lineTo(0.7, 2.0);
      ctx.lineTo(-0.9, 2.0);
      ctx.stroke();

      // Cheeks (blush lines)
      if (expression === "success") {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 0.5;
        // Left cheek
        ctx.beginPath(); ctx.moveTo(-18, 3.5); ctx.lineTo(-14, 2.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-17, 4.5); ctx.lineTo(-13, 3.5); ctx.stroke();
        // Right cheek
        ctx.beginPath(); ctx.moveTo(14, 2.5); ctx.lineTo(18, 3.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(13, 3.5); ctx.lineTo(17, 4.5); ctx.stroke();
      }

      // Mouth
      ctx.save();
      ctx.translate(0, 6.0);

      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#fff";
      ctx.lineWidth = 1.3;

      const mouthWidth = 10.0;
      const controlY = state.mouthCurve * 5.0;
      const openHeight = state.mouthOpen * 6.0;

      if (openHeight > 0.5) {
        // Open mouth: draw as filled or outlined shape
        ctx.beginPath();
        ctx.moveTo(-mouthWidth, 0);
        ctx.quadraticCurveTo(0, controlY + openHeight, mouthWidth, 0);
        ctx.quadraticCurveTo(0, controlY - openHeight * 0.3, -mouthWidth, 0);
        ctx.stroke();
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      } else {
        // Closed mouth: simple curved line
        ctx.beginPath();
        ctx.moveTo(-mouthWidth, 0);
        ctx.quadraticCurveTo(0, controlY, mouthWidth, 0);
        ctx.stroke();
      }

      ctx.restore();

      // Restore center rotation
      ctx.restore();
    };

    const convertToAscii = () => {
      const imgData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
      const data = imgData.data;
      let ascii = "";

      for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
          const idx = (y * WIDTH + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];

          // Compute grayscale brightness
          const brightness = ((r + g + b) / 3) * (a / 255);
          // Scale to 0-8 range for CHARS mapping
          const charIdx = Math.floor((brightness / 255) * (CHARS.length - 1));
          ascii += CHARS[charIdx];
        }
        ascii += "\n";
      }

      setAsciiText(ascii);
    };

    const loop = () => {
      updateParameters();
      drawFace();
      convertToAscii();
      animId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [expression]);

  // Map state to human-readable tag
  const getStatusText = () => {
    switch (expression) {
      case "listening":
        return "ESCUCHANDO...";
      case "thinking":
        return "PROCESANDO INFORMACIÓN...";
      case "speaking":
        return "HABLANDO...";
      case "success":
        return "DOCUMENTACIÓN COMPLETADA";
      case "confused":
        return "CONSULTANDO DETALLE...";
      case "idle":
      default:
        return "CONECTADA / ESPERANDO INSTRUCCIÓN";
    }
  };

  return (
    <div className="ascii-terminal">
      <div className="terminal-header">
        <div className="terminal-dot red"></div>
        <div className="terminal-dot yellow"></div>
        <div className="terminal-dot green"></div>
        <span className="terminal-title">DENTISCRAFT AI CORE v2.0</span>
      </div>
      <div className="terminal-body">
        <pre className={`ascii-face-pre ${expression}`}>{asciiText}</pre>
      </div>
      <div className="terminal-footer">
        <span className="status-label">ESTADO:</span>
        <span className={`status-value ${expression}`}>{getStatusText()}</span>
        {expression === "listening" && (
          <div className="audio-wave-container">
            <div className="bar" style={{ height: `${5 + stateRef.current.volume * 25}px` }}></div>
            <div className="bar" style={{ height: `${5 + stateRef.current.volume * 40}px` }}></div>
            <div className="bar" style={{ height: `${5 + stateRef.current.volume * 30}px` }}></div>
            <div className="bar" style={{ height: `${5 + stateRef.current.volume * 15}px` }}></div>
          </div>
        )}
      </div>
    </div>
  );
}
