// Accessibility (a11y) utilities and best practices

export const accessibilityPatterns = {
  // Color contrast: minimum 4.5:1 for normal text, 3:1 for large text
  colors: {
    // High contrast text on dark backgrounds
    textOnDark: {
      primary: 'text-white', // #FFFFFF on #090D16 = 18:1 contrast
      secondary: 'text-slate-200', // Good contrast
      tertiary: 'text-slate-400', // WCAG AA compliant
      muted: 'text-slate-500', // WCAG AA for large text
    },
    // Buttons and interactive elements
    button: {
      primary: 'bg-amber-500 text-slate-950 hover:bg-amber-600', // 8.5:1 contrast
      secondary: 'bg-blue-600 text-white hover:bg-blue-700', // 7.2:1 contrast
      danger: 'bg-red-600 text-white hover:bg-red-700', // 5.9:1 contrast
      ghost: 'text-slate-200 hover:bg-slate-800', // Good contrast on hover
    },
  },

  // Focus indicators for keyboard navigation
  focus: 'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950',

  // Skip links for keyboard navigation
  skipLink:
    'absolute top-0 left-0 px-4 py-2 bg-amber-500 text-slate-950 font-bold z-50 -translate-y-full focus:translate-y-0 transition-transform',
};

export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-busy'?: boolean;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  role?: string;
  tabIndex?: number;
}

// Semantic HTML helpers
export const semanticElements = {
  // Use <button> or <a> depending on action vs navigation
  // Use <input> with proper type attribute
  // Use <label> associated with form elements
  // Use <fieldset> and <legend> for form groups
  // Use <table> with proper <thead>, <tbody>, <th>, <td> structure
};

// Keyboard navigation patterns
export const keyboardNavigationPatterns = {
  TAB: 'Tab',
  SHIFT_TAB: 'Shift+Tab',
  ENTER: 'Enter',
  SPACE: 'Space',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
};

export function createA11yLabel(icon: string, text: string): string {
  return `${icon} ${text}`;
}

export function getAriaLiveMessage(priority: 'polite' | 'assertive', message: string): {
  'aria-live': string;
  role: string;
  children: string;
} {
  return {
    'aria-live': priority,
    role: priority === 'assertive' ? 'alert' : 'status',
    children: message,
  };
}

export interface FormInputA11y {
  id: string;
  label: string;
  required?: boolean;
  invalid?: boolean;
  helperText?: string;
  errorMessage?: string;
}

export function getFormInputAriaAttributes(
  input: FormInputA11y
): AriaAttributes & { 'aria-describedby'?: string } {
  const describedBy: string[] = [];

  if (input.helperText) describedBy.push(`${input.id}-helper`);
  if (input.errorMessage) describedBy.push(`${input.id}-error`);

  return {
    'aria-label': input.label,
    'aria-required': input.required,
    'aria-invalid': input.invalid,
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
  };
}

// Test: Keyboard navigation checklist
export const a11yTestChecklist = {
  keyboardNavigation: [
    'Tab key navigates through all interactive elements',
    'Shift+Tab navigates backwards',
    'Enter/Space activates buttons',
    'Escape closes modals/dropdowns',
    'Arrow keys navigate within components (lists, tabs, etc.)',
    'No keyboard traps (user can always tab away)',
  ],
  screenReaders: [
    'All images have alt text',
    'Form labels associated with inputs',
    'Headings properly nested (h1, h2, h3...)',
    'Lists use semantic <ul>/<ol>/<li>',
    'Buttons and links have descriptive text',
    'ARIA labels added where semantic HTML insufficient',
  ],
  contrast: [
    'Text and background: 4.5:1 ratio (WCAG AA)',
    'Large text (18pt+): 3:1 ratio',
    'Graphics and UI components: 3:1 ratio',
    'Focus indicators clearly visible',
    'No color-only information conveyance',
  ],
  motion: [
    'Respect prefers-reduced-motion',
    'Animations have purpose beyond decoration',
    'No auto-playing audio/video',
  ],
};

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addListener(listener);

    return () => mediaQuery.removeListener(listener);
  }, []);

  return prefersReducedMotion;
}

import React from 'react';
