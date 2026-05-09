import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader" [class.hidden]="hidden()">
      <div class="loader-logo">
        <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line class="draw-path" x1="28" y1="10" x2="28" y2="70" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round"/>
          <line class="draw-path" x1="28" y1="40" x2="72" y2="40" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round"/>
          <line class="draw-path" x1="72" y1="10" x2="72" y2="70" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round"/>
          <line class="draw-path" x1="50" y1="40" x2="50" y2="90" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="loader-name">{{ translationService.translations().loader.name }}</div>
    </div>
  `,
  styles: [`
    .loader {
      position: fixed;
      inset: 0;
      background: var(--white);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 32px;
      transition: opacity 0.8s ease, visibility 0.8s ease;
    }
    .loader.hidden { opacity: 0; visibility: hidden; }

    .loader-logo svg { width: 80px; height: 80px; }

    .draw-path {
      stroke-dasharray: 400;
      stroke-dashoffset: 400;
      animation: draw 2s ease forwards;
    }
    .draw-path:nth-child(2) { animation-delay: 0.3s; }
    .draw-path:nth-child(3) { animation-delay: 0.6s; }
    .draw-path:nth-child(4) { animation-delay: 0.9s; }

    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }

    .loader-name {
      font-family: var(--serif);
      font-size: 13px;
      letter-spacing: 0.35em;
      color: var(--gray);
      text-transform: uppercase;
      opacity: 0;
      animation: fadeIn 0.6s ease 1.6s forwards;
    }

    @keyframes fadeIn { to { opacity: 1; } }
  `]
})
export class LoaderComponent {
  translationService = inject(TranslationService);
  hidden = signal(false);

  constructor() {
    setTimeout(() => {
      this.hidden.set(true);
      document.getElementById('heroContent')?.classList.add('visible');
    }, 2400);
  }
}