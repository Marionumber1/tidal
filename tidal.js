/* Global constants. */
var STATE = {LOAD: 0, MENU: 1, PLAY: 2, STOP: 3, DEAD: 4};
var DAY = 1000 * 60 * 6;

/** Bound a number to a limit. */
function bound(x, b) { return Math.min(Math.max(x, b[0]), b[1]); }


/** Scrolling background image. */
function Background(engine) {
    
    /* Engine. */
    this.engine = engine;
    
    /* Image and other data. */
    this.image;
    //this.ratio = 6;
    this.rate = 1 * 2;
    this.scroll = 0;
	this.dir = 1;
    
    /* Auto update and render. */
    this.autoupdate = true;
    this.autorender = false;
    
    /** Update the background image. */
    this.update = function(delta) {
        if (this.engine.state == STATE.PLAY || this.engine.state == STATE.MENU) {
			var keyboard = this.engine.keyboard;
			
			/* Moving left */
			if (keyboard[KEY.LEFT]) {
				this.scroll = (this.scroll + this.rate * this.engine.rate * delta/16) % this.engine.canvas.width;
				dir = -1;
			/* Moving right */
			} else if (keyboard[KEY.RIGHT]) {
				this.scroll = (this.scroll - this.rate * this.engine.rate * delta/16) % this.engine.canvas.width;
				dir = 1;
			}
			
			this.scroll = (this.scroll + this.engine.canvas.width) % this.engine.canvas.width;
        }
    }
    
    /** Render the background image. */
    this.render = function(context) {
        if (this.image == null) return;
		
		var w1 = this.engine.canvas.width - this.scroll;
		var w2 = this.scroll;
		var h = this.engine.canvas.height;
		
		var ratioWidth = (this.image.width / this.engine.canvas.width);
		var ratioHeight = (this.image.height / this.engine.canvas.height);
		
		context.drawImage(this.image, 0, 0, w1 * ratioWidth, h * ratioHeight, w2, 0, w1, h);
		context.drawImage(this.image, w1 * ratioWidth, 0, w2 * ratioWidth, h * ratioHeight, 0, 0, w2, h);
		
			//var w1 = this.engine.canvas.width - this.scroll;
			//var w2 = this.scroll;
			//var h = this.engine.canvas.height;
			//context.drawImage(this.image, 0, 0, w1 / this.ratio, h / this.ratio, this.scroll, 0, w1, h);
			//context.drawImage(this.image, w1 / this.ratio, 0, w2 / this.ratio, h / this.ratio, 0, 0, w2, h);
			
		
    }
        
}

/** Dirt or sand tile. */
function Tile(engine) {
    
    /* Engine. */
    this.engine = engine;
    
    /* Image and other data. */
    this.image;
	
	this.detectCollision = true;
    
    /* Auto update and render. */
    this.autoupdate = false;
    this.autorender = true;
	
	/** Render the background image. */
    this.render = function(context) {
		if (this.engine.state == STATE.PLAY || this.engine.state == STATE.STOP) {
			context.drawImage(this.image, 0, 0, this.image.width, this.image.height, this.pos.x, this.pos.y, 32, 32);
		}
	}      
}

/** Tide */
function Tide(engine) {
    /* Engine. */
    this.engine = engine;
    
    /* Image and other data. */
    this.image;
	
	/* Tide distance to move, current displacement, and delta */
	this.tideDist = 256;
	this.tideDisp = 0;
	this.tideDelta = 0.5;
    
    /* Auto update and render. */
    this.autoupdate = true;
    this.autorender = true;
	
	/** Update the background image. */
    this.update = function(delta) {
        if (this.engine.state == STATE.PLAY || this.engine.state == STATE.STOP) {
			/* Move the tide one more tile */
			this.tideDisp += this.tideDelta;
			
			/* If exceeding the total distance to move, begin receeding */
			if (this.tideDisp >= this.tideDist) {
				this.tideDelta = -0.5;
			}
			/* If returned to original position, recalculate tide data */
			else if (this.tideDisp == 0) {
				this.tideDist = (288/4) * (Math.cos((2 * Math.PI / DAY) * (Date.now() - this.engine.startTime)) + 3);
				this.tideDelta = 0.5;
			}
		}
	}
	
	/** Render the background image. */
    this.render = function(context) {
		for (var i = 0; i < this.tideDisp; i += 32) {
			for (var j = 0; j < this.engine.canvas.width; j += 32) {
				context.drawImage(this.image, 0, 0, this.image.width, this.image.height, j, i, 32, 32);
			}
		}
	}
}

/** Crab player. */
function Player(engine) {
    
    /* Engine. */
    this.engine = engine;
    
    /* Image and other data. */
    this.image;
	
	this.detectCollision = true;
    
    /* Auto update and render. */
    this.autoupdate = true;
    this.autorender = true;
    
    /** Update the background image. */
    this.update = function(delta) {
        if (this.engine.state == STATE.PLAY) {
			var keyboard = this.engine.keyboard;
			
			/* Moving left */
			if (keyboard[KEY.LEFT]) {
				this.pos.x += -0.05 * delta;
			/* Moving right */
			} else if (keyboard[KEY.RIGHT]) {
				this.pos.x += 0.05 * delta;
			/* Moving up */
			} else if (keyboard[KEY.UP]) {
				this.pos.y += -0.05 * delta;
			/* Moving down */
			} else if (keyboard[KEY.DOWN]) {
				this.pos.y += 0.05 * delta;
			}
        }
    }
    
    /** Render the background image. */
    this.render = function(context) {
        if (this.image == null) return;
		
		if (this.engine.state == STATE.PLAY || this.engine.state == STATE.STOP) {
			context.drawImage(this.image, 0, 0, this.image.width, this.image.height, this.pos.x, this.pos.y, this.image.width, this.image.height);
		}
    }
        
}



/** Intertidal engine. */
function Tidal(canvas) {
    
    /* Super constructor. */
    Engine.call(this, canvas);
    var superclass = new Engine();
    
    /* Random data. */
    this.cache = {};
    this.cache["lastSkillBonus"] = 0;
    this.cache["skillBonusCount"] = 0;    

    /* Game objects. */
    this.entities = {};
    this.playlist = [];
    this.messages = [];

    /* State. */
    this.state = STATE.LOAD;
    this.difficulty = 10;
	
	/* Start time of game */
	this.startTime;
    
    /* Rate. */
    this.rate = 100;
    this.target = 1000;
	
    /* Score. */
    this.score = 0;

    /* Boost. */
    this.boost = 100;

    /** Setup the engine. */
    this.setup = function() {
        
        /* Super setup. */
        superclass.setup.call(this);
        
        /* Reference to self. */
        var that = this;
        
        /* Create entities. */
        //this.entities.boat = new Boat(this);
        //this.entities.boat.reset();
        this.entities.background = new Background(this);
        //for (var i = 0; i < this.difficulty; i++) this.entities["obstacle" + i] = new Obstacle(this);
        //for (var i = 0; i < 10; i++) this.entities["laser" + i] = new Projectile(this, this.entities.boat.pos.x, this.entities.boat.pos.y);
        
        /* Queue resources. */
        //this.manager.queue("boat", RESOURCE.IMAGE, "assets_drift/boat.png");
        //this.manager.queue("obstacles", RESOURCE.IMAGE, "assets_drift/obstacles2.png");
		this.manager.queue("crab_bare", RESOURCE.IMAGE, "assets/crab_bare.PNG");
		this.manager.queue("dirt", RESOURCE.IMAGE, "assets/dirt.png");
		this.manager.queue("sand", RESOURCE.IMAGE, "assets/sand.png");
		this.manager.queue("water", RESOURCE.IMAGE, "assets/water.png");
        this.manager.queue("bg", RESOURCE.IMAGE, "assets/bg.png");
        //this.manager.queue("laser", RESOURCE.IMAGE, "assets_drift/laser.png");
        this.manager.queue("running", RESOURCE.AUDIO, "assets/running.m4a");
        this.manager.load(function() {
            
            /* Alot resources. */
            //var boatSheet = new Sheet(that.manager.$("boat"), 1, 3);
            //var obstacleSheet = new Sheet(that.manager.$("obstacles"), 2, 3);
            //that.entities.boat.setSheet(boatSheet);
            that.entities.background.image = that.manager.$("bg");
            //for (var i = 0; i < 10; i++) that.entities["laser" + i].sheet = new Sheet(that.manager.$("laser"));
            //for (var i = 0; i < that.difficulty; i++) that.entities["obstacle" + i].setSheet(obstacleSheet);
            console.log("Loaded resources.")
            
            /* Add music. */
            that.manager.$("running").volume = 0.02;
            that.playlist.push(that.manager.$("running"));
            
            /* Set up menu. */
            that.menu();
            
        });
		
		/* Create tiles */
		var terrain = "dirt";
		for (var i = this.canvas.height - 32; i >= -32; i -= 32) {
			for (var j = 0; j < this.canvas.width + 32; j += 32) {
				/* Make a tile */
				var t = new Tile(this);
				t.image = this.manager.$(terrain);
				//console.log(t.image);
				t.pos = new Vector(j, i);
				this.entities["tile" + i + "," + j] = t;
			}
			
			/* Switch to sand if at 7/24 point */
			if (i <= 17 * this.canvas.height / 24) terrain = "sand";
		}
		
		/* Add the tide */
		var t = new Tide(this);
		t.image = this.manager.$("water");
		this.entities["tide"] = t;
		
		/* Create player */
		var p = new Player(this);
		p.image = this.manager.$("crab_bare");
		p.pos = new Vector(this.canvas.width / 2, this.canvas.height / 2);
		this.entities.player = p;
        
        /* Register click events. */
        document.addEventListener("mousedown", function(e) {
            var x = that.mouse.x - that.canvas.offsetLeft + document.body.scrollLeft;
            var y = that.mouse.y - that.canvas.offsetTop + document.body.scrollTop;
            if (that.canvas.width-30 < x && x < that.canvas.width && that.canvas.height-30 < y && y < that.canvas.height) {
                if (that.playlist[0].paused) {
                    that.playlist[0].play();
                    that.playlist[0].addEventListener("ended", function() { that.playlist[0].play(); });
                    that.cache.colors = true;
                    that.cache.target = 5;
                    that.target = 5;
                } else {
                    that.playlist[0].pause();
                    that.cache.colors = false;
                    that.cache.target = 1;
                    that.target = 1;
                }
            }
        });
        
        window.onblur = function() {
            if (that.state == STATE.PLAY) that.stop();
        };
        
        /* Mess around with the context. */
        this.context.imageSmoothingEnabled = false;
		
		/* Static context stuff. */
		this.context.fontFamily = "Bit";
        
    }
    
    /** Go to the menu. */
    this.menu = function() {
        this.state = STATE.MENU;
        this.rate = 0;
        this.target = 0;
    }
    
    /** Play the game. */
    this.play = function() {
		if (this.state != STATE.STOP) this.startTime = Date.now();
        this.state = STATE.PLAY;
        this.rate = this.cache.rate || 0;
        this.target = this.cache.target || 1;
    }
    
    /** Replay. */
    this.replay = function() {
        //for (var i = 0; i < this.difficulty; i++) this.entities["obstacle"+i].respawn();
        this.state = STATE.PLAY;
        this.target = this.cache.target || 1;
        this.score = 0;
        this.cache["skillBonusCount"] = 0;
        this.boost = 100;
    }
    
    /** Pause the engine. */
    this.stop = function() {
        this.state = STATE.STOP;
        this.cache.rate = this.rate;
        this.cache.target = this.target;
    }
    
    /** Once a round is over. */
    this.dead = function() {
        this.state = STATE.DEAD;
        this.cache.target = this.target;
        this.target = 0;
    }
	
	/** Display. */
	this.display = function() {
		this.context.font = "16px Bit";
		this.context.textBaseline = "hanging";
		superclass.display.call(this);
		this.context.textAlign = "right";
		this.context.fillText(Math.floor(this.score), this.canvas.width-10, 10);
		this.context.textAlign = "center";
		
        if (this.state == STATE.PLAY || this.state == STATE.STOP) {
			this.context.fillText("TIME: " + Math.floor((((Date.now() - this.startTime) % DAY) / DAY) * 24) + ":00", this.canvas.width/2, 10);
		} else {
			this.context.fillText("TIME: 0:00", this.canvas.width/2, 10);
		}
		
		for (var i = 0; i < this.messages.length; i++) 
		this.context.fillText(this.messages[i], this.canvas.width/2, this.canvas.height/2+20*i);
        this.context.textBaseline = "bottom";
        this.context.textAlign = "right";
        this.context.fillText("!", this.canvas.width-10, this.canvas.height-10);
	}
	
	/** Leave a text message hanging on screen for a set amount of time. */
	this.message = function(text, time) {
		var that = this;
		var obj = new String(text);
		this.messages.push(obj);
		setTimeout(function() { that.messages.splice(that.messages.indexOf(obj), 1); }, time);
	}
    
    /** Update the engine. */
    this.update = function(delta) {
         
        /* Check start. */
        if (this.keyboard[KEY.SPACE] == KEY.PRESSED) {
            if (this.state == STATE.MENU) this.play();
            else if (this.state == STATE.DEAD) this.replay();
        }
            
        /* Check pause. */
        if (this.keyboard[KEY.ESCAPE] == KEY.PRESSED) {
            if (this.state == STATE.PLAY) this.state = STATE.STOP;
            else if (this.state == STATE.STOP) this.state = STATE.PLAY;
            console.log("Changed to state " + this.state);
        }
		
		/* Check for collisions. */
        if (this.state == STATE.PLAY) {
            for (var i = 0; i < this.difficulty; i++) {
				/* COLLISIONS TO BE DETECTED */
            }
            
        }
		
        /* Update the superclass. */
        superclass.update.call(this, delta);
        
    }

    /** Render the entire engine. */
    this.render = function(delta) {
		
        /* Clear the canvas by rendering the background. */
        this.entities.background.render(this.context);

        /* Autodraw the entities. */
		for (var name in this.entities) if (this.entities[name].autorender) this.entities[name].render(this.context);
        
        //this.context.fillRect(this.entities.boat.particleSystem.properties.pos.x - 2, this.entities.boat.particleSystem.properties.pos.y - 2, 4, 4);
        //this.context.fillStyle = "black";
        //this.context.fillRect(this.entities.boat.particleSystem.properties.pos.x - this.entities.boat.particleSystem.properties.posVar.x, this.entities.boat.particleSystem.properties.pos.y - this.entities.boat.particleSystem.properties.posVar.y, this.entities.boat.particleSystem.properties.posVar.x, this.entities.boat.particleSystem.properties.posVar.y);
        
		/* Do before drawing entities. */
        if (this.state == STATE.MENU) {

            /* Draw the title and buttons. */
            this.context.fillStyle = "black";
			this.context.textAlign = "center";
			this.context.textBaseline = "bottom";
			this.context.font = "28px Bit";
			this.context.fillText("INTERTIDAL LIFE", canvas.width/2, canvas.height/3);
			this.context.font = "20px Bit";
			this.context.fillText("PRESS SPACE TO START", canvas.width/2, canvas.height/3+24);
            
		/* If playing. */
        } else if (this.state == STATE.PLAY) {
            
            /* Move rate to target. */
            if (this.rate > this.target) this.rate = Math.max(this.target, this.rate-delta/16*0.05);
            else if (this.rate < this.target) this.rate = Math.min(this.target, this.rate+delta/16*0.05);
			
		/* If paused. */
        } else if (this.state == STATE.STOP) {
			
            /* Draw the title and buttons. */
            this.context.fillStyle = "black";
			this.context.textAlign = "center";
			this.context.textBaseline = "bottom";
			this.context.font = "28px Bit";
			this.context.fillText("PAUSED", canvas.width/2, canvas.height/3);

        /* If dead. */
        } else if (this.state == STATE.DEAD) {
            this.context.fillStyle = "black";
            this.context.textAlign = "center";
            this.context.textBaseline = "bottom";
            this.context.font = "28px Bit";
            this.context.fillText("GAME OVER", canvas.width/2, canvas.height/3);
            this.context.font = "20px Bit";
            this.context.fillText("SCORE: " + Math.floor(this.score), canvas.width/2, canvas.height/3+30);
            //this.context.font = "16px Bit";
            //this.context.fillText("SKILL BONUS: " + this.cache["skillBonusCount"] + " X 10", canvas.width/2, canvas.height/3+56);           

        }
		
        if (this.cache.colors) {
            this.context.globalAlpha = 0.1;
            this.context.fillStyle = "hsl(" + (Date.now() / 10)  % 360 + ", 50%, 50%)";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.globalAlpha = 1;
        } else {
            this.context.globalAlpha = 1;
            this.context.fillStyle = "black";
        }
        
        
		/* Display. */
		if (this.showDisplay) this.display();
	}
    
}
