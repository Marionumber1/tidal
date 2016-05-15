/* Global constants. */
var STATE = {LOAD: 0, MENU: 1, PLAY: 2, STOP: 3, DEAD: 4};

/** Bound a number to a limit. */
function bound(x, b) { return Math.min(Math.max(x, b[0]), b[1]); }

/** Boat sprite. */
function Boat(engine) {
    
    /* Super constructor. */
    Sprite.call(this, engine, 300, 550, 16*3, 28*3, 8*3, 10*3);
    
    /* Movement rate. */
    this.rate = 1;
    
    /* Movement. */
    this.rot = 0;
    this.mov = {xv: 0, xa: 0.03, rv: 0.01};
    this.mov.xb = [50, 550];
    this.mov.vb = [-1.5, 1.5];
    
    /* Rotational bounds. */
    this.mov.rb = [-Math.PI/3, Math.PI/3];

    /* Boost. */
    this.temp = {};
    this.temp.boost = 1;
    
    /* Auto. */
    this.autoupdate = true;
    this.autorender = false;
    
    /* Shooting. */
    this.cooldown = 200;
    this.lastShootTime = 0;
    
    /* Water particle system. */
    this.particleSystem = new ParticleSystem(this.pos.x, this.pos.y);
    this.sideParticleSystem = new ParticleSystem(this.pos.x, this.pos.y);
    this.particleYOffset = this.width/2;
    
    /* Animation. */
    this.animation = "boat";
    this.addAnimation(new Animation("boat", [0, 1, 2]));
    this.getAnimation().index = 1;
    
    /* Reset the boat to it's original position. */
    this.reset = function() {
        this.rot = 0;
        this.pos.x = 300;
        this.pos.y = 550;
        this.mov.xv = 0;
        
        this.particleSystem = new ParticleSystem(this.pos.x, this.pos.y + this.particleYOffset);
        this.particleSystem.setProperties({
            posVar: new Vector(this.width/2 - 4, 0), 
            speed: 0.2, 
            speedVar: 0.05, 
            angle: Math.PI/2, 
            angleVar: 7.5 * Math.PI/180,  
            life: 300, 
            lifeVar: 50, 
            startRadius: 1.5, 
            startRadiusVar: 0.25, 
            endRadius: 1.0, 
            endRadiusVar: 0.2, 
            startColor: [101, 150, 187, 255], 
            startColorVar: [10, 5, 0, 0],
            endColor: [175, 201, 255, 255]
            
        });
        this.particleSystem.totalParticles = 512;
        this.particleSystem.emissionRate = 1.6;
        this.particleSystem.init();
        
        this.sideParticleSystem = new ParticleSystem(this.pos.x, this.pos.y + this.particleYOffset);
        this.sideParticleSystem.setProperties({
            posVar: new Vector(this.width/2 - 4, 0), 
            speed: 0.2, 
            speedVar: 0.05, 
            angle: Math.PI/2, 
            angleVar: 10.0 * Math.PI/180,  
            life: 500, 
            lifeVar: 50, 
            startRadius: 1.5, 
            startRadiusVar: 0.25, 
            endRadius: 1.0, 
            endRadiusVar: 0.2, 
            startColor: [101, 150, 187, 255], 
            startColorVar: [10, 5, 0, 0],
            endColor: [175, 201, 255, 255]
            
        });
        this.sideParticleSystem.totalParticles = 512;
        this.sideParticleSystem.emissionRate = 1.0;
        this.sideParticleSystem.init();
    }
    
    /** Update the boat. */
    this.update = function(delta) {
        
        /* Only allow the boat to move if playing. */
        if (this.engine.state == STATE.PLAY) {

            /* Left and right input. */
            var keyboard = this.engine.keyboard;
            var left = keyboard[KEY.LEFT] || keyboard[KEY.A];
            var right = keyboard[KEY.RIGHT] || keyboard[KEY.D];

            /* Only left. */
            if (left && !right) { 
                this.turn(+delta);
                this.getAnimation().index = 0;

            /* Only right. */
            } else if (right && !left) {
                this.turn(-delta);
                this.getAnimation().index = 2; 

            /* Neither or both. */
            } else { this.getAnimation().index = 1; }

            /* Move. */
            this.move(delta);
            
            /* Update particle systems. */
            this.updateParticles(delta);
            
            /* Fire lasers. */
            for (var i = 0; i < 10; i++) {
                if (keyboard[76] && !this.engine.entities["laser"+i].active && Date.now() - this.lastShootTime > this.cooldown) { // L
                    this.engine.entities["laser"+i].active = true;
                    this.engine.entities["laser"+i].pos = new Vector(this.pos.x, this.pos.y);
                    this.engine.entities["laser"+i].rot = this.rot + Math.PI/2;
                    this.engine.entities["laser"+i].speed = 20;
                    this.lastShootTime = Date.now();
                    console.log("shot " + this.rot);
                }
                this.engine.entities["laser"+i].update(delta);
                //console.log(this.engine.entities["laser"+i].pos.x + " " + this.engine.entities["laser"+i].pos.y + " " + keyboard[76]);
            }
        }

        this.temp = {};
        
    }
    
    this.updateParticles = function(delta) {
        this.particleSystem.properties.pos.x = this.pos.x + this.particleYOffset*Math.sin(this.rot);
        this.particleSystem.properties.posVar.x = (this.width/2 - 2) * Math.cos(this.rot);
        this.particleSystem.properties.pos.y = this.pos.y + this.particleYOffset*Math.cos(this.rot);
        this.particleSystem.properties.posVar.y = (this.width/2 - 2) * Math.sin(this.rot);
        this.particleSystem.properties.angle = Math.PI/2 - this.rot;
        this.particleSystem.properties.startRadius = 2 + Math.abs(this.rot)*1.5;
        this.particleSystem.update(delta);

        this.sideParticleSystem.properties.pos.x = this.pos.x + this.particleYOffset*Math.sin(this.rot);
        this.sideParticleSystem.properties.posVar.x = (this.width/2 - 8) * Math.cos(this.rot);
        this.sideParticleSystem.properties.pos.y = this.pos.y - this.particleYOffset*Math.cos(this.rot);
        this.sideParticleSystem.properties.posVar.y = (this.width/2 - 8) * Math.sin(this.rot);
        this.sideParticleSystem.properties.angle = Math.PI/2 - this.rot;
        this.sideParticleSystem.properties.startRadius = 2 + Math.abs(this.rot)*2.0;
        this.sideParticleSystem.update(delta);
    }
    
    this.renderParticles = function(context) {
        this.particleSystem.render(context);
        this.sideParticleSystem.render(context);
    }
    
    /** Turn the boat. */
    this.turn = function(delta) {
        var rot = this.mov.rv * this.rate * this.engine.rate * delta/16;
        this.rot = bound(this.rot+rot, this.mov.rb);
    }
    
    /** Move the boat. */
    this.move = function(delta) {
        this.mov.xv = bound(this.mov.xv-Math.sin(this.rot)*this.mov.xa, this.mov.vb);
        this.mov.xv -= Math.sin(this.rot) * (this.temp.boost || 0);
        var mov = this.mov.xv * this.rate * this.engine.rate * delta/16;
        this.pos.x = bound(this.pos.x+mov, this.mov.xb);
        if (this.mov.xb.indexOf(this.pos.x) > -1) this.mov.xv = 0;
    }
	
	this.bbox = function() {
		var tl = this.topLeft();
		return [tl.x, tl.y, this.width, this.height - 4*3];
	}
}

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
						
            /* Fail and send to bottom if colliding with another or too close. */
            if (Vector.distance(this.pos, obstacle.pos) < this.rad + obstacle.rad + this.engine.entities.boat.height*Math.sqrt(this.engine.rate)*1.2) {
                this.pos.y = this.engine.canvas.height + this.rad + 1;
				break;
            }
			
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
    
    /* Auto update and render. */
    this.autoupdate = true;
    this.autorender = false;
    
    /** Update the background image. */
    this.update = function(delta) {
        if (this.engine.state == STATE.PLAY || this.engine.state == STATE.MENU) {
            this.scroll = (this.scroll + this.rate * this.engine.rate * delta/16) % this.engine.canvas.height;
        }
    }
    
    /** Render the background image. */
    this.render = function(context) {
        if (this.image == null) return;
        var h1 = this.engine.canvas.height - this.scroll
        var h2 = this.scroll;
        var w = this.engine.canvas.width;
        context.drawImage(this.image, 0, 0, w / this.ratio, h1 / this.ratio, 0, this.scroll, w, h1);
        context.drawImage(this.image, 0, h1 / this.ratio, w / this.ratio, h2 / this.ratio, 0, 0, w, h2);
    }
        
}

/** Drift engine. */
function Drift(canvas) {
    
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
        this.entities.boat = new Boat(this);
        this.entities.boat.reset();
        this.entities.background = new Background(this);
        for (var i = 0; i < this.difficulty; i++) this.entities["obstacle" + i] = new Obstacle(this);
        for (var i = 0; i < 10; i++) this.entities["laser" + i] = new Projectile(this, this.entities.boat.pos.x, this.entities.boat.pos.y);
        
        /* Queue resources. */
        this.manager.queue("boat", RESOURCE.IMAGE, "assets_drift/boat.png");
        this.manager.queue("obstacles", RESOURCE.IMAGE, "assets_drift/obstacles2.png");
        this.manager.queue("water", RESOURCE.IMAGE, "assets_drift/water.png");
        this.manager.queue("laser", RESOURCE.IMAGE, "assets_drift/laser.png");
        this.manager.queue("running", RESOURCE.AUDIO, "assets_drift/running.m4a");
        this.manager.load(function() {
            
            /* Alot resources. */
            var boatSheet = new Sheet(that.manager.$("boat"), 1, 3);
            var obstacleSheet = new Sheet(that.manager.$("obstacles"), 2, 3);
            that.entities.boat.setSheet(boatSheet);
            that.entities.background.image = that.manager.$("water");
            for (var i = 0; i < 10; i++) that.entities["laser" + i].sheet = new Sheet(that.manager.$("laser"));
            for (var i = 0; i < that.difficulty; i++) that.entities["obstacle" + i].setSheet(obstacleSheet);
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
        this.entities.boat.reset();
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

        /* Boost. */
        var up = this.keyboard[KEY.UP] || this.keyboard[KEY.W];
        if (up && this.state == STATE.PLAY && this.boost > 0) {
            this.entities.boat.temp.boost = 0.2;
            this.boost -= delta/16 * 2;
        } else if (this.state == STATE.PLAY) {
            this.boost = Math.min(this.boost+0.05, 100);
        }
            
        /* Check pause. */
        if (this.keyboard[KEY.ESCAPE] == KEY.PRESSED) {
            if (this.state == STATE.PLAY) this.state = STATE.STOP;
            else if (this.state == STATE.STOP) this.state = STATE.PLAY;
            console.log("Changed to state " + this.state);
        }
		
		/* Increase score. */
		if (this.state == STATE.PLAY) this.score += this.rate * delta/16 * 0.1;
		
		/* Check for collisions. */
        if (this.state == STATE.PLAY) {
            for (var i = 0; i < this.difficulty; i++) {
                var obstacle = this.entities["obstacle" + i];
                if (!obstacle.detectCollision) continue;
                
                if (this.colliding(obstacle, this.entities.boat, true)) {
                    this.dead();
                    break;
                }
                
                for (var j = 0; j < 10; j++) {
                    var laser = this.entities["laser" + j];
                    if (laser.active && this.colliding(obstacle, laser, false)) {
                        laser.active = false;
                        obstacle.autorender = false;
                        obstacle.detectCollision = false;
                    }
                }
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
        
        /* Piggy back and check skill bonus. */
        if (isBoat && Date.now() - this.cache["lastSkillBonus"] > 1500) {
            if (distance - obstacle.rad < 10) {
                this.cache["lastSkillBonus"] = Date.now();
                this.score += 10;
                this.message("SKILL BONUS +10", 1000);
                this.cache["skillBonusCount"] += 1;
                if (this.cache["skillBonusCount"] % 5 == 0) {
                    this.score += 50;
                    this.message("SUPER SKILL BONUS +50", 1500);
                }
            }
        }
        
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
        this.entities.boat.renderParticles(this.context);
        for (var i = 0; i < 10; i++) {
            if (this.entities["laser"+i].active) {
                this.entities["laser"+i].render(this.context);
            }
        }
		this.entities.boat.render(this.context);
        
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
			this.context.fillText("CHINCOTEAGUE DRIFT", canvas.width/2, canvas.height/3);
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
