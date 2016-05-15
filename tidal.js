/* Global constants. */
var STATE = {LOAD: 0, MENU: 1, PLAY: 2, STOP: 3, DEAD: 4};

/** Bound a number to a limit. */
function bound(x, b) { return Math.min(Math.max(x, b[0]), b[1]); }

function Projectile(engine, x, y, angle, speed) {
    
    /* Super constructor. */
    Sprite.call(this, engine, x || 0, y || 0, 290/8, 74/4);
    
    this.active = false;
    
    /* Movement. */
    this.rate = 1;
    this.speed = speed || 0;
    this.rot = angle || 0;
    
    /* Auto. */
    this.autoupdate = false;
    this.autorender = false;
    
    this.update = function(delta) {
        if (!this.active) return;
        
        this.pos.x += this.speed * this.rate * delta/16.0 * Math.cos(this.rot);
        this.pos.y += this.speed * this.rate * delta/16.0 * -Math.sin(this.rot);
        
        // Check if off-screen
        if (this.pos.x + this.width < 0 || this.pos.y + this.height < 0 || this.pos.x - this.width > 600 || this.pos.y - this.height > 690) {
            this.active = false;
        }
    }

    this.bbox = function() {
        var tl = this.topLeft();
		return [tl.x, tl.y, this.width, this.height];
    }
    
}

/** Generic obstacle. */
function Obstacle(engine) {
		
	/* Super constructor. */
	Sprite.call(this, engine);
	
	/* Movement. */
	this.rate = 1;
	this.rad = 0;
	this.rot = 0;
	this.mov = {yv: 2};
    
    this.detectCollision = true;
	
	/* Auto. */
	this.autoupdate = true;
	this.autorender = true;

	/* Animation. */
	this.animation = "obstacle";
	this.addAnimation(new Animation("obstacle", [0, 1, 2, 3]));
	
	/** Update the obstacle. */
	this.update = function(delta) {
		if (this.engine.state != STATE.PLAY) return;
		this.pos.y += this.mov.yv * Obstacle.rate * this.engine.rate;
        if (this.pos.y > this.engine.canvas.height + this.rad && delta != 0) this.respawn();
	}
	
	/** Respawn the obstacle. */
	this.respawn = function() {
		
		/* Randomize the position and obstacle type. */
		this.randomize();
		
        for (var i = 0; i < this.engine.difficulty; i++) {
						
			/* Get the obstacle. */
			var obstacle = this.engine.entities["obstacle" + i];
			if (!obstacle) continue;
						
			/* Skip if comparing to self. */
            if (obstacle === this) continue;
						
            /* Fail and send to bottom if colliding with another or too close. *
            if (Vector.distance(this.pos, obstacle.pos) < this.rad + obstacle.rad + this.engine.entities.boat.height*Math.sqrt(this.engine.rate)*1.2) {
                this.pos.y = this.engine.canvas.height + this.rad + 1;
				break;
            }*/
			
        }
		
	}
	
	/** Randomize the obstacle. */
	this.randomize = function() {
        this.rad = Math.random()*10 + 10;
        this.cpos.x = this.rad;
        this.cpos.y = this.rad;
        this.width = this.height = this.rad*2;
        this.rot = Math.random() * 2 * Math.PI;
        this.pos.x = Math.random() * (this.engine.canvas.width-50) + 25;
        this.pos.y = -Math.random() * this.engine.canvas.height - this.rad;
        this.getAnimation().index = Math.floor(Math.random() * 5);
	    this.rad -= 2;
        this.detectCollision = true;
        this.autoupdate = true;
        this.autorender = true;
	}
	
	/* Randomize on initialization. */
	this.respawn();

}

/* Static rate. */
Obstacle.rate = 1;

/** Scrolling background image. */
function Background(engine) {
    
    /* Engine. */
    this.engine = engine;
    
    /* Image and other data. */
    this.image;
    this.ratio = 6;
    this.rate = 1 * 2;
    this.scroll = 0;
	this.dir = 0;
    
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
				this.dir = -1;
			/* Moving right */
			} else if (keyboard[KEY.RIGHT]) {
				this.scroll = (this.scroll + this.rate * this.engine.rate * delta/16) % this.engine.canvas.width;
				this.dir = 1;
			}
			/* No movement */
			else {
				this.dir = 0;
			}
        }
    }
    
    /** Render the background image. */
    this.render = function(context) {
        if (this.image == null) return;
		
		/* Moving left */
		if (this.dir == -1) {
			var w1 = this.engine.canvas.width - this.scroll;
			var w2 = this.scroll;
			var h = this.engine.canvas.height;
			context.drawImage(this.image, 0, 0, w1 / this.ratio, h / this.ratio, this.scroll, 0, w1, h);
			context.drawImage(this.image, w1 / this.ratio, 0, w2 / this.ratio, h / this.ratio, 0, 0, w2, h);
		} else {
			var w1 = this.scroll;
			var w2 = this.engine.canvas.width - this.scroll;
			var h = this.engine.canvas.height;
			context.drawImage(this.image, 0, 0, w1 / this.ratio, h / this.ratio, w2, 0, w1, h);
			context.drawImage(this.image, w1 / this.ratio, 0, w2 / this.ratio, h / this.ratio, 0, 0, w2, h);
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
        for (var i = 0; i < this.difficulty; i++) this.entities["obstacle" + i] = new Obstacle(this);
        //for (var i = 0; i < 10; i++) this.entities["laser" + i] = new Projectile(this, this.entities.boat.pos.x, this.entities.boat.pos.y);
        
        /* Queue resources. */
        //this.manager.queue("boat", RESOURCE.IMAGE, "assets_drift/boat.png");
        //this.manager.queue("obstacles", RESOURCE.IMAGE, "assets_drift/obstacles2.png");
        this.manager.queue("bg", RESOURCE.IMAGE, "assets/water.png");
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
        this.state = STATE.PLAY;
        this.rate = this.cache.rate || 0;
        this.target = this.cache.target || 1;
    }
    
    /** Replay. */
    this.replay = function() {
        for (var i = 0; i < this.difficulty; i++) this.entities["obstacle"+i].respawn();
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
        this.context.fillText("BOOST: " + Math.max(0, Math.floor(this.boost)), this.canvas.width/2, 10);
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
                var obstacle = this.entities["obstacle" + i];
                if (!obstacle.detectCollision) continue;
                
                /* COLLISIONS DETECTED */
            }
            
        }
		
        /* Update the superclass. */
        superclass.update.call(this, delta);
        
    }
	
    /* Check if a boat and an obstacle are colliding. */
	this.colliding = function(obstacle, sprite, isBoat) {
        var bbox = sprite.bbox();
		
        /* Get boat center position. */
		var bcx = sprite.pos.x;
		var bcy = sprite.pos.y;

        /* Get top left and copy. */
		var bx = bbox[0];
		var by = bbox[1];
		var brx = bx;
		var bry = by;
		
		/* Get boat size. */
		var bw = bbox[2];
		var bh = bbox[3];
		
        /* Get obstacle top left. */
		var ocx = obstacle.pos.x;
		var ocy = obstacle.pos.y;
		
		/* Rotate circle's center point back. */
		var cux = Math.cos(sprite.rot) * (ocx-bcx) - Math.sin(sprite.rot) * (ocy-bcy) + bcx;
		var cuy = Math.sin(sprite.rot) * (ocx-bcx) + Math.cos(sprite.rot) * (ocy-bcy) + bcy;

		/* Closest point in the rectangle to the center of circle rotated backwards (unrotated). */
		var cx, cy;

		/* Find the unrotated closest x point from center of unrotated circle. */
		if (cux < brx) cx = brx;
		else if (cux > brx + bw) cx = brx + bw;
		else cx = cux;
	 
		/* Find the unrotated closest y point from center of unrotated circle. */
		if (cuy < bry) cy = bry;
		else if (cuy > bry + bh) cy = bry + bh;
		else cy = cuy;
	 
		/* Determine collision. */
		var distance = Math.sqrt((cx-cux)*(cx-cux)+(cy-cuy)*(cy-cuy));
        
        /* Return. */
		if (distance < obstacle.rad) return true;
		return false;
        
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
