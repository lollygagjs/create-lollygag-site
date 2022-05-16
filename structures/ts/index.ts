import Lollygag, {markdown, templates} from '@lollygag/core';
import livedev from '@lollygag/livedev';

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
    );

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

lollygag.build({fullBuild: true});
