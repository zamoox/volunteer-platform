import { Component, ElementRef, HostListener, OnInit, ViewChild, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-hero-canvas',
  standalone: true,
  template: `<canvas #canvas class="block w-full h-full"></canvas>`,
  styles: [`:host { display: block; width: 100%; height: 100%; opacity: 0.6; }`]
})
export class HeroCanvasComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private ctx!: CanvasRenderingContext2D;
  private particles: any[] = [];
  private animationId!: number;
  private mouse = { x: -100, y: -100 };

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  ngOnInit() {
    this.initCanvas();
    this.animate();
  }

  initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    for (let i = 0; i < 80; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    this.ctx.fillStyle = '#3b82f6'; // Синій колір (blue-500)
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';

    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;

      // Відбивання від стінок
      if (p.x < 0 || p.x > this.ctx.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.ctx.canvas.height) p.vy *= -1;

      // Малюємо точку
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // З'єднуємо лініями
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 150) {
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }

      // Взаємодія з мишкою
      const mouseDist = Math.hypot(p.x - this.mouse.x, p.y - this.mouse.y);
      if (mouseDist < 200) {
        this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(this.mouse.x, this.mouse.y);
        this.ctx.stroke();
      }
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
  }
}