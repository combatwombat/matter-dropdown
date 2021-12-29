# MatterDropdown 0.1

Applies physics to DOM elements and lets you bounce them around with the mouse. Built with [matter.js](https://github.com/liabru/matter-js/) and [ismailman/decompose-dommatrix](https://github.com/ismailman/decompose-dommatrix).

Example: [dropdown.robsite.net](https://dropdown.robsite.net)  
Simple Example with debug mode: [dropdown.robsite.net/simple-example](https://dropdown.robsite.net/simple-example)

## Usage

Don't. This is just for inspiration and not meant for people to use, yet. It doesn't really work with responsive websites or touch controls. Try [elopezga/matter-dom-plugin](https://github.com/elopezga/matter-dom-plugin) for a somewhat similar thing with more features and support.

But:

1. Include `matter.js`, `matter-dropdown.js`:
   ```
   <script src="matter.js" type="text/javascript"></script>
   <script src="matter-dropdown.js" type="text/javascript"></script>
   ```
2. Add a `#matter-canvas` element and hide it. Optionally do this to see it in debug mode:
   ```
   <canvas id="matter-canvas"></canvas>
   <style>
       body {
           position: relative;
       }
       #matter-canvas {
           display: none;
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           bottom: 0;
           width: 100%;
           height: 100%;
           opacity: 0.5;
           z-index: 100000;
           pointer-events: none;
       }
       body.debug #matter-canvas {
           display: block;
       }
       .matter {
           z-index: 90000;
       }
   </style>
   ```
3. Add class `matter` to all elements that should be affected by physics.
   1. Add class `matter-static` to all fixed elements, on which others bounce off.
   2. Add class `matter-static-animated` to fixed elements whose position changes (like with CSS- or JS-animations)
4. Initialize MatterDropdown with optional options:
   ```
   <script>
       window.addEventListener('load', function() {
           var dropdown = MatterDropdown({
               bounceDebounce: 50,               // how often are bounce-mouse interactions done? in ms
               timeToInteraction: 3000,          // how long until we can interact after creating the first interactive object with dropdown.addElement(el)?
               mouseBounceForce: {x: 0, y: -0.5} // for applyForce() when mouse touches non-static object. lower y = bouncier
           });
           dropdown.init();
       });
   </script>
   ```  
   Now all elements with only the class `matter` fall down and bounce off the static elements.
5. Add other interactive elements later. For example, show a dropdown submenu and apply physics after 1 second:
   ```
   var menuItems = document.querySelectorAll('.menu > li > a');
   menuItems.forEach(function(el) {
       el.addEventListener('click', function(ev) {
           ev.preventDefault();
           var submenu = ev.currentTarget.parentElement.querySelector('ul');
           submenu.classList.add('visible');
           setTimeout(function() {
               dropdown.addElement(submenu);
           }, 1000);
       })
   })
   ```
6. A `border-radius` gets recognized automatically. Give the element the class `has-boxshadow` if it has one. Can only be `rgba(0,0,0,0.5) 0 10px 20px;` (or change it in `matter-dropdown.js`)
7. An existing element with class `matter` is added to the physics objects immediately after init(). Give it the attribute `data-matter-init-delay="1000"` to delay that init by 1000ms.
   