# phaser-pointline
A simple movement / physics system built for Phaser 3 based on points and lines

Usage: Simply instantiate the object at the start of your create() function. For Debug drawing to work correctly, the graphics object must be created at the end of your create() function:

```
create(){
   this.pointLine = new Pointline(this, gravity, debug);
   
   /*
   * Everything else
   */
   
   this.pointLine.gfx = this.add.graphics();
}

```
