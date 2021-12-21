var ready = function(callback) {
    if (document.readyState !== 'loading'){
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

ready(function() {
    // module aliases
    var Engine = Matter.Engine,
    Render = Matter.Render,
    World = Matter.World,
    Bodies = Matter.Bodies;

    var canvas = document.getElementById('matter-canvas');

    // create an engine
    var engine = Engine.create();

    // create a renderer
    var render = Render.create({
        element: document.body,
        canvas: canvas,
        engine: engine,
        options: {
            width: canvas.offsetWidth,
            height: canvas.offsetHeight
        }
    });

    Render.setPixelRatio(render, 'auto');

    // create two boxes and a ground
    var boxA = Bodies.rectangle(400, 200, 80, 80, {
        frictionAir: 0.1,
        isStatic: true
    });
    var boxB = Bodies.rectangle(450, 50, 80, 80);
    var ground = Bodies.rectangle(400, 610, 210, 60, { isStatic: true });

    // add all of the bodies to the world
    World.add(engine.world, [boxA, boxB, ground]);

    // run the engine
    Engine.run(engine);

    // run the renderer
    Render.run(render);

    setTimeout(function() {
        Matter.Body.setPosition(ground, {x: 350, y: 150});
    }, 1000);

    setInterval(function() {
        //console.log(boxB.position.y);
    }, 200);

    window.onresize = function() {
        console.log(canvas.offsetWidth);
    }
});
