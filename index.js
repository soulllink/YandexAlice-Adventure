//Алиса
const { Alice, Reply, Scene, Stage, Markup } = require('yandex-dialogs-sdk');
const alice = new Alice();
const stage = new Stage();
const NEXT_MOVE = 'NEXT_MOVE';
const NextMove = new Scene(NEXT_MOVE);
const NAME_SELECT = 'NAME_SELECT';
const NameSelect = new Scene(NAME_SELECT);
const M = Markup;

//База данных
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Adventure');
const Users = require('./models/users.js');
const gameData = require('./models/gamedata.js');

//функции работы с БД

//получение объекта пользователя из БД
async function queryname(uname) {
    const userdata = await Users.findOne({ uid: uname }).lean().exec();
    return userdata;
};
//получение данных из БД с игрой
async function querygame(ustate) {
    const gamedata = await gameData.findOne({ state: ustate}).lean().exec();
    return gamedata;   
};
//обновление и создание нового пользователя
function updateusers(newname, newstate, uid) {
    const newUser = new Users({
        name: newname,
        uid: uid,
        stateofgame: newstate,
    });
    newUser.save();
};
//получение данных из БД по текущему положения "Стейт"
async function nextmove(ctx) {
    const stateofgame = ctx.session.get('stateofgame');
    const gamedata = await querygame(stateofgame);
    return Reply.text(gamedata.text, { buttons: gamedata.buttons});
};

//Приветсвтие
alice.command('', ctx => 
	Reply.text('Добро пожаловать! Желаете начать игру или продолжить?', {
		buttons: ['Начать новую игру', 'Продолжить', 'Об игре'],
	  }),
);
alice.command('Об игре', ctx =>
	Reply.text('Я даже и не знаю с чего начать...'),
);

//Начало игры
// Вилка диалога Продолжения игры и Создания новой игры
stage.addScene(NameSelect);
stage.addScene(NextMove);
alice.use(stage.getMiddleware());
const startNewGame = async ctx => {
    ctx.session.set('stateofgame', '1');
    ctx.enter(NAME_SELECT);
    return Reply.text('Придумайте новое имя');
};

//продолжение игры, плюс проверка на наличие имени пользователя
const startGame = async ctx => {
    const getid = String(ctx.userId);
    const userdata = await queryname(getid);
    
    if (getid == undefined) { 
    ctx.session.set('stateofgame', '1')
    ctx.enter(NAME_SELECT);
    return Reply.text('Придумайте новое имя');
    } else {
    const getsession = String(userdata.stateofgame);
    const gamedata = await querygame(getsession);
    ctx.session.set('stateofgame', getsession);
    ctx.session.set('name', userdata.name);
    ctx.enter(NEXT_MOVE);
    return Reply.text(gamedata.text, { buttons: gamedata.buttons});
            
    };  
};

//команды основного меню
alice.command('Начать новую игру', startNewGame);
alice.command('Продолжить', startGame);

//Начало функционального лупа - основого диалога внутри комнаты хода
NextMove.any( async ctx => {
    
    const message = String(ctx.message);
    const getid = String(ctx.userId);
    const getname = String(ctx.session.get('name'));
    const getstate = String(ctx.session.get('stateofgame'));
    const gamedata = await querygame(getstate);
	
	if (message == gamedata.buttons[0] || gamedata.buttons[1] || gamedata.buttons[2] || gamedata.buttons[3] || gamedata.buttons[4]) {
        const buttonid = gamedata.buttons.lastIndexOf(message);
        const newstate = ctx.session.set('stateofgame', gamedata.goto[buttonid]);
        updateusers(getname, newstate, getid);
	    return await nextmove(ctx);
	} else {
        await nextmove(ctx);
		return Reply.text('Вы не можете так поступить, попробуйте еще раз!', { buttons: gamedata.buttons});
	}
});


NameSelect.any( async ctx => {
    const newname = String(ctx.message);
    const getid = String(ctx.userId);
    updateusers(newname, '1', getid);
    ctx.session.set('name', newname);
    return Reply.text('Ваше имя ' + newname + ' верно?', {
            buttons: ['Именно так', 'Это не совсем так'],
    });
});
NameSelect.command('Именно так', startGame);
NameSelect.command('Это не совсем так', startNewGame);

//Отлов Any, а так же нового имени
alice.any(ctx => {
    return Reply.text('Что то пошло не так...');
});
//Подтверждение или отказ о назначении имени
alice.command('Именно так', startGame);
alice.command('Это не совсем так', startNewGame);

//Сервер
const port = 3001
alice.listen(port, '/', callback => console.log(port))