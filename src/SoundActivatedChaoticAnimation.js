import React, { useEffect, useRef, useState, useCallback } from 'react';

const SoundActivatedChaoticAnimation = () => {
  const canvasRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);
  const [analyzer, setAnalyzer] = useState(null);
  const [elements, setElements] = useState([]);
  const animationRef = useRef(null);

  const randomInRange = useCallback((min, max) => Math.random() * (max - min) + min, []);

  const ChaoticElement = useCallback(function ChaoticElement(canvas) {
    this.canvas = canvas;
    this.reset = () => {
      this.x = randomInRange(0, this.canvas.width);
      this.y = randomInRange(0, this.canvas.height);
      this.size = randomInRange(1, 100);
      this.speedX = randomInRange(-10, 10);
      this.speedY = randomInRange(-10, 10);
      this.rotation = randomInRange(0, Math.PI * 2);
      this.rotationSpeed = randomInRange(-0.1, 0.1);
      this.hue = randomInRange(0, 360);
      this.saturation = randomInRange(50, 100);
      this.lightness = randomInRange(30, 70);
      this.alpha = randomInRange(0.1, 0.9);
      this.shape = Math.floor(randomInRange(0, 5));
    };
    this.reset();

    this.update = (speedMultiplier) => {
      this.x += this.speedX * speedMultiplier;
      this.y += this.speedY * speedMultiplier;
      this.rotation += this.rotationSpeed * speedMultiplier;
      this.hue = (this.hue + randomInRange(1, 5) * speedMultiplier) % 360;
      this.size += randomInRange(-5, 5) * speedMultiplier;

      if (this.x < 0 || this.x > this.canvas.width || this.y < 0 || this.y > this.canvas.height || this.size < 1) {
        this.reset();
      }
    };

    this.draw = (ctx) => {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.alpha})`;
      ctx.beginPath();

      switch(this.shape) {
        case 0:
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          break;
        case 1:
          ctx.rect(-this.size / 2, -this.size / 2, this.size, this.size);
          break;
        case 2:
          ctx.moveTo(0, -this.size / 2);
          ctx.lineTo(this.size / 2, this.size / 2);
          ctx.lineTo(-this.size / 2, this.size / 2);
          break;
        case 3:
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(
              Math.cos((i * 4 * Math.PI) / 5) * this.size / 2,
              Math.sin((i * 4 * Math.PI) / 5) * this.size / 2
            );
          }
          break;
        case 4:
          const sides = Math.floor(randomInRange(3, 8));
          for (let i = 0; i < sides; i++) {
            ctx.lineTo(
              Math.cos((i * 2 * Math.PI) / sides) * this.size / 2,
              Math.sin((i * 2 * Math.PI) / sides) * this.size / 2
            );
          }
          break;
        default:
          ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
          break;
      }

      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
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

    if (speedMultiplier > 0.1) {
      elements.forEach(element => {
        element.update(speedMultiplier);
        element.draw(ctx);
      });

      if (Math.random() < 0.05 * speedMultiplier) {
        ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [analyzer, elements]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    setElements(Array(100).fill().map(() => new ChaoticElement(canvas)));

    const initializeAudio = async () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyzerNode = audioCtx.createAnalyser();
        analyzerNode.fftSize = 256;

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const sourceNode = audioCtx.createMediaStreamSource(stream);
        sourceNode.connect(analyzerNode);

        setAudioContext(audioCtx);
        setAnalyzer(analyzerNode);
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };

    initializeAudio();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [ChaoticElement]);

  useEffect(() => {
    if (analyzer && elements.length > 0) {
      animate();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyzer, elements, animate]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default SoundActivatedChaoticAnimation;