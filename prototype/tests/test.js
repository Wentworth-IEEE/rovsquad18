// Bobby Martin
// 2017

const fs = require('fs');

describe('Ye tests', () => {
    it('should parse hardcoded JSON correctly', () => {
        let test;
        fs.readFile('test.json', 'utf8', (err, data) => {
            if (err) throw err;
            test = JSON.parse(data);
        });
    });
});
