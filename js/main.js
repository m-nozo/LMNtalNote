window.onload = function () {
    var svgns = "http://www.w3.org/2000/svg";
    var xlinkns = "http://www.w3.org/1999/xlink";

    svg = document.getElementById("svg");
    var bg = svg.children.bg;
    var guide = svg.children.guide;

    var pool = svg.children.pool;
    var layer1 = pool.children.layer1;
    var layer2 = pool.children.layer2;
    var layer3 = pool.children.layer3;
    var layer4 = pool.children.layer4;

    var grid = svg.children.grid;
    var grid_w = grid.getAttribute("width");
    var grid_h = grid.getAttribute("height");

    var tool_atom = svg.children.tool_atom;
    var tool_memb = svg.children.tool_memb;
    var tool_rule = svg.children.tool_rule;
    var tool_process_context = svg.children.tool_process_context;

    var mouse = {x:0, y:0, px:0, py:0, down:false, moved:false, scroll:false, mode:"atom"};
    var latestlink = null;
    var link_creatable = false;
    var latestmemb = null;
    var latestmemb_pos = {x:0, y:0};
    var latestatom = null;
    var link_from_atom = null;

    var link_index = 0;
    var atom_index = 0;

    var text_margin = 22;

    process_root = new Process();

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
    document.addEventListener("contextmenu", function (e) {
	e.preventDefault();
    }, false);

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

	latestatom = null;
	
	link_creatable = false;

	console.log(process_root.encode());
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
	    var angle = get_angle(
		{x:latestatom_pos_abs.x + grid_pos.x,
		 y:latestatom_pos_abs.y + grid_pos.y
		}, mouse);

	    latestatom.setAttribute("transform",
				    `rotate(
					${angle},
					${latestatom_pos_abs.x},
					${latestatom_pos_abs.y}
				    )`);
	    latestatom.lmntal_process.angle = angle;
	}
    }, false);

    //====================================
    // Background event
    //====================================
    // mouse event setting
    bg.addEventListener("mousedown", function (e) {
	mouse.scroll = true;
	mousedown_on_process(process_root);
    }, false);

    bg.addEventListener("mouseup", function (e) {
	mouseup_on_process(process_root);
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
    	    set_pos_abs(create_new_memb(parent_process), guide_pos.x, guide_pos.y);
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
	    create_new_atom(parent_process, guide_pos.x, guide_pos.y);
	    break;
	case "process_context" :
	    create_new_process_context(parent_process, guide_pos.x, guide_pos.y);
	    break;
	case "rule" :
    	    set_pos_abs(create_new_rule(), guide_pos.x, guide_pos.y);
	    break;
	}
    }

    //====================================
    // Atom
    //====================================
    function create_new_atom (parent_process, x, y) {
	var newAtom = document.createElementNS(svgns, "use");
	newAtom.setAttributeNS(xlinkns, "href", "#atom");
	newAtom.setAttribute("fill", "white");
	newAtom.addEventListener("mouseleave", mouseleave_on_atom, false);
	newAtom.addEventListener("mousedown", mousedown_on_atom, false);
	newAtom.addEventListener("mouseup", mouseup_on_atom, false);
    	layer3.appendChild(newAtom);

	set_pos_abs(newAtom, x, y);
	set_pos_abs(create_new_text("hoge"+atom_index), x, y-text_margin);

	console.log("create atom.");
	console.dir(newAtom);

	newAtom.lmntal_process = new Atom("hoge"+atom_index);
	parent_process.push(newAtom.lmntal_process);

	atom_index++;
	return newAtom;
    }

    function mouseleave_on_atom (e) {
	if(!link_creatable || latestlink != null) return;

	var atom_pos = get_pos(this);
    	latestlink = create_new_link();
	latestlink.setAttribute("x1", atom_pos.x);
	latestlink.setAttribute("y1", atom_pos.y);
	link_from_atom = this;
    }

    function mousedown_on_atom (e) {
	switch (e.button) {
	case 0: // left mouse button
	    link_creatable = true;
	    break;
	case 2: // right mouse button
	    latestatom = this;
	    break;
	}
    }

    function mouseup_on_atom (e) {
	latestlink = null;

	if (link_from_atom != null) {
	    var from_atom_pos = get_pos(link_from_atom);
	    var to_atom_pos = get_pos(this);
	    var angle = get_angle(from_atom_pos, to_atom_pos);
	    add_link(link_from_atom.lmntal_process, new Link("L"+link_index, angle));
	    add_link(this.lmntal_process, new Link("L"+link_index, (angle+180) < 360 ? (angle+180) : (angle+180) - 360));
	    link_index++;
	}
    }

    //====================================
    // Text
    //====================================
    function create_new_text (name) {
	var newText = document.createElementNS(svgns, "text");
	newText.setAttribute("text-anchor", "middle");
	newText.setAttribute("fill", "white");
	newText.setAttribute("font-size", "20");
    	newText.setAttribute("font-weight", "bold");
    	newText.setAttribute("stroke", "black");
    	newText.setAttribute("stroke-width", "1");
	newText.setAttribute("class", "unselectable");
	newText.textContent = name;
	layer4.appendChild(newText);

	console.log("create text.", newText);

	return newText;
    }

    //====================================
    // Link
    //====================================
    function create_new_link () {
	var newLink = document.createElementNS(svgns, "line");
    	newLink.setAttribute("stroke", "black");
    	newLink.setAttribute("stroke-width", "3");
    	newLink.addEventListener("click", remove_link, false);
	layer2.appendChild(newLink);

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
    function create_new_memb (parent_process) {
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
	layer3.appendChild(newMemb);

	console.log("create membrane.", newMemb);

	newMemb.lmntal_process = new Membrane();
	parent_process.push(newMemb.lmntal_process);

	latestmemb = newMemb;
	return newMemb;
    }

    function mousedown_on_memb (e) {
	mouse.scroll = true;
	mousedown_on_process(this.lmntal_process.process);
    }

    function mouseup_on_memb (e) {
	mouseup_on_process(this.lmntal_process.process);
    }

    //====================================
    // Rule
    //====================================
    function create_new_rule () {
	var newRule = document.createElementNS(svgns, "use");
	newRule.setAttributeNS(xlinkns, "href", "#rule_arrow");
	newRule.setAttribute("fill", "white");
    	layer3.appendChild(newRule);

	console.log("create rule.");

	return newRule;
    }

    //====================================
    // Process Context
    //====================================
    function create_new_process_context (parent_process, x, y) {
	var newProcessContext = document.createElementNS(svgns, "use");
	newProcessContext.setAttributeNS(xlinkns, "href", "#process_context");
	newProcessContext.setAttribute("fill", "white");
	newProcessContext.addEventListener("mouseleave", mouseleave_on_atom, false);
	newProcessContext.addEventListener("mousedown", mousedown_on_atom, false);
	newProcessContext.addEventListener("mouseup", mouseup_on_atom, false);
    	layer3.appendChild(newProcessContext);

	set_pos_abs(newProcessContext, x, y);
	set_pos_abs(create_new_text("hoge"), x, y-text_margin);

	console.log("create Process Context.", newProcessContext);

	newProcessContext.lmntal_process = new ProcessContexts("hoge");
	parent_process.push(newProcessContext.lmntal_process);

	return newProcessContext;
    }

    //====================================
    // Free Link
    //====================================
    function create_new_free_link () {
	var newFreeLink = document.createElementNS(svgns, "use");
	newFreeLink.setAttributeNS(xlinkns, "href", "#free_link");
	layer4.appendChild(newFreeLink);

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

    // get angle (clockwise)
    function get_angle (from, to) {
	var angle = Math.atan2(
	    to.y - from.y,
	    to.x - from.x
	) / Math.PI*180 + 90;

	return angle >= 0 ? angle : angle+360;	
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
