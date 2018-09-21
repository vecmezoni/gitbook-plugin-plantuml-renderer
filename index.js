const plantumlEncoder = require('plantuml-encoder');
const http = require('http')

const contentTypes = ['image/png', 'image/svg+xml']

module.exports = {
    blocks: {
        plantuml: {
            process: function(block) {
                const defaultFormat = this.generator === 'ebook'? 'png' : 'svg';
                const format = block.kwargs.format || defaultFormat;

                const encoded = plantumlEncoder.encode(
                    block.body
                        .replace(/\\\//g, `/`)
                        .replace(/\\\[/g, `[`)
                        .replace(/\\\]/g, `]`)
                        .replace(/\\\(/g, `(`)
                        .replace(/\\\)/g, `)`)
                        .replace(/&gt;/g, `>`)
                        .replace(/&lt;/g, `<`)
                );
                const hash = encoded.slice(0, 16);
                const name = block.kwargs.name || hash;
                const path = `/plantuml/${hash}.${format}`;
                const href = `http://www.plantuml.com/plantuml/${format}/${encoded}`;

                return new Promise((resolve, reject) => {
                    const request = http.get(href, (response) => {
                        const body = [];
                        response.on('data', (chunk) => body.push(chunk));
                        response.on('end', () => {
                            if (!contentTypes.includes(response.headers['content-type'])) {
                                reject(new Error(`Failed to load picture "${href}", response code: ${response.statusCode}`));
                            }

                            resolve(body.join(''))
                        });
                    });
                    request.on('error', (err) => reject(err));
                }).then(body => {
                    return this.output.writeFile(path, body);
                }).then(() => {
                    return `<img src="${path}" class="platuml-diagram" id="platuml-${name}"/>`;
                });
            }
        }
    }
};
