import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="about">
      <div class="about-left">
        <div class="section-label reveal">{{ translationService.translations().about.label }}</div>
        <h2 class="about-title reveal" [innerHTML]="translationService.translations().about.title"></h2>
        <p class="about-bio reveal">{{ translationService.translations().about.bio1 }}</p>
        <p class="about-bio reveal">{{ translationService.translations().about.bio2 }}</p>
        <p class="about-bio reveal">{{ translationService.translations().about.bio3 }}</p>
      </div>
      <div class="about-right reveal">
        <div class="about-img-placeholder">
          <svg width="60" height="80" viewBox="0 0 80 100" fill="none" opacity="0.15">
            <line x1="20" y1="8" x2="20" y2="55" stroke="#0A0A0A" stroke-width="3" stroke-linecap="round"/>
            <line x1="20" y1="32" x2="60" y2="32" stroke="#0A0A0A" stroke-width="3" stroke-linecap="round"/>
            <line x1="60" y1="8" x2="60" y2="55" stroke="#0A0A0A" stroke-width="3" stroke-linecap="round"/>
            <line x1="40" y1="32" x2="40" y2="75" stroke="#0A0A0A" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="about-stats">
          @for (stat of translationService.translations().about.stats; track $index) {
            <div class="stat">
              <div class="stat-num">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    #about {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: start;
    }

    .about-left .section-label { justify-content: flex-start; }

    .about-title {
      font-family: var(--serif);
      font-size: clamp(32px, 4vw, 52px);
      font-weight: 300;
      line-height: 1.15;
      margin-bottom: 40px;
      white-space: pre-line;
    }
    .about-title :deep(em) { font-style: italic; color: var(--gray); }

    .about-bio {
      font-size: 15px;
      line-height: 1.9;
      color: #444;
      margin-bottom: 24px;
      font-family: var(--sans);
      font-weight: 300;
    }

    .about-right {
      position: relative;
      padding-top: 80px;
    }

    .about-img-placeholder {
      width: 100%;
      aspect-ratio: 3/4;
      background: #F4F4F4;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .about-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: var(--light-gray);
      margin-top: 2px;
    }

    .stat {
      background: var(--white);
      padding: 32px 24px;
    }

    .stat-num {
      font-family: var(--serif);
      font-size: 40px;
      font-weight: 300;
      line-height: 1;
      margin-bottom: 8px;
    }

    .stat-label {
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--gray);
    }

    @media (max-width: 768px) {
      #about {
        grid-template-columns: 1fr;
        gap: 48px;
      }
      .about-right { padding-top: 0; }
    }
  `]
})
export class AboutComponent {
  translationService = inject(TranslationService);
}