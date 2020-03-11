# COM SCI 174A Final Project

### Project Overview

Our project is separated into two components:
* Record player simulation
  * Basic controls: needle unlocking, needle rotating, disk spinning, volume adjusting
  * Music will only play when the needle is touching the disk and when the disk is spinning
  * Two different songs will play depending on the position of the needle
  * Smash button to transition to target shooting game with realistic disk shattering effect
* Target shooting game
  * Use ‘w’/‘a’/ ‘s’/ ‘d’ controls to move the tank left, right, up and down. 
  * Rotate its cannon left and right using ‘q’ and ‘e’
  * Shoot small disks with the space bar
  * Shooting a target awards 12 points
  * The player has a maximum of 3 shots which recharge over time
  * The player also expends 2 points per shot
  * Projectiles will break upon hitting a target and create a realistic shattering effect with particles affected by gravity
  * Projectiles will not break upon hitting a wall and instead correctly ricochet
  * Targets respawn randomly with no overlap
  * Game over if projectile hits the player or time runs out
  * Score 100 points to win
Note: The player may switch between third and first person cameras to make shooting targets easier

### Team Members and Contributions

* Joshua Young
   * Implemented collision detection and object physics
   * Implemented game mechanics for firing projectiles, spawning targets, and shattering targets/projectiles
   * Implemented game time, points system, and first/third person camera switching
* Christopher Kha
   * Created all textures
   * Created disk and needle objects
   * Implemented customization on disk object based on shapes of revolution to generate fragments
   * Debugged issues with Javascript audio
* Miles Kang
   * Implemented record player functions (needle locking/unlocking, needle rotation, volume controls, etc.)
   * Created the record player object as an obj file using Maya.
   * Implemented the transition animation sequence, with the falling disk and the needle moving/scaling.
   * Implemented dynamic key triggered button controls in both the record simulation and game.
   * Composed the music and the sound effects.

### References

 * https://github.com/encyclopedia-of-code/tiny-graphics-js
