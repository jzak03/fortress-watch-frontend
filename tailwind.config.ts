
import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      typography: (theme: (path: string) => any) => ({
        DEFAULT: {
          css: {
            color: theme('colors.foreground'),
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.DEFAULT / 0.8'),
              },
            },
            // Add more prose styles here as needed
          },
        },
        sm: { // For prose-sm
          css: {
            color: theme('colors.muted.foreground'), // Example: use muted foreground for prose-sm
             a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.DEFAULT / 0.8'),
              },
            },
            // You can define specific styles for 'prose-sm'
             code: {
              backgroundColor: theme('colors.muted.DEFAULT'),
              color: theme('colors.muted.foreground'),
              padding: '0.2em 0.4em',
              borderRadius: theme('borderRadius.sm'),
            },
            pre: {
              backgroundColor: theme('colors.muted.DEFAULT / 0.5'),
              color: theme('colors.foreground'),
              padding: theme('spacing.4'),
              borderRadius: theme('borderRadius.md'),
              overflowX: 'auto',
            },
            'pre code': {
              backgroundColor: 'transparent',
              color: 'inherit',
              padding: '0',
              borderRadius: '0',
            },
            'ul > li::before': { backgroundColor: theme('colors.primary.DEFAULT') },
            'ol > li::before': { color: theme('colors.primary.DEFAULT') },
            strong: { color: theme('colors.foreground')},
            h1: { color: theme('colors.foreground') },
            h2: { color: theme('colors.foreground') },
            h3: { color: theme('colors.foreground') },
            h4: { color: theme('colors.foreground') },
          }
        },
        invert: { // For dark:prose-invert
            css: {
                color: theme('colors.background'), // Example: use background (light) for inverted text color
                a: {
                    color: theme('colors.primary.DEFAULT'), // Keep links primary
                    '&:hover': {
                        color: theme('colors.primary.DEFAULT / 0.8'),
                    },
                },
                 code: {
                  backgroundColor: theme('colors.secondary.DEFAULT'),
                  color: theme('colors.secondary.foreground'),
                },
                pre: {
                  backgroundColor: theme('colors.secondary.DEFAULT / 0.5'),
                  color: theme('colors.background'),
                },
                'pre code': {
                  color: 'inherit',
                },
                'ul > li::before': { backgroundColor: theme('colors.primary.DEFAULT') },
                'ol > li::before': { color: theme('colors.primary.DEFAULT') },
                strong: { color: theme('colors.background')},
                h1: { color: theme('colors.background') },
                h2: { color: theme('colors.background') },
                h3: { color: theme('colors.background') },
                h4: { color: theme('colors.background') },
            }
        }
      }),
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;

