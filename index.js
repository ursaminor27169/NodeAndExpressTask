const fs = require('fs');
var express = require('express');
var multer  = require('multer');
var app = express();
app.set('view engine', 'ejs');
var howString;

const storageConfig = multer.diskStorage({
    destination: (req, file, cb) =>{
        cb(null, "uploads");
    },
    filename: (req, file, cb) =>{
        cb(null, file.originalname);
    }
});

app.use(multer({storage:storageConfig}).single("fileform"));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/', function(req, res) {
    let filedata = req.file;
    if (!filedata) {
        res.render('error', {str: 'Файл не выбран'});
    } else if (filedata.mimetype !== 'text/plain') {
        res.render('error', {str: 'Неверный формат файла'});
    } else {
        const nameOfFile = filedata.path;
        var final = giveParser(nameOfFile);
        if (final instanceof String) {
            res.render('error', {str: final});
        } else {
            howString = (req.body.check === 'on') ? true : false;
            res.render('success', {final: final, howString: howString});    
        };
    };
});

app.listen(3000, ()=>{console.log("Server started");});

var giveParser = function(filePath) {
    var parser = function(str) { //сам парсер
        
        var remakeMass = function(table) { //обработка таблиц
            let keysMass = table[0].split(','), //записываем названия столбцов таблицы
                flag = 0,
                mass = [];
            keysMass.splice(0, 1); //убираем из массива названий первый элемент - название таблицы
            table.splice(0, 1); //убираем из таблицы первый элемент - в нем записаны названия
            table = table.filter(item => item.length > 0); //убираем возможные пустые строки
            table.forEach(row => {
                    let miniObj = {},
                        massOfValue = row.split(','); //делим на элементы строку
                    miniObj.id = massOfValue[0]; //записываем id
                    massOfValue.splice(0, 1);
                    if (massOfValue.length !== keysMass.length) { //проверка на одинаковое кол-во элементов в строках
                        flag++;
                    };
                    massOfValue.forEach((value, index) => { //вписываем остальные значения
                        miniObj[keysMass[index]] = value;
                    })
                    mass.push(miniObj); //добавляем готовый элемент в таблицу
            });
            return (flag > 0) ? 'В таблице ошибка' : mass; 
        }

        let mainObject = {};
        let mainArray = str.split('!'); //делим строку на потенциальные таблицы
        mainArray.splice(0, 1); //убираем первый элемент - он пустой
        const transfer = (str.indexOf('\r\n')) ? '\r\n' : '\n'; //выбираем кодировку символа переноса
        mainArray.forEach(table => {
            table = table.split(transfer); //делим таблицу на строки
            mainObject[(table[0].split(','))[0]] = remakeMass(table); //добавляем в итоговый объект результат работы функции
        });
        return mainObject;
    }

    var path = filePath;

    try { //обработка системных ошибок
        const str = fs.readFileSync(path, 'utf8');
        var final = parser(str)
        return final;
    } catch(err) {
        return 'Произошла системная ошибка';
    }
}