#!/usr/bin/env node

import {existsSync, readdirSync} from 'fs';
import {join, resolve} from 'path';
import {spawn, spawnSync} from 'child_process';
import readline from 'readline';
import ncp from 'ncp';
import Lollygag, {handlebars, RaggedyAny} from '@lollygag/lollygag';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const qPrefix = '\x1b[36mquestion\x1b[0m';
const wPrefix = '\x1b[33mwarning \x1b[0m';

type TGetOptionCallback = (
    answer: string,
    // eslint-disable-next-line no-use-before-define
    func?: typeof getOption
) => string | Promise<string> | boolean;

function getOption(
    question: string,
    message: string | null,
    callback: TGetOptionCallback
): Promise<string> {
    if(message) console.log(message);

    return new Promise((res) => {
        rl.question(question, async(answer) =>
            res(callback(answer, getOption) as string | Promise<string>));
    });
}

const defaultProjectDir = './';
const getProjectDirQuestion = `${qPrefix} Project directory (${defaultProjectDir}): `;

function getProjectDir(dir: string, func?: typeof getOption) {
    let result;
    const resolvedDir = resolve(dir);

    if(!resolvedDir) {
        result = `${wPrefix} Project directory is required`;
    } else if(!resolvedDir.match(/^[\w.\-/]*$/)) {
        result = `${wPrefix} Invalid directory name... '${resolvedDir}'`;
    } else if(existsSync(resolvedDir) && readdirSync(resolvedDir).length) {
        result = `${wPrefix} The directory '${resolvedDir}' exists and is not empty`;
    } else {
        result = resolvedDir;
    }

    return func && result !== resolvedDir
        ? func(getProjectDirQuestion, result, getProjectDir)
        : result;
}

const defaultSiteName = 'Lollygag Site';
const getSiteNameQuestion = `${qPrefix} Site name (${defaultSiteName}): `;

const getSiteName = (name: string) => name;

const defaultSiteDescription = 'A Lollygag starter site.';
const getSiteDescriptionQuestion = `${qPrefix} Site description (${defaultSiteDescription}): `;

const getSiteDescription = (description: string) => description;

const defaultUseTs = 'yes';
const getUseTsQuestion = `${qPrefix} Use TypeScript? (${defaultUseTs}): `;

function getUseTs(useTs: string, func?: typeof getOption) {
    let result;

    useTs.toLowerCase();

    const no = ['no', 'n', 'false'];
    const yes = ['yes', 'y', 'true'];
    const validValues = [...yes, ...no];

    if(useTs && !validValues.includes(useTs)) {
        let vals: string | string[] = [...validValues];
        const lastVal = vals.pop();

        vals = `${vals.join(', ')} and ${lastVal}`;
        result = `${wPrefix} Valid values are ${vals}`;
    } else {
        result = useTs === '' || yes.includes(useTs) ? 'yes' : 'no';
    }

    return func && !['yes', 'no'].includes(result)
        ? func(getUseTsQuestion, result, getUseTs)
        : result;
}

(async function start() {
    const vars = {
        siteName: defaultSiteName,
        siteDescription: defaultSiteDescription,
        useTs: defaultUseTs,
        projectDir: defaultProjectDir,
    };

    type TOptionVars = keyof typeof vars;

    interface ICreateOptions {
        callback: TGetOptionCallback;
        question: string;
        varToSet: TOptionVars;
        returnType: 'string' | 'boolstring';
    }

    const options: Record<string, ICreateOptions> = {
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
    const skips: TOptionVars[] = [];

    for(let i = 0; i < validOptions.length; i++) {
        const opt = options[validOptions[i]];

        // eslint-disable-next-line no-continue
        if(skips.includes(opt.varToSet)) continue;

        const idx = process.argv.indexOf(validOptions[i]);

        let val = '';

        if(idx > -1) {
            if(opt.returnType === 'string') {
                val = validOptions.includes(process.argv[idx + 1])
                    ? ''
                    : process.argv[idx + 1];
            }

            if(opt.returnType === 'boolstring') val = 'yes';

            const checkedVal = opt.callback(val);

            if(checkedVal !== val) {
                val = '';
                console.log(checkedVal);
            }
        }

        // eslint-disable-next-line require-atomic-updates
        vars[opt.varToSet]
            = val
            // eslint-disable-next-line no-await-in-loop
            || (await getOption(opt.question, null, opt.callback))
            || vars[opt.varToSet].trim();

        skips.push(opt.varToSet);
    }

    const projectDir = join(vars.projectDir);

    const packageName = vars.siteName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const pnpmVersion = spawnSync('pnpm --version', {
        shell: true,
    })
        .stdout.toString()
        .trim();

    const yarnVersion = spawnSync('yarn --version', {
        shell: true,
    })
        .stdout.toString()
        .trim();

    // eslint-disable-next-line no-nested-ternary
    const packageManager = pnpmVersion ? 'pnpm' : yarnVersion ? 'yarn' : 'npm';

    // eslint-disable-next-line no-nested-ternary
    const installCommand = pnpmVersion
        ? 'pnpm install'
        : yarnVersion
            ? 'yarn'
            : 'npm install';

    await new Lollygag()
        .config({
            prettyUrls: false,
            generateTimestamp: false,
        })
        .meta({
            siteName: vars.siteName,
            siteDescription: vars.siteDescription,
            packageName,
            packageManager,
        })
        .in(
            resolve(
                __dirname,
                '../',
                join('structures', vars.useTs === 'yes' ? 'ts' : 'js')
            )
        )
        .out(projectDir)
        .do(
            handlebars({
                newExtname: false,
                targetExtnames: ['.json', '.ts', '.md', '.js'],
            })
        )
        .build({
            allowExternalDirectories: true,
            allowWorkingDirectoryOutput: true,
        });

    await new Promise((res, rej) => {
        ncp(
            resolve(__dirname, '../', join('structures', 'universal')),
            projectDir,
            (err: RaggedyAny): RaggedyAny => {
                if(err) rej(err);
                res(null);
            }
        );
    });

    const install = spawn(`cd ${projectDir} && ${installCommand}`, {
        shell: true,
        stdio: 'inherit',
    });

    install.on('exit', (exitCode) => {
        if(exitCode && exitCode !== 0) {
            console.log();
            console.log('--------------------------------------------');
            console.log();
            console.log('An error occurred while installing dependencies.');
            console.log();
            console.log('--------------------------------------------');
            console.log();

            process.exit(exitCode);
        }

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

        process.exit(0);
    });
}());
