const {default: Lollygag} = require('@lollygag/core');
const {default: markdown} = require('@lollygag/markdown');
const {default: templates} = require('@lollygag/templates');
const {default: livedev} = require('@lollygag/livedev');

const isProduction = process.env.NODE_ENV === 'production';
const lollygag = new Lollygag();

lollygag
    .config({
        prettyUrls: true,
    })
    .meta({
        siteName: '{{siteName}}',
        siteDescription: '{{siteDescription}}',
    })
    .do(markdown())
    .do(templates())
    .do(
        livedev({
            patterns: {
                'files/**/*': true,
                'templates/**/*': '**/*.md',
            },
            injectLivereloadScript: true,
        })
    )
    .build({fullBuild: true});

if(!isProduction) {
    lollygag.do(
        livedev({
            patterns: {
                'files/**/*': true,
                'files/**/*.scss': '**/*.scss',
                'templates/**/*': '**/*.md',
            },
            injectLivereloadScript: true,
        })
    );
}
