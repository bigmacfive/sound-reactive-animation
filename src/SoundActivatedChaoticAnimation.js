import React, { useEffect, useRef, useState, useCallback } from 'react';

const ChaoticAnimation = () => {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const animationRef = useRef(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const lastTouchTime = useRef(Date.now());
  const touchCount = useRef(0);

  const randomInRange = useCallback((min, max) => Math.random() * (max - min) + min, []);

  const ChaoticElement = useCallback(function ChaoticElement(canvas) {
    this.canvas = canvas;
    this.reset = () => {
      this.x = randomInRange(0, this.canvas.width);
      this.y = randomInRange(0, this.canvas.height);
      this.size = randomInRange(1, 100);
      this.speedX = randomInRange(-5, 5);
      this.speedY = randomInRange(-5, 5);
      this.rotation = randomInRange(0, Math.PI * 2);
      this.rotationSpeed = randomInRange(-0.1, 0.1);
      this.hue = randomInRange(0, 360);
      this.saturation = randomInRange(50, 100);
      this.lightness = randomInRange(30, 70);
      this.alpha = randomInRange(0.1, 0.9);
      this.shape = Math.floor(randomInRange(0, 5));
    };
    this.reset();

    this.update = (speed) => {
      this.x += this.speedX * speed;
      this.y += this.speedY * speed;
      this.rotation += this.rotationSpeed * speed;
      this.hue = (this.hue + 1) % 360;

      if (this.x < 0 || this.x > this.canvas.width || this.y < 0 || this.y > this.canvas.height) {
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
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    elements.forEach(element => {
      element.update(speedMultiplier);
      element.draw(ctx);
    });

    if (Math.random() < 0.05 * speedMultiplier) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.8)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [elements, speedMultiplier]);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setElements(prevElements => {
      return prevElements.map(element => {
        element.canvas = canvas;
        element.reset(); // Reset elements to ensure they're within the new canvas size
        return element;
      });
    });
  }, []);

  const handleTouch = useCallback(() => {
    const now = Date.now();
    if (now - lastTouchTime.current < 1000) {
      touchCount.current++;
      setSpeedMultiplier(prev => Math.min(prev + 0.1, 5));
    } else {
      touchCount.current = 1;
    }
    lastTouchTime.current = now;

    setTimeout(() => {
      touchCount.current--;
      if (touchCount.current === 0) {
        setSpeedMultiplier(1);
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    setElements(Array(100).fill().map(() => new ChaoticElement(canvas)));

    window.addEventListener('resize', handleResize);
    canvas.addEventListener('click', handleTouch);
    canvas.addEventListener('touchstart', handleTouch);

    // 초기 검은색 배경 그리기
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', handleTouch);
      canvas.removeEventListener('touchstart', handleTouch);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [ChaoticElement, handleResize, handleTouch]);

  useEffect(() => {
    if (elements.length > 0) {
      animate();
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [elements, animate]);

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default ChaoticAnimation;