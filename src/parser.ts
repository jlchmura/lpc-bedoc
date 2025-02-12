import * as fs from "fs";
import * as path from "path";
import * as lpc from "@lpc-lang/core";
import { findArgument } from "./utils";

export class Parser {
    private createProgramOptions: lpc.CreateProgramOptions;
    private program: lpc.Program;

    /**
     *      
     * @param configSearchPath The starting to point to search for lpc-config.json.  This folder
     * and all ancestor folders will be searched for the config file.
     */
    constructor(configSearchPath: string) {        
        const configPath = lpc.findConfigFile(path.resolve(configSearchPath), fs.existsSync, "lpc-config.json");
        const projectFolder = configPath && path.dirname(configPath);
        const configFile = configPath ? lpc.parseJsonText(configPath, lpc.sys.readFile(configPath)!) : undefined;
        const parsedConfig = configFile && lpc.parseLpcSourceFileConfigFileContent(configFile, lpc.sys, projectFolder!, undefined, configPath);
        const compilerOptions = parsedConfig?.options || {
            driverType: lpc.LanguageVariant.FluffOS
        };
        const compilerHost = lpc.createCompilerHost(compilerOptions);    
        
        this.createProgramOptions = {
            host: compilerHost,
            rootNames: parsedConfig?.fileNames || [],
            options: compilerOptions,        
        };        

        this.program = lpc.createProgram(this.createProgramOptions);                
    }

    public parse(fileName: string, text: string): lpc.SourceFile | undefined {        
        let sourceFile = this.program?.getSourceFile(fileName);

        if (!sourceFile && fs.existsSync(fileName)) { 
            const inferredProgram = lpc.createProgram(
                {...this.createProgramOptions, rootNames: [fileName]}
            );
            sourceFile = inferredProgram.getSourceFile(fileName);        
        }

        if (!sourceFile) {
            const fileHandler = lpc.createLpcFileHandler({
                fileExists: fs.existsSync,
                readFile: lpc.sys.readFile,
                getCompilerOptions: () => this.createProgramOptions.options,
                getIncludeDirs: () => [],
                getCurrentDirectory: () => process.cwd(),
            });
            sourceFile = lpc.LpcParser.parseSourceFile(fileName, text, [], new Map(), fileHandler, lpc.ScriptTarget.LPC, undefined, true);
        } else {
            lpc.LpcParser.fixupParentReferences(sourceFile);
        }
        
        return sourceFile;
    }
}
