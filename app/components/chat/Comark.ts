import { defineComarkComponent } from '@comark/vue'
import highlight from '@comark/vue/plugins/highlight'
import githubLight from '@shikijs/themes/github-light'
import githubDark from '@shikijs/themes/github-dark'
import js from '@shikijs/langs/javascript'
import ts from '@shikijs/langs/typescript'
import tsx from '@shikijs/langs/tsx'
import jsx from '@shikijs/langs/jsx'
import vue from '@shikijs/langs/vue'
import html from '@shikijs/langs/html'
import css from '@shikijs/langs/css'
import scss from '@shikijs/langs/scss'
import json from '@shikijs/langs/json'
import yaml from '@shikijs/langs/yaml'
import md from '@shikijs/langs/markdown'
import bash from '@shikijs/langs/bash'
import shell from '@shikijs/langs/shellscript'
import php from '@shikijs/langs/php'
import python from '@shikijs/langs/python'
import go from '@shikijs/langs/go'
import rust from '@shikijs/langs/rust'
import java from '@shikijs/langs/java'
import csharp from '@shikijs/langs/csharp'
import cpp from '@shikijs/langs/cpp'
import c from '@shikijs/langs/c'
import sql from '@shikijs/langs/sql'
import dockerfile from '@shikijs/langs/dockerfile'
import xml from '@shikijs/langs/xml'
import diff from '@shikijs/langs/diff'

/**
 * Pre-configured Comark component used to render assistant markdown.
 *
 * Auto-imported globally as `<ChatComark>`. The `*:first:mt-0 *:last:mb-0`
 * utility trims the leading/trailing margins from the generated prose so the
 * markdown sits flush within UChatMessage's content slot.
 */
export default defineComarkComponent({
    name: 'ChatComark',
    plugins: [
        highlight({
            themes: {
                light: githubLight,
                dark: githubDark,
            },
            preStyles: true,
            languages: [
                js, ts, tsx, jsx, vue, html, css, scss, json, yaml, md,
                bash, shell, php, python, go, rust, java, csharp, cpp, c,
                sql, dockerfile, xml, diff,
            ],
        }),
    ],
    class: 'prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:text-highlighted prose-strong:text-highlighted prose-a:text-primary prose-code:text-highlighted prose-code:font-normal prose-code:before:content-none prose-code:after:content-none *:first:mt-0 *:last:mb-0',
})
