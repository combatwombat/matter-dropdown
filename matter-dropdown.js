/*
    MatterDropdown 0.1

    Applies physics to DOM elements and lets you bounce them around with the mouse.

    Robert Gerlach 2021 - gerlach.dev
 */
function MatterDropdown(customOptions = {}) {

    var defaultOptions = {
        bounceDebounce:     50,             // how often are bounce-mouse interactions done? in ms
        timeToInteraction:  2000,           // how long until we can interact after creating the first interactive object?
        mouseBounceForce:   {x: 0, y: -0.4} // for applyForce() when mouse touches non-static object. lower y = bouncier
    };
    var options = Object.assign({}, defaultOptions, customOptions);

    var interactionStartTime = null; // when did we start adding interactive elements?

    // matter module aliases
    var Engine      = Matter.Engine,
        Render      = Matter.Render,
        Runner      = Matter.Runner,
        World       = Matter.World,
        Bodies      = Matter.Bodies,
        Body        = Matter.Body,
        Events      = Matter.Events;


    var body,
        canvas,
        pageHeight,
        mousePosition,
        matterElements,
        mouseBall,
        boundaries;

    var engine = Engine.create();
    var runner = Runner.create();

    // thx to https://stackoverflow.com/a/442474
    var getOffset = function(el) {
        var x = 0;
        var y = 0;
        while(el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
            x += el.offsetLeft - el.scrollLeft;
            y += el.offsetTop - el.scrollTop;
            el = el.offsetParent;
        }
        return {top: y, left: x};
    };

    var getPageHeight = function() {
        return Math.max(document.body.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.clientHeight,
            document.documentElement.scrollHeight,
            document.documentElement.offsetHeight);
    }

    var createBodyFromDOMElement = function(el) {
        var offset = getOffset(el);

        // get existing transform
        var transform = DecomposeDOMMatrix(new DOMMatrix(getComputedStyle(el).getPropertyValue('transform')));

        // assuming border-radius is specified in px...
        var borderRadius = +window.getComputedStyle(el).getPropertyValue('border-radius').replace(/[^0-9]+/g, "");

        var bodyOptions = {
            element: el,
            frictionAir: 0,
            restitution: 0.5,
            chamfer: {radius: borderRadius},
            angle: transform.rotateZ * (Math.PI / 180),
            positionOrig:  {
                x: offset.left + (el.offsetWidth / 2),
                y: offset.top + (el.offsetHeight / 2)
            },
            widthOrig: el.offsetWidth,
            heightOrig: el.offsetHeight,
            transformOrig: transform,
            hasShadow: el.classList.contains('has-shadow'),
            lastCollisionTime: 0,
            creationTime: +new Date()
        };

        // static object, just sitting there?
        if (el.classList.contains('matter-static')) {
            bodyOptions.isStatic = true;
            bodyOptions.frictionAir = 0.1;

            // static object, but dom element animated with css, js etc.?
            if (el.classList.contains('matter-static-animated')) {
                bodyOptions.isStaticAnimated = true;
            }
        }
        return Bodies.rectangle(bodyOptions.positionOrig.x + transform.translateX,bodyOptions.positionOrig.y + transform.translateY, bodyOptions.widthOrig, bodyOptions.heightOrig, bodyOptions);
    }

    var addElement = function(el) {
        el.classList.add('matter');
        var matterElement = createBodyFromDOMElement(el);
        matterElements.push(matterElement);
        World.add(engine.world, matterElement);
        if (interactionStartTime === null) {
            interactionStartTime = +new Date();
        }
    }

    // update matter elements -> dom elements
    var step = function() {

        var now = +new Date();

        // do this instead of Matter.Mouse, so we can hide the canvas and keep natural site scrolling
        if (interactionStartTime !== null && now - interactionStartTime > options.timeToInteraction) {
            Body.setPosition(mouseBall, mousePosition);
        }

        // move dom elements like their physics counterparts
        matterElements.forEach(function (el) {
            if (typeof el.element !== 'undefined') {

                // static object? apply dom- to physics position
                if (el.isStatic) {

                    if (el.isStaticAnimated) {
                        var transform = DecomposeDOMMatrix(new DOMMatrix(getComputedStyle(el.element).getPropertyValue('transform')));
                        var offset = getOffset(el.element);

                        Body.setPosition(el, {
                            x: offset.left + (el.element.offsetWidth / 2) + transform.translateX,
                            y: offset.top + (el.element.offsetHeight / 2) + transform.translateY
                        });
                        Body.setAngle(el, transform.rotateZ * (Math.PI / 180));
                    }

                } else {

                    // apply physics- to dom position
                    el.element.style.transform = 'translate(' +
                        (el.position.x - el.positionOrig.x) + 'px, ' +
                        (el.position.y - el.positionOrig.y) + 'px) ' +
                        'rotate(' + el.angle + 'rad )';

                    // mouse touches object? bounce it up a bit for increased fun.
                    if (Matter.SAT.collides(mouseBall, el).collided) {
                        if (now - el.lastCollisionTime > options.bounceDebounce && now - el.creationTime > options.timeToInteraction) {
                            Body.applyForce(el, {x: el.position.x, y: el.position.y}, options.mouseBounceForce);
                            el.lastCollisionTime = now;
                        }
                    }
                }

                // rotate shadow
                if (el.hasShadow) {
                    var shadowAngle = 0.5 * Math.PI - el.angle;
                    el.element.style.boxShadow = 'rgba(0,0,0,0.2) ' + (Math.cos(shadowAngle) * 10) + 'px ' + (Math.sin(shadowAngle) * 10) + 'px 20px';
                }

            }
        });
    }

    var init = function() {

        body = document.body;
        canvas = document.getElementById('matter-canvas');
        pageHeight = getPageHeight();
        mousePosition = {x: 0, y: 0};

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

        matterElements = [];

        // create boundary elements
        var boundaryOptions = {
            isStatic: true,
            restitution: 0.5,
            friction: 0.5
        }
        boundaries = {
            top:    Bodies.rectangle(0, -10, document.documentElement.clientWidth * 10, 10 * window.devicePixelRatio, boundaryOptions),
            bottom: Bodies.rectangle(0, pageHeight + 10, document.documentElement.clientWidth * 10, 10 * window.devicePixelRatio, boundaryOptions),
            left:   Bodies.rectangle(-10, 0, 10 * window.devicePixelRatio, pageHeight * window.devicePixelRatio, boundaryOptions),
            right:  Bodies.rectangle(document.documentElement.clientWidth + 10, 0, 10 * window.devicePixelRatio, pageHeight * window.devicePixelRatio, boundaryOptions)
        }
        matterElements.push(boundaries.top);
        matterElements.push(boundaries.bottom);
        matterElements.push(boundaries.left);
        matterElements.push(boundaries.right);

        // create mouse ball
        mouseBall = Bodies.circle(0, 0, 1, {isStatic: true});
        matterElements.push(mouseBall);

        // get positions of dom elements, create matter elements
        document.querySelectorAll('.matter').forEach(function(el) {
            setTimeout(function() {
                addElement(el);
            }, el.getAttribute('data-matter-init-delay') || 0);
        });


        // update mouse position
        function onMouseMove(ev) {
            if (typeof ev.pageX !== 'undefined') {
                mousePosition = {x: ev.pageX, y: ev.pageY};
            } else if (typeof ev.changedTouches !== 'undefined' && ev.changedTouches.length > 0) {
                mousePosition = {x: ev.changedTouches[0].pageX, y: ev.changedTouches[0].pageY};
            }
        }
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('touchmove', onMouseMove);


        // add all of the bodies to the world
        World.add(engine.world, matterElements);

        // run the engine
        Runner.run(runner, engine);

        // run the renderer
        if (body.classList.contains('debug')) {
            Render.run(render);
        }

        Events.on(runner, 'afterTick', step)

    };

    return {
        init: init,
        addElement: addElement
    }

}

// thx to ismailman https://github.com/ismailman/decompose-dommatrix
function DecomposeDOMMatrix(domMatrix) {

    var RAD_TO_DEG = 180 / Math.PI;

    /*
     copied from https://github.com/facebook/react-native/blob/master/Libraries/Utilities/MatrixMath.js#L572
     vectors are just arrays of numbers
    */
    var vectorFns = {
        length: function(vector) {
            return Math.sqrt(
                vector[0] * vector[0] +
                vector[1] * vector[1] +
                vector[2] * vector[2]
            );
        },
        normalize: function(vector, preComputedVectorLength) {
            return [
                vector[0]/preComputedVectorLength,
                vector[1]/preComputedVectorLength,
                vector[2]/preComputedVectorLength
            ];
        },
        dotProduct: function(vectorA, vectorB) {
            return (
                vectorA[0] * vectorB[0] +
                vectorA[1] * vectorB[1] +
                vectorA[2] * vectorB[2]
            );
        },
        crossProduct: function(vectorA, vectorB) {
            return [
                vectorA[1] * vectorB[2] - vectorA[2] * vectorB[1],
                vectorA[2] * vectorB[0] - vectorA[0] * vectorB[2],
                vectorA[0] * vectorB[1] - vectorA[1] * vectorB[0]
            ];
        },
        linearCombination: function(vectorA, vectorB, aScaleFactor, bScaleFactor) {
            return [
                vectorA[0] * aScaleFactor + vectorB[0] * bScaleFactor,
                vectorA[1] * aScaleFactor + vectorB[1] * bScaleFactor,
                vectorA[2] * aScaleFactor + vectorB[2] * bScaleFactor
            ];
        }
    };

    var roundToThreePlaces = function(number){
        const arr = number.toString().split('e');
        return Math.round(arr[0] + 'e' + (arr[1] ? +arr[1] - 3 : 3)) * 0.001;
    }


    var quaternionToDegreesXYZ = function(quaternion) {

        const [qx, qy, qz, qw] = quaternion;
        const qw2 = qw * qw;
        const qx2 = qx * qx;
        const qy2 = qy * qy;
        const qz2 = qz * qz;
        const test = qx * qy + qz * qw;
        const unit = qw2 + qx2 + qy2 + qz2;

        if (test > 0.49999 * unit) {
            return [0, 2 * Math.atan2(qx, qw) * RAD_TO_DEG, 90];
        }
        if (test < -0.49999 * unit) {
            return [0, -2 * Math.atan2(qx, qw) * RAD_TO_DEG, -90];
        }

        return [
            roundToThreePlaces(
                Math.atan2(2 * qx * qw - 2 * qy * qz, 1 - 2 * qx2 - 2 * qz2) * RAD_TO_DEG,
            ),
            roundToThreePlaces(
                Math.atan2(2 * qy * qw - 2 * qx * qz, 1 - 2 * qy2 - 2 * qz2) * RAD_TO_DEG,
            ),
            roundToThreePlaces(Math.asin(2 * qx * qy + 2 * qz * qw) * RAD_TO_DEG),
        ];

    }

    var decomposeMatrix = function(matrix) {
        const quaternion = new Array(4);
        const scale = new Array(3);
        const skew = new Array(3);
        const translation = new Array(3);

        // translation is simple
        // it's the first 3 values in the last column
        // i.e. m41 is X translation, m42 is Y and m43 is Z
        for (let i = 0; i < 3; i++) {
            translation[i] = matrix[3][i];
        }

        // Now get scale and shear.
        const normalizedColumns = new Array(3);
        for (let columnIndex = 0; columnIndex < 3; columnIndex++) {
            normalizedColumns[columnIndex] = matrix[columnIndex].slice(0, 3);
        }

        // Compute X scale factor and normalize first row.
        scale[0] = vectorFns.length(normalizedColumns[0]);
        normalizedColumns[0] = vectorFns.normalize(normalizedColumns[0], scale[0]);

        // Compute XY shear factor and make 2nd row orthogonal to 1st.
        skew[0] = vectorFns.dotProduct(normalizedColumns[0], normalizedColumns[1]);
        normalizedColumns[1] = vectorFns.linearCombination(normalizedColumns[1], normalizedColumns[0], 1.0, -skew[0]);

        // Now, compute Y scale and normalize 2nd row.
        scale[1] = vectorFns.length(normalizedColumns[1]);
        normalizedColumns[1] = vectorFns.normalize(normalizedColumns[1], scale[1]);
        skew[0] /= scale[1];

        // Compute XZ and YZ shears, orthogonalize 3rd row
        skew[1] = vectorFns.dotProduct(normalizedColumns[0], normalizedColumns[2]);
        normalizedColumns[2] = vectorFns.linearCombination(normalizedColumns[2], normalizedColumns[0], 1.0, -skew[1]);
        skew[2] = vectorFns.dotProduct(normalizedColumns[1], normalizedColumns[2]);
        normalizedColumns[2] = vectorFns.linearCombination(normalizedColumns[2], normalizedColumns[1], 1.0, -skew[2]);

        // Next, get Z scale and normalize 3rd row.
        scale[2] = vectorFns.length(normalizedColumns[2]);
        normalizedColumns[2] = vectorFns.normalize(normalizedColumns[2], scale[2]);
        skew[1] /= scale[2];
        skew[2] /= scale[2];

        // At this point, the matrix defined in normalizedColumns is orthonormal.
        // Check for a coordinate system flip.  If the determinant
        // is -1, then negate the matrix and the scaling factors.
        const pdum3 = vectorFns.crossProduct(normalizedColumns[1], normalizedColumns[2]);
        if (vectorFns.dotProduct(normalizedColumns[0], pdum3) < 0) {
            for (let i = 0; i < 3; i++) {
                scale[i] *= -1;
                normalizedColumns[i][0] *= -1;
                normalizedColumns[i][1] *= -1;
                normalizedColumns[i][2] *= -1;
            }
        }

        // Now, get the rotations out
        quaternion[0] =
            0.5 * Math.sqrt(Math.max(1 + normalizedColumns[0][0] - normalizedColumns[1][1] - normalizedColumns[2][2], 0));
        quaternion[1] =
            0.5 * Math.sqrt(Math.max(1 - normalizedColumns[0][0] + normalizedColumns[1][1] - normalizedColumns[2][2], 0));
        quaternion[2] =
            0.5 * Math.sqrt(Math.max(1 - normalizedColumns[0][0] - normalizedColumns[1][1] + normalizedColumns[2][2], 0));
        quaternion[3] =
            0.5 * Math.sqrt(Math.max(1 + normalizedColumns[0][0] + normalizedColumns[1][1] + normalizedColumns[2][2], 0));

        if (normalizedColumns[2][1] > normalizedColumns[1][2]) {
            quaternion[0] = -quaternion[0];
        }
        if (normalizedColumns[0][2] > normalizedColumns[2][0]) {
            quaternion[1] = -quaternion[1];
        }
        if (normalizedColumns[1][0] > normalizedColumns[0][1]) {
            quaternion[2] = -quaternion[2];
        }

        // correct for occasional, weird Euler synonyms for 2d rotation
        let rotationDegrees;
        if (
            quaternion[0] < 0.001 &&
            quaternion[0] >= 0 &&
            quaternion[1] < 0.001 &&
            quaternion[1] >= 0
        ) {
            // this is a 2d rotation on the z-axis
            rotationDegrees = [
                0,
                0,
                roundToThreePlaces(
                    (Math.atan2(normalizedColumns[0][1], normalizedColumns[0][0]) * 180) / Math.PI
                )
            ];
        } else {
            rotationDegrees = quaternionToDegreesXYZ(quaternion);
        }

        // expose both base data and convenience names
        return {
            rotateX: rotationDegrees[0],
            rotateY: rotationDegrees[1],
            rotateZ: rotationDegrees[2],
            scaleX: roundToThreePlaces(scale[0]),
            scaleY: roundToThreePlaces(scale[1]),
            scaleZ: roundToThreePlaces(scale[2]),
            translateX: translation[0],
            translateY: translation[1],
            translateZ: translation[2],
            skewXY: roundToThreePlaces(skew[0]) * RAD_TO_DEG,
            skewXZ: roundToThreePlaces(skew[1]) * RAD_TO_DEG,
            skewYZ: roundToThreePlaces(skew[2] * RAD_TO_DEG)
        };
    }


    /*
    DOMMatrix is column major, meaning:
     _               _
    | m11 m21 m31 m41 |
      m12 m22 m32 m42
      m13 m23 m33 m43
      m14 m24 m34 m44
    |_               _|
    */
    var decomposeDOMMatrix = function(domMatrix) {
        const indexableVersionOfMatrix = new Array(4);
        for (let columnIndex = 1; columnIndex < 5; columnIndex++) {
            const columnArray = indexableVersionOfMatrix[columnIndex - 1] = new Array(4);
            for (let rowIndex = 1; rowIndex < 5; rowIndex++) {
                columnArray[rowIndex - 1] = domMatrix[`m${columnIndex}${rowIndex}`];
            }
        }

        return decomposeMatrix(indexableVersionOfMatrix);
    }

    return decomposeDOMMatrix(domMatrix);
}