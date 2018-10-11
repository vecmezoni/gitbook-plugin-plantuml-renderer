const plantuml = require('node-plantuml');
const crypto = require('crypto');

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
                    return `<img src="${path}" class="platuml-diagram" id="platuml-${name}"/>`;
                });
            }
        }
    }
};
