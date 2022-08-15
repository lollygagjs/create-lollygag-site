#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const readline_1 = __importDefault(require("readline"));
const ncp_1 = __importDefault(require("ncp"));
const core_1 = __importStar(require("@lollygag/core"));
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const qPrefix = '\x1b[36mquestion\x1b[0m';
const wPrefix = '\x1b[33mwarning \x1b[0m';
function getOption(question, message, callback) {
    if (message)
        console.log(message);
    return new Promise((res) => {
        rl.question(question, (answer) => __awaiter(this, void 0, void 0, function* () { return res(callback(answer, getOption)); }));
    });
}
const defaultProjectDir = './';
const getProjectDirQuestion = `${qPrefix} Project directory (${defaultProjectDir}): `;
function getProjectDir(dir, func) {
    let result;
    const resolvedDir = (0, path_1.resolve)(dir);
    if (!resolvedDir) {
        result = `${wPrefix} Project directory is required`;
    }
    else if (!resolvedDir.match(/^[\w.\-/]*$/)) {
        result = `${wPrefix} Invalid directory name... '${resolvedDir}'`;
    }
    else if ((0, fs_1.existsSync)(resolvedDir) && (0, fs_1.readdirSync)(resolvedDir).length) {
        result = `${wPrefix} The directory '${resolvedDir}' exists and is not empty`;
    }
    else {
        result = resolvedDir;
    }
    return func && result !== resolvedDir
        ? func(getProjectDirQuestion, result, getProjectDir)
        : result;
}
const defaultSiteName = 'Lollygag Site';
const getSiteNameQuestion = `${qPrefix} Site name (${defaultSiteName}): `;
const getSiteName = (name) => name;
const defaultSiteDescription = 'A Lollygag starter site.';
const getSiteDescriptionQuestion = `${qPrefix} Site description (${defaultSiteDescription}): `;
const getSiteDescription = (description) => description;
const defaultUseTs = 'yes';
const getUseTsQuestion = `${qPrefix} Use TypeScript? (${defaultUseTs}): `;
function getUseTs(useTs, func) {
    let result;
    useTs.toLowerCase();
    const no = ['no', 'n', 'false'];
    const yes = ['yes', 'y', 'true'];
    const validValues = [...yes, ...no];
    if (useTs && !validValues.includes(useTs)) {
        let vals = [...validValues];
        const lastVal = vals.pop();
        vals = `${vals.join(', ')} and ${lastVal}`;
        result = `${wPrefix} Valid values are ${vals}`;
    }
    else {
        result = useTs === '' || yes.includes(useTs) ? 'yes' : 'no';
    }
    return func && !['yes', 'no'].includes(result)
        ? func(getUseTsQuestion, result, getUseTs)
        : result;
}
(function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const vars = {
            siteName: defaultSiteName,
            siteDescription: defaultSiteDescription,
            useTs: defaultUseTs,
            projectDir: defaultProjectDir,
        };
        const options = {
            '-p': {
                callback: getProjectDir,
                question: getProjectDirQuestion,
                varToSet: 'projectDir',
                returnType: 'string',
            },
            '--projectdir': {
                callback: getProjectDir,
                question: getProjectDirQuestion,
                varToSet: 'projectDir',
                returnType: 'string',
            },
            '-n': {
                callback: getSiteName,
                question: getSiteNameQuestion,
                varToSet: 'siteName',
                returnType: 'string',
            },
            '--name': {
                callback: getSiteName,
                question: getSiteNameQuestion,
                varToSet: 'siteName',
                returnType: 'string',
            },
            '-d': {
                callback: getSiteDescription,
                question: getSiteDescriptionQuestion,
                varToSet: 'siteDescription',
                returnType: 'string',
            },
            '--description': {
                callback: getSiteDescription,
                question: getSiteDescriptionQuestion,
                varToSet: 'siteDescription',
                returnType: 'string',
            },
            '-t': {
                callback: getUseTs,
                question: getUseTsQuestion,
                varToSet: 'useTs',
                returnType: 'boolstring',
            },
            '--typescript': {
                callback: getUseTs,
                question: getUseTsQuestion,
                varToSet: 'useTs',
                returnType: 'boolstring',
            },
        };
        const validOptions = Object.keys(options).map((key) => key);
        const skips = [];
        for (let i = 0; i < validOptions.length; i++) {
            const opt = options[validOptions[i]];
            // eslint-disable-next-line no-continue
            if (skips.includes(opt.varToSet))
                continue;
            const idx = process.argv.indexOf(validOptions[i]);
            let val = '';
            if (idx > -1) {
                if (opt.returnType === 'string') {
                    val = validOptions.includes(process.argv[idx + 1])
                        ? ''
                        : process.argv[idx + 1];
                }
                if (opt.returnType === 'boolstring')
                    val = 'yes';
                const checkedVal = opt.callback(val);
                if (checkedVal !== val) {
                    val = '';
                    console.log(checkedVal);
                }
            }
            // eslint-disable-next-line require-atomic-updates
            vars[opt.varToSet]
                = val
                    // eslint-disable-next-line no-await-in-loop
                    || (yield getOption(opt.question, null, opt.callback))
                    || vars[opt.varToSet].trim();
            skips.push(opt.varToSet);
        }
        const projectDir = (0, path_1.join)(vars.projectDir);
        const packageName = vars.siteName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        yield new core_1.default()
            .meta({
            siteName: vars.siteName,
            siteDescription: vars.siteDescription,
            packageName,
        })
            .in((0, path_1.resolve)(__dirname, '../', (0, path_1.join)('structures', vars.useTs === 'yes' ? 'ts' : 'js')))
            .out(projectDir)
            .do((0, core_1.handlebars)({
            newExtname: false,
            targetExtnames: ['.json', '.ts', '.md', '.js'],
        }))
            .build({
            allowExternalDirectories: true,
            allowWorkingDirectoryOutput: true,
        });
        (0, fs_1.unlinkSync)('.timestamp');
        yield new Promise((res, rej) => {
            (0, ncp_1.default)((0, path_1.resolve)(__dirname, '../', (0, path_1.join)('structures', 'universal')), projectDir, (err) => {
                if (err)
                    rej(err);
                res(null);
            });
        });
        const yarnVersion = (0, child_process_1.spawnSync)('yarn --version', {
            shell: true,
        })
            .stdout.toString()
            .trim();
        const packageManager = yarnVersion ? 'yarn' : 'npm';
        const installCommand = yarnVersion ? 'yarn' : 'npm install';
        const install = (0, child_process_1.spawn)(`cd ${projectDir} && ${installCommand}`, {
            shell: true,
            stdio: 'inherit',
        });
        install.on('exit', (exitCode) => {
            console.log();
            console.log('--------------------------------------------');
            console.log();
            console.log('Your new Lollygag site is ready.');
            console.log();
            console.log('Next steps:');
            console.log();
            console.log(`$ cd ${projectDir}`);
            console.log(`$ ${packageManager} start`);
            console.log();
            console.log('This would start a live dev server at');
            console.log('http://localhost:3000. For more info, check');
            console.log('out the docs: https://lollygag.github.io');
            console.log();
            console.log('Happy building!');
            console.log();
            console.log('--------------------------------------------');
            console.log();
            process.exit(exitCode || 0);
        });
    });
}());
