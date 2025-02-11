import * as path from "path";
import * as lpc from "@lpc-lang/core";
import { findArgument } from "./utils";

function findArgAndResolve(argName: string, commandLineArgs: readonly string[]): string | undefined {
    const arg = findArgument(argName, commandLineArgs);
    return arg ? path.resolve(arg) : undefined;
}

export function run(commandLineArgs: readonly string[]) {     
    const projectFolder = findArgAndResolve("--project", commandLineArgs) ?? process.cwd();
    const fileNameArg = findArgAndResolve("--file", commandLineArgs);
    
    console.info("Project folder: " + projectFolder);
    console.info("File name: " + fileNameArg);

    const configPath = lpc.findConfigFile(projectFolder, lpc.sys.fileExists, "lpc-config.json");
    const configFile = lpc.parseJsonText(configPath, lpc.sys.readFile(configPath));
    const parsedConfig = lpc.parseLpcSourceFileConfigFileContent(configFile, lpc.sys, projectFolder, undefined, configPath);
    const compilerOptions = parsedConfig.options;
    const compilerHost = lpc.createCompilerHost(compilerOptions);    

    const createProgramOptions: lpc.CreateProgramOptions = {
        host: compilerHost,
        rootNames: parsedConfig.fileNames,
        options: compilerOptions        
    };
    const program = lpc.createProgram(createProgramOptions);
    const rootFiles = program.getRootFileNames();
    // console.info("Root files: ", rootFiles);
    rootFiles.forEach((rootFileName) => {
        if (rootFileName == fileNameArg) {
            const sourceFile = program.getSourceFile(rootFileName);
            printAst(sourceFile);            
        }
    });
}

function printAst(sourceFile: lpc.SourceFile) {
    console.info("AST for file: " + sourceFile.fileName);    
    console.info(JSON.stringify(sourceFile, undefined, 2));    
}
