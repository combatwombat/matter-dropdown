var ready = function(callback) {
    if (document.readyState !== 'loading'){
        callback();
    } else {
        window.addEventListener('load', callback);
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

    var mousePosition = {x: 0, y: 0};

    // module aliases
    var Engine      = Matter.Engine,
        Render      = Matter.Render,
        Runner      = Matter.Runner,
        World       = Matter.World,
        Bodies      = Matter.Bodies,
        Body        = Matter.Body;


    // create an engine
    var engine = Engine.create();
    var runner = Runner.create();

    engine.world.gravity.y = 1;

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
    var interactiveElements = []; // the moving boxes on the page

    // create boundarie elements
    var boundaryOptions = {
        isStatic: true,
        restitution: 0.5,
        friction: 0.5
    }
    var boundaries = {
        top:    Bodies.rectangle(0, -10, document.documentElement.clientWidth * 10, 10 * window.devicePixelRatio, boundaryOptions),
        bottom: Bodies.rectangle(0, pageHeight + 10, document.documentElement.clientWidth * 10, 10 * window.devicePixelRatio, boundaryOptions),
        left:   Bodies.rectangle(-10, 0, 10 * window.devicePixelRatio, pageHeight * window.devicePixelRatio, boundaryOptions),
        right:  Bodies.rectangle(document.documentElement.clientWidth, 0, 10 * window.devicePixelRatio, pageHeight * window.devicePixelRatio, boundaryOptions)
    }
    matterElements.push(boundaries.top);
    matterElements.push(boundaries.bottom);
    matterElements.push(boundaries.left);
    matterElements.push(boundaries.right);

    // create mouse ball
    var mouseBall = Bodies.circle(0, 0, 1, {isStatic: true});
    matterElements.push(mouseBall);

    // get positions of dom elements, create matter elements
    var DOMElements = document.querySelectorAll('.matter');
    var options, offset;
    DOMElements.forEach(function(el, currentIndex) {
        offset = getOffset(el);
        console.log(offset);
        console.log(el.offsetHeight);
        options = {
            element: el,
            frictionAir: 0,
            restitution: 0.5,
            chamfer: {radius: 10},
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

        if (!el.classList.contains('matter-static')) {
            interactiveElements.push(matterElement);
        }

    });


    // update matter elements -> dom elements
    function step() {

        // do this instead of Matter.Mouse, so we can hide the canvas and keep natural site scrolling
        Body.setPosition(mouseBall, {x: mousePosition.x, y: mousePosition.y});

        // move dom elements like their physics counterparts
        matterElements.forEach(function(el) {
            if (typeof el.element !== 'undefined') {
                el.element.style.transform =    'translate(' +
                                                    (el.position.x - el.positionOrig.x) + 'px, ' +
                                                    (el.position.y - el.positionOrig.y) + 'px) ' +
                                                'rotate(' + el.angle + 'rad )';

                // rotate shadow
                if (el.element.classList.contains('has-shadow')) {
                    var shadowAngle = 0.5*Math.PI-el.angle;
                    el.element.style.boxShadow = 'rgba(0,0,0,0.3) '+(Math.cos(shadowAngle)*10)+'px '+(Math.sin(shadowAngle)*10)+'px 20px';
                }
            }
        });

        // mouse collides with interactive box: bounce a bit, so we can move it up
        interactiveElements.forEach(function(el) {
            if (Matter.SAT.collides(mouseBall, el).collided) {
                Body.applyForce( el, {x: el.position.x, y: el.position.y}, {x: 0, y: -0.8});
            }
        });
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);

    // on scroll or resize: move bottom
    function moveBottom() {
        //Body.setPosition(boundaries.bottom, {x: 0, y: window.innerHeight + 10 + window.scrollY});
    }
    function onScroll() {
        moveBottom();
    }
    function onResize() {
        moveBottom();
    }
    function onMouseMove(ev) {
        if (typeof ev.pageX !== 'undefined') {
            mousePosition = {x: ev.pageX, y: ev.pageY};
        } else if (typeof ev.changedTouches !== 'undefined' && ev.changedTouches.length > 0) {
            mousePosition = {x: ev.changedTouches[0].pageX, y: ev.changedTouches[0].pageY};
        }

    }
    document.addEventListener('scroll', onScroll);
    window.onresize = onResize;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('touchmove', onMouseMove);

    // add all of the bodies to the world
    World.add(engine.world, matterElements);

    // run the engine
    Runner.run(runner, engine);

    // run the renderer
    //Render.run(render);



});
