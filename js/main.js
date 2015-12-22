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

    var mouse = {x:0, y:0, px:0, py:0, down:false, moved:false, mode:"atom"};
    var latestlink = null;
    var latestmemb = null;

    // select mouse mode
    document.getElementById("tool_atom").addEventListener("click", function (e) {
	mouse.mode = "atom";
	console.log("mouse mode:" + mouse.mode);
    }, false);

    document.getElementById("tool_memb").addEventListener("click", function (e) {
	mouse.mode = "memb";
	console.log("mouse mode:" + mouse.mode);
    }, false);

    // update position of mouse
    document.addEventListener("mousemove", function (e) {
	mouse.moved = true;
	mouse.px = mouse.x;
	mouse.py = mouse.y;
	mouse.x = e.pageX;
	mouse.y = e.pageY;
    }, false);

    document.addEventListener("mousedown", function (e) {
	mouse.moved = false;
	mouse.down = true;
    }, false);

    document.addEventListener("mouseup", function (e) {
	mouse.moved = false;
	mouse.down = false;
    }, false);


    // set guide
    document.addEventListener("mousemove", function (e) {
	var grid_pos = get_pos(grid);
	var guide_pos;

	switch (mouse.mode) {
	case "atom" : // set guide pos in atom mode
	    guide_pos = get_grid_cross_pos(mouse.x-grid_pos.x, mouse.y-grid_pos.y);
	    break;
	    
	case "memb" : // set guide pos in memb mode
	    guide_pos = get_grid_mid_pos(mouse.x-grid_pos.x, mouse.y-grid_pos.y);
	    break;
	}
	set_pos_rel(grid, guide, guide_pos.x, guide_pos.y);
    }, false);

    //====================================
    // Background event
    //====================================
    // mouse event setting
    bg.addEventListener("mousedown", function (e) {
    }, false);

    bg.addEventListener("mouseup", function (e) {
	create_new_process();
    }, false);

    bg.addEventListener("mousemove", function (e) {
	if(mouse.down || latestlink!=null){
	    var grid_pos = get_pos(grid);

	    // newLink animation for mousedrag
	    switch (mouse.mode) {
	    case "atom":
		var guide_pos = get_grid_cross_pos(mouse.x-grid_pos.x, mouse.y-grid_pos.y);
		if(latestlink!=null){
		    latestlink.setAttribute("x2", guide_pos.x);
		    latestlink.setAttribute("y2", guide_pos.y);
		}
		break;

	    // newMemb animation for mousedrag
	    case "memb":
		var guide_pos = get_grid_mid_pos(mouse.x-grid_pos.x, mouse.y-grid_pos.y);
		var memb_pos = get_pos(latestmemb);

		if (guide_pos.x >= memb_pos.x) {
		    latestmemb.setAttribute("width", guide_pos.x-memb_pos.x);
		} else {
		}

		if (guide_pos.y >= memb_pos.y) {
		    latestmemb.setAttribute("height", guide_pos.y-memb_pos.y);
		} else {
		}

		break;
	    }
	}
    }, false);

    // scroll background
    bg.addEventListener("mousemove", function (e) {
	if (mouse.down && mouse.mode!="memb")
	    pan(mouse.x-mouse.px, mouse.y-mouse.py);
    }, false);

    //====================================
    // Process
    //====================================
    // create process object on parent_process
    function create_new_process (parent_process) {
	if(mouse.moved) return;
	var guide_pos = get_pos_rel(grid, guide);

	switch (mouse.mode) {
	case "atom" :
    	    set_pos_abs(create_new_atom(), guide_pos.x, guide_pos.y);
	    break;
	case "memb" :
    	    set_pos_abs(create_new_memb(), guide_pos.x, guide_pos.y);
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

	console.log("create atom.", newAtom);

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
	var atom_pos = get_pos(this);
	latestlink.setAttribute("x2", atom_pos.x);
	latestlink.setAttribute("y2", atom_pos.y);
	latestlink = null;
    }

    //====================================
    // Link
    //====================================
    function create_new_link () {
	var newLink = document.createElementNS(svgns, "line");
    	newLink.setAttribute("stroke", "black");
    	newLink.setAttribute("stroke-width", "2");
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
    	newMemb.setAttribute("stroke-width", "2");
	layer1.appendChild(newMemb);

	console.log("create membrane.", newMemb);

	return newMemb;
    }

    //====================================
    // Rule
    //====================================
    function create_new_rule () {
	console.log("create rule.");
    }

    //====================================
    // Process Context
    //====================================
    function create_new_process_context () {
	console.log("create Process Context.");
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
