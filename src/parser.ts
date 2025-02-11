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
        const configPath = lpc.findConfigFile(configSearchPath, lpc.sys.fileExists, "lpc-config.json");
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
            options: compilerOptions        
        };        
        this.program = lpc.createProgram(this.createProgramOptions);
    }

    public parse(fileName: string): lpc.SourceFile | undefined {        
        if (this.createProgramOptions.rootNames?.length) {
            return this.program.getSourceFile(fileName);
        } 
        
        const inferredProgram = lpc.createProgram(
            {...this.createProgramOptions, rootNames: [fileName]}
        )
        return inferredProgram.getSourceFile(fileName);        
    }
}
