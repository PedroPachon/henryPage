import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="portfolio">
      <div class="section-label reveal">{{ translationService.translations().portfolio.label }}</div>
      <div class="portfolio-grid reveal">
        @for (item of translationService.translations().portfolio.items; track $index) {
          <div class="portfolio-item">
            <div class="portfolio-placeholder">
              <svg [attr.viewBox]="'0 0 40 40'" fill="none">
                @switch ($index) {
                  @case (0) {
                    <rect x="8" y="4" width="24" height="32" rx="1" stroke="#0A0A0A" stroke-width="1.5"/>
                    <line x1="12" y1="12" x2="28" y2="12" stroke="#0A0A0A" stroke-width="1"/>
                    <line x1="12" y1="18" x2="24" y2="18" stroke="#0A0A0A" stroke-width="1"/>
                    <line x1="12" y1="24" x2="26" y2="24" stroke="#0A0A0A" stroke-width="1"/>
                  }
                  @case (1) {
                    <circle cx="20" cy="20" r="14" stroke="#0A0A0A" stroke-width="1.5"/>
                    <circle cx="20" cy="20" r="7" stroke="#0A0A0A" stroke-width="1"/>
                  }
                  @case (2) {
                    <polygon points="20,4 36,34 4,34" stroke="#0A0A0A" stroke-width="1.5" fill="none"/>
                    <polygon points="20,12 30,30 10,30" stroke="#0A0A0A" stroke-width="1" fill="none"/>
                  }
                  @case (3) {
                    <rect x="6" y="6" width="28" height="28" stroke="#0A0A0A" stroke-width="1.5"/>
                    <line x1="6" y1="20" x2="34" y2="20" stroke="#0A0A0A" stroke-width="1"/>
                    <line x1="20" y1="6" x2="20" y2="34" stroke="#0A0A0A" stroke-width="1"/>
                  }
                  @case (4) {
                    <path d="M20 6 C30 6 36 14 36 20 C36 28 28 36 20 36 C12 36 4 28 4 20 C4 14 10 6 20 6Z" stroke="#0A0A0A" stroke-width="1.5"/>
                    <path d="M20 12 C26 12 30 16 30 20 C30 26 26 30 20 30" stroke="#0A0A0A" stroke-width="1"/>
                  }
                  @case (5) {
                    <line x1="8" y1="8" x2="32" y2="32" stroke="#0A0A0A" stroke-width="1.5"/>
                    <line x1="32" y1="8" x2="8" y2="32" stroke="#0A0A0A" stroke-width="1.5"/>
                    <rect x="14" y="14" width="12" height="12" stroke="#0A0A0A" stroke-width="1"/>
                  }
                }
              </svg>
            </div>
            <div class="portfolio-caption">{{ item.caption }}</div>
          </div>
        }
      </div>
      <div class="portfolio-footer reveal">
        <a href="https://www.instagram.com/henry_tatts/" target="_blank" class="hero-cta">{{ translationService.translations().portfolio.cta }}</a>
      </div>
    </section>
  `,
  styles: [`
    #portfolio { background: var(--white); }

    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
    }

    .portfolio-item {
      aspect-ratio: 1;
      background: var(--light-gray);
      overflow: hidden;
      position: relative;
      cursor: pointer;
    }

    .portfolio-item::after {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(10,10,10,0);
      transition: background 0.4s;
    }
    .portfolio-item:hover::after { background: rgba(10,10,10,0.05); }

    .portfolio-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F4F4F4;
    }

    .portfolio-placeholder svg {
      width: 40px;
      height: 40px;
      opacity: 0.15;
    }

    .portfolio-caption {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 24px;
      background: linear-gradient(to top, rgba(255,255,255,0.9), transparent);
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--gray);
      transform: translateY(100%);
      transition: transform 0.4s;
      z-index: 1;
    }
    .portfolio-item:hover .portfolio-caption { transform: translateY(0); }

    .portfolio-footer {
      margin-top: 48px;
      display: flex;
      justify-content: center;
    }

    .hero-cta {
      display: inline-flex;
      align-items: center;
      gap: 16px;
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--black);
      text-decoration: none;
      border-bottom: 1px solid var(--black);
      padding-bottom: 6px;
      transition: gap 0.3s;
    }
    .hero-cta:hover { gap: 24px; }
    .hero-cta::after { content: '→'; }

    @media (max-width: 768px) {
      .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 480px) {
      .portfolio-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class PortfolioComponent {
  translationService = inject(TranslationService);
}