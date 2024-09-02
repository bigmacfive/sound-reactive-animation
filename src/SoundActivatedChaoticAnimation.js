import React, { useEffect, useRef, useState, useCallback } from 'react';

const SoundActivatedChaoticAnimation = () => {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const [analyzer, setAnalyzer] = useState(null);
  const [elements, setElements] = useState([]);
  const animationRef = useRef(null);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const randomInRange = useCallback((min, max) => Math.random() * (max - min) + min, []);

  const ChaoticElement = useCallback(function ChaoticElement(canvas) {
    // ... (ChaoticElement 코드는 이전과 동일)
  }, [randomInRange]);

  const animate = useCallback(() => {
    if (!canvasRef.current || !analyzer) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const speedMultiplier = average / 128;

    console.log('Audio level:', average, 'Speed multiplier:', speedMultiplier);

    if (speedMultiplier > 0.1) {
      elements.forEach(element => {
        element.update(speedMultiplier);
        element.draw(ctx);
      });

      if (Math.random() < 0.05 * speedMultiplier) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText('Speak or make noise to activate the animation', canvas.width / 2 - 150, canvas.height / 2);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [analyzer, elements]);

  const initializeAudio = useCallback(async () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyzerNode = audioCtx.createAnalyser();
      analyzerNode.fftSize = 256;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      sourceNode.connect(analyzerNode);

      setAnalyzer(analyzerNode);
      setIsAudioInitialized(true);
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Error initializing audio:', error);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    setElements(Array(100).fill().map(() => new ChaoticElement(canvas)));
    initializeAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [ChaoticElement, initializeAudio]);

  useEffect(() => {
    if (analyzer && elements.length > 0 && isAudioInitialized) {
      console.log('Starting animation');
      animate();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyzer, elements, animate, isAudioInitialized]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default SoundActivatedChaoticAnimation;