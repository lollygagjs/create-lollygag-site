import Lollygag from '@lollygag/core';
import markdown from '@lollygag/markdown';
import templates from '@lollygag/templates';
import livedev from '@lollygag/livedev';

new Lollygag()
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
