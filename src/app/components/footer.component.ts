import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer>
      <div class="footer-logo">henry tatts<br>
        <span>{{ translationService.translations().footer.subtitle }}</span>
      </div>
      <ul class="footer-links">
        <li><a href="https://www.instagram.com/henry_tatts/" target="_blank">{{ translationService.translations().footer.instagram }}</a></li>
        <li><a href="#portfolio">{{ translationService.translations().footer.portfolio }}</a></li>
        <li><a href="#booking">{{ translationService.translations().footer.reservations }}</a></li>
      </ul>
      <div class="footer-copy">{{ translationService.translations().footer.copyright }}</div>
    </footer>
  `,
  styles: [`
    footer {
      padding: 60px 48px;
      border-top: 1px solid var(--light-gray);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 24px;
    }

    .footer-logo {
      font-family: var(--serif);
      font-size: 14px;
      letter-spacing: 0.1em;
    }
    .footer-logo span {
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--gray);
      font-family: var(--sans);
    }

    .footer-links {
      display: flex;
      gap: 32px;
      list-style: none;
    }
    .footer-links a {
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--gray);
      text-decoration: none;
      transition: color 0.3s;
    }
    .footer-links a:hover { color: var(--black); }

    .footer-copy {
      font-size: 10px;
      letter-spacing: 0.2em;
      color: var(--gray);
      text-transform: uppercase;
    }

    @media (max-width: 768px) {
      footer {
        padding: 40px 24px;
        flex-direction: column;
        align-items: flex-start;
        gap: 32px;
      }
      .footer-links { flex-wrap: wrap; gap: 20px; }
    }
  `]
})
export class FooterComponent {
  translationService = inject(TranslationService);
}