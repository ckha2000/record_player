# COM SCI 174A Final Project

### Project Overview

Our project is separated into two components:
* Record player simulation
* Target shooting game
  * Shooting a target awards 12 points
  * The player has a maximum of 3 shots which recharge over time
  * The player also expends 2 points per shot
  * Projectiles will break upon hitting a target and create a realistic shattering effect with particles affected by gravity
  * Projectiles will not break upon hitting a wall and instead correctly ricochet
  * Game over if projectile hits the player or time runs out
  * Score 100 points to win
Note: The player may switch between third and first person cameras to make shooting targets easier

### Team Members and Contributions

* Joshua Young
   * Implemented collision detection and object physics
   * Implemented game mechanics for firing projectiles, spawning targets, and shattering targets/projectiles
   * Implemented game time, points system, and first/third person camera switching
* Christopher Kha
* Miles Kang
   * Implemented record player functions (needle locking/unlocking, needle rotation, volume controls, etc.)
   * Created the record player object as an obj file using Maya.
   * Implemented the transition animation sequence, with the falling disk and the needle moving/scaling.
   * Implemented dynamic key triggered button controls in both the record simulation and game.
   * Composed the music and the sound effects.

### References

 * https://github.com/encyclopedia-of-code/tiny-graphics-js
