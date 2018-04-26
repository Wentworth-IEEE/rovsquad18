/*var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.send('hello wold');
});

if(!module.parent) {
    app.listen(8083);
    console.log('Started on port 8083');
}

app.get('/', (request, response) => {
    response.render('home', {
        name: 'John'
    })
})
*/
// index.js
const path = require('path')
const express = require('express')
const exphbs = require('express-handlebars')

const app = express()

app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'views'))
app.get('/', (request, response) => {
    response.render('home', {
        name: 'John'
    })
})

