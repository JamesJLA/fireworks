#!/usr/bin/env node

/**
 * Terminal Fireworks Show
 * A fun CLI that creates animated fireworks in your terminal
 * 
 * Usage: npx ts-node fireworks.ts [duration_seconds]
 */

import * as readline from 'readline';

// ANSI color codes
const colors = [
  '\x1b[91m', // bright red
  '\x1b[92m', // bright green
  '\x1b[93m', // bright yellow
  '\x1b[94m', // bright blue
  '\x1b[95m', // bright magenta
  '\x1b[96m', // bright cyan
  '\x1b[97m', // bright white
];
const reset = '\x1b[0m';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: string;
  life: number;
}

interface Firework {
  particles: Particle[];
  exploded: boolean;
  x: number;
  y: number;
  targetY: number;
  color: string;
}

class FireworkShow {
  private width: number;
  private height: number;
  private fireworks: Firework[] = [];
  private running = true;

  constructor() {
    this.width = process.stdout.columns || 80;
    this.height = process.stdout.rows || 24;
  }

  private randomColor(): string {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private createFirework(): Firework {
    const x = Math.floor(Math.random() * (this.width - 10)) + 5;
    const targetY = Math.floor(Math.random() * (this.height / 2)) + 3;

    return {
      particles: [],
      exploded: false,
      x,
      y: this.height - 1,
      targetY,
      color: this.randomColor(),
    };
  }

  private explode(fw: Firework): void {
    const chars = ['*', '•', '○', '◦', '+', '×'];
    const particleCount = 20 + Math.floor(Math.random() * 15);

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 0.5 + Math.random() * 1.5;

      fw.particles.push({
        x: fw.x,
        y: fw.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        char: chars[Math.floor(Math.random() * chars.length)],
        color: fw.color,
        life: 15 + Math.floor(Math.random() * 10),
      });
    }

    fw.exploded = true;
    this.beep();
  }

  private beep(): void {
    process.stdout.write('\x07');
  }

  private updateFireworks(): void {
    // Launch new fireworks randomly
    if (Math.random() < 0.05 && this.fireworks.length < 5) {
      this.fireworks.push(this.createFirework());
    }

    // Update existing fireworks
    for (let i = this.fireworks.length - 1; i >= 0; i--) {
      const fw = this.fireworks[i];

      if (!fw.exploded) {
        fw.y -= 1;
        if (fw.y <= fw.targetY) {
          this.explode(fw);
        }
      } else {
        // Update particles
        for (let j = fw.particles.length - 1; j >= 0; j--) {
          const p = fw.particles[j];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.1; // gravity
          p.life--;

          if (p.life <= 0 || p.y >= this.height) {
            fw.particles.splice(j, 1);
          }
        }

        // Remove firework if all particles are gone
        if (fw.particles.length === 0) {
          this.fireworks.splice(i, 1);
        }
      }
    }
  }

  private render(): void {
    const buffer: string[][] = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(' '));

    // Render all fireworks
    for (const fw of this.fireworks) {
      if (!fw.exploded) {
        // Render rising rocket
        const x = Math.floor(fw.x);
        const y = Math.floor(fw.y);
        if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
          buffer[y][x] = fw.color + '|' + reset;
        }
      } else {
        // Render explosion particles
        for (const p of fw.particles) {
          const x = Math.floor(p.x);
          const y = Math.floor(p.y);
          if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
            buffer[y][x] = p.color + p.char + reset;
          }
        }
      }
    }

    // Clear screen and render
    console.clear();
    console.log('\n  🎆 TERMINAL FIREWORKS SHOW 🎆\n');
    console.log(buffer.map(row => '  ' + row.join('')).join('\n'));
    console.log(`\n  ${this.fireworks.length} active fireworks | Press Ctrl+C to exit`);
  }

  public async start(duration: number = 30): Promise<void> {
    console.clear();
    console.log('\n  Starting fireworks show...\n');

    // Hide cursor
    process.stdout.write('\x1b[?25l');

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      this.stop();
    });

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (!this.running || Date.now() - startTime > duration * 1000) {
        this.stop();
        clearInterval(interval);
        return;
      }

      this.updateFireworks();
      this.render();
    }, 50);
  }

  private stop(): void {
    this.running = false;
    console.clear();
    process.stdout.write('\x1b[?25h'); // Show cursor
    console.log('\n  🎆 Show ended! Thanks for watching! 🎆\n');
    process.exit(0);
  }
}

// CLI entry point
const duration = parseInt(process.argv[2]) || 30;
const show = new FireworkShow();

console.log(`\n  🎆 Terminal Fireworks CLI 🎆`);
console.log(`  Duration: ${duration} seconds\n`);

setTimeout(() => {
  show.start(duration);
}, 1000);
