const esbuild = require("esbuild");

// ACTION
esbuild.build({
    entryPoints: ['src/index.ts'],  
    bundle: true, 
    banner: { js: "// Copyright 2025 John L Chmura\n" },
    outfile: 'index.js',
    target: ["es2020"],
    platform: 'node',
    format: 'cjs',
    sourcemap: 'both',
    mainFields: ['module','main'], 
    logLevel: 'warning',
    treeShaking: true,
    minify: false
})