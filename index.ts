#!/usr/bin/env node

import { spawn }  from "child_process";
import * as yargs from "yargs";
import * as fs from "fs";
import * as request from "request-promise";
const highlight = require('cli-highlight').highlight;


interface ExposedValue {
    name: string;
    comment: string;
    type: string;
};

interface Module {
    name: string;
    comment: string;
    aliases: any[];
    types: any[]
    values: ExposedValue[];
}


function renderExposedValueDocs(withStyles: boolean, value: ExposedValue): string {
    if (withStyles) return renderStyledExposedValueDocs(value);

    return `
${value.name} : ${value.type}
${value.comment.trim()}
    `.trim();
}

function renderStyledExposedValueDocs(value: ExposedValue): string {
    let definitionLine = highlight(`${value.name} : ${value.type}`, {language: 'elm'});

    let buildLines: string[] = [];
    let isInCode = false;
    let codeBuffer = '';

    if (value.comment.indexOf('\n') === -1){
        buildLines.push(value.comment);
    } else {
        value.comment.split('\n').forEach((line) => {
            if (isInCode) {
                if (line.indexOf('    ') === 0) {
                    codeBuffer += line + '\n';
                } else {
                    buildLines.push(highlight(codeBuffer, {language: 'elm'}));
                    isInCode = false;
                }
            } else {
                if (line.indexOf('    ') === 0){
                    isInCode = true;
                    codeBuffer += line + '\n';
                } else {
                    buildLines.push(line.trim());
                }
            }
        });
    }

    if (isInCode) {
        buildLines.push(highlight(codeBuffer, {language: 'elm'}));
    }

    return `
${definitionLine}
${buildLines.join('\n')}
    `.trim();
}

function renderModuleHeader(module: Module): string {
    return `
===============================================
|   Module: ${module.name}
===============================================
    `.trim();
}

function renderModuleDocs(withStyles: boolean, module: Module) : string {
    let builder : string[] = [];
    builder.push(renderModuleHeader(module));
    builder = builder.concat(module.values.map(renderExposedValueDocs.bind(null, withStyles))); 
    return builder.join("\n\n");
};

function renderDocs(docs: Module[], packageName: string, moduleName: string, valueName: string, version: string, withStyles: boolean) {
    if (!moduleName && !valueName) {
        let renderedModules = docs.sort((a: Module, b: Module) => {
            if (a.name < b.name) return -1;
            return 1;
        }).map(renderModuleDocs.bind(null, withStyles));
        console.log(renderedModules.join('\n\n'));
        return;
    } else if (valueName && !moduleName) {
        let foundThings : any[] = [];

        docs.forEach((module) => {
            module.values.forEach((val) => {
                if (val.name !== valueName) return;

                foundThings.push({ 
                    module: module,
                    value: val
                });
            });
        });

        if (foundThings.length === 0) {
            console.log(`The value ${valueName} is not exposed for that package at the version ${version}.`);
            return;
        } 

        let renderedDocs = foundThings.map((thing) => {
            return renderModuleHeader(thing.module) + "\n\n" + renderExposedValueDocs(withStyles, thing.value);
        }).join("\n\n");
        
        console.log(renderedDocs);
    } else {
        let foundModules = docs.filter((module : Module) => module.name === moduleName);
        if (foundModules.length === 0) {
            console.log(`The module ${moduleName} is not exposed for that package at the version ${version}.`);
            return;
        } 
        
        let foundModule = foundModules[0];

        if (!valueName) {
            console.log(renderModuleDocs(withStyles, foundModule));
        } else {
            let foundValues = foundModule.values.filter((value: ExposedValue) => value.name === valueName);
            if (foundValues.length === 0) {
                console.log(`The value ${valueName} is not exposed for that package at the version ${version}.`);
                return;
            }
            let foundValue = foundValues[0];
            console.log(renderExposedValueDocs(withStyles, foundValue));
        }
    }
}


function main(){
    const foundArgs = yargs
        .alias("package", "p")
        .describe("package", "An Elm package, for example elm-lang/core")
        .alias("module", "m")
        .describe("module", "A module inside the package, for example Maybe")
        .alias("name", "n")
        .describe("name", "An exposed name, for example withDefault") 
        .alias("version", "v")
        .describe("version", "A version of a package, for example 1.0.0 or latest")
        .boolean("style")
        .describe("style", "Enable syntax highlighting")
        .default("style", true)
        .usage("Provide a package name and I'll tell about that package")
        .help()
        .alias("h", "help")
        .argv;

    const packageName = foundArgs.package;
    const moduleName = foundArgs.module;
    const valueName = foundArgs.name;
    const version = foundArgs.version;
    const withStyles = foundArgs.style;

    if (!packageName) {
        console.log("Please specify a package name to look at using --package");
        return;
    } 

    let loadViaUrl = () => { 
        let ourVersion = version || 'latest';
        let documentationUrl = `http://package.elm-lang.org/packages/${packageName}/${ourVersion}/documentation.json`
        request.get(documentationUrl).then((docsAsString : string) => {
            let docs : Module[] = JSON.parse(docsAsString);
            renderDocs(docs, packageName, moduleName, valueName, ourVersion, withStyles);
        }).catch((err) => {
            console.log(err.error);
        });
    }

    fs.readFile("elm-stuff/exact-dependencies.json", (err, content) => {
        if (err) return loadViaUrl();

        let deps = JSON.parse(content.toString());
        let docsVersion = version || deps[packageName];
        if (!docsVersion) return loadViaUrl();
        
        fs.readFile(`elm-stuff/packages/${packageName}/${docsVersion}/documentation.json`, (err, docsAsString) => {
            if (err) return loadViaUrl();
            
            let docs : Module[] = JSON.parse(docsAsString.toString());
            console.log(`${packageName} ${docsVersion}`);
            renderDocs(docs, packageName, moduleName, valueName, version, withStyles);
        });
    });

};
main();
