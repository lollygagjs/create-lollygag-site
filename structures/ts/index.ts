import Lollygag, {
    markdownWorker,
    templatesWorker,
    livedevWorker,
} from '@lollygag/lollygag';

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
    .do(markdownWorker.default())
    .do(templatesWorker.default())
    .do(
        livedevWorker.default({
            patterns: {
                'files/**/*': true,
                'files/**/*.scss': '**/*.scss',
                'templates/**/*': '**/*.md',
            },
            injectLivereloadScript: !isProduction,
        })
    )
    .build({fullBuild: true});
