import { Component, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header.component';
import { LoaderComponent } from './components/loader.component';
import { HeroComponent } from './components/hero.component';
import { PortfolioComponent } from './components/portfolio.component';
import { AboutComponent } from './components/about.component';
import { StyleSectionComponent } from './components/style-section.component';
import { BookingComponent } from './components/booking.component';
import { FooterComponent } from './components/footer.component';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    LoaderComponent,
    HeroComponent,
    PortfolioComponent,
    AboutComponent,
    StyleSectionComponent,
    BookingComponent,
    FooterComponent,
  ],
  template: `
    <app-loader></app-loader>
    <app-header></app-header>
    <main>
      <app-hero></app-hero>
      <section id="portfolio" class="section-padding">
        <app-portfolio></app-portfolio>
      </section>
      <section id="about" class="section-padding">
        <app-about></app-about>
      </section>
      <app-style-section></app-style-section>
      <section id="booking" class="section-padding">
        <app-booking></app-booking>
      </section>
    </main>
    <app-footer></app-footer>
  `,
  styles: [`
    main { position: relative; z-index: 1; }
    .section-padding { padding: 120px 48px; }
    @media (max-width: 768px) {
      .section-padding { padding: 80px 24px; }
    }
  `]
})
export class App implements AfterViewInit {
  private translationService = inject(TranslationService);

  ngAfterViewInit(): void {
    this.initRevealAnimations();
  }

  private initRevealAnimations(): void {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => observer.observe(el));
  }
}