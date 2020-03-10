window.Record_Player_Simulator = window.classes.Record_Player_Simulator =
    class Record_Player_Simulator extends Simulation {
        constructor(context, control_box) {
            // The scene begins by requesting the camera, shapes, and materials it will need.
            super(context, control_box);
            // First, include a secondary Scene that provides movement controls:
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            const r = context.width / context.height;
            context.globals.graphics_state.camera_transform = Mat4.translation([0, -2, -15]).times(Mat4.rotation(1.5, Vec.of(1,0,0)));  // Locate the camera here (inverted matrix).
            this.attached = () => Mat4.translation([0, 1.8, 5]).times(Mat4.rotation(-.2, Vec.of(1,0,0)));
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);


            const shapes = {
                'box': new Square(),
                'cube': new Cube(),
                'record_player': new Shape_From_File("assets/record_player.obj"),
                'button': new Shape_From_File("assets/cube.obj"),
                'needle': new Needle(),
                'disk': new Disk_Frag(30, 1),
                'disk_frag': new Disk_Frag(30, 6),
                
            };

            // At the beginning of our program, load one of each of these shape
            // definitions onto the GPU.  NOTE:  Only do this ONCE per shape
            // design.  Once you've told the GPU what the design of a cube is,
            // it would be redundant to tell it again.  You should just re-use
            // the one called "box" more than once in display() to draw
            // multiple cubes.  Don't define more than one blueprint for the
            // same thing here.
            this.submit_shapes(context, shapes);

            // Make some Material objects available to you:
            this.materials =
            {
                phong_primary: context.get_instance( Phong_Shader ).material( Color.of(.8, .15, .25, 1)),
                phong_secondary: context.get_instance( Phong_Shader ).material( Color.of(.2, .9, .5, 1)),
                grey_texture: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ) , {ambient: 0.9, texture:context.get_instance( "assets/slider_tex.jpg", false )}),
                record_tex: context.get_instance( Phong_Shader).material(Color.of(0,0,0,1), {ambient: 1, specularity: .9, texture:context.get_instance("assets/record_tex.jpg", false)}),
                clear: context.get_instance( Phong_Shader ).material( Color.of(0, 0, 0, 0) ),
                record_tex2: context.get_instance( Phong_Shader).material(Color.of(0,0,0,1), {ambient: 1, specularity: 1.0, texture:context.get_instance("assets/record_tex2.jpg", false)}),
                wall_tex: context.get_instance( Phong_Shader ).material(Color.of(0,0,0,1), {ambient: 1, specularity: 0.5, texture: context.get_instance("assets/wall_tex.jpg", false)}),
                ceiling: context.get_instance( Phong_Shader ).material(Color.of(153/255,121/255,82/255,1), {ambient: 0.4, specularity: 0.5}),
                floor: context.get_instance( Phong_Shader ).material(Color.of(92/255,60/255,45/255,1), {ambient: 0.4, specularity: 0.5}),
                back_wall_tex: context.get_instance( Phong_Shader ).material(Color.of(0,0,0,1), {ambient: 1, specularity: 0.5, texture: context.get_instance("assets/back_wall_tex.jpg", false)}),
                target: context.get_instance( Phong_Shader ).material(Color.of(0,0,0,1), {ambient: 1, specularity: 0.5, texture: context.get_instance("assets/music_note.jpg", false)}),
                game_over: context.get_instance( Phong_Shader ).material(Color.of(0,0,0,1), {ambient: 1, specularity: 0.5, texture: context.get_instance("assets/game_over_tex.jpg", false)}),
            }

            this.default = context.get_instance(Phong_Shader).material(Color.of(1,1,1,1));
            this.lights = [new Light(Vec.of(20, 20, 45, 1), Color.of(1, 1, 1, 1), 40000), new Light(Vec.of(10, 37, -35, 1), Color.of(1, 1, 1, 1), 40000)];

            // MUSIC-RELATED PROPS
            this.music = new Audio();

            this.song1_path = "assets/audio/music.wav";
            this.song2_path =  "assets/audio/music2.wav";
            this.transition_path = "assets/audio/transition.wav";
            this.boss_music_path = "assets/audio/boss_music.wav";
            this.game_over_path = "assets/audio/victory.wav";

            this.break_sound = document.getElementById("break_sound");
            this.slide_sound = document.getElementById("slide_sound");
            this.start_sound = document.getElementById("start_sound");
            this.shoot_sound = document.getElementById("shoot_sound");
            this.needl_sound = document.getElementById("needl_sound");
            this.point_sound = document.getElementById("point_sound");
            this.break_sound.volume = .5;

            this.btn_z = 0;

            this.slider_pos = 1;

            // game transitioning?
            this.game_transitioning = false;

            // Transition animation parameters.
            this.disk_fall_pos = 30;
            this.fall_factor = 0.49;
            this.needle_transitioning = false;
            this.needle_x = 0;
            this.needle_y = 0;
            this.needle_z = 0;
            this.needle_scale_factor = 1.0;
            this.needle_rising = false;
            this.needle_translating = false;
            this.needle_falling = false;
            this.needle_scaling = false;

            // game started?
            this.broken = false;
            // game over?
            this.game_over = false;
            this.lost_game = false;

            this.tank_transform = Mat4.translation([0,0.3,0]).times(Mat4.identity());
            this.aim_transform = this.tank_transform.times(Mat4.translation(Vec.of(0, 1, 10)));

            // Fixed transforms.
            this.player_transform = Mat4.scale([2, 2, 2]);
            this.sliderbox_transform = Mat4.translation([2, -0.48, 3.47]).times(Mat4.scale([0.6, 0.25, 0.25]));

            // NEEDLE ROTATION.
            this.needle_vertical_pos = 0.2;
            this.needle_locking = 0;
            this.needle_rotation_angle = 0;
            this.needle_rotation_locked = true;
            this.needle_rotation_speed = 1;
            this.song_angle = 5;
            this.song_angle_two = 8;
            this.needle_left = false;
            this.needle_right = false;
            this.needle_prev_rot = 0;

            // RECORD ROTATION.
            this.record_spinning = false;
            this.record_rotation_speed = 1;             // rev/sec
            this.record_rotation_angle = 0;

            // PHYSICS RELATED OBJECTS
            this.num_targets = 0;
            this.target_locations = new Array(30).fill(false).map(() => new Array(20).fill(false));
            this.spawn_timer = 0;
            this.aabb = {
                'cube': [Vec.of(-1, -1, -1), Vec.of(1, 1, 1)],
                'sphere': [Vec.of(-1, -1, -1), Vec.of(1, 1, 1)],
                'disk': [Vec.of(-1, -0.05, -1), Vec.of(1, 0.05, 1)],
            }
            this.num_shots = 3;
            this.shot_recharge = 0;
            this.points = 0;
            this.remaining_time = 300;
            this.start_game = false;
            this.third_person = true;
                      
            this.room_length = 50;
            this.room_height = 20;
            this.room_width = 30;  

            // right wall   
            this.bodies.push(new Wall(this.shapes.cube, this.materials.wall_tex, Vec.of(1, this.room_height, this.room_length), this.aabb.cube, Vec.of(1, 0, 0))
                       .emplace(Mat4.translation(Vec.of(-31, 18, 45)), Vec.of(0, 0, 0), 0));
            // left wall
            this.bodies.push(new Wall(this.shapes.cube, this.materials.wall_tex, Vec.of(1, this.room_height, this.room_length), this.aabb.cube, Vec.of(-1, 0, 0))
                       .emplace(Mat4.translation(Vec.of(31, 18, 45)), Vec.of(0, 0, 0), 0));
            // back wall
            this.bodies.push(new Wall(this.shapes.cube, this.materials.back_wall_tex, Vec.of(this.room_width, this.room_height, 1), this.aabb.cube, Vec.of(0, 0, -1))
                       .emplace(Mat4.translation(Vec.of(0, 18, 95)), Vec.of(0, 0, 0), 0));
            // floor
            this.bodies.push(new Wall(this.shapes.cube, this.materials.floor, Vec.of(this.room_width, 1, this.room_length), this.aabb.cube, Vec.of(0, 1, 0))
                       .emplace(Mat4.translation(Vec.of(0, -2, 45)), Vec.of(0, 0, 0), 0));
            // ceiling
            this.bodies.push(new Wall(this.shapes.cube, this.materials.ceiling, Vec.of(this.room_width, 1, this.room_length), this.aabb.cube, Vec.of(0, -1, 0))
                       .emplace(Mat4.translation(Vec.of(0, 38, 45)), Vec.of(0, 0, 0), 0));
        }



        // MUSIC-RELATED FUNCTIONS

        play_music() {
            if (this.broken && this.record_spinning) {
                this.music.src = this.boss_music_path;
                this.music.play();
            }
            else if (this.broken && !this.record_spinning) {
                this.music.pause();
                this.music.currentTime = 0;
                this.music.src = "";
                return;
            }
            else if (!this.record_spinning || !this.needle_rotation_locked) {
                this.music.pause();
                this.music.currentTime = 0;
                this.music.src = "";
                return;
            }
            else {
                if (this.needle_rotation_angle === this.song_angle) {
                    this.music.src = this.song1_path;
                    this.music.play();
                }
                if (this.needle_rotation_angle === this.song_angle_two) {
                    this.music.src = this.song2_path;
                    this.music.play();
                }
            }
        }

        spin_disk() {
            this.start_sound.play();
            this.record_spinning = !this.record_spinning;
            this.play_music();
        }

        lower_volume() {   
            if (this.music.volume > .1) {
                this.slide_sound.play();
                this.music.volume -= .1;
                this.music.volume -= .1;
            }
            let vol = Math.floor(this.music.volume * 10) / 10;
            this.slider_pos = vol;
            document.getElementById("volume").textContent = "VOLUME: " + vol.toFixed(1);
        }

        raise_volume() {
            if (this.music.volume < 1) {
                this.slide_sound.play();
                this.music.volume += .1;
                this.music.volume += .1;
            }
            let vol = Math.floor(this.music.volume * 10) / 10;
            this.slider_pos = vol;
            document.getElementById("volume").textContent = "VOLUME: " + vol.toFixed(1);
        }

        break_stuff () {
            if (this.broken) {
                return;
            }

            this.music.pause();
            this.music.currentTime = 0;
            this.music.src = "";

            this.music.src = this.transition_path;
            this.music.play();

            this.record_spinning = false;
            this.break_sound.play();

            this.attached = () => this.tank_transform.times(Mat4.translation([0, 9, -18]).times(Mat4.rotation(Math.PI, Vec.of(0,1,0.07))));
            this.game_transitioning = true;
            this.needle_rising = true;

            // change buttons.
            this.hide_button("rotation", true);
            this.hide_button("p", false);
            this.hide_button("b", false);
            this.hide_button("n", true);
            this.hide_button("m", true);
            this.hide_button("r", true);

            this.step_size = .18;
            this.moving_forward = false;
            this.moving_left = false;
            this.moving_back = false;
            this.moving_right = false;
            this.rotating_left = false;
            this.rotating_right = false;
            
            this.record_spinning = true;

            this.spawn_targets();
        }

        add_game_buttons() {
            document.getElementById("p").style.opacity = "1";
            document.getElementById("p").style.cursor = "pointer";

            const scoreText = document.createElement("span");
            scoreText.id = "score";
            scoreText.textContent = "SCORE: " + this.points + " (100 TO WIN) ";
            const shotsText = document.createElement("span");
            shotsText.id = "shots";
            shotsText.textContent = "SHOTS REMAINING: " + this.num_shots;
            const timerText = document.createElement("span");
            timerText.id = "timer";
            timerText.textContent = "TIME LEFT: " + (Math.round((this.remaining_time / 10) * 100) / 100);
            this.control_panel.appendChild(scoreText);
            this.new_line();
            this.control_panel.appendChild(shotsText);
            this.new_line();
            this.control_panel.appendChild(timerText);

            this.new_line();
            this.new_line();
            this.key_triggered_button("SHOOT", [" "], this.shoot_item);
            this.key_triggered_button("CHANGE VIEW", ["t"], () => this.third_person = !this.third_person);
            this.new_line();
            this.new_line();
            this.key_triggered_button("Aim Left", ["q"], () => this.rotating_left = true, undefined, () => this.rotating_left = false);
            this.key_triggered_button("W", ["w"], () => this.moving_forward = true, undefined, () => this.moving_forward = false);
            this.key_triggered_button("Aim Right", ["e"], () => this.rotating_right = true, undefined, () => this.rotating_right = false);
            this.new_line();
            this.key_triggered_button("A", ["a"], () => this.moving_left = true, undefined, () => this.moving_left = false);
            this.key_triggered_button("S", ["s"], () => this.moving_back = true, undefined, () => this.moving_back = false);
            this.key_triggered_button("D", ["d"], () => this.moving_right = true, undefined, () => this.moving_right = false);
            this.new_line();
            this.new_line();
            
        }

        hide_button(id, remove) {
            if (remove) {
                document.getElementById(id).style.display = "none";
            }
            else {
                document.getElementById(id).style.opacity = "0";
                document.getElementById(id).style.cursor = "auto";
            }
        }

        needle_rotation_lock() {
            this.start_sound.play();
            this.needle_rotation_locked = !this.needle_rotation_locked;
            if (this.needle_rotation_locked) {
                this.needle_locking = 1;
                document.getElementById("rotation").textContent = "Needle Rotation: Locked";   
            } else {
                this.needle_locking = 2;
                document.getElementById("rotation").textContent = "Needle Rotation: Unlocked";
            }
            this.play_music();
        }

        needle_rotate_left() {
            if(!this.needle_rotation_locked) {
                this.needl_sound.currentTime = 0;
                this.needl_sound.play();
                this.needle_left = true;
                this.needle_right = false;      
            }
        }

        needle_rotate_right() {
            if(!this.needle_rotation_locked) {
                this.needl_sound.currentTime = 0;
                this.needl_sound.play();
                this.needle_right = true;   
                this.needle_left = false;  
            }
        }

        // SHOOTS A THING
        shoot_item() {
            if (this.num_shots === 0)
                return;

            this.shoot_sound.currentTime = 0;
            this.shoot_sound.play();

            this.points -= 2;
            document.getElementById("score").textContent = "SCORE: " + this.points + (" (100 TO WIN) ");  

            let direction = Vec.of(this.aim_transform[0][3] - this.tank_transform[0][3],
                                   this.aim_transform[1][3] - (this.tank_transform[1][3] + 1),
                                   this.aim_transform[2][3] - this.tank_transform[2][3]);
            
            let norm_dir = direction.normalized();
            let x_rot = Math.atan(norm_dir[1] / norm_dir[2]);
            let y_rot = Math.atan(norm_dir[0] / norm_dir[2]);

            let proj_transform = Mat4.translation(Vec.of(this.aim_transform[0][3], this.aim_transform[1][3], this.aim_transform[2][3]))
                                     .times(Mat4.rotation(-x_rot, Vec.of(1, 0, 0))
                                     .times(Mat4.rotation(y_rot, Vec.of(0, 1, 0))));


            this.bodies.push(new Projectile(this.shapes.disk, this.materials.record_tex2, Vec.of(1, 1, 1), this.aabb.disk)
                       .emplace(proj_transform, norm_dir.times(4), 0));

            this.num_shots -= 1;
            document.getElementById("shots").textContent = "SHOTS REMAINING: " + this.num_shots;
        }

        // MAKES THE TARGETS
        spawn_targets() {
                while ( this.num_targets < 20 ) {
                        let target_location = [Math.floor(Math.random() * 30), Math.floor(Math.random() * 20)];
                        if (!this.target_locations[target_location[0]][target_location[1]])
                        {
                                this.bodies.push(new Target(this.shapes.cube, this.materials.target, Vec.of(1, 1, 1), this.aabb.cube)
                                            .emplace(Mat4.translation([-15 + target_location[0], 5 + target_location[1], 45 + Math.floor(Math.random() * 20)]),
                                            Vec.of(0, 0, 0), 0));
                                this.target_locations[target_location[0]][target_location[1]] = true;
                                this.num_targets += 1
                        }

                }
        }

        end_game() {
            this.game_over = true;
            this.attached = () => Mat4.translation([0,15,-15]);

            this.hide_button("volume", true);
            this.hide_button("-", true);
            this.hide_button("=", true);
            this.hide_button("p", true);
            this.hide_button("b", true);
            this.hide_button("shots", true);
            this.hide_button("timer", true);
            this.hide_button(" ", true);
            this.hide_button("q", true);
            this.hide_button("w", true);
            this.hide_button("e", true);
            this.hide_button("a", true);
            this.hide_button("s", true);
            this.hide_button("d", true);
            this.hide_button("t", true);

            const gameOverText = document.createElement("span");
            gameOverText.id = "game_over";
            if (this.lost_game)
                gameOverText.textContent = "GAME OVER. REFRESH TO RESTART.";
            else
                gameOverText.textContent = "YOU WON! REFRESH TO RESTART.";
            const game_over_panel = this.control_panel.appendChild(gameOverText);

            this.music.pause();
            this.music.currentTime = 0;
            this.music.loop = false;
            this.music.src = "";
            this.music.src = this.game_over_path;
            this.music.play();
        }

        make_control_panel()             // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        {
            // A button to control the music.
            this.key_triggered_button("Spin Disk", ["p"], this.spin_disk);
            // this.control_panel.innerHTML += "<br><br>";
            this.key_triggered_button("-", ["-"], this.lower_volume);

            const volumeText = document.createElement("span");
            volumeText.id = "volume";
            volumeText.textContent = "VOLUME: " + this.music.volume.toFixed(1);
            const vol_controls = this.control_panel.appendChild(volumeText);
            vol_controls.style.margin = "5px";

            this.key_triggered_button("+", ["="], this.raise_volume);
            this.key_triggered_button("Smash", ["b"], this.break_stuff);
            this.new_line();
            this.new_line();

            const rotationText = document.createElement("span");
            rotationText.id = "rotation";
            rotationText.textContent = "Needle Rotation: Locked";
            const rot_controls = this.control_panel.appendChild(rotationText);
            rot_controls.style.margin = "5px";
            this.new_line();

            this.key_triggered_button("Rotate Left", ["n"], this.needle_rotate_left);
            this.key_triggered_button("Rotate Right", ["m"], this.needle_rotate_right);
            this.key_triggered_button("(Un)lock Rotation", ["r"], this.needle_rotation_lock);
        }

        update_state(dt) {

            for( let a of this.bodies )
            {
                if (a.moveable)
                    a.linear_velocity[1] += dt * -0.25;

                this.bodies = this.bodies.filter( o => o.drawn_location[2][3] > -25 && o.drawn_location[1][3] > -20); 
                
                if( a.linear_velocity.norm() == 0 )
                    continue;
                                                              // *** Collision process is here ***
                                                              // Loop through all bodies again (call each "b"):
                for( let b of this.bodies )                                      
                {
                    if( !a.check_if_colliding( b ) )
                      continue;
                                                  // If we get here, we collided
                    a.perform_action( b );

                    if (b.breakable && a.breakable && b.linear_velocity.norm() == 0) {
                      this.target_locations[Math.round(b.center[0] + 15)][Math.round(b.center[1] - 5)] = false;
                      this.point_sound.play();

                      this.bodies.push(new Target_Frag(this.shapes.cube, this.materials.phong_primary, Vec.of(0.25, 0.25, 0.25), this.aabb.cube)
                                 .emplace(b.drawn_location.times(Mat4.translation([0.5, 0.5, 0.5])), Vec.of(0, 0, 1).randomized(3), Math.random()));
                      this.bodies.push(new Target_Frag(this.shapes.cube, this.materials.phong_primary, Vec.of(0.25, 0.25, 0.25), this.aabb.cube)
                                 .emplace(b.drawn_location.times(Mat4.translation([-0.5, 0.5, 0.5])), Vec.of(0, 0, 1).randomized(3), Math.random()));
                      this.bodies.push(new Target_Frag(this.shapes.cube, this.materials.phong_primary, Vec.of(0.25, 0.25, 0.25), this.aabb.cube)
                                 .emplace(b.drawn_location.times(Mat4.translation([0.5, 0.5, -0.5])), Vec.of(0, 0, 1).randomized(3), Math.random()));
                      this.bodies.push(new Target_Frag(this.shapes.cube, this.materials.phong_primary, Vec.of(0.25, 0.25, 0.25), this.aabb.cube)
                                 .emplace(b.drawn_location.times(Mat4.translation([-0.5, 0.5, -0.5])), Vec.of(0, 0, 1).randomized(3), Math.random()));
                      this.bodies.push(new Target_Frag(this.shapes.cube, this.materials.phong_primary, Vec.of(0.25, 0.25, 0.25), this.aabb.cube)
                                 .emplace(b.drawn_location.times(Mat4.translation([0.5, -0.5, 0.5])), Vec.of(0, 0, 1).randomized(3), Math.random()));
                      this.bodies.push(new Target_Frag(this.shapes.cube, this.materials.phong_primary, Vec.of(0.25, 0.25, 0.25), this.aabb.cube)
                                 .emplace(b.drawn_location.times(Mat4.translation([-0.5, -0.5, 0.5])), Vec.of(0, 0, 1).randomized(3), Math.random()));
                      this.bodies.push(new Target_Frag(this.shapes.cube, this.materials.phong_primary, Vec.of(0.25, 0.25, 0.25), this.aabb.cube)
                                 .emplace(b.drawn_location.times(Mat4.translation([0.5, -0.5, -0.5])), Vec.of(0, 0, 1).randomized(3), Math.random()));
                      this.bodies.push(new Target_Frag(this.shapes.cube, this.materials.phong_primary, Vec.of(0.25, 0.25, 0.25), this.aabb.cube)
                                 .emplace(b.drawn_location.times(Mat4.translation([-0.5, -0.5, -0.5])), Vec.of(0, 0, 1).randomized(3), Math.random()));
                      
                      for (let i = 0; i < 6; i++) {
                          this.bodies.push(new Frag(this.shapes.disk_frag, this.materials.record_tex2, Vec.of(1, 1, 1), this.aabb.disk)
                                     .emplace(b.drawn_location.times(Mat4.rotation((i / 6) * 2 * Math.PI, Vec.of(0, 1, 0))), 
                                     Vec.of(0 , 0, 1).randomized(3), Math.random()));
                      }
                      
                      if (!this.game_over) {
                          this.points += 12;
                          document.getElementById("score").textContent = "SCORE: " + this.points + (" (100 TO WIN) ");  
                          if (this.points >= 100) {
                            this.points = 100;
                            document.getElementById("score").textContent = "SCORE: " + this.points + (" (100 TO WIN) ")
                            this.bodies = [];
                            this.end_game();
                      }   
                      }
                      
                      this.num_targets -= 1;
                      this.bodies = this.bodies.filter( o => o != b && o != a);
                    }

                    if (!a.breakable && !b.breakable && a.linear_velocity.norm() == 0)
                      this.bodies = this.bodies.filter(o => o != a);
                }

                if(a.breakable) {
                    let a_min_aabb = a.drawn_location.times( a.aabb[0].to4(1) ).to3();
                    let a_max_aabb = a.drawn_location.times( a.aabb[1].to4(1) ).to3();

                    let b_min_aabb = this.tank_transform.times( Vec.of(-1, -1, -1, 1) ).to3();
                    let b_max_aabb = this.tank_transform.times( Vec.of(1, 1.5, 1, 1) ).to3();

                                              // Check for intersections on the three axes          
                    if ( a_max_aabb[0] < b_min_aabb[0] || a_min_aabb[0] > b_max_aabb[0] ) continue; 
                    if ( a_max_aabb[1] < b_min_aabb[1] || a_min_aabb[1] > b_max_aabb[1] ) continue; 
                    if ( a_max_aabb[2] < b_min_aabb[2] || a_min_aabb[2] > b_max_aabb[2] ) continue; 
                    
                    if(!this.game_over) {
                          this.bodies = [];
                          this.lost_game = true;
                          this.end_game();  
                    }        
                }
            }    

            if(this.start_game) {
                    this.spawn_timer += dt;
                    this.shot_recharge += dt;
                    this.remaining_time -= dt;
                    if (this.remaining_time <= 0)
                        this.remaining_time = 0;
                    document.getElementById("timer").textContent = "TIME LEFT: "  + (Math.round((this.remaining_time / 10) * 100) / 100);
            }

            if(this.spawn_timer > 50) {
                    this.spawn_targets();
                    this.spawn_timer = 0;
            }

            if(this.shot_recharge > 8) {
                    if (this.num_shots < 3) {
                        this.num_shots += 1;
                        document.getElementById("shots").textContent = "SHOTS REMAINING: " + this.num_shots;
                    }

                    this.shot_recharge = 0;
            }

            if(this.remaining_time <= 0 && !this.game_over) {
                    this.bodies = [];
                    this.lost_game = true;
                    this.end_game(); 
            }
        }

        display(graphics_state) {
            super.display(graphics_state);
            graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
            const t = this.t = graphics_state.animation_time / 1000;
            const dt = graphics_state.animation_delta_time /1000;

            if (this.attached !== undefined) {
                    if (!this.game_over && this.third_person && this.broken)
                        this.attached = () => this.tank_transform.times(Mat4.translation([0, 9, -18]).times(Mat4.rotation(Math.PI, Vec.of(0,1,0.07))));
                    else if (!this.game_over && this.broken) 
                        this.attached = () => this.aim_transform.times(Mat4.rotation(Math.PI, Vec.of(0,1,0.07)));
                    
                    let desired = Mat4.inverse(this.attached().times(Mat4.translation([0, 0, 5])));
                    if (this.third_person || this.game_over)
                        graphics_state.camera_transform = desired.map((x, i) => Vec.from(graphics_state.camera_transform[i]).mix(x, 0.04));
                    else
                        graphics_state.camera_transform = desired;     
            }

            if (!this.game_over) {
                // Button transform when pressed.
                let btn_transform = Mat4.translation([0, -0.48, 3.45 + this.btn_z]).times(Mat4.scale([0.3, 0.3, 0.3]));
                if (this.record_spinning && this.btn_z > -0.09) {
                    switch(this.btn_z) {
                        case -.09:
                            break;
                        case -.06:
                            this.btn_z = -.09;
                            break;
                        case -.03:
                            this.btn_z = -.06;
                            break;
                        case 0:
                            this.btn_z = -.03;
                            break;
                    }
                }
                else if (this.record_spinning === false && this.btn_z < 0) {
                    switch(this.btn_z) {
                        case 0:
                            break;
                        case -.03:
                            this.btn_z = 0;
                            break;
                        case -.06:
                            this.btn_z = -.03;
                            break;
                        case -.09:
                            this.btn_z = -.06;
                            break;
                    }
                }

                // Knob transform when volume is adjusted.
                let slider_transform = Mat4.translation([1.5 + (this.slider_pos), -0.48, 3.45]).times(Mat4.scale([0.075, 0.3, 0.3]));

                // Needle transform when record player is started/stopped.
                
                if (this.needle_locking === 1 && !this.broken) {
                    this.needle_vertical_pos -= 0.04;
                    if (this.needle_vertical_pos <= 0.2) {
                        this.needle_vertical_pos = 0.2;
                    }
                }
                if (this.needle_locking === 2 && !this.broken) {
                    this.needle_vertical_pos += 0.04;
                    if (this.needle_vertical_pos >= 0.28) {
                        this.needle_vertical_pos = 0.28;
                    }
                }

                if (this.needle_left && !this.broken) {
                    if ((this.needle_rotation_angle + this.needle_rotation_speed) <= this.song_angle) {
                        this.needle_rotation_angle += this.needle_rotation_speed;
                        if (this.needle_rotation_angle >= this.song_angle) {
                            this.needle_rotation_angle = this.song_angle;
                            this.needle_left = false;
                        }
                    }
                    else if ((this.needle_rotation_angle + this.needle_rotation_speed) <= this.song_angle_two) {
                        this.needle_rotation_angle += this.needle_rotation_speed;
                        if (this.needle_rotation_angle >= this.song_angle_two) {
                            this.needle_rotation_angle = this.song_angle_two;
                            this.needle_left = false;
                        }
                    }
                }
                if (this.needle_right && !this.broken) {
                    if ((this.needle_rotation_angle - this.needle_rotation_speed) >= this.song_angle) {
                        this.needle_rotation_angle -= this.needle_rotation_speed;
                        if (this.needle_rotation_angle <= this.song_angle) {
                            this.needle_rotation_angle = this.song_angle;
                            this.needle_right = false;
                        }
                    }
                    else if ((this.needle_rotation_angle - this.needle_rotation_speed) >= 0) {
                        this.needle_rotation_angle -= this.needle_rotation_speed;
                        if (this.needle_rotation_angle <= 0) {
                            this.needle_rotation_angle = 0.0;
                            this.needle_right = false;
                        }
                    }
                }
                let needle_rotation = Mat4.rotation(this.needle_rotation_angle * .05, Vec.of(0,-1,0));

                let disk_position = Mat4.translation(Vec.of(0,0.3,0));
                let disk_scale = Mat4.scale(Vec.of(2.8,0.5,2.8));
                let disk_rotation = Mat4.rotation(this.record_rotation_angle, Vec.of(0,1,0));

                if(this.record_spinning) {
                    disk_rotation = disk_rotation.times(Mat4.rotation(0.004, Vec.of(0,0,(Math.random()-0.5) / 100.)));
                    this.record_rotation_angle += (this.record_rotation_speed)*2*Math.PI * dt;
                }

                let disk_transform = disk_position.times(disk_rotation.times(disk_scale));

                // Movement translations.
                if (this.moving_forward) {
                    if (this.tank_transform[1][3] < this.room_height * 2 - 15) {
                        this.tank_transform = this.tank_transform.times(Mat4.translation([0, this.step_size, 0]));
                    }
                }
                if (this.moving_left) {
                    if (this.tank_transform[0][3] < this.room_width - 5) {
                        this.tank_transform = this.tank_transform.times(Mat4.translation([this.step_size, 0, 0]));
                    }
                }
                if (this.moving_back) {
                    if (this.tank_transform[1][3] > 0.5) {
                        this.tank_transform = this.tank_transform.times(Mat4.translation([0, -this.step_size, 0]));
                    }
                }
                if (this.moving_right) {
                    if (this.tank_transform[0][3] > -this.room_width + 5) {
                        this.tank_transform = this.tank_transform.times(Mat4.translation([-this.step_size, 0, 0]));
                    }
                }
                if (this.broken && !this.moving_back && !this.moving_forward && !this.moving_left && ! this.moving_right) {
                    this.tank_transform = this.tank_transform.times(Mat4.translation([0, Math.sin(t * 6) / 85, 0]));
                }

                // Rotations for needle
                if (this.rotating_left && this.needle_prev_rot <= 1.1) {
                    this.needle_prev_rot += 0.01 * Math.PI;
                }
                if (this.rotating_right && this.needle_prev_rot >= -1.1) {
                    this.needle_prev_rot -= 0.01 * Math.PI;
                }
                if (this.broken) {
                    needle_rotation = Mat4.rotation(this.needle_prev_rot, Vec.of(0, 1, 0));
                }
                
                // Transitioning animation.
                if (this.game_transitioning) {
                    if(this.disk_fall_pos < 20 && !this.broken) {
                            let frag_matrix = Mat4.translation([this.tank_transform[0][3], this.tank_transform[1][3] + 0.3, this.tank_transform[2][3]]);
                            for (let i = 0; i < 6; i++) {
                                this.bodies.push(new Frag(this.shapes.disk_frag, this.materials.record_tex, Vec.of(2.8, 0.5, 2.8), this.aabb.disk)
                                        .emplace(Mat4.rotation((i / 6) * 2 * Math.PI, Vec.of(0, 1, 0)).times(frag_matrix), 
                                        Vec.of((Math.random() - 0.5) * 2, 1.5, -2).normalized().times(4), Math.random()));
                            }
                            this.broken = true;
                    }
                                
                    this.needle_right = true;

                    // Disk falling.
                    this.disk_fall_pos -= this.fall_factor;
                    this.fall_factor *= 0.984;
                    if (this.disk_fall_pos <= 0) {
                        this.disk_fall_pos = 0;
                        this.game_transitioning = false;
                        this.needle_transitioning = true;
                    }
                }
                if (this.needle_transitioning) {
                    // Needle moving to center.
                    if (this.needle_rising) {
                        this.needle_y += 0.06;
                        if (this.needle_y + this.needle_vertical_pos >= 2) {
                            this.needle_rising = false;
                            this.needle_translating = true;
                        }
                    }
                    if (this.needle_translating) {
                        this.needle_x -= 0.05;
                        this.needle_z += 0.05;
                        if (2.85 + this.needle_x <= 0) {
                            this.needle_x = -2.85;
                            this.needle_z = 2.85;
                            this.needle_translating = false;
                            this.needle_scaling = true;
                        }
                    }
                    if (this.needle_scaling) {
                        this.needle_scale_factor *= 1.02;
                        if (this.needle_scale_factor >= 2.0) {
                            this.needle_scale_factor = 2.0;
                            this.needle_scaling = false;
                            this.needle_falling = true;
                        }
                    }
                    if (this.needle_falling) {
                        this.needle_y -= 0.025;
                        if (this.needle_y + this.needle_vertical_pos <= 0.1) {
                            this.needle_falling = false;
                            this.music.pause();
                            this.music.currentTime = 0;
                            this.music.src = "";
                            this.music.src = this.boss_music_path;
                            this.music.play();
                            this.music.loop = true;
                            this.add_game_buttons();
                            this.start_game = true;
                        }
                    }
                }
                let needle_position = Mat4.translation(Vec.of(2.85 + this.needle_x,this.needle_vertical_pos + this.needle_y,-2.85 + this.needle_z));
                let needle_scale = Mat4.scale(Vec.of(0.5*this.needle_scale_factor,0.5*this.needle_scale_factor,0.5*this.needle_scale_factor));
                let needle_transform = needle_position.times(needle_rotation.times(needle_scale));

                let game_disk_transform = Mat4.translation([0,this.disk_fall_pos,0]).times(disk_transform);

                /* Draws scene. */

                this.shapes.record_player.draw(graphics_state, this.tank_transform.times(this.player_transform), this.materials.phong_primary);
                this.shapes.needle.draw(graphics_state, this.tank_transform.times(needle_transform), this.materials.phong_secondary);
                
                // Decide whether to draw original disk or the game music disk and whether to draw buttons.
                if (!this.broken) {
                    this.shapes.button.draw(graphics_state, this.tank_transform.times(slider_transform), this.materials.phong_secondary);
                    this.shapes.box.draw(graphics_state, this.tank_transform.times(this.sliderbox_transform), this.materials.grey_texture);
                    this.shapes.button.draw(graphics_state, this.tank_transform.times(btn_transform), this.materials.phong_secondary);
                    this.shapes.disk.draw(graphics_state, this.tank_transform.times(disk_transform), this.materials.record_tex);
                }
                else {
                    this.shapes.disk.draw(graphics_state, this.tank_transform.times(game_disk_transform), this.materials.record_tex2);
                }

                this.aim_transform = this.tank_transform.times(needle_rotation).times(Mat4.translation(Vec.of(0, 1, 10)));
            }
            else {
                this.shapes.box.draw(graphics_state, Mat4.translation([0,15,-40]).times(Mat4.scale(Vec.of(20,20,20))), this.materials.game_over);
            }
        }
    };