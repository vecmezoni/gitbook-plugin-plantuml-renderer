const plantuml = require('node-plantuml');
const escape = require('escape-html');
const crypto = require('crypto');

function flattenAttributes(attributes) {
    return Object.keys(attributes).filter(key => {
        return !['format', 'name'].includes(key);
    }).reduce((result, key) => {
        return `${result} ${escape(key)}="${escape(attributes[key])}"`;
    }, '');
}

module.exports = {
    blocks: {
        plantuml: {
            process: function(block) {
                const defaultFormat = this.generator === 'ebook'? 'png' : 'svg';
                const format = block.kwargs.format || defaultFormat;

                const input = block.body
                    .replace(/\\\//g, `/`)
                    .replace(/\\\[/g, `[`)
                    .replace(/\\\]/g, `]`)
                    .replace(/\\\(/g, `(`)
                    .replace(/\\\)/g, `)`)
                    .replace(/\\\#/g, `#`)
                    .replace(/\\\_/g, `_`)
                    .replace(/&gt;/g, `>`)
                    .replace(/&lt;/g, `<`);

                const hash = crypto.createHash('md5').update(input).digest('hex');
                const name = block.kwargs.name || hash;
                const path = `/plantuml/${hash}.${format}`;

                return new Promise((resolve, reject) => {
                    plantuml.generate(input, {format: format}, (error, result) => {
                        if (error) {
                            reject(error);
                            return
                        }

                        resolve(result);
                    });
                }).then(body => {
                    return this.output.writeFile(path, body);
                }).then(() => {
                    const attributes = Object.assign({}, block.kwargs, {
                        src: path,
                        class: 'platuml-diagram' + block.kwargs.class ? ' ' + block.kwargs.class : '',
                        id: `platuml-${name}`
                    })
                    return `<img${flattenAttributes(attributes)}/>`;
                });
            }
        }
    }
};
