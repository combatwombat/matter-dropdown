var ready = function(callback) {
    if (document.readyState !== 'loading'){
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

// thx to https://stackoverflow.com/a/442474
function getOffset(el) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
};

ready(function() {

    // module aliases
    var Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        World = Matter.World,
        Bodies = Matter.Bodies;


    // create an engine
    var engine = Engine.create();
    var runner = Runner.create();

    var canvas = document.getElementById('matter-canvas');

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


    // get positions of dom elements, create matter elements
    var matterElements = [];
    var DOMElements = document.querySelectorAll('.matter');
    var options, offset;
    DOMElements.forEach(function(el, currentIndex) {
        offset = getOffset(el);
        options = {
            element: el,
            positionOrig:  {
                x: offset.left + (el.offsetWidth / 2),
                y: offset.top + (el.offsetHeight / 2)
            },
            widthOrig: el.offsetWidth,
            heightOrig: el.offsetHeight
        };
        if (el.classList.contains('matter-static')) {
            options.isStatic = true;
            options.frictionAir = 0.1;
        }
        var matterElement = Bodies.rectangle(options.positionOrig.x, options.positionOrig.y, options.widthOrig, options.heightOrig, options);
        matterElements.push(matterElement);
    });

    console.log(matterElements);

    function step() {

        matterElements.forEach(function(el) {
            if (typeof el.element !== 'undefined') {
                el.element.style.transform = 'translate(' + (el.position.x - el.positionOrig.x) + 'px, ' + (el.position.y - el.positionOrig.y) + 'px) rotate(' + el.angle + 'rad )';
            }
        });

        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);

    /*
    // create two boxes and a ground
    var boxA = Bodies.rectangle(400, 200, 80, 80, {
        frictionAir: 0.1,
        isStatic: true
    });
    var boxB = Bodies.rectangle(450, 50, 80, 80);
    var ground = Bodies.rectangle(400, 610, 210, 60, { isStatic: true });
    */
    // add all of the bodies to the world
    World.add(engine.world, matterElements);

    // run the engine
    Runner.run(runner, engine);

    // run the renderer
    Render.run(render);

    setInterval(function() {
        //console.log(boxB.position.y);
    }, 200);


});
