declare module 'vite' {
    export function defineConfig(config: any): any;
}

declare module '@vitejs/plugin-react' {
    const plugin: any;
    export default plugin;
}

// Allow importing CSS/asset modules in TypeScript during build
declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
