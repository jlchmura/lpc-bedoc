const esbuild = require("esbuild");

// ACTION
esbuild.build({
    entryPoints: ['src/index.ts'],  
    bundle: false, 
    banner: { js: "// Copyright 2025 John L Chmura\n" },
    outfile: 'dist/index.js',
    target: ["es2020"],
    platform: 'node',
    format: 'cjs',
    sourcemap: 'both',
    mainFields: ['module','main'], 
    logLevel: 'warning',
    treeShaking: true,
    minify: false
})