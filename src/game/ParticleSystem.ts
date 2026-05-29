import { Graphics, Container, Ticker } from "pixi.js";

export class ParticleSystem {
  private container: Container;
  private particles: Particle[] = [];
  private active: boolean = true;

  constructor(container: Container, ticker: Ticker) {
    this.container = new Container();
    container.addChild(this.container);
    ticker.add(this.update.bind(this));
  }

  public explode(x: number, y: number, color: number, scale: number = 1) {
    if (!this.active) return;
    
    const count = 40;
    const speed = 3.8;

    for (let i = 0; i < count; i++) {
      const size = Math.random() * 9 + 2;
      const angle = Math.random() * Math.PI * 2;
      const vel = Math.random() * speed * (Math.random() < 0.5 ? 1.4 : 1);

      const particle = new Particle(x, y, size, color, {
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        decay: 0.016 + Math.random() * 0.022,
        scale: scale
      });

      this.container.addChild(particle);
      this.particles.push(particle);
    }
  }

  private update = () => {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();

      if (p.life <= 0) {
        if (p.parent) this.container.removeChild(p);
        p.destroy();
        this.particles.splice(i, 1);
      }
    }
  };

  public reset() {
    this.clearParticles();
    this.active = true;
  }

  public destroy() {
  this.clearParticles();

  if (this.container.parent) {
    this.container.parent.removeChild(this.container);
  }

  this.container.destroy({
    children: true
  });
}

  private clearParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.parent) this.container.removeChild(p);
      p.destroy();
    }
    this.particles = [];
  }
}

class Particle extends Graphics {
  public life = 1;
  public decay = 0;
  private vx = 0;
  private vy = 0;

  constructor(x: number, y: number, size: number, color: number, props: any) {
    super();
    this.fill(color);
    this.rect(-size/2, -size/2, size, size);
    this.fill();

    this.position.set(x, y);
    this.scale.set(props.scale);
    this.alpha = 1;
    this.rotation = Math.random() * Math.PI * 2;

    this.vx = props.vx;
    this.vy = props.vy;
    this.decay = props.decay;
  }

  public update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.965;
    this.vy *= 0.965;

    this.life -= this.decay;
    this.alpha = Math.max(0, this.life);
    this.rotation += 0.08;
  }
}