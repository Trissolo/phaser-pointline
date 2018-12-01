class Pointline{
	
	/*
	* Set up private properties for the physics involved
	* @return false
	*/
		constructor(scene, gravity, debug)
		{
			
			this.scene = scene;
			this.gravity = gravity; //px / sec
			
			//movement arrays
				this.dynamicObjects = [];
				this.platforms = [];
			
			//for debug drawing...
				this.staticObjects = {
					walls:[],
					stickyWalls:[],
					slopes:[],
					grounds:[],
					platforms:[]
				};
				
			//Collider objects
				this.colliders = {};
				this.overlappers = {};
				this.worldCollider = {};
			
			//debug vars
				this.debug = debug;
				this.debugPoint = {x:0,y:0};
			
			//gfx as passed from scene to draw debug lines / points
				this.gfx = {};
				this.gfxSet = false;
				
			//defaults
				this.dynamicDefaults = {
					spriteSelector:'',									//which scene sprite are we using
					x:0,												//initial x position
					y:0,												//initial y position
					canMove : true,										//are we applying movement to this body?
					velocity : {x:0,y:0},								//body velocity
					radius : 0,											//width / 2 of body bounds
					height: 0,
					dirAdj : 1,											//left or right X
					gravityFactor : 1,									//for scaling gravity for this body
					pointOffset : {x:0, y:0},							//where is the "point" in relation to the origin of the sprite
					onGround : false,									//on a ground / slope / platform
					onPlatform: false,									//on a platform specifically
					platformIndex : 0,									//which platform? For movement
					onWall : false,										//on a wall?
					onStickyWall:false,									//on a sticky wall, for wall jumping..
					hanging:false,										//currently hanging on a sticky wall
					m : 0,												//the m in y=mx+b 
					b : 0,												//the b in y=mx+b
					velMult : 1,										//velocity multiplier
					breakOnOverlap :false,								//on overlap do we stop checking for overlaps?
					overlapCallback: false								//the callback function itself
				}
				
				this.lineDefaults = {
					type: 'ground',										//type of line
					coords: { x1:0, y1:0, x2:0, y2:0 },					//bound points of line
					destinations: { x1:0, y1:0, x2:0, y2:0 },			//for platforms, from where - to does the platform move?
					facing:true,										//for platforms, which direction does the movement start in? true = right
					checkDirections: {									//for collisions, which directions are we checking?
						checkUp:false,									//ground, slopes, platforms
						checkDown:false,								//ground, slopes, platforms
						checkLeft:false,								//walls
						checkRight:false								//walls
					},
					velMult:1,											//when on ground, slope or platform is the velocity increased?
					velocity:0,											//for platforms, what x velocity does this platforms move at?
					length:0,											//length of ground or platform
					height:0,											//height of wall
					sticky:false,										//is the wall sticky?
					callback:false,										//collision callback
					isOverlapper:false,									//Does this line act as a trigger? i.e. with callback on collision
					pause:0,											//for platforms, do they pause at the bounds of the movement line, if so how long?
					isPaused:false,										//does the platform start paused?
					pauseUntil:0										//for pause counter
				}
			
			return false;
			
		}
		
	//creation methods
	
		/*
		* Create a world collider for a dynamic object
		* @param object dynamic The dynamic object for this collider group
		* @param int x Bottom left x coord of world
		* @param int y Bottom left y coord of world
		* @param int width Width of world
		* @param int height Height of world
		* @return false
		*/
			addWorldCollider( x, y, width, height){
				
				let world = {
					bottomLeft:{x:x,y:y},
					bottomRight:{x:x+width, y:y},
					topRight:{x:x+width, y:y-height},
					topLeft:{x:x, y:y-height}
				};
				
				this.worldCollider = {world:world, dynamics:[]};
				
				return false;
				
			}
			
		/*
		* Add dynamic objects to the world collider
		* @param array dynamic An array of dynamic objects
		*/
			addToWorldCollider(dynamics)
			{
				
				if(dynamics.constructor === Array){
					
					for(var i = 0; i < dynamics.length; i++){
						this.worldCollider.dynamics.push(dynamics[i]);
					}
					
				} else {
				
					this.worldCollider.dynamics.push(dynamics);
					
				}
				
				return false;
			}
	
		/*
		* Create a sprite and inject physics properties for it
		* @return Phaser.GameoBjects.Sprite
		*/
			addSprite(config)
			{
				
				let dyn = this.dynamicDefaults;
				
				var sprite = this.scene.add.sprite(config.x || dyn.x, config.y || dyn.y, config.spriteSelector || '');		
				
				sprite.body = {
					canMove : config.canMove || dyn.canMove,						//are we applying movement to this body?
					velocity : {													//body velocity
						x:config.velocity.x || dyn.velocity.x,
						y:config.velocity.y || dyn.velocity.y
					},											
					radius : config.radius || dyn.radius,							//width / 2 of body bounds
					height: config.height || dyn.height,							//height of body bounds
					dirAdj : config.dirAdj || dyn.dirAdj,							//left or right X
					gravityFactor : config.gravityFactor || dyn.gravityFactor,		//for scaling gravity for this body
					pointOffset : {													//where is the "point" in relation to the origin of the sprite
						x:config.pointOffset.x || dyn.pointOffset.x, 
						y:config.pointOffset.y || dyn.pointOffset.y
					},				
					onGround : config.onGround || dyn.onGround,						//on a ground / slope / platform
					onPlatform: config.onPlatform || dyn.onPlatform,				//on a platform specifically
					platformIndex : config.platformIndex || dyn.platformIndex,		//which platform? For movement
					onWall : config.onWall || dyn.onWall,							//on a wall?
					onStickyWall:config.onStickyWall || dyn.onStickyWall,			//on a sticky wall, for wall jumping..
					hanging:config.hanging || dyn.hanging,							//currently hanging on a sticky wall
					m : config.m || dyn.m,											//the m in y=mx+b 
					b : config.b || dyn.b,											//the b in y=mx+b
					velMult : config.velMult || dyn.velMult,						//velocity multiplier
					breakOnOverlap : config.breakOnOverlap || dyn.breakOnOverlap,	//on overlap do we stop checking for overlaps?
					overlapCallback: config.overlapCallback || dyn.overlapCallback,	//the callback function itself
				};
				
				//add to the dynamic objects movement array
					this.dynamicObjects.push(sprite);
				
				return sprite;
				
			}
			
		/*
		* Add a line to the world, injecting simple properties with it.
		* @param object config The config variable for this line 
		*/
			addLine(config)
			{
				
				if(typeof config != 'object'){ 
					console.log('Config Object not present.');
					return null; 
				}
				
				//sort out default values
					let defaults = this.lineDefaults;
					
				//ensure coords exists and write to var for use later
					let coords;
					if(typeof config.coords == 'undefined') { 
						coords = defaults.coords; 
					} else {
						coords = config.coords; 
					}
					coords.x1 = config.coords.x1 || defaults.coords.x1;
					coords.y1 = config.coords.y1 || defaults.coords.y1;
					coords.x2 = config.coords.x2 || defaults.coords.x2;
					coords.y2 = config.coords.y2 || defaults.coords.y2;
				
				//length and height regardless.
					config.length = config.length || defaults.length;
					config.height = config.height || defaults.height;
					
					config.type = config.type || defaults.type;
					
					if(typeof config.facing == 'undefined'){ config.facing = defaults.facing; }
				
				switch(config.type){
					
					//flat line horizontal
					case 'ground':																				//type 1
					case 'platform':																			//type 4		
						
						//make line
							var line = new Phaser.Geom.Line(coords.x1, coords.y1, coords.x1+config.length, coords.y1);
						
						//write properties
							line.checkUp = config.checkDirections.checkUp || defaults.checkDirections.checkUp;
							line.checkDown = config.checkDirections.checkDown || defaults.checkDirections.checkDown;
							line.velMult = config.velMult || defaults.velMult;
							line.type = (config.type == 'ground') ? 1 : 4;
							line.m = 0;																			//needed for straight line
							line.b = coords.y1;																	//needed for straight line
							line.angle = 0;																		//needed for straight line
							line.callback = config.callback || defaults.callback;
							line.isOverlapper = config.isOverlapper || defaults.isOverlapper;
						
						//platforms properties
							if(config.type == 'platform'){
								
								line.origin = {x:coords.x1+(config.length/2), y:coords.y1};						//origin half way up line
								line.facing = config.facing;													//which way is the initial facing of platform (true = right)
								line.dirAdj = (line.facing) ? 1 : -1;											//used as multiplier for velocity
								line.deltaX = 0;																//in update, the move this platform made this frame
								line.deltaY = 0;																//in update, the move this platform made this frame
								line.velocity = config.velocity || defaults.velocity;							//speed of platform movement X
								line.path = {vert:false, b:0, m:0};
								line.pause = config.pause || defaults.pause;
								line.isPaused = false;
								line.pauseUntil = 0;
								
								line.destinations = {
									x1:config.destinations.x1 || defaults.destinations.x1, 
									y1:config.destinations.y1 || defaults.destinations.y1,  
									x2:config.destinations.x2 || defaults.destinations.x2,  
									y2:config.destinations.y2 || defaults.destinations.y2
								};
								
								//work out line equation
								//flat path line
								if(line.destinations.y1 == line.destinations.y2){
									line.path.b = line.destinations.y1;
									line.path.m = 0;
								} else if (line.destinations.x1 == line.destinations.x2){
									line.path.vert = true;
								} else {
									
									//whats the slope?
										line.path.m = (line.destinations.y1 - line.destinations.y2) / (line.destinations.x1 - line.destinations.x2);
									
									//b = y - mx
										line.path.b = line.destinations.y1 - (line.path.m*line.destinations.x1);
									
								}
								
							}
							
							if(config.type == 'platform'){
								this.platforms.push(line);
							}
						
						if(this.debug == true){
							if(config.type == 'ground'){
								this.staticObjects.grounds.push(line);
							} else {
								this.staticObjects.platforms.push(line);
							}
						}
						
						return line;
					
					break;
					
					//sloped line in either direction
					case 'slope':
					
						//swap over points if right point given first.
						// x1 further to right than x2
							if(coords.x1 > coords.x2){
								
								let first = {x:ccoords.x1,y:coords.y1};
								coords.x1 = coords.x2;
								coords.y1 = coords.y2;
								coords.x2 = first.x;
								coords.y2 = first.y;
								
							}
						
						//make line
							var line = new Phaser.Geom.Line(coords.x1, coords.y1, coords.x2, coords.y2);
						
							line.m = (coords.y1 - coords.y2) / (coords.x1 - coords.x2);							//whats the slope?
							line.b = config.coords.y1 - (line.m*coords.x1);										//b = y - mx
							
						//write properties
							line.checkUp = config.checkDirections.checkUp || defaults.checkDirections.checkUp;
							line.checkDown = config.checkDirections.checkDown || defaults.checkDirections.checkDown;
							line.velMult = config.velMult || defaults.velMult;
							line.type = 2;
							line.callback = config.callback || defaults.callback;
							line.isOverlapper = config.isOverlapper || defaults.isOverlapper;
						
						//work out slope angle - toa
							let adjacent = Math.abs(line.x2) - Math.abs(line.x1);
							let opposite = Math.abs(line.y2) - Math.abs(line.y1);
							let theta = opposite/adjacent;														//tan(theta)
							theta = Math.atan(theta);															//atan(theta) in rads
							theta *= 180 / Math.PI;																//convert to degrees							
							line.angle = theta*-1;																//set for this coord system
						
						if(this.debug == true){
							this.staticObjects.slopes.push(line);
						}
						
						return line;
					
					break;
					
					//flat vertical line
					case 'wall':
						
						//use height from bottom point to make second point on line
						var line = new Phaser.Geom.Line(config.coords.x1, config.coords.y1, config.coords.x1, config.coords.y1-config.height);
						
						line.checkLeft = config.checkDirections.checkLeft || defaults.checkDirections.checkLeft;
						line.checkRight = config.checkDirections.checkRight || defaults.checkDirections.checkRight;
						line.sticky = config.sticky || defaults.sticky;
						line.type = 3;
						line.callback = config.callback || defaults.callback;
						line.isOverlapper = config.isOverlapper || defaults.isOverlapper;
						
						if(this.debug == true){
							if(line.sticky){
								this.staticObjects.stickyWalls.push(line);
							} else {
								this.staticObjects.walls.push(line);
							}
						}
						
						return line;
					
					break;
					
				}
				
			}
			
		/*
		* Add a collider setup to the world
		* @param string name The identifier for this collider
		* @param object dyanmic The Dyanmic object of this collider.
		*/
			addCollider(name, dynamic){
				
				this.colliders[name] = {
					dynamic:dynamic, 		//the dynamic body
					walls:[],				
					groundSlopes:[] 		//including platforms
				};
				
				return false;
			}
			
		/*
		* Add static objects to a collider
		* @param string name The identifier for the collider
		* @param array objects An array of objects
		*/
			addToCollider(name, objects)
			{
				
				if(objects.constructor === Array){
					
					for(var i = 0; i < objects.length; i++){
						switch(objects[i].type){
							
							case 1:
							case 2:
							case 4:
								this.colliders[name].groundSlopes.push(objects[i]);
							break;
							case 3:
								this.colliders[name].walls.push(objects[i]);
							break;
							
						}
						
					}
					
				} else {
				
					switch(objects[i].type){
							
						case 1:
						case 2:
						case 4:
							this.colliders[name].groundSlopes.push(objects);
						break;
						case 3:
							this.colliders[name].walls.push(objects);
						break;
						
					}
					
				}
				
				return false;
			}
			
		/*
		* Add an overlapper setup to the world
		* @param string name The identifier for this overlapper
		* @param object dyanmic The Dyanmic object of this overlapper.
		*/
			addOverlapper(name, dynamic){
				
				this.overlappers[name] = {
					dynamic:dynamic,
					otherDynamic:[]
				};
				
				return false;
			}
			
		/*
		* Add static objects to an overlapper
		* @param string name The identifier for the overlapper
		* @param array objects An array of objects
		*/
			addToOverlapper(name, objects)
			{
				
				if(objects.constructor === Array){
					
					for(var i = 0; i < objects.length; i++){
						this.overlappers[name].otherDynamic.push(objects[i]);
					}
					
				} else {
				
					this.overlappers[name].otherDynamic.push(objects);
					
				}
				
				return false;
			}
	
	/*
	* Main Update function to loop through movement and collisions for bodies / statics / platforms
	* @param float delta The Delta time (in milliseconds) passed from Scene's update loop
	* @return false
	*/
		update(delta, time)
		{
			
			//transform delta to seconds for movement.
				delta = delta*0.001;
				
			//Set up local variables for use in loops
				let cam,
					dynPointX,dynPointY,dynPointYtop,dynPointYbottom,dyn,
					otherDynPointX,otherDynPointY,otherDynPointYtop,otherDynPointYbottom,otherDyn,
					stat,plat,key,index,
					colliders,overlappers;
				let scene = this.scene;
				
			//update the camera and it's bounds
				cam = this.scene.cameras.main;
				cam.camLeftBorderX = cam.midPoint.x - ((cam.width / cam.zoom) / 2);
				cam.camRightBorderX = cam.midPoint.x + ((cam.width / cam.zoom)/2);
				cam.camTopBorderY = cam.midPoint.y - ((cam.height / cam.zoom)/2);
				cam.camBottomBorderY = cam.midPoint.y + ((cam.height / cam.zoom)/2);			
			
			//    _   ___ ___ _ __   __  __  __  _____   ____  __ ___ _  _ _____ 
			//   /_\ | _ \ _ \ |\ \ / / |  \/  |/ _ \ \ / /  \/  | __| \| |_   _|
			//  / _ \|  _/  _/ |_\ V /  | |\/| | (_) \ V /| |\/| | _|| .` | | |  
			// /_/ \_\_| |_| |____|_|   |_|  |_|\___/ \_/ |_|  |_|___|_|\_| |_| 
			
				//platforms first, they wait for no man
					for(var i=0; i<this.platforms.length; i++){
						
						plat = this.platforms[i];
						
						if(plat.isPaused){
							
							if(time > plat.pauseUntil){
								plat.isPaused = false;
							}
							
						} else {
						
							//first apply movement
								let thisMove = plat.velocity*delta*plat.dirAdj;
								
							if (plat.path.vert == true){
							
								plat.deltaX = 0;													//x always 0 on vertical line
								
								//positive facing = down
								//does this take us past a destination?
									if(
										plat.facing &&												//true facing
										(plat.origin.y + thisMove) >= plat.destinations.y1			//first point the bottom point
									){
										
										//about turn
											plat.facing = !plat.facing;
											plat.dirAdj *= -1;
										
										//work out diff and apply to line bounds
											plat.deltaY = plat.destinations.y1 - plat.origin.y; 	//destination - CURRENT origin y
											
											plat.y1 += plat.destinations.y1;						//move y's to y1
											plat.y2 += plat.destinations.y1;						//move y's to y1
											plat.origin.y = plat.destinations.y1;					//move y's to y1
											
										//set pause?
											if(plat.pause > 0){
												plat.isPaused = true;
												plat.pauseUntil = time+plat.pause;
											}
										
									} else if(
										!plat.facing &&
										(plat.origin.y + thisMove) <= plat.destinations.y2			//second point the top point
									){
										
										//about turn
											plat.facing = !plat.facing;
											plat.dirAdj *= -1;
										
										//work out diff and apply to line bounds
											plat.deltaY = plat.destinations.y2 - plat.origin.y; 	//destination - CURRENT origin y
											
											plat.y1 += plat.deltaX;									//move  y'2 to y2
											plat.y2 += plat.deltaX;									//move  y'2 to y2
											plat.origin.y = plat.destinations.y2;					//move  y'2 to y2
											
										//set pause?
											if(plat.pause > 0){
												plat.isPaused = true;
												plat.pauseUntil = time+plat.pause;
											}
										
									} else {
										//move normally
											plat.deltaY = thisMove;									//move this delta
											plat.y1 += thisMove;									//move y's
											plat.y2 += thisMove;
											plat.origin.y += thisMove;
									}
									
							} else {
								
								//does this take us past a destination?
									if(
										plat.facing &&
										(plat.origin.x + thisMove) >= plat.destinations.x2			//x2 right side point
									){
										
										//about turn
											plat.facing = !plat.facing;
											plat.dirAdj *= -1;
										
										//work out diff and apply to line bounds
											plat.deltaX = plat.destinations.x2 - plat.origin.x; 	//destination - CURRENT origin x
											
											plat.x1 += plat.deltaX;									//move the line bounds x's
											plat.x2 += plat.deltaX;									//move the line bounds x's
											plat.origin.x = plat.destinations.x2;					//move origing to that bound x
											let oldY = plat.origin.y;								//where were the y points
											plat.origin.y = plat.destinations.y2;					//where are they now
											plat.deltaY = plat.origin.y - oldY;						//move by that amount
											plat.y1 += plat.deltaY;									//move by that amount
											plat.y2 += plat.deltaY;									//move by that amount
											
										//set pause?
											if(plat.pause > 0){
												plat.isPaused = true;
												plat.pauseUntil = time+plat.pause;
											}
										
									} else if(
										!plat.facing &&
										(plat.origin.x + thisMove) <= plat.destinations.x1			//x1 left side point
									){
										
										//about turn
											plat.facing = !plat.facing;
											plat.dirAdj *= -1;
										
										//work out diff and apply to line bounds
											plat.deltaX = plat.destinations.x1 - plat.origin.x; //destination - CURRENT origin x
											
											plat.x1 += plat.deltaX;
											plat.x2 += plat.deltaX;
											plat.origin.x = plat.destinations.x1;
											let oldY = plat.origin.y;
											plat.origin.y = plat.destinations.y1;
											plat.deltaY = plat.origin.y - oldY;
											plat.y1 += plat.deltaY;
											plat.y2 += plat.deltaY;
											
										//set pause?
											if(plat.pause > 0){
												plat.isPaused = true;
												plat.pauseUntil = time+plat.pause;
											}
										
									} else {
										
										//move normally
											plat.deltaX = thisMove;
											plat.x1 += thisMove;
											plat.x2 += thisMove;
											plat.origin.x += thisMove;
											let oldY = plat.origin.y;
											plat.origin.y = (plat.path.m*plat.origin.x) + plat.path.b;
											plat.deltaY = plat.origin.y - oldY;
											plat.y1 += plat.deltaY;
											plat.y2 += plat.deltaY;
										
									}
								
							}
							
						}
						
					}
			
				//go through each dynamic object and move.
					for(var i=0; i<this.dynamicObjects.length; i++){
						
						dyn = this.dynamicObjects[i];
						
						//first move X and Y to new location WITH platform, if on one.
						if(dyn.body.onPlatform){
							key = dyn.body.platformIndex.key;
							index = dyn.body.platformIndex.index;
							plat = this.colliders[key].groundSlopes[index];
							dyn.x += plat.deltaX;
							dyn.y += plat.deltaY;
							dyn.angle = dyn.body.angle;
						}
							
						//first make horizontal movement
						dyn.x += (dyn.body.velocity.x == 0) ? 0 : (dyn.body.velocity.x*delta*dyn.body.velMult);
						
						//platforms can't be slopes...yet
						if(dyn.body.onGround && !dyn.body.onPlatform){
							
							//use m and b values set by current ground
							//essentially y=mx+b;
							dyn.y = (dyn.x*dyn.body.m) + dyn.body.b - dyn.body.pointOffset.y;
							dyn.angle = dyn.body.angle;
							
						//if you're not hanging, not on a platform and not on the ground...then you're in the air!
						} else if (!dyn.body.hanging) {
							
							//apply gravity to velocity
							dyn.body.velocity.y += this.gravity*dyn.body.gravityFactor;
							
							//make the movement
							dyn.y += dyn.body.velocity.y*delta;
							
						}
						
					}
			
			//   ___ ___  _    _    ___ ___ ___ ___  _  _ ___ 
			//  / __/ _ \| |  | |  |_ _/ __|_ _/ _ \| \| / __|
			// | (_| (_) | |__| |__ | |\__ \| | (_) | .` \__ \
			//  \___\___/|____|____|___|___/___\___/|_|\_|___/
				
				
				//world first
				
					if(typeof this.worldCollider.dynamics !== 'undefined'){
						
						for(var i=0; i<this.worldCollider.dynamics.length; i++){
							
							dyn = this.worldCollider.dynamics[i];
							
							//so we're not adding up every time
								dynPointX = dyn.x+dyn.body.pointOffset.x+(dyn.body.radius*dyn.body.dirAdj); 	//WALLS USE THE WIDTH+POINT X VALUE TO CALCULATE COLLISION
								dynPointY = dyn.y+dyn.body.pointOffset.y;									//WALLS USE POINT Y VALUE
							
							//left
								if (dynPointX < this.worldCollider.world.bottomLeft.x){
									dyn.body.velocity.x = 0;
									dyn.x = this.worldCollider.world.bottomLeft.x+dyn.body.pointOffset.x-(dyn.body.radius*dyn.body.dirAdj);
								}
								
							//right
								if (dynPointX > this.worldCollider.world.bottomRight.x){
									dyn.body.velocity.x = 0;
									dyn.x = this.worldCollider.world.bottomRight.x+dyn.body.pointOffset.x-(dyn.body.radius*dyn.body.dirAdj);
								}

							//Up
								if (dynPointY < this.worldCollider.world.topLeft.y){
									dyn.body.velocity.y = 0;
									dyn.y = this.worldCollider.world.topLeft.y+dyn.body.pointOffset.y;
								}

							//Down
								if (dynPointY > this.worldCollider.world.bottomLeft.y){
									dyn.body.velocity.y = 0;
									dyn.y = this.worldCollider.world.bottomLeft.y+dyn.body.pointOffset.y;
								}
							
						}
						
					}
						
				////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
				
				
				//   _____   _____ ___ _      _   ___ ___ ___ ___  ___ 
				//  / _ \ \ / / __| _ \ |    /_\ | _ \ _ \ __| _ \/ __|
				// | (_) \ V /| _||   / |__ / _ \|  _/  _/ _||   /\__ \
				//  \___/ \_/ |___|_|_\____/_/ \_\_| |_| |___|_|_\|___/
				
				
					//write overlappers to local var, as "this" won't work in loop function
					overlappers = this.overlappers;
					
					//loop over the sub objects within overlappers, by key
					Object.keys(overlappers).forEach(function(key,index) {
						
						//easier to call upon variable
						dyn = overlappers[key].dynamic;
						dynPointX = dyn.x+dyn.body.pointOffset.x;
						dynPointY = dyn.y+dyn.body.pointOffset.y;
						
						//loop  over grounds and slopes in group
						for(var j=0; j < overlappers[key].otherDynamic.length; j++){
							
							//write static to local var
							otherDyn = overlappers[key].otherDynamic[j];
							otherDynPointX = otherDyn.x+otherDyn.body.pointOffset.x;
							otherDynPointYbottom = otherDyn.y+otherDyn.body.pointOffset.y;
							
							//ignore this other dynamic?
							if(
								//other dyn off screen
								(otherDynPointX-otherDyn.body.radius > cam.camRightBorderX) ||							//right
								(otherDynPointX+otherDyn.body.radius < cam.camLeftBorderX) ||							//left
								(otherDynPointYbottom < cam.camTopBorderY) ||											//top
								(otherDynPointYbottom-otherDyn.body.height > cam.camBottomBorderY)						//bottom
							){
								continue;
							}
							
							if(
								(
									(
										dynPointX+dyn.body.radius > otherDynPointX-otherDyn.body.radius &&				//right border within other sprite bounds
										dynPointX+dyn.body.radius < otherDynPointX+otherDyn.body.radius
									) ||
									(
										dynPointX-dyn.body.radius > otherDynPointX-otherDyn.body.radius &&				//left border within other sprite bounds
										dynPointX-dyn.body.radius < otherDynPointX+otherDyn.body.radius
									) 
								) &&
								(
									(
										dynPointY < otherDynPointYbottom &&												//bottom border within other sprite bounds
										dynPointY > otherDynPointYbottom-otherDyn.body.height
									) ||
									(
										dynPointY-dyn.body.height < otherDynPointYbottom &&								//top border within other sprite bounds
										dynPointY-dyn.body.height > otherDynPointYbottom-otherDyn.body.height
									)
								)
							){
								
								//callback?
									if (otherDyn.body.overlapCallback && typeof(otherDyn.body.overlapCallback) === "function") {
										otherDyn.body.overlapCallback(dyn, otherDyn, scene);
									}
									
								//stop checking overlaps?
									if (otherDyn.body.breakOnOverlap){
										break;
									}
								
							}
							
						}
						
					});

				
				
				////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// 
				
				//write colliders to local var, as "this" won't work in loop function
					colliders = this.colliders;
					
				//loop over the sub objects within colliders, by key
				Object.keys(colliders).forEach(function(key,index) {
					
					//easier to call upon variable
						dyn = colliders[key].dynamic;
						
					//moving in any direction, otherwise don't calculate
						if(dyn.body.velocity.y !== 0 || dyn.body.velocity.x !== 0){
						
							//start off assuming we're not on a slope, or ground, or wall
								dyn.body.onGround = false;
								dyn.body.velMult = 1;
								dyn.body.onWall = false;
								dyn.body.onStickyWall = false;
								dyn.body.onPlatform = false;
								
							//loop  over grounds and slopes in group
							for(var j=0; j < colliders[key].groundSlopes.length; j++){
								
								//write static to local var
								stat = colliders[key].groundSlopes[j];
									
								dynPointX = dyn.x+dyn.body.pointOffset.x;										//SLOPE AND GROUND USES POINT X VALUE (NOT POINT + WIDTH LIKE WALLS!)
								dynPointY = dyn.y+dyn.body.pointOffset.y;										//SLOPE AND GROUND USES POINT Y VALUE
								
								//Ignore this line?
								if(
									stat.x2 < cam.camLeftBorderX || 											//line off screen to left
									stat.x1 > cam.camRightBorderX ||											//line off screen to right
									(stat.y1 < cam.camTopBorderY && stat.y2 < cam.camTopBorderY) ||				//line off screen upwards
									(stat.y1 > cam.camBottomBorderY && stat.y2 > cam.camBottomBorderY) ||		//line off screen downwards
									dynPointX < stat.x1 ||														//Dynamic Object too far left of line to care
									dynPointX > stat.x2 ||														//Dynamic Object too far right of line to care
									(stat.checkUp === false && stat.checkDown === false) || 					//Line isn't checking either direction
									(dyn.body.velocity.y > 0 && stat.checkUp === false) ||						//Dynamic Object moving down, line isn't checking on it's top side
									(dyn.body.velocity.y < 0 && stat.checkDown === false) 						//dyn moving up, line isn't checking on it's bottom side
								){
									continue;
								}
								
								
								//   ___ ___  ___  _   _ _  _ ___  
								//  / __| _ \/ _ \| | | | \| |   \ 
								// | (_ |   / (_) | |_| | .` | |) |
								//  \___|_|_\\___/ \___/|_|\_|___/ 
								//Check Grounds and Platforms first, as calculations simpler
							 
									if(stat.type == 1 || stat.type == 4){
										
										//are we on this line? (y = mx+b)
											if(
												dyn.body.velocity.y == 0 && 										//not moving up or down by gravity
												dynPointY == stat.y1												//Does Y = ground.y?
											){
												if(!plat.isOverlapper){												//only apply collision if this line aint an overlapper
													dyn.body.onGround = true;										//Set onGround to allow skipping of all other grounds in loop
													if(stat.type == 4){
														dyn.body.onPlatform = true;
														dyn.body.platformIndex = {key:key, index:j};
													}
													dyn.body.velMult = stat.velMult;								//Set velMult to this ground.
												}
												break;
											}
										
										//moving down and collider is facing up
											else if( 
												( 
													(dynPointY + (dyn.body.velocity.y*delta) ) > stat.y1	&&		//next frames position of point
													(dynPointY - (dyn.body.velocity.y*delta*2) ) <= stat.y1	 		//2 frames in past position of point
												)
												&& stat.checkUp === true
											){
												
												if(!plat.isOverlapper){												//only apply collision if this line aint an overlapper
												
													dyn.body.m = stat.m;
													dyn.body.b = stat.b;
													dyn.body.angle = stat.angle;
													dyn.body.velMult = stat.velMult;								//set the current line equation from the line the player is on
													
													dyn.y = stat.y1-dyn.body.pointOffset.y;							//set dyn y position according to equation (i.e. snap to line) accounting for point offset/y = dyn.x*m + b
													
													dyn.body.velocity.y = 0; 										//as soon as we know we're on a ground platform, then set dynamic to on ground, and break from colliders
													dyn.body.onGround = true;
													
													//on a platform?
													if(stat.type == 4){
														dyn.body.onPlatform = true;
														dyn.body.platformIndex = {key:key, index:j};
													}
													
												}
												
												//callback?
													if (stat.callback && typeof(stat.callback) === "function") {
														stat.callback(dyn, scene);
													}
												
												break;																//break because if colliding, no need to check anything else until next frame
												
											}
										
										//moving up and collider is facing down.
											else if(
												( 
													( (dynPointY-dyn.body.height) + (dyn.body.velocity.y*delta) ) < stat.y1			//next frames position of point - height
													&& ( (dynPointY-dyn.body.height) - (dyn.body.velocity.y*delta) ) >= stat.y1 	//last frames position of point
												)
												&& stat.checkDown === true 
											){
												
												if(!plat.isOverlapper){												//only apply collision if this line aint an overlapper
													dyn.body.velocity.y = 0;
													dyn.body.onGround = false;
												}
													
												//callback?
													if (stat.callback && typeof(stat.callback) === "function") {
														stat.callback(dyn, scene);
													}
												
												break;																//break because if colliding, no need to check anything else until next frame
											}
										
								//  ___ _    ___  ___ ___ ___ 
								// / __| |  / _ \| _ \ __/ __|
								// \__ \ |_| (_) |  _/ _|\__ \
								// |___/____\___/|_| |___|___/						
								//Check Slopes
								
									} else if (stat.type == 2){
										
										//are we on this line? (y = mx+b)
											if(
												dyn.body.velocity.y == 0 && 										//not moving up or down by gravity
												(dynPointY.toFixed(5) == ((dynPointX*stat.m)+stat.b).toFixed(5))	//Does y = mx+b?
											){
												
												if(!plat.isOverlapper){												//only apply collision if this line aint an overlapper
													dyn.body.onGround = true;										//Set onGround to allow skipping of all other grounds in loop
													dyn.body.velMult = stat.velMult;								//Set velMult to this ground.
												}
												break;
											}
										
										//moving down and collider is facing up
											else if( 
												( 
													(dynPointY + (dyn.body.velocity.y*delta) ) > (stat.m*(dynPointX+(dyn.body.velocity.x*delta)) )+stat.b 			//next frames position of point
													&& (dynPointY - (dyn.body.velocity.y*delta*2) ) <= (stat.m*(dynPointX-(dyn.body.velocity.x*delta*2)) )+stat.b 	//2 frames in past position of point
												)
												&& stat.checkUp === true
											){
												
												if(!plat.isOverlapper){												//only apply collision if this line aint an overlapper
												
													//set the current line equation from the line the player is on
													dyn.body.m = stat.m;
													dyn.body.b = stat.b;
													dyn.body.angle = stat.angle;
													dyn.body.velMult = stat.velMult;
													
													//y = dyn.x*m + b
													//set dyn y position according to equation (i.e. snap to line) accounting for point offset
													dyn.y = (dynPointX*dyn.body.m) + dyn.body.b - dyn.body.pointOffset.y;
													
													//as soon as we know we're on a ground platform, then set dynamic to on ground, and break from colliders
													dyn.body.velocity.y = 0; 
													dyn.body.onGround = true;
												}
												
												//callback?
													if (stat.callback && typeof(stat.callback) === "function") {
														stat.callback(dyn, scene);
													}
													
												break;																//break because if colliding, no need to check anything else until next frame
												
											}
										
										//moving up and collider is facing down.
											else if(
												( 
													( (dynPointY-dyn.body.height) + (dyn.body.velocity.y*delta) ) < (stat.m*dynPointX)+stat.b 		//next frames position of point
													&& ( (dynPointY-dyn.body.height) - (dyn.body.velocity.y*delta) ) >= (stat.m*dynPointX)+stat.b 	//last frames position of point
												)
												&& stat.checkDown === true 
											){
												
												if(!plat.isOverlapper){												//only apply collision if this line aint an overlapper
													dyn.body.velocity.y = 0;
													dyn.body.onGround = false;
												}
												
												//callback?
													if (stat.callback && typeof(stat.callback) === "function") {
														stat.callback(dyn, scene);
													}
													
												break;																//break because if colliding, no need to check anything else until next frame
											}
										
									}
								
							}
							
							//loop  over grounds and slopes in group
							for(var k=0; k < colliders[key].walls.length; k++){
								
								// __      ___   _    _    ___ 
								// \ \    / /_\ | |  | |  / __|
								//  \ \/\/ / _ \| |__| |__\__ \
								//   \_/\_/_/ \_\____|____|___/
								
								//write static to local var
								stat = colliders[key].walls[k]; 
							
								dynPointX = dyn.x+dyn.body.pointOffset.x+(dyn.body.radius*dyn.body.dirAdj); 	//WALLS USE THE WIDTH+POINT X VALUE TO CALCULATE COLLISION
								dynPointYtop = dyn.y+dyn.body.pointOffset.y-dyn.body.height;					//WALLS USE POINT Y VALUE 
								dynPointYbottom = dyn.y+dyn.body.pointOffset.y;									//WALLS USE POINT Y VALUE 
								
								//if the dynamic object point is outside of the y bounds of this line, don't bother testing.
								if(
									stat.x1 < cam.camLeftBorderX ||												//Wall off screen to left
									stat.x1 > cam.camRightBorderX ||											//Wall off screen to right
									(stat.y1 < cam.camTopBorderY && stat.y2 < cam.camTopBorderY) ||				//Wall off screen upwards
									(stat.y1 > cam.camBottomBorderY && stat.y2 > cam.camBottomBorderY) ||		//Wall off screen downwards
									dynPointYtop > stat.y1 || 													//Dynamic Object below wall
									dynPointYbottom < stat.y2 ||												//Dynamic Object above wall
									(dynPointYbottom == stat.y2 && dyn.body.onGround) ||						//If dyn is on a slope where the top of this wall is on the same point as this wall, ignore to prevent dyn stopping
									(stat.checkLeft === false && stat.checkRight === false)	||					//ground line isn't checking either direction
									(dyn.body.velocity.x > 0 && stat.checkLeft === false) ||					//dyn moving right, line isn't checking left
									(dyn.body.velocity.x < 0 && stat.checkRight === false)						//dyn moving left, line isn't checking right
								){
									continue;
								}
									
								//are we on this wall?
								else if(
									dyn.body.velocity.x == 0 && 
									(dynPointX.toFixed(5) == (stat.x1).toFixed(5))								//to fixed to allow for float innacuracy.
								){
									dyn.body.onWall = true;
									dyn.body.onStickyWall = stat.sticky;
									break;																		//dyn not moving left or right, and is currently on a wall line
								}
								
								else if(
									(
										(dynPointX + (dyn.body.velocity.x*delta) ) > stat.x1 					//next frame x position right side of wall
										&& (dynPointX - (dyn.body.velocity.x*delta*2) ) <= stat.x1 				//2 frames in past x position left side of wall
										&& stat.checkLeft === true												//checking from left
									) ||
									(
										(dynPointX + (dyn.body.velocity.x*delta) ) < stat.x1 					//next frame x position left side of wall
										&& (dynPointX - (dyn.body.velocity.x*delta*2) ) >= stat.x1 				//2 frames in past x position right side of wall
										&& stat.checkRight === true												//checking from right
									) && 
									(
										(dynPointYtop > stat.y2 && dynPointYtop < stat.y1) ||					//either top or bottom point within wall bounds
										(dynPointYbottom > stat.y2 && dynPointYbottom < stat.y1)
									)
								){
									
									dyn.x = stat.x1-(dyn.body.radius*dyn.body.dirAdj);							//set X to wall - radius - x point offset
									dyn.body.velocity.x = 0; 													//stop all x velocity
									dyn.body.onWall = true;														//set onWall to true
									dyn.body.onStickyWall = stat.sticky;										//set sticky from wall
									
									//callback?
										if (stat.callback && typeof(stat.callback) === "function") {
											stat.callback(dyn, scene);
										}
												
									break;
								}
								
							}
						
						}
						
				});
								
			//  ___  ___ ___ _   _  ___ 
			// |   \| __| _ ) | | |/ __|
			// | |) | _|| _ \ |_| | (_ |
			// |___/|___|___/\___/ \___|
			
				if(this.debug && this.gfxSet){
					
					this.gfx.clear();
					
					//static grounds first
					this.gfx.lineStyle(1, 0xFF00FF, 1.0);
					for(var i=0; i < this.staticObjects.grounds.length; i++){
						let obj = this.staticObjects.grounds[i];
						this.gfx.strokeLineShape(obj);
					}
					
					//platforms
					this.gfx.lineStyle(1, 0xFF00FF, 1.0);
					for(var i=0; i < this.staticObjects.platforms.length; i++){
						let obj = this.staticObjects.platforms[i];
						this.gfx.strokeLineShape(obj);
					}
					
					//static slopes
					this.gfx.lineStyle(1, 0xf6ff00, 1.0);
					for(var i=0; i < this.staticObjects.slopes.length; i++){
						let obj = this.staticObjects.slopes[i];
						this.gfx.strokeLineShape(obj);
					}
					
					
					//static walls
					this.gfx.lineStyle(1, 0x32CD32, 1.0);
					for(var i=0; i < this.staticObjects.walls.length; i++){
						let obj = this.staticObjects.walls[i];
						this.gfx.strokeLineShape(obj);
					}
					
					//static sticky walls
					this.gfx.lineStyle(1, 0x00eaff, 1.0);
					for(var i=0; i < this.staticObjects.stickyWalls.length; i++){
						let obj = this.staticObjects.stickyWalls[i];
						this.gfx.strokeLineShape(obj);
					}
					
					//dynamic on top
					this.gfx.fillStyle(0x6de3cb, 1.0);
					for(var i=0; i < this.dynamicObjects.length; i++){
						let obj = this.dynamicObjects[i];
						
						//main point
						this.debugPoint.x = obj.x+obj.body.pointOffset.x;
						this.debugPoint.y = obj.y+obj.body.pointOffset.y;
						this.gfx.fillPointShape(this.debugPoint, 2);
						
						//bottom right
						this.debugPoint.x = obj.x+obj.body.pointOffset.x+obj.body.radius;
						this.gfx.fillPointShape(this.debugPoint, 1);
						
						//bottom left
						this.debugPoint.x = obj.x+obj.body.pointOffset.x-obj.body.radius;
						this.gfx.fillPointShape(this.debugPoint, 1);
						
						//top right
						this.debugPoint.x = obj.x+obj.body.pointOffset.x+obj.body.radius;
						this.debugPoint.y = obj.y-obj.body.height;
						this.gfx.fillPointShape(this.debugPoint, 1);
						
						//top left
						this.debugPoint.x = obj.x+obj.body.pointOffset.x-obj.body.radius;
						this.debugPoint.y = obj.y-obj.body.height;
						this.gfx.fillPointShape(this.debugPoint, 1);
					}
					
				} else if(this.gfxSet){
					
					this.gfx.clear();
					
				}
				
			return false;
			
		}
}
