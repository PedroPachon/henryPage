import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav [class.scrolled]="isScrolled()" [class.dark]="isDarkSection()">
      <a href="#hero" class="nav-logo">henry tatts</a>
      <ul class="nav-links">
        <li><a href="#portfolio">{{ translationService.translations().nav.portfolio }}</a></li>
        <li><a href="#about">{{ translationService.translations().nav.studio }}</a></li>
        <li><a href="#style">{{ translationService.translations().nav.style }}</a></li>
        <li><a href="#booking">{{ translationService.translations().nav.booking }}</a></li>
      </ul>
      <button class="lang-toggle" (click)="translationService.toggleLanguage()">
        {{ translationService.language() === 'en' ? 'ES' : 'EN' }}
      </button>
      <button class="nav-toggle" (click)="toggleMenu()">
        <span></span><span></span>
      </button>
    </nav>
    <div class="mobile-menu" [class.open]="menuOpen()">
      <a href="#portfolio" (click)="closeMenu()">{{ translationService.translations().nav.portfolio }}</a>
      <a href="#about" (click)="closeMenu()">{{ translationService.translations().nav.studio }}</a>
      <a href="#style" (click)="closeMenu()">{{ translationService.translations().nav.style }}</a>
      <a href="#booking" (click)="closeMenu()">{{ translationService.translations().nav.booking }}</a>
    </div>
  `,
  styles: [`
    nav {
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28px 48px;
      transition: all 0.4s ease;
    }
    nav.scrolled {
      padding: 20px 48px;
      background: var(--white);
    }
    nav.dark {
      background: var(--black);
    }
    nav.dark .nav-logo,
    nav.dark .nav-links a,
    nav.dark .lang-toggle,
    nav.dark .nav-toggle span {
      color: var(--white);
    }
    nav.dark .nav-toggle span {
      background: var(--white);
    }

    .nav-logo {
      font-family: var(--serif);
      font-size: 16px;
      letter-spacing: 0.1em;
      color: var(--black);
      text-decoration: none;
      font-weight: 400;
    }

    .nav-links {
      display: flex;
      gap: 40px;
      list-style: none;
    }
    .nav-links a {
      font-family: var(--sans);
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--black);
      text-decoration: none;
      transition: color 0.3s;
    }
    .nav-links a:hover { color: var(--gray); }

    .lang-toggle {
      font-family: var(--sans);
      font-size: 11px;
      letter-spacing: 0.2em;
      background: none;
      border: 1px solid var(--black);
      padding: 8px 14px;
      cursor: pointer;
      transition: all 0.3s;
    }
    nav.dark .lang-toggle {
      border-color: var(--white);
      color: var(--white);
    }
    .lang-toggle:hover { opacity: 0.7; }

    .nav-toggle {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
    }
    .nav-toggle span {
      display: block;
      width: 24px;
      height: 1px;
      background: var(--black);
      transition: all 0.3s;
    }

    .mobile-menu {
      position: fixed;
      inset: 0;
      background: var(--white);
      z-index: 99;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 40px;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.4s, visibility 0.4s;
    }
    .mobile-menu.open { opacity: 1; visibility: visible; }
    .mobile-menu a {
      font-family: var(--serif);
      font-size: 36px;
      color: var(--black);
      text-decoration: none;
      letter-spacing: 0.05em;
    }

    @media (max-width: 768px) {
      nav { padding: 24px; }
      .nav-links { display: none; }
      .lang-toggle { display: none; }
      .nav-toggle { display: flex; }
    }
  `]
})
export class HeaderComponent {
  translationService = inject(TranslationService);

  isScrolled = signal(false);
  isDarkSection = signal(false);
  menuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 50);

    const darkSection = document.getElementById('style');
    if (darkSection) {
      const rect = darkSection.getBoundingClientRect();
      this.isDarkSection.set(rect.top <= 100 && rect.bottom >= 100);
    }
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}