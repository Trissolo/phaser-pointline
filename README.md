# Phaser Point-Line 
A simple movement / physics system built for Phaser 3 based on points and lines

Usage: Simply instantiate the object at the start of your create() function. For Debug drawing to work correctly, the graphics object must be created at the end of your create() function:

```
create(){
   this.pointLine = new Pointline(this, gravity, debug);
   
   //add a dynamic body (with sprite)
      this.player.sprite = this.pointLine.addSprite(
         this.xInit,  	                                          //initial world X value
         this.yInit, 	                                          //initial word y value
         2.5, 				                                          //wdith / 2 of bounding box
         'player', 		                                          //which sprite from loaded adssets
         0, 				                                          //X offset of body point
         0				                                             //y offset of body point
      );
      
  //add a line
      let floor = this.pointLine.addLine({
         type : 'ground',                                         //could be 'wall' or 'platform' or 'slope'
         coords : {x1:0, y1:-7},                                  //coords of first point (leftmost or bottom most)
         length : 1000,                                           //or height for walls
         checkDirections : {checkUp:true, checkDown:false},       //checkLeft or checkRight for walls
         velMult : 1                                              //how fast do objects move on this (ground / platforms / slopes only
      });
   
   //world collisions
      this.pointLine.addWorldCollider(0,0,1000,160);             //world boundaries
      this.pointLine.addToWorldCollider([this.player.sprite]);   //add player to world collider

   //player collisions
      this.pointLine.addCollider('lines', this.player.sprite);   //add a collider for the player sprite
      this.pointLine.addToCollider('lines',floor);               //add the floor to that collider, also accepts array of lines
   
   /*
   * Everything else
   */
   
   this.pointLine.gfx = this.add.graphics();
}

```
