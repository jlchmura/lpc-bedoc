import * as fs from "fs";
import * as path from "path";
import * as lpc from "@lpc-lang/core";
import { findArgument } from "./utils";

export class Parser {
    private createProgramOptions: lpc.CreateProgramOptions;
    private program: lpc.Program;

    /**
     * Attempt to find an lpc-config.json file and create a program. Although this is not needed
     * to parse a file for bedoc, we'll attempt to use any options the user has set in the config.
     * @param configSearchPath The starting to point to search for lpc-config.json.  This folder
     * and all ancestor folders will be searched for the config file.
     */
    constructor(configSearchPath: string) {        
        const configPath = lpc.findConfigFile(path.resolve(configSearchPath), fs.existsSync, "lpc-config.json");
        const projectFolder = configPath && path.dirname(configPath);
        // lpc-config is jsonc, parse it using lpc-lang's json parser
        const configFile = configPath ? lpc.parseJsonText(configPath, lpc.sys.readFile(configPath)!) : undefined;        
        const parsedConfig = configFile && lpc.parseLpcSourceFileConfigFileContent(configFile, lpc.sys, projectFolder!, undefined, configPath);
        // use config options if available, otherwise default to FluffOS driver type
        const compilerOptions = parsedConfig?.options || {
            driverType: lpc.LanguageVariant.FluffOS
        };

        // setup host and options for the program
        const compilerHost = lpc.createCompilerHost(compilerOptions);            
        this.createProgramOptions = {
            host: compilerHost,
            rootNames: parsedConfig?.fileNames || [],
            options: compilerOptions,        
        };        

        // create the program - this will read all lpc files "included" by the
        // lpc-config
        this.program = lpc.createProgram(this.createProgramOptions);                
    }

    public parse(fileName: string, text: string): lpc.SourceFile | undefined {        
        // check if the file is already in the program (program may not exist)
        let sourceFile = this.program?.getSourceFile(fileName);

        // as a fallback, parse the file as a standalone file using default options
        if (!sourceFile) {
            // file handler is used to load & resolve include files
            const fileHandler = lpc.createLpcFileHandler({
                fileExists: fs.existsSync,
                readFile: lpc.sys.readFile,
                getCompilerOptions: () => this.createProgramOptions.options,
                getIncludeDirs: () => [],
                getCurrentDirectory: () => process.cwd(),
            });
            sourceFile = lpc.LpcParser.parseSourceFile(fileName, text, [], new Map(), fileHandler, lpc.ScriptTarget.LPC, undefined, /** set parent nodes */ true);
        } else {
            // if the file came from a program, we'll need to set the parent for each AST node
            lpc.LpcParser.fixupParentReferences(sourceFile);
        }
        
        return sourceFile;
    }
}
