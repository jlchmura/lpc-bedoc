# @lpc-lang/bedoc

An LPC parser for [BeDoc](https://github.com/gesslar/bedoc), a powerful, pluggable documentation generator designed to handle any programming language and output format.

This parser uses the [lpc-lang](https://www.npmjs.com/package/@lpc-lang/core) language parser library from the [LPC Language Server](https://github.com/jlchmura/lpc-language-server) project to parse LPC code, extract function declarations, and generate documentation from their signature and LPCDoc comments.

A markdown printer is included to generate markdown documentation from the parsed data.

## Installation

Install from [npm](https://www.npmjs.com/package/@lpc-lang/bedoc):

```bash
npm install -g @lpc-lang/bedoc
```

## Use

For information on how to use this parser, see the official [BeDoc documentation](https://bedoc.gesslar.dev/).
