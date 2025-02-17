const esbuild = require("esbuild");
const copy = require('esbuild-plugin-copy');

// ACTION
esbuild.build({
    entryPoints: ['src/index.ts'],  
    bundle: true, 
    banner: { js: "// Copyright 2025 John L Chmura\n" },
    outfile: './dist/index.js',
    target: ["es2020"],
    platform: 'node',
    format: 'cjs',
    sourcemap: 'both',
    mainFields: ['module','main'], 
    logLevel: 'warning',
    treeShaking: true,
    minify: false,    
    plugins: [
        copy.copy({
          resolveFrom: 'cwd',
          assets: { from: ['./src/parser/*.yaml'], to: ['./dist/'] },          
        }),
        copy.copy({
            resolveFrom: 'cwd',
            assets: { from: ['./src/printer/*.yaml'], to: ['./dist/'] },
          }),        
      ],
})