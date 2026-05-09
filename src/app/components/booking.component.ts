import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../services/translation.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section id="booking">
      <div class="section-label reveal" style="justify-content:center">{{ translationService.translations().booking.label }}</div>
      <h2 class="booking-title reveal" [innerHTML]="translationService.translations().booking.title"></h2>
      <p class="booking-sub reveal">{{ translationService.translations().booking.subtitle }}</p>
      <form class="booking-form reveal" (ngSubmit)="handleSubmit()">
        <div class="form-field">
          <label>{{ translationService.translations().booking.name }}</label>
          <input type="text" placeholder="Your full name">
        </div>
        <div class="form-field">
          <label>{{ translationService.translations().booking.email }}</label>
          <input type="email" placeholder="your@email.com">
        </div>
        <div class="form-field">
          <label>{{ translationService.translations().booking.styleLabel }}</label>
          <select>
            <option value="">{{ translationService.translations().booking.stylePlaceholder }}</option>
            @for (option of translationService.translations().booking.styleOptions; track $index) {
              <option>{{ option }}</option>
            }
          </select>
        </div>
        <div class="form-field">
          <label>{{ translationService.translations().booking.ideaLabel }}</label>
          <textarea [placeholder]="translationService.translations().booking.ideaPlaceholder"></textarea>
        </div>
        <button type="submit" class="submit-btn" [class.sent]="submitted()">
          {{ submitted() ? translationService.translations().booking.sent : translationService.translations().booking.submit }}
        </button>
      </form>
    </section>
  `,
  styles: [`
    #booking {
      background: var(--white);
      text-align: center;
    }

    .booking-title {
      font-family: var(--serif);
      font-size: clamp(40px, 6vw, 72px);
      font-weight: 300;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    .booking-title :deep(em) { font-style: italic; color: var(--gray); }

    .booking-sub {
      font-size: 13px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--gray);
      margin-bottom: 56px;
    }

    .booking-form {
      max-width: 560px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .form-field {
      border-top: 1px solid var(--light-gray);
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
    }
    .form-field:last-of-type { border-bottom: 1px solid var(--light-gray); }

    .form-field label {
      font-size: 10px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--gray);
    }

    .form-field input,
    .form-field textarea,
    .form-field select {
      background: none;
      border: none;
      outline: none;
      font-family: var(--serif);
      font-size: 18px;
      color: var(--black);
      width: 100%;
      resize: none;
    }

    .form-field select { cursor: pointer; appearance: none; }
    .form-field textarea { height: 80px; }

    .submit-btn {
      margin-top: 40px;
      display: inline-flex;
      align-items: center;
      gap: 16px;
      font-family: var(--sans);
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--white);
      background: var(--black);
      border: none;
      padding: 20px 48px;
      cursor: pointer;
      transition: opacity 0.3s;
      align-self: center;
    }
    .submit-btn:hover { opacity: 0.8; }
    .submit-btn.sent { background: #333; }
  `]
})
export class BookingComponent {
  translationService = inject(TranslationService);
  submitted = signal(false);

  handleSubmit(): void {
    this.submitted.set(true);
    setTimeout(() => {
      this.submitted.set(false);
    }, 3000);
  }
}