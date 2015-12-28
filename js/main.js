window.onload = function () {
    var svgns = "http://www.w3.org/2000/svg";
    var xlinkns = "http://www.w3.org/1999/xlink";

    svg = document.getElementById("svg");
    var bg = svg.children.bg;
    var guide = svg.children.guide;

    var pool = svg.children.pool;
    var layer1 = pool.children.layer1;
    var layer2 = pool.children.layer2;

    var grid = svg.children.grid;
    var grid_w = grid.getAttribute("width");
    var grid_h = grid.getAttribute("height");

    var tool_atom = svg.children.tool_atom;
    var tool_memb = svg.children.tool_memb;
    var tool_rule = svg.children.tool_rule;
    var tool_process_context = svg.children.tool_process_context;

    var mouse = {x:0, y:0, px:0, py:0, down:false, moved:false, scroll:false, mode:"atom"};
    var latestlink = null;
    var latestmemb = null;
    var latestmemb_pos = {x:0, y:0};
    var latestatom = null;

    // select mouse mode
    tool_atom.addEventListener("click", function (e) {
	mouse.mode = "atom";
	console.log("mouse mode:" + mouse.mode);
    }, false);

    tool_memb.addEventListener("click", function (e) {
	mouse.mode = "memb";
	console.log("mouse mode:" + mouse.mode);
    }, false);

    tool_rule.addEventListener("click", function (e) {
	mouse.mode = "rule";
	console.log("mouse mode:" + mouse.mode);
    }, false);

    tool_process_context.addEventListener("click", function (e) {
	mouse.mode = "process_context";
	console.log("mouse mode:" + mouse.mode);
    }, false);

    //====================================
    // Document event
    //====================================
    document.addEventListener("mousedown", function (e) {
	mouse.moved = false;
	mouse.down = true;
    }, false);

    document.addEventListener("mouseup", function (e) {
	mouse.moved = false;
	mouse.down = false;
	mouse.scroll = false;

	latestmemb = null;
	latestmemb_pos = null;

	if (latestlink != null) {
	    var guide_pos = get_pos_rel(grid, guide);
	    set_pos_abs(create_new_free_link(), guide_pos.x, guide_pos.y);
	    latestlink = null;
	}
    }, false);

    document.addEventListener("mousemove", function (e) {
	mouse.moved = true;
	mouse.px = mouse.x;
	mouse.py = mouse.y;
	mouse.x = e.pageX;
	mouse.y = e.pageY;
    }, false);

    // set guide
    document.addEventListener("mousemove", function (e) {
	var grid_pos = get_pos(grid);
	var guide_pos;

	switch (mouse.mode) {
	case "process_context" :
	case "rule" :
	case "atom" : // set guide pos in atom mode
	    guide_pos = get_grid_cross_pos(mouse.x-grid_pos.x, mouse.y-grid_pos.y);
	    set_pos_rel(grid, guide, guide_pos.x, guide_pos.y);
	    break;
	    
	case "memb" : // set guide pos in memb mode
	    guide_pos = get_grid_mid_pos(mouse.x-grid_pos.x, mouse.y-grid_pos.y);
	    set_pos_rel(grid, guide, guide_pos.x, guide_pos.y);
	    break;
	}
    }, false);

    // scroll background
    document.addEventListener("mousemove", function (e) {
	if (mouse.scroll) pan(mouse.x-mouse.px, mouse.y-mouse.py);
    }, false);

    // mouse drag animation
    document.addEventListener("mousemove", function (e) {
	var guide_pos = get_pos_rel(grid, guide);

	if (latestlink != null) {
	    latestlink.setAttribute("x2", guide_pos.x);
	    latestlink.setAttribute("y2", guide_pos.y);
	}

	if (latestmemb != null) {
	    if (guide_pos.x > latestmemb_pos.x) {
		latestmemb.setAttribute("width", guide_pos.x-latestmemb_pos.x);
	    } else {
 		latestmemb.setAttribute("x", guide_pos.x);
		latestmemb.setAttribute("width", latestmemb_pos.x-guide_pos.x);
	    }

	    if (guide_pos.y > latestmemb_pos.y) {
		latestmemb.setAttribute("height", guide_pos.y-latestmemb_pos.y);
	    } else {
 		latestmemb.setAttribute("y", guide_pos.y);
		latestmemb.setAttribute("height", latestmemb_pos.y-guide_pos.y);
	    }
	}
	if (latestatom != null) {
	    var latestatom_pos_abs = get_pos(latestatom);
	    var grid_pos = get_pos(grid);
	    var angle = -Math.atan2(
		(latestatom_pos_abs.x+grid_pos.x)-mouse.x,
		(latestatom_pos_abs.y+grid_pos.y)-mouse.y
	    ) / Math.PI*180;
	    latestatom.setAttribute("transform",
				    `rotate(
					${angle},
					${latestatom_pos_abs.x},
					${latestatom_pos_abs.y}
				    )`);
	}
    }, false);

    //====================================
    // Background event
    //====================================
    // mouse event setting
    bg.addEventListener("mousedown", function (e) {
	mouse.scroll = true;
	mousedown_on_process();
    }, false);

    bg.addEventListener("mouseup", function (e) {
	mouseup_on_process();
    }, false);

    bg.addEventListener("mousemove", function (e) {
    }, false);

    //====================================
    // Process
    //====================================
    // create process object on parent_process
    function mousedown_on_process (parent_process) {
	var guide_pos = get_pos_rel(grid, guide);

	switch (mouse.mode) {
	case "memb" :
	    mouse.scroll = false;
    	    set_pos_abs(create_new_memb(), guide_pos.x, guide_pos.y);
	    latestmemb_pos = {
		x : guide_pos.x,
		y : guide_pos.y
	    };
	    break;
	}
    }

    function mouseup_on_process (parent_process) {
	if(mouse.moved) return;
	var guide_pos = get_pos_rel(grid, guide);

	switch (mouse.mode) {
	case "atom" :
    	    set_pos_abs(create_new_atom(), guide_pos.x, guide_pos.y);
	    break;
	case "process_context" :
    	    set_pos_abs(create_new_process_context(), guide_pos.x, guide_pos.y);
	    break;
	case "rule" :
    	    set_pos_abs(create_new_rule(), guide_pos.x, guide_pos.y);
	    break;
	}
    }

    //====================================
    // Atom
    //====================================
    function create_new_atom () {
	var newAtom = document.createElementNS(svgns, "use");
	newAtom.setAttributeNS(xlinkns, "href", "#atom");
	newAtom.setAttribute("fill", "white");
	newAtom.addEventListener("mousedown", mousedown_on_atom, false);
	newAtom.addEventListener("mouseup", mouseup_on_atom, false);
    	layer2.appendChild(newAtom);

	console.log("create atom.");
	console.dir(newAtom);

	latestatom = null;
	latestatom = newAtom;
	return newAtom;
    }

    function mousedown_on_atom (e) {
	var atom_pos = get_pos(this);
    	latestlink = create_new_link();
	latestlink.setAttribute("x1", atom_pos.x);
	latestlink.setAttribute("y1", atom_pos.y);
	latestlink.setAttribute("x2", atom_pos.x);
	latestlink.setAttribute("y2", atom_pos.y);
    }

    function mouseup_on_atom (e) {
	latestlink = null;
    }

    //====================================
    // Link
    //====================================
    function create_new_link () {
	var newLink = document.createElementNS(svgns, "line");
    	newLink.setAttribute("stroke", "black");
    	newLink.setAttribute("stroke-width", "3");
    	newLink.addEventListener("click", remove_link, false);
	layer1.appendChild(newLink);

	console.log("create link.", newLink);

	return newLink;
    }

    function remove_link () {
	console.log("remove link.", this);
	this.parentNode.removeChild(this);
    }

    //====================================
    // Membrane
    //====================================
    function create_new_memb () {
	var newMemb = document.createElementNS(svgns, "rect");
    	newMemb.setAttribute("rx", "14");
    	newMemb.setAttribute("ry", "14");
    	newMemb.setAttribute("width", "60");
    	newMemb.setAttribute("height", "60");
    	newMemb.setAttribute("fill", "blue");
    	newMemb.setAttribute("fill-opacity", "0.1");
    	newMemb.setAttribute("stroke", "black");
    	newMemb.setAttribute("stroke-width", "3");
	newMemb.addEventListener("mousedown", mousedown_on_memb, false);
	newMemb.addEventListener("mouseup", mouseup_on_memb, false);
	layer1.appendChild(newMemb);

	console.log("create membrane.", newMemb);

	latestmemb = newMemb;
	return newMemb;
    }

    function mousedown_on_memb (e) {
	mousedown_on_process();
    }

    function mouseup_on_memb (e) {
	mouseup_on_process();
    }

    //====================================
    // Rule
    //====================================
    function create_new_rule () {
	var newRule = document.createElementNS(svgns, "use");
	newRule.setAttributeNS(xlinkns, "href", "#rule_arrow");
	newRule.setAttribute("fill", "white");
    	layer2.appendChild(newRule);

	console.log("create rule.");

	return newRule;
    }

    //====================================
    // Process Context
    //====================================
    function create_new_process_context () {
	var newProcessContext = document.createElementNS(svgns, "use");
	newProcessContext.setAttributeNS(xlinkns, "href", "#process_context");
	newProcessContext.setAttribute("fill", "white");
	newProcessContext.addEventListener("mousedown", mousedown_on_atom, false);
	newProcessContext.addEventListener("mouseup", mouseup_on_atom, false);
    	layer2.appendChild(newProcessContext);

	console.log("create Process Context.", newProcessContext);

	return newProcessContext;
    }

    //====================================
    // Free Link
    //====================================
    function create_new_free_link () {
	var newFreeLink = document.createElementNS(svgns, "use");
	newFreeLink.setAttributeNS(xlinkns, "href", "#free_link");
	layer1.appendChild(newFreeLink);

	console.log("create free link.");

	return newFreeLink;
    }

    //====================================
    // SVG methods
    //====================================
    function get_grid_cross_pos(x, y){
	return {
	    x : grid_w*((x/grid_w+(x<0?-0.5:0.5))|0),
	    y : grid_h*((y/grid_h+(y<0?-0.5:0.5))|0)
	};
    }

    function get_grid_mid_pos(x, y){
	return {
	    x : (x<0?-grid_w/2:grid_w/2)+grid_w*((x/grid_w)|0),
	    y : (y<0?-grid_h/2:grid_h/2)+grid_h*((y/grid_h)|0)
	};
    }

    function pan(dx, dy){
	var grid_pos = get_pos(grid);
	move(grid, dx, dy);
	pool.setAttribute(
	    "transform",
	    "translate("+(grid_pos.x+dx)+","+(grid_pos.y+dy)+")"
	);
    }

    // set position absolute
    function set_pos_abs(obj, x, y) {
	obj.setAttribute("x", x);
	obj.setAttribute("y", y);
    }

    // set position relative
    function set_pos_rel(base_obj, set_obj, x, y) {
	var base_pos = get_pos(base_obj);
	set_pos_abs(set_obj, base_pos.x+x, base_pos.y+y);
    }

    // get position
    function get_pos(obj) {
	return {
	    x: Number(obj.getAttribute("x")),
	    y: Number(obj.getAttribute("y"))
	}
    }

    // get position relative
    function get_pos_rel(base_obj, obj) {
	return {
	    x: obj.getAttribute("x")-base_obj.getAttribute("x"),
	    y: obj.getAttribute("y")-base_obj.getAttribute("y"),
	}
    }

    // move position (obj.x+dx, obj.y+dy)
    function move(obj, dx, dy) {
	var obj_pos = get_pos(obj);
	set_pos_abs(obj, obj_pos.x+dx, obj_pos.y+dy);
    }
}


// // update position of 
// document.addEventListener("touchmove", function (e) {
// 	mouse.move = true;
// 	mouse.px = mouse.x;
// 	mouse.py = mouse.y;
// 	mouse.x = e.changedTouches[0].pageX | 0;
// 	mouse.y = e.changedTouches[0].pageY | 0;
// }, false);

// // prevent default touchmove event
// document.addEventListener("touchmove", function (e) {
// 	e.preventDefault();
// }, false);

// // touch event setting
// bg.addEventListener("touchstart", function (e) {
// 	mouse.move = false;
// 	mouse.down = true;
// 	mouse.x = e.changedTouches[0].pageX | 0;
// 	mouse.y = e.changedTouches[0].pageY | 0;
// 	mouse.px = mouse.x;
// 	mouse.py = mouse.y;
// }, false);

// bg.addEventListener("touchmove", bg_scroll, false);
