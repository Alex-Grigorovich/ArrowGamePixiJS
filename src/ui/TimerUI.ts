import { Container, Text } from "pixi.js";

export class TimerUI extends Container {
  private readonly timerText: Text;
  private startTimestamp = 0;
  private elapsedMs = 0;
  private running = false;
  private rafId = 0;

  constructor() {
    super();

    this.timerText = new Text({
      text: "0.0s",
      style: {
        fontFamily: "Arial",
        fontSize: 28,
        fill: 0xfff176,
        stroke: { color: 0x000000, width: 1 },
        fontWeight: "bold",
      },
    });
    this.timerText.anchor.set(0, 0);
    this.addChild(this.timerText);
  }

  public start(): void {
    this.startTimestamp = performance.now();
    this.elapsedMs = 0;
    this.running = true;
    this.updateDisplay(0);
    this.tick();
  }

  public stop(): number {
    if (this.running) {
      this.elapsedMs = performance.now() - this.startTimestamp;
      this.running = false;
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.updateDisplay(this.elapsedMs);
    }
    return this.elapsedMs;
  }

  public pause(): void {
    if (!this.running) return;
    this.elapsedMs = performance.now() - this.startTimestamp;
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.updateDisplay(this.elapsedMs);
  }

  public resume(): void {
    if (this.running) return;
    this.startTimestamp = performance.now() - this.elapsedMs;
    this.running = true;
    this.tick();
  }

  public reset(): void {
    this.running = false;
    this.elapsedMs = 0;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.updateDisplay(0);
  }

  public getElapsedMs(): number {
    if (this.running) return performance.now() - this.startTimestamp;
    return this.elapsedMs;
  }

  private tick = (): void => {
    if (!this.running) return;
    this.updateDisplay(performance.now() - this.startTimestamp);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private formatTime(ms: number): string {
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;
    const totalSeconds = Math.floor(totalTenths / 10);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    const secPart = `${seconds}.${tenths}s`;

    if (minutes > 0) return `${minutes}m ${secPart}`;
    return secPart;
  }

  private updateDisplay(ms: number): void {
    this.timerText.text = this.formatTime(ms);
  }
}
