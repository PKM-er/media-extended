/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/components/**/*.{ts,tsx}",
    "./src/media-view/**/*.{ts,tsx}",
  ],
  darkMode: ["class", ".theme-dark"],
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@vidstack/react/tailwind.cjs')({
      prefix: 'media',
    }),
    customVariants,
  ],
  theme: {
    fontSize: {
      xs: "var(--font-ui-smaller)",
      sm: "var(--font-ui-small)",
      base: "var(--font-text-size)",
      md: "var(--font-ui-medium)",
      lg: "var(--font-ui-large)",
      "status-bar": "var(--status-bar-font-size)",
    },
    fontWeight: {
      thin: "var(--font-thin)",
      extralight: "var(--font-extralight)",
      light: "var(--font-light)",
      normal: "var(--font-normal)",
      medium: "var(--font-medium)",
      semibold: "var(--font-semibold)",
      bold: "var(--font-bold)",
      extrabold: "var(--font-extrabold)",
      black: "var(--font-black)",
    },
    borderRadius: {
      none: "0",
      sm: "var(--radius-s)",
      DEFAULT: "var(--radius-m)",
      md: "var(--radius-m)",
      lg: "var(--radius-l)",
      full: "9999px",
    },
    extend: {
      borderColor: {
        DEFAULT: "var(--background-modifier-border)",
      },
      divideColor: {
        DEFAULT: "var(--background-modifier-border)",
      },
      borderWidth: {
        DEFAULT: "var(--border-width)",
        callout: "var(--callout-border-width)",
        input: "var(--input-border-width)",
        modal: "var(--modal-border-width)",
        prompt: "var(--prompt-border-width)",
        table: "var(--table-border-width)",
        tag: "var(--tag-border-width)",
        titlebar: "var(--titlebar-border-width)",
        toggle: "var(--toggle-border-width)",
        blockquote: "var(--blockquote-border-thickness)",
      },
      boxShadow: {
        border: "0 0 0 1px var(--background-modifier-border)",
        input: "var(--input-shadow)",
      },
      lineHeight: {
        normal: "var(--line-height)",
        tight: "var(--line-height-tight)",
      },
      height: {
        'slider-track': 'var(--slider-track-height)',
        'slider-thumb': 'var(--slider-thumb-height)',
        'slider-thumb-sm': 'calc(var(--slider-thumb-height) * 0.75)',
      },
      borderRadius: {
        'slider-thumb': 'var(--slider-thumb-radius)',
      },
      borderWidth: {
        'width-slider-thumb': 'var(--slider-thumb-border-width)',
      },
      width: {
        'slider-thumb': 'var(--slider-thumb-width)',
        'slider-thumb-sm': 'calc(var(--slider-thumb-width) * 0.75)',
      },
      colors: {
        primary: "var(--background-primary)",
        "primary-alt": "var(--background-primary-alt)",
        secondary: "var(--background-secondary)",
        "secondary-alt": "var(--background-secondary-alt)",
        "text-highlight": "var(--text-highlight-bg)",
        "text-highlight-active": "var(--text-highlight-bg-active)",
        "mod-hover": "var(--background-modifier-hover)",
        "mod-active-hover": "var(--background-modifier-active-hover)",
        "mod-border": "var(--background-modifier-border)",
        "mod-border-hover": "var(--background-modifier-border-hover)",
        "mod-border-focus": "var(--background-modifier-border-focus)",
        "mod-error-rgb": "var(--background-modifier-error-rgb)",
        "mod-error": "var(--background-modifier-error)",
        "mod-error-hover": "var(--background-modifier-error-hover)",
        "mod-success-rgb": "var(--background-modifier-success-rgb)",
        "mod-success": "var(--background-modifier-success)",
        "mod-message": "var(--background-modifier-message)",
        "mod-form-field": "var(--background-modifier-form-field)",
        "txt-normal": "var(--text-normal)",
        "txt-muted": "var(--text-muted)",
        "txt-faint": "var(--text-faint)",
        "txt-on-accent": "var(--text-on-accent)",
        "txt-on-accent-inverted": "var(--text-on-accent-inverted)",
        "txt-error": "var(--text-error)",
        "txt-success": "var(--text-success)",
        "txt-selection": "var(--text-selection)",
        "txt-accent": "var(--text-accent)",
        "txt-accent-hover": "var(--text-accent-hover)",
        "txt-status-bar": "var(--status-bar-text-color)",
        "ia-normal": "var(--interactive-normal)",
        "ia-hover": "var(--interactive-hover)",
        "ia-accent-hsl": "var(--interactive-accent-hsl)",
        "ia-accent": "var(--interactive-accent)",
        "ia-accent-hover": "var(--interactive-accent-hover)",
        "slider-track": "var(--slider-track-background)",
        'slider-thumb': 'var(--thumb-border-color)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
};

function customVariants({ addVariant, matchVariant }) {
  // Strict version of `.group` to help with nesting.
  matchVariant('parent-data', (value) => `.parent[data-${value}] > &`);

  addVariant('hocus', ['&:hover', '&:focus-visible']);
  addVariant('group-hocus', ['.group:hover &', '.group:focus-visible &']);
}