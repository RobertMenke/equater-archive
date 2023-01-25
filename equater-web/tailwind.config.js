const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./components/**/*.tsx', './pages/**/*.tsx'],
    theme: {
        extend: {
            borderWidth: {
                1: '1px'
            },
            fontFamily: {
                sans: ['Inter var', ...defaultTheme.fontFamily.sans]
            },
            textColor: {
                primary: 'var(--app-text-primary)',
                secondary: 'var(--app-text-secondary)',
                'accent-primary': 'var(--app-text-accent-primary)',
                'accent-dark': 'var(--app-text-accent-dark)',
                'accent-light': 'var(--app-text-accent-light)'
            },
            colors: {
                app: {
                    primary: 'var(--bg-app-primary)',
                    secondary: 'var(--bg-app-secondary)',
                    'secondary-dark': 'var(--bg-app-secondary-dark)',
                    accent: 'var(--app-accent)',
                    'accent-light': 'var(--app-accent-light)',
                    'accent-dark': 'var(--app-accent-dark)',
                    'accent-100': 'var(--app-accent-100)',
                    'royal-blue': 'var(--app-royal-blue)',
                    'royal-blue-light': 'var(--app-royal-blue-light)'
                },
                gray: {
                    100: '#f5f5f5',
                    200: '#eeeeee',
                    300: '#e0e0e0',
                    400: '#bdbdbd',
                    500: '#9e9e9e',
                    600: '#757575',
                    700: '#616161',
                    800: '#424242',
                    900: '#212121'
                }
            }
        },
        spinner: (theme) => ({
            default: {
                color: '#EEE', // color you want to make the spinner
                size: '1em', // size of the spinner (used for both width and height)
                border: '2px', // border-width of the spinner (shouldn't be bigger than half the spinner's size)
                speed: '500ms' // the speed at which the spinner should rotate
            }
        })
    },
    plugins: [require('tailwindcss'), require('@tailwindcss/forms'), require('postcss-preset-env')]
}
