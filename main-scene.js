window.Record_Player_Simulator = window.classes.Record_Player_Simulator =
    class Record_Player_Simulator extends Scene_Component {
        constructor(context, control_box) {
            // The scene begins by requesting the camera, shapes, and materials it will need.
            super(context, control_box);
            // First, include a secondary Scene that provides movement controls:
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            const r = context.width / context.height;
            context.globals.graphics_state.camera_transform = Mat4.translation([0, -1.5, -11]).times(Mat4.rotation(.1, Vec.of(1,0,0)));  // Locate the camera here (inverted matrix).
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            const shapes = {
                'box': new Square(),
                'record_player': new Shape_From_File("assets/record_player.obj"),
                'button': new Shape_From_File("assets/cube.obj"),
                'needle': new Needle(),
                'disk': new Disk_Frag(30, 1)
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
                phong_primary: context.get_instance( Phong_Shader ).material( Color.of(.8, .1, .2, 1)),
                phong_secondary: context.get_instance( Phong_Shader ).material( Color.of(.2, .9, .5, 1)),
                grey_texture: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ) , {ambient: 0.9, texture:context.get_instance( "assets/grey_texture.jpg", false )}),
                gold_texture: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ) , {ambient: 0.9, texture:context.get_instance( "assets/gold_texture.jpg", false )}),
                record_texture: context.get_instance( Phong_Shader ).material( Color.of(0.15,0.15,0.15,1) , {specularity: 1.}),
            }

            this.default = context.get_instance(Phong_Shader).material(Color.of(1,1,1,1));
            this.lights = [new Light(Vec.of(6, 8, 10, 1), Color.of(1, 1, 1, 1), 100000)];

            // MUSIC-RELATED PROPS

            this.music_sound = document.getElementById("music_sound");
            this.music_sound_two = document.getElementById("music_sound_two");
            this.break_sound = document.getElementById("break_sound");
            this.slide_sound = document.getElementById("slide_sound");
            this.start_sound = document.getElementById("start_sound");
            this.shoot_sound = document.getElementById("shoot_sound");
            this.needl_sound = document.getElementById("needl_sound");
            this.point_sound = document.getElementById("point_sound");
            this.game_music = document.getElementById("game_music");
            this.break_sound.volume = .5;

            this.isPlaying = false;
            this.isPlayable = true;

            this.btn_z = 0;

            this.slider_pos = 1;

            this.broken = false;

            // Fixed transforms.
            this.player_transform = Mat4.scale([2, 2, 2]);
            this.sliderbox_transform = Mat4.translation([2, -0.48, 3.47]).times(Mat4.scale([0.6, 0.25, 0.25]));

            // NEEDLE ROTATION.
            this.needle_rotation_angle = 0;
            this.needle_rotation_locked = true;
            this.needle_rotation_speed = .05;
            this.song_angle = 0.3;
            this.song_angle_two = 0.6;
            this.needle_left = false;
            this.needle_right = false;

            // RECORD ROTATION.
            this.record_spinning = false;
            this.record_rotation_speed = 1;             // rev/sec
            this.record_rotation_angle = 0;
        }

        // MUSIC-RELATED FUNCTIONS

        play_music() {
            this.start_sound.play();
            this.record_spinning = !this.record_spinning;
            this.isPlaying = !this.isPlaying;
            if (!this.isPlayable) {
                return;
            }

            if (!this.isPlaying || !this.record_spinning) {
                this.music_sound.pause();
                this.music_sound_two.pause();
            }
            else {
                if (this.needle_rotation_angle === this.song_angle) {
                    this.music_sound_two.pause();
                    this.music_sound.play();
                }
                if (this.needle_rotation_angle === this.song_angle_two) {
                    this.music_sound.pause();
                    this.music_sound_two.play();
                }
            }
        }

        lower_volume() {   
            if (this.music_sound.volume > .1) {
                this.slide_sound.play();
                this.music_sound.volume -= .1;
            }
            let vol = Math.floor(music_sound.volume * 10) / 10;
            this.slider_pos = vol;
            document.getElementById("volume").textContent = "VOLUME: " + vol.toFixed(1);
        }

        raise_volume() {
            if (this.music_sound.volume < 1) {
                this.slide_sound.play();
                this.music_sound.volume += .1;
            }
            let vol = Math.floor(music_sound.volume * 10) / 10;
            this.slider_pos = vol;
            document.getElementById("volume").textContent = "VOLUME: " + vol.toFixed(1);
        }

        break_stuff () {
            if (this.broken === true) {
                return;
            }
            this.music_sound.pause();
            this.isPlaying = false;
            this.isPlayable = false;
            this.break_sound.play();
            this.attached = () => Mat4.translation([0, 4, 20]);
            this.broken = true;
        }

        needle_rotation_lock(){
            this.needle_rotation_locked = !this.needle_rotation_locked;
            this.start_sound.play();
            if(this.needle_rotation_locked){
                document.getElementById("rotation").textContent = "Needle Rotation: Locked";   
            }else{
                document.getElementById("rotation").textContent = "Needle Rotation: Unlocked";
            }
        }

        needle_rotate_left(){
            if(!this.needle_rotation_locked) {
                this.needl_sound.currentTime = 0;
                this.needl_sound.play();
                this.needle_left = true;
                this.needle_right = false;      
            }
        }

        needle_rotate_right(){
            if(!this.needle_rotation_locked) {
                this.needl_sound.currentTime = 0;
                this.needl_sound.play();
                this.needle_right = true;   
                this.needle_left = false;  
            }
        }

        make_control_panel()             // Draw the scene's buttons, setup their actions and keyboard shortcuts, and monitor live measurements.
        {
            // A button to control the music.
            this.key_triggered_button("Play/Pause", ["p"], this.play_music);
            // this.control_panel.innerHTML += "<br><br>";
            this.key_triggered_button("-", ["-"], this.lower_volume);

            const volumeText = document.createElement("span");
            volumeText.id = "volume";
            volumeText.textContent = "VOLUME: " + music_sound.volume.toFixed(1);
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

        display(graphics_state) {
            graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
            const t = this.t = graphics_state.animation_time / 1000;
            const dt = graphics_state.animation_delta_time /1000;

            if (this.attached !== undefined) {
                let desired = Mat4.inverse(this.attached().times(Mat4.translation([0, 0, 5])));
                graphics_state.camera_transform = desired.map((x, i) => Vec.from(graphics_state.camera_transform[i]).mix(x, 0.1));
            }

            // Button transform when pressed.
            let btn_transform = Mat4.translation([0, -0.48, 3.45 + this.btn_z]).times(Mat4.scale([0.3, 0.3, 0.3]));
            if (this.isPlaying === true && this.btn_z > -0.09) {
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
            else if (this.isPlaying === false && this.btn_z < 0) {
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
            let needle_position = Mat4.translation(Vec.of(2.8,0.2,-2.8));
            let needle_scale = Mat4.scale(Vec.of(0.5,0.5,0.5));
            if (this.needle_left) {
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
            if (this.needle_right) {
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
            let needle_rotation = Mat4.rotation(this.needle_rotation_angle, Vec.of(0,-1,0));

            let needle_transform = needle_position.times(needle_rotation.times(needle_scale));

            let disk_position = Mat4.translation(Vec.of(0,0.3,0));
            let disk_scale = Mat4.scale(Vec.of(2.8,0.5,2.8));
            let disk_rotation = Mat4.identity();

            if(this.record_spinning) {
                disk_rotation = disk_rotation.times(Mat4.rotation(this.record_rotation_angle, Vec.of(0,1,Math.random() / 150.)));
                this.record_rotation_angle += this.record_rotation_speed*2*Math.PI * dt;
            }

            let disk_transform = disk_position.times(disk_rotation.times(disk_scale));

            /*
            // TODO:  Draw your entire scene here.  Use this.draw_box( graphics_state, model_transform ) to call your helper*/

            this.shapes.box.draw(graphics_state, this.sliderbox_transform, this.materials.grey_texture);
            this.shapes.button.draw(graphics_state, btn_transform, this.materials.phong_secondary);
            this.shapes.record_player.draw(graphics_state, this.player_transform, this.materials.phong_primary);
            this.shapes.button.draw(graphics_state, slider_transform, this.materials.phong_secondary);
            this.shapes.needle.draw(graphics_state, needle_transform, this.materials.phong_secondary);
            this.shapes.disk.draw(graphics_state, disk_transform, this.materials.record_texture);
        }
    };