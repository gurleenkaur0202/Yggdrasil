import React, { useEffect, useRef } from "react";

interface CanvasBackgroundProps {
  type: string; // "stars" | "forest" | "rain" | "snow" | "clouds" | "minimal"
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ type }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle class definition
    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedX: number = 0;
      speedY: number = 0;
      angle: number = 0;
      spin: number = 0;
      color: string = "";
      opacity: number = 1;

      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.size = Math.random() * 3 + 1;
        this.angle = Math.random() * 360;
        this.spin = Math.random() * 2 - 1;

        if (type === "forest") {
          // Floating Leaves
          this.y = height + Math.random() * 100;
          this.size = Math.random() * 12 + 6;
          this.speedY = -(Math.random() * 1 + 0.5);
          this.speedX = Math.random() * 1 - 0.5;
          const colors = [
            "rgba(16, 185, 129, 0.4)", // emerald
            "rgba(52, 211, 153, 0.3)", // light emerald
            "rgba(4, 120, 87, 0.3)",   // dark green
            "rgba(245, 158, 11, 0.2)",  // gold leaf
          ];
          this.color = colors[Math.floor(Math.random() * colors.length)];
          this.opacity = Math.random() * 0.5 + 0.3;
        } else if (type === "rain") {
          // Gentle Rain
          this.y = -Math.random() * height;
          this.size = Math.random() * 2 + 1;
          this.speedY = Math.random() * 8 + 6;
          this.speedX = -1 - Math.random() * 1;
          this.color = "rgba(14, 165, 233, 0.25)"; // sky blue
          this.opacity = Math.random() * 0.4 + 0.2;
        } else if (type === "snow") {
          // Silent Snow
          this.y = -Math.random() * height;
          this.size = Math.random() * 4 + 1;
          this.speedY = Math.random() * 1 + 0.5;
          this.speedX = Math.random() * 1 - 0.5;
          this.color = "rgba(255, 255, 255, 0.6)";
          this.opacity = Math.random() * 0.5 + 0.3;
        } else {
          // Twinkling Stars (Default & Galaxy)
          this.y = Math.random() * height;
          this.speedY = 0;
          this.speedX = 0;
          this.color = "rgba(255, 255, 255, " + (Math.random() * 0.7 + 0.3) + ")";
          this.opacity = Math.random();
        }
      }

      update() {
        if (type === "forest") {
          this.y += this.speedY;
          this.x += this.speedX + Math.sin(this.angle * (Math.PI / 180)) * 0.3;
          this.angle += this.spin;
          if (this.y < -50 || this.x < -50 || this.x > width + 50) {
            this.reset();
            this.y = height + 10;
          }
        } else if (type === "rain" || type === "snow") {
          this.y += this.speedY;
          this.x += this.speedX;
          if (this.y > height + 20 || this.x < -20) {
            this.reset();
            this.y = -10;
          }
        } else {
          // Twinkling effect
          this.opacity += Math.random() * 0.04 - 0.02;
          if (this.opacity < 0.1) this.opacity = 0.1;
          if (this.opacity > 0.9) this.opacity = 0.9;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;

        if (type === "forest") {
          // Draw leaf shape
          ctx.translate(this.x, this.y);
          ctx.rotate(this.angle * (Math.PI / 180));
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.moveTo(0, -this.size);
          ctx.quadraticCurveTo(this.size, -this.size / 2, 0, this.size);
          ctx.quadraticCurveTo(-this.size, -this.size / 2, 0, -this.size);
          ctx.fill();
        } else if (type === "rain") {
          // Draw line
          ctx.strokeStyle = this.color;
          ctx.lineWidth = this.size;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + this.speedX * 1.5, this.y + this.speedY * 1.5);
          ctx.stroke();
        } else if (type === "snow") {
          // Draw soft circle
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw sparkling star
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    const particles: Particle[] = [];
    const particleCount = type === "forest" ? 35 : type === "rain" ? 60 : type === "snow" ? 50 : type === "minimal" ? 0 : 80;

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Handles resizing
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [type]);

  if (type === "minimal") return null;

  return (
    <canvas
      ref={canvasRef}
      id="bg-canvas"
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
