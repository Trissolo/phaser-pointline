class Player {
	
	/*
	* Initialise class properties
	* @return false
	*/
		constructor(x, y, scene)
		{
			
			//game utilities
				this.scene = scene;			//by ref
				this.cursors = this.scene.cursors;		//by ref
				this.pointline = this.scene.pointline;		//by ref
			
			//player properties
				
				//global switches
					this.hopSwitch = false;
			
				//direction
					this.yInit = y;
					this.xInit = x;
					this.origin = {x:0.5, y:1};
					this.absVelX = 0;
					this.absVelY = 0;
					this.maxVelX = 80;
					this.rampUpIncr = 6;
					this.rampDownIncr = 8;
					this.rampDownCutoff = 3;
					this.facing = true;		//true right, false left
					this.previousFacing = true;
				
				//jumping & hopping
					this.hopOrigin = {x:0.5, y:0.5};
					this.hopSpineOffset = 8;
					this.jumpVel = -300;
					this.gravityMulti = 2.5;
					this.terminalVel = 250;
					this.jumping = false;
					this.hopping = false;
					this.hopSpinning = false;
					this.canHop = false;
					this.edgeTime = 50; //roughly 3 frames
					this.edgeTimer = 0;
					
				//wall jumping
					this.stickyWallTime = 1000; //1 sec?
					this.stickyWallTimer = 0;
					this.wasOnStickyWall = false;
					this.wallJumpXMult = 2;
					this.wallHopping = false;
					
					
			//objects
				this.sprite = {};
				this.poofs = [];
			
			//initialise
				this.init();
				
			return false;
			
		}
	
	/*
	* Initialise the player sprite, physics body and animations
	* @return false
	*/
		init()
		{
			
			//add sprite to physics
				
				this.sprite = this.pointline.addSprite({
					spriteSelector:'player',
					x:this.xInit,
					y:this.yInit,
					canMove : true,										//are we applying movement to this body?
					velocity : {x:0,y:0},								//body velocity
					width : 2.5,										//width / 2 of body bounds
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
					velMult : 1											//velocity multiplier
				});
				
			//set origin
				this.resetOrigin();
				
			//animations
				this.scene.anims.create({
					key: 'run',
					frames: [{key: "player", frame: 1},{key: "player", frame: 0}], //1 first so run frame is always first seen
					frameRate: 9,
					repeat: -1
				});

				this.scene.anims.create({
					key: 'stand',
					frames: [ { key: 'player', frame: 0 } ],
					frameRate: 1
				});
				
				this.scene.anims.create({
					key: 'jump',
					frames: [ { key: 'player', frame: 3 } ],
					frameRate: 1
				});
			
				this.scene.anims.create({
					key: 'ball',
					frames: [ {key: "player", frame: 4},{key: "player", frame: 5},{key: "player", frame: 6},{key: "player", frame: 7} ],
					frameRate: 24
				});
				
			return false;
			
		}
	
	//movement functions
	
		/*
		* Get Absolute value of each velocity direction
		* @param bool upDown Ramping up or down?
		* @return false
		*/
			ramp(up)
			{
				
				//ramp up
					if(up === true){
						
						if(
							(this.facing && this.sprite.body.velocity.x < 0) || 			//facing right, but your velocity is left
							(!this.facing && this.sprite.body.velocity.x > 0) 				//now facing left but velocity is right
						){
							
							//if already moving in a direction, quickly turn around (the *2)
							this.sprite.body.velocity.x = this.sprite.body.velocity.x + (this.rampDownIncr*this.sprite.body.dirAdj*2);
							
						} else if(this.absVelX < this.maxVelX){
							
							//increase velocity
							this.sprite.body.velocity.x = (this.absVelX+this.rampUpIncr)*this.sprite.body.dirAdj;
							
						} else {
							
							//stay at same velocity
							this.sprite.body.velocity.x = this.maxVelX*this.sprite.body.dirAdj;
							
						}
					
				//ramp down
					} else {
						
						if(
							this.absVelX <= this.rampDownCutoff ||
							(this.facing && this.sprite.body.velocity.x < 0) ||
							(!this.facing && this.sprite.body.velocity.x > 0) 
						){
							
							//kill out velocity below a certain value
							this.sprite.body.velocity.x = 0;
							
						} else if(this.absVelX > this.rampDownCutoff){
							
							//decrease velocity
							this.sprite.body.velocity.x = (this.absVelX-this.rampDownIncr)*this.sprite.body.dirAdj;
							
						}
						
					}
					
				return false;
				
			}
	
		/*
		* Get Absolute value of each velocity direction
		* @return false
		*/
			setMovementProps(timeNow)
			{
				
				//absolute velocities
					this.absVelX = Math.abs(this.sprite.body.velocity.x);
					this.absVelY = Math.abs(this.sprite.body.velocity.y);
					
				//walls
				
					//catch if jsut stuck to sticky wall
						if (this.sprite.body.onStickyWall && this.wasOnStickyWall === false){
							this.stickyWallTimer = timeNow + this.stickyWallTime;
						}
					
					//still hanging?
						this.sprite.body.hanging = (this.sprite.body.onStickyWall && timeNow <= this.stickyWallTimer) ? true : false;
				
				//jumping from edges
				
					//set timer if last frame player was on surface
						if (!this.sprite.body.onGround && this.wasTouchingDown && !this.jumping){
							this.edgeTimer = timeNow + this.edgeTime;
						}
						
					//set flag to enable jump in update function
						this.canJumpEdge = (timeNow <= this.edgeTimer) ? true : false;
					
				//set properties for use in next frame
					this.wasTouchingDown = this.sprite.body.onGround;
					this.wasOnStickyWall = this.sprite.body.onStickyWall;
					this.previousFacing = this.facing;
					
				return false;
			}
		
		/*
		* Get Absolute value of each velocity direction
		* @return false
		*/
			changeFacing(leftRight)
			{
				
				this.facing = leftRight;										//facing
				this.sprite.body.dirAdj = (this.facing === true) ? 1 : -1; 		//set Dir for subsequent potential operations
				
				//flip the X offset of point if x offset not 0
				if(this.sprite.body.pointOffset.x !== 0){
					this.sprite.body.pointOffset.x = (this.facing === true) ? Math.abs(this.sprite.body.pointOffset.x) : -Math.abs(this.sprite.body.pointOffset.x);
				}
				
				return false
				
			}
			
			resetOrigin(){
				this.sprite.setOrigin(this.origin.x,this.origin.y);				//reset origin
			}
			
			resetAngle(){
				this.sprite.angle = 0;
			}
		
	//end movement functions
	
	//utility functions
	
		/*
		* Main player update function, dealing with movement and animation switching
		* @return false
		*/
			update(timeNow)
			{				
				
				//first set absolute velocities and direction adjustment
					this.setMovementProps(timeNow);
					
				//work out movement based on cursors
				
					//if neither direction or both directions down, then slow down x movement regardless of jumping or not
						if ( 
							(this.cursors.left.isDown && this.cursors.right.isDown) || 
							(this.cursors.left.isUp && this.cursors.right.isUp)
						){
							this.ramp(false);
						}
					
					//left
						if (
							this.cursors.left.isDown && 
							this.cursors.right.isUp
						){
							this.changeFacing(false);
							this.ramp(true);									//ramp up & move
						}
						
					//right
						if (
							this.cursors.right.isDown && 
							this.cursors.left.isUp
						){
							this.changeFacing(true);
							this.ramp(true);									//ramp up & move
						}
						
					//sticky walls
						if(this.sprite.body.hanging){
							this.sprite.body.velocity.y = 0;
						}
					
					//jump from ground		
						//using above, can they jump?					
							if (
								this.cursors.up.isDown && 							//up key held
								(this.sprite.body.onGround || this.canJumpEdge) && 	//on the ground, or just left it
								!this.jumping && 									//not already jumping
								!this.sprite.body.hanging							//not hanging on a wall
							){
								this.sprite.body.onGround = false;					//manually set onground to allow gravity to kick in
								this.sprite.body.velMult = 1;						//manually set velMult back to normal if jumping.
								this.sprite.body.velocity.y = this.jumpVel;			//add negative vert vel
								this.jumping = true;								//set jumping switch
							}
						
						//hop
							if (
								this.hopSwitch &&									//global hop switch
								this.cursors.up.isDown && 							//up key pressed
								(this.jumping || this.sprite.body.hanging) && 		//already jumping / or hanging
								(!this.hopping || this.sprite.body.hanging) &&		//not already hopping, except when hanging
								this.canHop											//set to be able to hop
							){
								this.jumping = true;								//in case it's a hop of a wall
								this.sprite.body.velocity.y = this.jumpVel;			//add another negative vert vel
								this.hopping = true;								//set hopping switch
								this.hopSpinning = true;							//set hop spin switch for animation
								this.canHop = false;								//set can hop to false so hops don't repeat
								
								//if hanging, then perform a hang hop
									if(this.sprite.body.hanging){
										this.sprite.body.hanging = false;			//stop hanging
										this.wallHopping = true;					//set wall hopping
										this.changeFacing(!this.facing);			//swap direction
										this.sprite.body.velocity.x = this.maxVelX*this.wallJumpXMult*this.sprite.body.dirAdj; 	//make vel x hopping vel
									}
								
							}
						
						//touched down, reset jump and hop, but only after lifting up key
							if (this.cursors.up.isUp && this.sprite.body.onGround){
								this.jumping = false;								//set not jumping
								this.hopping = false;								//set not hopping
								this.hopSpinning = false;							//set not hopSpinning
								this.canHop = false;								//set can hop to false so hops aren't before normal jumps
							}
							
							if(this.sprite.body.onGround){
								this.wallHopping = false;							//set wall hopping back to false
							}
					
						//set can hop
							if(
								(
									this.cursors.up.isUp && 						//up key not pressed
									!this.sprite.body.onGround && 					//not on the ground
									this.jumping && 								//are jumping
									!this.hopping									//not already hopping
								) ||
								(
									this.sprite.body.hanging && 					//are hanging
									this.cursors.up.isUp							//but up key is not pressed
								)
							){
								this.canHop = true;									//set can hop if in the air for second up key  press
							}
					
						//short and long jumps, set gravity to higher than normal if lift off up key
							if((this.cursors.up.isDown && this.jumping) && this.sprite.body.velocity.y < 0){
								this.sprite.body.gravityFactor = 1;
							} else {
								this.sprite.body.gravityFactor = this.gravityMulti; //most of the time this, so falling from ledges is at faster rate if just walked off
							}
				
				//limit falling speed
					if(this.sprite.body.velocity.y > this.terminalVel){
						this.sprite.body.velocity.y = this.terminalVel;
					}
				
				//animations
				
					//on ground / platform
						if(this.sprite.body.onGround){
							
							if(this.absVelX > 0 && (this.cursors.left.isDown || this.cursors.right.isDown)){
								this.sprite.anims.play('run', true);
							} else {
								this.sprite.anims.play('stand');
							}
							
						} 
						
					//in air	
						else {
							
							this.resetAngle();
						
							if(this.sprite.body.hanging){
								
									this.hopSpinning = false;
								//play hanging anim
									this.sprite.anims.play('jump', true);
								
							} else if(this.hopping == true){
								
								//play ball anim until landed
									this.sprite.anims.play('ball', true);
								
							} else {
								
								this.sprite.anims.play('jump', true);
								
							}
							
						}
					
					//animations flipper
						this.sprite.flipX = !this.facing;
				
				return false;
				
			}
		
	//end utility functions
	
}

