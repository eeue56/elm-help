#!/usr/bin/env node

import { spawn }  from "child_process";
import * as yargs from "yargs";
import * as fs from "fs";
import * as request from "request-promise";


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

function renderExposedValueDocs(value: ExposedValue): string {
    return `
${value.name} : ${value.type}
${value.comment.trim()}
    `.trim();
}

function renderModuleHeader(module: Module): string {
    return `
===============================================
|   Module: ${module.name}
===============================================
    `.trim();
}

function renderModuleDocs(module: Module) : string {
    let builder : string[] = [];
    builder.push(renderModuleHeader(module));
    builder = builder.concat(module.values.map(renderExposedValueDocs)); 
    return builder.join("\n\n");
};

function renderDocs(docs: Module[], packageName: string, moduleName: string, valueName: string, version: string) {
    if (!moduleName && !valueName) {
        let renderedModules = docs.sort((a: Module, b: Module) => {
            if (a.name < b.name) return -1;
            return 1;
        }).map(renderModuleDocs);
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
            return renderModuleHeader(thing.module) + "\n\n" + renderExposedValueDocs(thing.value);
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
            console.log(renderModuleDocs(foundModule));
        } else {
            let foundValues = foundModule.values.filter((value: ExposedValue) => value.name === valueName);
            if (foundValues.length === 0) {
                console.log(`The value ${valueName} is not exposed for that package at the version ${version}.`);
                return;
            }
            let foundValue = foundValues[0];
            console.log(renderExposedValueDocs(foundValue));
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
        .usage("Provide a package name and I'll tell about that package")
        .help()
        .alias("h", "help")
        .argv;

    const packageName = foundArgs.package;
    const moduleName = foundArgs.module;
    const valueName = foundArgs.name;
    const version = foundArgs.version;

    if (!packageName) {
        console.log("Please specify a package name to look at using --package");
        return;
    } 

    let loadViaUrl = () => { 
        let ourVersion = version || 'latest';
        let documentationUrl = `http://package.elm-lang.org/packages/${packageName}/${ourVersion}/documentation.json`
        request.get(documentationUrl).then((docsAsString : string) => {
            let docs : Module[] = JSON.parse(docsAsString);
            renderDocs(docs, packageName, moduleName, valueName, ourVersion);
        }).catch((err) => {
            console.log(err.error);
        });
    }

    fs.readFile("elm-stuff/exact-dependencies.json", (err, content) => {
        if (err) return loadViaUrl();

        let deps = JSON.parse(content.toString());
        let docsVersion = version || deps[packageName];
        console.log('dcos', docsVersion)
        if (!docsVersion) return loadViaUrl();
        
        fs.readFile(`elm-stuff/packages/${packageName}/${docsVersion}/documentation.json`, (err, docsAsString) => {
            if (err) return loadViaUrl();
            
            let docs : Module[] = JSON.parse(docsAsString.toString());
            console.log(`${packageName} ${docsVersion}`);
            renderDocs(docs, packageName, moduleName, valueName, version);
        });
    });

};
main();
