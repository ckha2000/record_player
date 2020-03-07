window.Cube = window.classes.Cube =
    class Cube extends Shape {
        // Here's a complete, working example of a Shape subclass.  It is a blueprint for a cube.
        constructor() {
            super("positions", "normals"); // Name the values we'll define per each vertex.  They'll have positions and normals.

            // First, specify the vertex positions -- just a bunch of points that exist at the corners of an imaginary cube.
            this.positions.push(...Vec.cast(
                [-1, -1, -1], [1, -1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, -1], [-1, 1, -1], [1, 1, 1], [-1, 1, 1],
                [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1], [1, -1, 1], [1, -1, -1], [1, 1, 1], [1, 1, -1],
                [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1], [1, -1, -1], [-1, -1, -1], [1, 1, -1], [-1, 1, -1]));
            // Supply vectors that point away from eace face of the cube.  They should match up with the points in the above list
            // Normal vectors are needed so the graphics engine can know if the shape is pointed at light or not, and color it accordingly.
            this.normals.push(...Vec.cast(
                [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, -1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0],
                [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [-1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0],
                [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]));

            // Those two lists, positions and normals, fully describe the "vertices".  What's the "i"th vertex?  Simply the combined
            // data you get if you look up index "i" of both lists above -- a position and a normal vector, together.  Now let's
            // tell it how to connect vertex entries into triangles.  Every three indices in this list makes one triangle:
            this.indices.push(0, 1, 2, 1, 3, 2, 4, 5, 6, 5, 7, 6, 8, 9, 10, 9, 11, 10, 12, 13,
                14, 13, 15, 14, 16, 17, 18, 17, 19, 18, 20, 21, 22, 21, 23, 22);
            // It stinks to manage arrays this big.  Later we'll show code that generates these same cube vertices more automatically.
        }
    };

window.Cube_Outline = window.classes.Cube_Outline =
    class Cube_Outline extends Shape {
        constructor() {
            super("positions", "colors"); // Name the values we'll define per each vertex.

            const white_c = Color.of(1, 1, 1, 1);
            //  TODO (Requirement 5).
            // When a set of lines is used in graphics, you should think of the list entries as
            // broken down into pairs; each pair of vertices will be drawn as a line segment.
            this.positions.push(...Vec.cast(
                [1, 1, 1], [1, 1, -1],
                [1, 1, -1],[-1, 1, -1],
                [-1, 1, -1], [-1, 1, 1],
                [-1, 1, 1], [1, 1, 1],

                [1, 1, 1], [1, -1, 1],
                [-1, -1, 1], [-1, 1, 1],
                [1, 1, -1], [1, -1, -1],
                [-1, 1, -1], [-1, -1, -1],

                [1, -1, 1], [-1, -1, 1],
                [-1, -1, 1], [-1, -1, -1],
                [-1, -1, -1], [1, -1, -1],
                [1, -1, -1], [1, -1, 1]
            ));

            this.colors = [ white_c, white_c, white_c, white_c, white_c, white_c, 
                            white_c, white_c, white_c, white_c, white_c, white_c, 
                            white_c, white_c, white_c, white_c, white_c, white_c, 
                            white_c, white_c, white_c, white_c, white_c, white_c
                            ];
            this.indexed = false;       // Do this so we won't need to define "this.indices".
        }
    };

window.Cube_Single_Strip = window.classes.Cube_Single_Strip =
    class Cube_Single_Strip extends Shape {
        constructor() {
            super("positions", "normals");

            // TODO (Extra credit part I)

            this.positions.push(...Vec.cast( [1, 1, 1], [1, -1, 1], [-1, -1, 1], [-1, 1, 1],
                                             [1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]
            ));

            this.normals.push(...Vec.cast( [1, 1, 1], [1, -1, 1], [-1, -1, 1], [-1, 1, 1],
                                           [1, 1, -1], [-1, 1, -1], [-1, -1, -1], [1, -1, -1]
            ));

            this.indices.push(0,1,2, 0,2,3, 0,1,4, 1,4,7, 0,3,5, 0,4,5, 2,3,5, 2,6,5, 5,6,7, 4,5,7, 1,2,7, 2,6,7);
        }
    };

window.Record_Player_Simulator = window.classes.Record_Player_Simulator =
    class Record_Player_Simulator extends Scene_Component {
        constructor(context, control_box) {
            // The scene begins by requesting the camera, shapes, and materials it will need.
            super(context, control_box);
            // First, include a secondary Scene that provides movement controls:
            if (!context.globals.has_controls)
                context.register_scene_component(new Movement_Controls(context, control_box.parentElement.insertCell()));

            const r = context.width / context.height;
            context.globals.graphics_state.camera_transform = Mat4.translation([0, -2, -11]);  // Locate the camera here (inverted matrix).
            context.globals.graphics_state.projection_transform = Mat4.perspective(Math.PI / 4, r, .1, 1000);

            const shapes = {
                'box': new Square(),
                'record_player': new Shape_From_File("assets/record_player.obj"),
                'button': new Shape_From_File("assets/cube.obj")
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
                gold_texture: context.get_instance( Phong_Shader ).material( Color.of( 0,0,0,1 ) , {ambient: 0.9, texture:context.get_instance( "assets/gold_texture.jpg", false )})
            }

            this.default = context.get_instance(Phong_Shader).material(Color.of(1,1,1,1));

            this.lights = [new Light(Vec.of(7, 5, 10, 1), Color.of(1, 1, 1, 1), 100000)];
            
            this.colorList = [];
            this.set_colors();

            this.heightScale = 1.5;
            this.widthScale = 1;

            // MUSIC-RELATED PROPS

            this.music_sound = document.getElementById("music_sound");
            this.break_sound = document.getElementById("break_sound");
            this.slide_sound = document.getElementById("slide_sound");
            this.start_sound = document.getElementById("start_sound");
            this.shoot_sound = document.getElementById("shoot_sound");
            this.needl_sound = document.getElementById("needl_sound");
            this.point_sound = document.getElementById("point_sound");
            this.break_sound.volume = .5;

            this.isPlaying = false;
            this.isPlayable = true;
            this.isFirstPlay = true;

            this.btn_z = 0;

            this.slider_pos = 1;

            // Fixed transforms.
            this.player_transform = Mat4.scale([2, 2, 2]);
            this.sliderbox_transform = Mat4.translation([2, -0.48, 3.47]).times(Mat4.scale([0.6, 0.25, 0.25]));
        }

        set_colors() {
            // TODO:  Create a class member variable to store your cube's colors.
            // if there are any colors already set, reset the array
            while(this.colorList.length > 0){
                this.colorList.pop();
            }

            for(var i = 0; i < 8; i++){
                this.colorList.push(Color.of(Math.random(), Math.random(), Math.random(), 1));
            }
        }

        // MUSIC-RELATED FUNCTIONS

        play_music() {
            this.start_sound.play();
            this.isPlaying = !this.isPlaying;
            if (!this.isPlayable) {
                return;
            }
            this.needl_sound.currentTime = 0;
            this.needl_sound.play();

            // Will be better to play the music when needle touches disk, not when btn is pressed.
            if (this.isPlaying) {
                //setTimeout(() => { this.music_sound.play(); }, 1000);
                this.music_sound.play();
            }
            else {
                this.music_sound.pause();
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
            this.music_sound.pause();
            this.isPlaying = false;
            this.isPlayable = false;
            this.break_sound.play();
            this.attached = () => Mat4.translation([0, 4, 20]);
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
        }

        display(graphics_state) {
            graphics_state.lights = this.lights;        // Use the lights stored in this.lights.
            const t = this.t = graphics_state.animation_time / 1000;

            if (this.attached !== undefined) {
                let desired = Mat4.inverse(this.attached().times(Mat4.translation([0, 0, 5])));
                graphics_state.camera_transform = desired.map((x, i) => Vec.from(graphics_state.camera_transform[i]).mix(x, 0.1));
            }

            // Button transform when pressed.
            let btn_transform = Mat4.translation([0, -0.48, 3.45 + this.btn_z]).times(Mat4.scale([0.3, 0.3, 0.3]));
            if (this.isPlaying === true && this.btn_z > -0.21) {
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


            /*
            // TODO:  Draw your entire scene here.  Use this.draw_box( graphics_state, model_transform ) to call your helper*/

            this.shapes.box.draw(graphics_state, this.sliderbox_transform, this.materials.grey_texture);
            this.shapes.button.draw(graphics_state, btn_transform, this.materials.phong_secondary);
            this.shapes.record_player.draw(graphics_state, this.player_transform, this.materials.phong_primary);
            this.shapes.button.draw(graphics_state, slider_transform, this.materials.phong_secondary);
            //this.shapes.box.draw(graphics_state, slider_transform, this.plastic);
        }
    };