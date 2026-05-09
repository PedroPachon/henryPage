import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-style-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="style">
      <div class="section-label reveal">{{ translationService.translations().style.label }}</div>
      <div class="style-grid reveal">
        @for (item of translationService.translations().style.items; track $index) {
          <div class="style-item">
            <div class="style-num">{{ item.num }}</div>
            <div class="style-name" [innerHTML]="item.name"></div>
            <p class="style-desc">{{ item.desc }}</p>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    #style {
      background: var(--black);
      color: var(--white);
    }

    #style .section-label { color: #555; }
    #style .section-label::after { background: #333; }

    .style-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1px;
      background: #1a1a1a;
    }

    .style-item {
      background: var(--black);
      padding: 48px 40px;
    }

    .style-num {
      font-family: var(--serif);
      font-size: 11px;
      color: #444;
      margin-bottom: 24px;
      letter-spacing: 0.2em;
    }

    .style-name {
      font-family: var(--serif);
      font-size: 28px;
      font-weight: 300;
      margin-bottom: 16px;
      color: var(--white);
    }
    .style-name :deep(em) { font-style: italic; color: #888; }

    .style-desc {
      font-size: 13px;
      line-height: 1.8;
      color: #666;
      letter-spacing: 0.05em;
    }

    @media (max-width: 768px) {
      .style-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StyleSectionComponent {
  translationService = inject(TranslationService);
}