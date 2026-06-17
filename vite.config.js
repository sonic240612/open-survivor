export default {
    root: '.',
    base: './',
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                format: 'iife',
                entryFileNames: 'assets/[name].[hash].js'
            }
        }
    },
    server: {
        open: true,
    }
};
