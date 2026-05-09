import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section id="hero">
      <div class="hero-content" id="heroContent">
        <p class="hero-eyebrow">{{ translationService.translations().hero.eyebrow }}</p>
        <h1 class="hero-title" [innerHTML]="translationService.translations().hero.name"></h1>
        <p class="hero-sub">{{ translationService.translations().hero.subtitle }}</p>
        <a href="#portfolio" class="hero-cta">{{ translationService.translations().hero.cta }}</a>
      </div>
      <div class="hero-scroll">{{ translationService.translations().hero.scroll }}</div>
    </section>
  `,
  styles: [`
    #hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 0 48px 80px;
      position: relative;
    }

    .hero-content {
      max-width: 700px;
      opacity: 0;
      transform: translateY(30px);
      transition: opacity 1s ease 0.3s, transform 1s ease 0.3s;
    }
    .hero-content.visible { opacity: 1; transform: translateY(0); }

    .hero-eyebrow {
      font-size: 11px;
      letter-spacing: 0.35em;
      text-transform: uppercase;
      color: var(--gray);
      margin-bottom: 20px;
    }

    .hero-title {
      font-family: var(--serif);
      font-size: clamp(48px, 8vw, 96px);
      font-weight: 300;
      line-height: 1.05;
      letter-spacing: -0.02em;
      margin-bottom: 24px;
      white-space: pre-line;
    }

    .hero-title :deep(em) {
      font-style: italic;
      color: var(--gray);
    }

    .hero-sub {
      font-size: 13px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--gray);
      margin-bottom: 48px;
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

    .hero-scroll {
      position: absolute;
      right: 48px;
      bottom: 80px;
      writing-mode: vertical-rl;
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--gray);
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .hero-scroll::before {
      content: '';
      width: 1px;
      height: 48px;
      background: var(--light-gray);
      display: block;
      animation: scrollLine 2s ease-in-out infinite;
    }

    @keyframes scrollLine {
      0%, 100% { transform: scaleY(1); opacity: 1; }
      50% { transform: scaleY(0.3); opacity: 0.3; }
    }

    @media (max-width: 768px) {
      #hero { padding: 0 24px 80px; }
      .hero-scroll { display: none; }
    }
  `]
})
export class HeroComponent {
  translationService = inject(TranslationService);
}