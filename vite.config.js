import { defineConfig } from 'vite';

export default defineConfig({
    root: 'web',
    server: {
        port: 3000,
        open: true,
        proxy: {
            '/api': 'http://localhost:5000',
            '/photos': 'http://localhost:5000',
        },
    },
});