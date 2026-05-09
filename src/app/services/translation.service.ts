import { Injectable, signal, computed } from '@angular/core';

export type Language = 'en' | 'es';

export interface Translations {
  hero: {
    eyebrow: string;
    name: string;
    subtitle: string;
    cta: string;
    scroll: string;
  };
  portfolio: {
    label: string;
    cta: string;
    items: { caption: string }[];
  };
  about: {
    label: string;
    title: string;
    bio1: string;
    bio2: string;
    bio3: string;
    stats: { value: string; label: string }[];
  };
  style: {
    label: string;
    items: { num: string; name: string; desc: string }[];
  };
  booking: {
    label: string;
    title: string;
    subtitle: string;
    name: string;
    email: string;
    styleLabel: string;
    stylePlaceholder: string;
    styleOptions: string[];
    ideaLabel: string;
    ideaPlaceholder: string;
    submit: string;
    sent: string;
  };
  footer: {
    subtitle: string;
    instagram: string;
    portfolio: string;
    reservations: string;
    copyright: string;
  };
  nav: {
    portfolio: string;
    studio: string;
    style: string;
    booking: string;
  };
  loader: {
    name: string;
  };
}

const translations: Record<Language, Translations> = {
  en: {
    hero: {
      eyebrow: 'Los Angeles · Ganga Tattoo LA',
      name: 'Enrique\nMartínez\nLorca',
      subtitle: 'Blackwork · Permanent Art',
      cta: 'View Work',
      scroll: 'Scroll',
    },
    portfolio: {
      label: 'Portfolio',
      cta: 'See more on Instagram',
      items: [
        { caption: 'Blackwork · 2024' },
        { caption: 'Ornamental · 2024' },
        { caption: 'Geometric · 2024' },
        { caption: 'Linework · 2024' },
        { caption: 'Blackwork · 2023' },
        { caption: 'Sigilism · 2023' },
      ],
    },
    about: {
      label: 'Studio',
      title: 'Art That\n<em>Endures</em>',
      bio1: 'Enrique Martínez Lorca, known as Henry Tatts, works from Ganga Tattoo LA studio in Los Angeles with a clear philosophy: each piece is unique, each stroke has intention.',
      bio2: 'Specialized in Blackwork — the discipline that turns black ink into pure form. No color, no distraction. Just line, mass, and silence.',
      bio3: 'The white background is not aesthetics. It is respect for the work.',
      stats: [
        { value: '+8', label: 'Years of experience' },
        { value: '100%', label: 'Custom design' },
        { value: '1', label: 'Client per session' },
        { value: 'Pvt.', label: 'Ganga Tattoo LA' },
      ],
    },
    style: {
      label: 'Specialties',
      items: [
        { num: '01', name: 'Black<em>work</em>', desc: 'Solid black ink. Clean forms. The oldest tradition reinterpreted with contemporary rigor.' },
        { num: '02', name: 'Dark <em>Ornamental</em>', desc: 'Complex patterns that wrap the skin. Decorative architecture that respects anatomy.' },
        { num: '03', name: '<em>Realismo</em>', desc: 'Hyper-realistic designs. Precision and depth that transform skin into living canvas.' },
        { num: '04', name: 'Geo<em>métrico</em>', desc: 'Mathematical precision. Symmetry and rhythm as the base of timeless aesthetics.' },
      ],
    },
    booking: {
      label: 'Booking',
      title: "Let's Start\n<em>Your Project</em>",
      subtitle: 'Ganga Tattoo LA · Los Angeles · Appointment Only',
      name: 'Name',
      email: 'Email',
      styleLabel: 'Style',
      stylePlaceholder: 'Select a style',
      styleOptions: ['Blackwork', 'Dark Ornamental', 'Realism', 'Geometric', 'Other / Inquire'],
      ideaLabel: 'Describe your idea',
      ideaPlaceholder: 'Tell me what you have in mind...',
      submit: 'Send Inquiry',
      sent: 'Sent ✓',
    },
    footer: {
      subtitle: 'Ganga Tattoo LA',
      instagram: 'Instagram',
      portfolio: 'Portfolio',
      reservations: 'Reservations',
      copyright: '© 2025 Enrique Martínez Lorca',
    },
    nav: {
      portfolio: 'Portfolio',
      studio: 'Studio',
      style: 'Style',
      booking: 'Booking',
    },
    loader: {
      name: 'henry tatts',
    },
  },
  es: {
    hero: {
      eyebrow: 'LOS ANGELES · Ganga Tattoo LA',
      name: 'Enrique\nMartínez\nLorca',
      subtitle: 'Blackwork · Arte permanente',
      cta: 'Ver trabajo',
      scroll: 'Scroll',
    },
    portfolio: {
      label: 'Portfolio',
      cta: 'Ver más en Instagram',
      items: [
        { caption: 'Blackwork · 2024' },
        { caption: 'Ornamental · 2024' },
        { caption: 'Geométrico · 2024' },
        { caption: 'Linework · 2024' },
        { caption: 'Blackwork · 2023' },
        { caption: 'Sigilismo · 2023' },
      ],
    },
    about: {
      label: 'Estudio',
      title: 'Arte que\n<em>permanece</em>',
      bio1: 'Enrique Martínez Lorca, conocido como Henry Tatts, trabaja desde Ganga Tattoo LA en LA con una filosofía clara: cada pieza es única, cada trazo tiene intención.',
      bio2: 'Especializado en Blackwork — la disciplina que convierte la tinta negra en forma pura. Sin color, sin distracción. Solo línea, masa y silencio.',
      bio3: 'El fondo blanco no es estética. Es respeto por el trabajo.',
      stats: [
        { value: '+8', label: 'Años de experiencia' },
        { value: '100%', label: 'Diseño personalizado' },
        { value: '1', label: 'Cliente por sesión' },
        { value: 'Ganga', label: 'Ganga Tattoo LA' },
      ],
    },
    style: {
      label: 'Especialidades',
      items: [
        { num: '01', name: 'Black<em>work</em>', desc: 'Tinta negra sólida. Formas limpias. La tradición más antigua reinterpretada con rigor contemporáneo.' },
        { num: '02', name: 'Dark <em>Ornamental</em>', desc: 'Patrones complejos que envuelven la piel. Arquitectura decorativa que respeta la anatomía.' },
        { num: '03', name: '<em>Realismo</em>', desc: 'Diseños hiperrealistas. Precisión y profundidad que transforman la piel en lienzo vivo.' },
        { num: '04', name: 'Geo<em>métrico</em>', desc: 'Precisión matemática. Simetría y ritmo como base de una estética atemporal.' },
      ],
    },
    booking: {
      label: 'Reserva',
      title: 'Comencemos\n<em>tu proyecto</em>',
      subtitle: 'Ganga Tattoo LA · LA · Solo citas previas',
      name: 'Nombre',
      email: 'Email',
      styleLabel: 'Estilo',
      stylePlaceholder: 'Selecciona un estilo',
      styleOptions: ['Blackwork', 'Dark Ornamental', 'Realismo', 'Geométrico', 'Otro / Consultar'],
      ideaLabel: 'Describe tu idea',
      ideaPlaceholder: 'Cuéntame qué tienes en mente...',
      submit: 'Enviar consulta',
      sent: 'Enviado ✓',
    },
    footer: {
      subtitle: 'Ganga Tattoo LA',
      instagram: 'Instagram',
      portfolio: 'Portfolio',
      reservations: 'Reservas',
      copyright: '© 2025 Enrique Martínez Lorca',
    },
    nav: {
      portfolio: 'Portfolio',
      studio: 'Estudio',
      style: 'Estilo',
      booking: 'Reserva',
    },
    loader: {
      name: 'henry tatts',
    },
  },
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private currentLang = signal<Language>('en');

  readonly language = computed(() => this.currentLang());
  readonly translations = computed(() => translations[this.currentLang()]);

  toggleLanguage(): void {
    this.currentLang.update(lang => lang === 'en' ? 'es' : 'en');
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
  }
}