var NFS_HEIGHT = 500;
var CAR_BOTTOM = 10;
var CAR_HEIGHT = 80 + CAR_BOTTOM;
var CAR_WIDTH = 40;
var OBSTACLE_WIDTH = 100;
var OBSTACLE_HEIGHT = 33.328;
var OBSTACLE_APPEARANCE_GAP = 1000; //1 second
var OBSTACLE_APPEARANCE_DX = 100;
var PX_DX = 3;
var PX_DX_DX = 0.05;
var GAME_TIME = 1;
var GAME_TIME_DX = 11;
var INITIAL_BULLETS_BOTTOM = CAR_HEIGHT;

function Util() {}

Util.getRandomInt = function(min, max) {

    return Math.floor(Math.random() * (max - min + 1)) + min;
};

function Obstacle(lanes, laneNo) {

    var _this = this;
    this._init = function() {

        this.element = document.createElement('img');
        this.laneNo = laneNo;
        this.lanes = lanes;
        this.element.className = 'obstacle';
        this.element.setAttribute('src', 'images/obstacle.png');
        this.lanes[laneNo].appendChild(this.element);
        this.dynamicMarginTop = 1;
    };

    this._init();
}

function ObstacleManager(lanes, car) {

    var _this = this;
    this._init = function() {

        this.lanes = lanes;
        this.car = car;
        this.obstacles = [];
    };

    this.generateObstacles = function() {

        _this.obstacleGeneratorId = setInterval(_this._generateObstacle, OBSTACLE_APPEARANCE_GAP);
    };

    this._generateObstacle = function() {

        if (_this.obstacles.length < 3) {

            var laneNo;
            laneNo = Util.getRandomInt(0, _this.lanes.length - 1);
            var obstacle = new Obstacle(_this.lanes, laneNo);
            _this.obstacles.push(obstacle);

            return obstacle;
        }
    };

    this.refreshObstacles = function() {

        var updatedObstacles = [];
        for (var i = 0; i < _this.obstacles.length; i++) {

            _this.obstacles[i].element.style.top = _this.obstacles[i].dynamicMarginTop + 'px';
            if (!(parseInt(_this.obstacles[i].element.style.top) > NFS_HEIGHT - CAR_BOTTOM)) {

                _this.obstacles[i].dynamicMarginTop += PX_DX;
                updatedObstacles.push(_this.obstacles[i]);
            } else {

                _this.obstacles[i].element.parentElement.removeChild(_this.obstacles[i].element);
                for (var j = 0; j < _this.obstacles.length; j++) {

                    if (_this.obstacles[j].element.parentElement === _this.obstacles[i].element.parentElement) {

                        _this.obstacles[j].element.style.top = _this.obstacles[j].dynamicMarginTop + OBSTACLE_HEIGHT + 'px';
                    }
                }
            }
        }
        _this.obstacles = updatedObstacles;
    };

    this.removeObstacle = function(obstacle){

        var index = this.obstacles.indexOf(obstacle);

        if(index !== -1){
            console.log(this.obstacles[index].parentElement);
            this.obstacles[index].element.parentElement.removeChild(this.obstacles[index].element);
            this.obstacles.splice(index, 1);
        }
    };

    this.getOldestObstacleInLane = function(bulletLane){

        var obstacle;
        for(var i = 0; i < _this.obstacles.length; i++){

            if(_this.obstacles[i].laneNo == bulletLane){

                if(obstacle === undefined || _this.obstacles[i].dynamicMarginTop > obstacle.dynamicMarginTop){

                    obstacle = _this.obstacles[i];
                }
            }
        }

        return obstacle;
    };

    this.stop = function() {

        if (this.obstacleGeneratorId) {
            clearInterval(this.obstacleGeneratorId);
            this.obstacleGeneratorId = false;
        }
    };

    this._init();
}

function CollisionHandler(car, obstacleManager) {

    var _this = this;
    this._init = function() {

        this.car = car;
        this.obstacleManager = obstacleManager;
    };

    this.checkCollisions = function() {

        for (var i = 0; i < _this.obstacleManager.obstacles.length; i++)
            return _this._checkCollision(_this.obstacleManager.obstacles[i]);
    };

    this._checkCollision = function(obstacleO) {

        if ((obstacleO.dynamicMarginTop + OBSTACLE_HEIGHT > NFS_HEIGHT - CAR_HEIGHT) && (obstacleO.laneNo == _this.car.currentLane)) {

            return true;
        }
    };

    this.checkShot = function(){

        var bulletLane;

        for(var i = 0; i < _this.obstacleManager.lanes.length; i++){

            if(_this.obstacleManager.lanes[i].getElementsByClassName('bullets').length > 0) {
                bulletLane = i;
                break;
            }
        }

        var oldestObstacleInCurrentLane = obstacleManager.getOldestObstacleInLane(bulletLane);
        if(oldestObstacleInCurrentLane !== undefined && _this.car.gun.bullets !== undefined) {
            if (_this.car.gun.dynamicBulletBottom + oldestObstacleInCurrentLane.dynamicMarginTop + CAR_HEIGHT + OBSTACLE_HEIGHT > NFS_HEIGHT) {

                _this.car.gun.stop();
                _this.car.enableGun();
                _this.obstacleManager.removeObstacle(oldestObstacleInCurrentLane);
            }
        }
        if(_this.car.gun.dynamicBulletBottom + CAR_HEIGHT > NFS_HEIGHT){

            _this.car.gun.stop();
            _this.car.enableGun();
        }
    };

    this._init();
}

function Car(currentLane, lanes) {

    var _this = this;
    this._init = function() {

        this.currentLane = currentLane;
        this.lanes = lanes;
        this.element = document.createElement('img');
        this.element.className = 'car';
        this.element.setAttribute('src', 'images/car.png');
        this.lanes[this.currentLane].appendChild(this.element);
        this.gun = new Gun(this.lanes);
    };

    this._changeLane = function(laneNumber) {


        if (_this.currentLane != laneNumber) {

            _this.lanes[laneNumber].appendChild(_this.element);
        }
        if (_this.currentLane > laneNumber) {

            _this.currentLane--;
        } else if (_this.currentLane < laneNumber) {

            _this.currentLane++;
        }
    };

    this._keyNavigation = function(e) {

        switch (e.which) {
            case 37: // left
                _this._changeLane((_this.currentLane - 1) < 0 ? 0 : (_this.currentLane - 1));
                break;

            case 39: // right
                _this._changeLane((_this.currentLane + 1) > _this.lanes.length - 1 ? _this.lanes.length - 1 : (_this.currentLane + 1));
                break;

            default:
                return; // exit this handler for other keys
        }
    };


    this._fireGunEvent = function(e){

        switch (e.which){

            case 32:
                _this._disableGun();
                _this.gun.fireBullets(_this.currentLane);
                break;
        }
    };

    this.enableGun = function(){

        document.addEventListener('keyup', this._fireGunEvent, false);
    };

    this._disableGun = function(){

        document.removeEventListener('keyup', this._fireGunEvent, false);
    };

    this._initEvents = function() {

        document.addEventListener('keydown', this._keyNavigation, false);
        this.enableGun();
    };

    this._removeEvents = function() {

        document.removeEventListener('keydown', this._keyNavigation, false);
        this._disableGun();
    };

    this.stop = function() {

        _this._removeEvents();
    };

    this._init();
}

function Gun(lanes){

    var _this = this;
    this._init = function(){

        this.lanes = lanes;
    };

    this.fireBullets = function(currentLane){

        var bullets = document.createElement('img');
        bullets.setAttribute('src', 'images/bullets.png');
        bullets.className = 'bullets';
        _this.lanes[currentLane].appendChild(bullets);
        _this.bullets = bullets;
        _this.dynamicBulletBottom = INITIAL_BULLETS_BOTTOM;

        _this.bulletId = requestAnimationFrame(_this.animateFireBullets);
    };

    this.animateFireBullets = function () {

        _this.dynamicBulletBottom += PX_DX;
        _this.bullets.style.bottom = _this.dynamicBulletBottom + 'px';

        _this.bulletId = requestAnimationFrame(_this.animateFireBullets);
    };

    _this.stop = function () {

        if(_this.bulletId){

            cancelAnimationFrame(_this.bulletId);
            _this.bulletId = false;
            _this.bullets.parentElement.removeChild(_this.bullets);
            _this.bullets = undefined;
        }
    };

    this._init();
}

function NFS() {

    var _this = this;

    this._init = function() {

        this.lanes = document.getElementsByClassName('lane');
        this.container = document.getElementById('container');
        this.obstacles = [];
        this.car = new Car(Util.getRandomInt(0, this.lanes.length - 1), this.lanes);
        this.obstacleManager = new ObstacleManager(this.lanes, this.car);
        this.collisionHander = new CollisionHandler(this.car, this.obstacleManager);

        this.dynamicBackgroundPositionY = 1;

        document.getElementById('toggle').addEventListener('click', function() {

            if (this.innerHTML == 'Start') {
                _this.obstacleManager.generateObstacles();
                _this.play();
                _this.car._initEvents();
                _this._startTime();
                this.innerHTML = 'Pause';
            } else if (this.innerHTML == 'Pause') {
                _this.stop();
                this.innerHTML = 'Start';
            }
        });
    };

    this._startTime = function(){

        this.timeId = setInterval(function(){GAME_TIME++;}, 1000);
    };

    this._stopTime = function(){

        if(this.timeId){

            clearInterval(this.timeId);
            this.timeId = false;
        }
    };

    this.play = function() {

        _this.dynamicBackgroundPositionY += PX_DX;
        _this.container.style.backgroundPositionY = _this.dynamicBackgroundPositionY + 'px';

        _this.obstacleManager.refreshObstacles();

        if(GAME_TIME % GAME_TIME_DX == 0) {
            PX_DX += PX_DX_DX;
            OBSTACLE_APPEARANCE_GAP -= OBSTACLE_APPEARANCE_DX;
        }

        _this.playId = window.requestAnimationFrame(_this.play);

        if (_this.collisionHander.checkCollisions()) {

            _this.gameOver();
        }

        _this.collisionHander.checkShot();
    };

    this.gameOver = function(){

        var gameOver = document.createElement('div');
        gameOver.className = 'game-over';
        gameOver.innerHTML = 'GAME OVER';
        _this.container.appendChild(gameOver);
        _this.stop();
    };

    this.stop = function() {

        this.obstacleManager.stop();
        window.cancelAnimationFrame(_this.playId);
        _this.car.stop();
        _this._stopTime();
    };

    this._init();
}

var nfs = new NFS();
