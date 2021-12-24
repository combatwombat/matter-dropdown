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

function getPageHeight() {
    return Math.max( document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight )
}


ready(function() {

    var body = document.body,
        html = document.documentElement;

    var pageHeight = getPageHeight();

    var canvas = document.getElementById('matter-canvas');

    // module aliases
    var Engine = Matter.Engine,
        Render = Matter.Render,
        Runner = Matter.Runner,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Body = Matter.Body;


    // create an engine
    var engine = Engine.create();
    var runner = Runner.create();

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

    var matterElements = [];

    // create boundarie elements
    var boundaries = {
        top:    Bodies.rectangle(0, -10, document.documentElement.clientWidth * 10, 10 * window.devicePixelRatio, {isStatic: true, frictionAir: 0.1}),
        bottom: Bodies.rectangle(0, window.innerHeight + 10, document.documentElement.clientWidth * 10, 10 * window.devicePixelRatio, {isStatic: true, frictionAir: 0.1}),
        left:   Bodies.rectangle(-10, 0, 10 * window.devicePixelRatio, pageHeight * window.devicePixelRatio, {isStatic: true, frictionAir: 0.1}),
        right:  Bodies.rectangle(document.documentElement.clientWidth, 0, 10 * window.devicePixelRatio, pageHeight * window.devicePixelRatio, {isStatic: true, frictionAir: 0.1})
    }
    matterElements.push(boundaries.top);
    matterElements.push(boundaries.bottom);
    matterElements.push(boundaries.left);
    matterElements.push(boundaries.right);

    // get positions of dom elements, create matter elements
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


    // update matter elements -> dom elements
    function step() {
        matterElements.forEach(function(el) {
            if (typeof el.element !== 'undefined') {
                el.element.style.transform = 'translate(' + (el.position.x - el.positionOrig.x) + 'px, ' + (el.position.y - el.positionOrig.y) + 'px) rotate(' + el.angle + 'rad )';
            }
        });
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);

    // on scroll or resize: move bottom
    function moveBottom() {
        Body.setPosition(boundaries.bottom, {x: 0, y: window.innerHeight + 10 + window.scrollY});
    }
    function onScroll() {
        moveBottom();
    }
    function onResize() {
        moveBottom();
    }
    document.addEventListener('scroll', onScroll);
    window.onresize = onResize;


    // add all of the bodies to the world
    World.add(engine.world, matterElements);

    // run the engine
    Runner.run(runner, engine);

    // run the renderer
    //Render.run(render);



});
