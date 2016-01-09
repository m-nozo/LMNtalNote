window.onload = function () {
    var svgns = "http://www.w3.org/2000/svg";
    var xlinkns = "http://www.w3.org/1999/xlink";

    var textbox = document.getElementById("textbox");

    var svg = document.getElementById("svg");
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

    // link
    var latestlink = null;
    var link_creatable = false;

    // memb
    var latestmemb = null;
    var latestmemb_pos = {x:0, y:0};
    var head_rulememb = null;
    var body_rulememb = null;
    var rulememb_pos = {x:0, y:0};

    // atom
    var latestatom = null;
    var link_from_atom = null;
    var rename_atom = null;

    // rule
    var latestrule = null;
    var rename_guard = null;

    var link_index = 0;
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
	// prevent to show menu of right click
	e.preventDefault();
    }, false);

    document.addEventListener("mousedown", function (e) {
	mouse.moved = false;
	mouse.down = true;
    }, false);

    document.addEventListener("mouseup", function (e) {
	// reset mouse state
	mouse.moved = false;
	mouse.down = false;
	mouse.scroll = false;

	// reset etc state
	latestmemb = null;
	latestmemb_pos = null;
	head_rulememb = null;
	body_rulememb = null;
	rulememb_pos = null;
	latestatom = null;
	link_from_atom = null;	
	link_creatable = false;

	// cancel creating link
	if (latestlink != null) {
	    latestlink.parentNode.removeChild(latestlink);
	    latestlink = null;
	}

	// encode to lmntal program
	console.log(process_root.encode());
    }, false);

    // update mouse position
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
	case "atom" : // set guide pos in atom mode
	    guide_pos = get_grid_cross_pos(mouse.x-grid_pos.x, mouse.y-grid_pos.y);
	    set_pos_rel(grid, guide, guide_pos.x, guide_pos.y);
	    break;

	case "rule" :
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

	// link animation
	if (latestlink != null) {
	    latestlink.setAttribute("x2", guide_pos.x);
	    latestlink.setAttribute("y2", guide_pos.y);
	}

	// membrane animation
	if (latestmemb != null) {
	    drag_membrane(latestmemb, guide_pos.x, guide_pos.y, latestmemb_pos);
	}

	// rule animation
	if (head_rulememb != null && body_rulememb) {
	    drag_membrane(head_rulememb, 2*rulememb_pos.x-guide_pos.x, guide_pos.y, rulememb_pos);
	    drag_membrane(body_rulememb, guide_pos.x, guide_pos.y, rulememb_pos);
	}

	// rotate atom animation
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

    function drag_membrane (memb, x, y, base_pos) {
	if (x > base_pos.x) {
	    memb.setAttribute("width", x - base_pos.x);
	} else {
	    memb.setAttribute("x", x);
	    memb.setAttribute("width", base_pos.x - x);
	}

	if (y > base_pos.y) {
	    memb.setAttribute("height", y - base_pos.y);
	} else {
	    memb.setAttribute("y", y);
	    memb.setAttribute("height", base_pos.y - y);
	}
    }

    //====================================
    // Background event
    //====================================
    // mouse event setting
    bg.addEventListener("mousedown", function (e) {
	switch (e.button) {
	// left mouse button
	case 0: mousedown_on_process(process_root); break;
	// right mouse button
	case 2:	mouse.scroll = true; break;
	}
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
	    latestmemb = create_new_memb(parent_process);
    	    set_pos_abs(latestmemb, guide_pos.x, guide_pos.y);
	    latestmemb_pos = {
		x : guide_pos.x,
		y : guide_pos.y
	    };
	    latestmemb.lmntal_process = new Membrane();
	    parent_process.push(latestmemb.lmntal_process);

	    break;
	case "rule" :
	    mouse.scroll = false;
	    latestrule = create_new_rule(parent_process, guide_pos.x, guide_pos.y);
	    break;
	}
    }

    function mouseup_on_process (parent_process) {
	if(mouse.moved && mouse.mode!="rule") return;
	var guide_pos = get_pos_rel(grid, guide);

	switch (mouse.mode) {
	case "atom" :
	    create_new_atom(parent_process, "a", guide_pos.x, guide_pos.y);
	    break;
	case "process_context" :
	    create_new_process_context(parent_process, "p",guide_pos.x, guide_pos.y);
	    break;
	}
    }

    //====================================
    // Atom
    //====================================
    function create_new_atom (parent_process, name, x, y) {
	var atom =  base_atom(parent_process, name, x, y, "#atom");
	atom.lmntal_process = new Atom(name);
	parent_process.push(atom.lmntal_process);
	return atom;
    }

    function base_atom (parent_process, name, x, y, type) {
	var newAtom = document.createElementNS(svgns, "use");
	newAtom.setAttributeNS(xlinkns, "href", type);
	newAtom.setAttribute("fill", "white");
	newAtom.addEventListener("mouseleave", mouseleave_on_atom, false);
	newAtom.addEventListener("mousedown", mousedown_on_atom, false);
	newAtom.addEventListener("mouseup", mouseup_on_atom, false);
    	layer3.appendChild(newAtom);
	set_pos_abs(newAtom, x, y);
	
	newAtom.text = create_new_text(name);
	set_pos_abs(newAtom.text, x, y-text_margin);

	console.log("create atom.");
	console.dir(newAtom);

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

	if(link_from_atom != null) {
	    if(link_from_atom.linkname == undefined)
		conect_atom(link_from_atom, this, "L"+link_index++);
	    else
		conect_atom(link_from_atom, this, link_from_atom.linkname);
	}

	if (!mouse.move) {
	    textbox.focus();
	    rename_atom = this;
	    textbox.value = this.lmntal_process.name;
	}
    }

    function conect_atom (from_atom, to_atom, linkname) {
	if (from_atom == null || to_atom == null) return;
	var from_atom_pos = get_pos(from_atom);
	var to_atom_pos = get_pos(to_atom);
	var angle = get_angle(from_atom_pos, to_atom_pos);
	add_link(from_atom.lmntal_process, new Link(linkname, angle));
	angle += 180;
	add_link(to_atom.lmntal_process, new Link(linkname, angle < 360 ? angle : angle - 360));
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

    textbox.addEventListener("keyup", function () {
	if (rename_atom != null) {
	    rename_atom.text.textContent = this.value;
	    rename_atom.lmntal_process.name = this.value;
	}
	if (rename_guard != null) {
	    rename_guard.text.textContent = this.value;
	    rename_guard.lmntal_process.guard = this.value;
	}
    }, false);

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

	console.log("create membrane.");
	console.dir(newMemb);

	return newMemb;
    }

    function mousedown_on_memb (e) {
	switch (e.button) {
	// left mouse button
	case 0: mousedown_on_process(this.lmntal_process.root); break;
	// right mouse button
	case 2: mouse.scroll = true; break;
	}
    }

    function mouseup_on_memb (e) {
	mouseup_on_process(this.lmntal_process.root);
    }

    //====================================
    // Rule
    //====================================
    function create_new_rule (parent_process, x, y) {
	// create rulearrow
	var newRule = document.createElementNS(svgns, "use");
	newRule.setAttributeNS(xlinkns, "href", "#rule_arrow");
	newRule.setAttribute("fill", "white");
    	set_pos_abs(newRule, x, y);
	newRule.addEventListener("mouseup", mouseup_on_rulearrow, false);

	// create lmntal ruleobject
	newRule.lmntal_process = new Rule();
	parent_process.push(newRule.lmntal_process);

	// create rulemembs
	head_rulememb = create_new_memb(parent_process);
	head_rulememb.setAttribute("fill","red");
    	set_pos_abs(head_rulememb, x, y);
	rulememb_pos = {
	    x : x,
	    y : y
	};
	body_rulememb = create_new_memb(parent_process);
	body_rulememb.setAttribute("fill","red");
    	set_pos_abs(body_rulememb, x, y);
	rulememb_pos = {
	    x : x,
	    y : y
	};

	// set head/body of rule to rulemembs.
	head_rulememb.lmntal_process = {root:newRule.lmntal_process.head};
	body_rulememb.lmntal_process = {root:newRule.lmntal_process.body};

	// set rule obj to rulemembs
	head_rulememb.rule = newRule;
	body_rulememb.rule = newRule;

	// set rulememb to rule obj
	newRule.head = head_rulememb;
	newRule.body = body_rulememb;
	
	head_rulememb.addEventListener("mouseup", mouseup_on_rulememb, false);
	body_rulememb.addEventListener("mouseup", mouseup_on_rulememb, false);

    	layer3.appendChild(newRule);

	// set guard text
	newRule.text = create_new_text("");
	set_pos_abs(newRule.text, x, y-text_margin);

	console.log("create rule.");

	return newRule;
    }

    function mouseup_on_rulememb (e) {
	// set free link on rulemembs
	if (latestlink != null) {
	    var guide_pos = get_pos_rel(grid, guide);
	    var rulearrow_pos = get_pos(this.rule);
	    var rule_width = Number(this.getAttribute("width"));
	   
	    var freelink = create_new_free_link(this, "L"+link_index++);
	    set_pos_abs(freelink, guide_pos.x, guide_pos.y);
	    conect_atom(link_from_atom, freelink, freelink.linkname)

	    // add free link to the other rulememb
	    if (guide_pos.x < rulearrow_pos.x)
		set_pos_abs(create_new_free_link(this.rule.body, freelink.linkname), guide_pos.x+rule_width, guide_pos.y);
	    else
		set_pos_abs(create_new_free_link(this.rule.head, freelink.linkname), guide_pos.x-rule_width, guide_pos.y);

	    latestlink = null;
	}
    }

    function mouseup_on_rulearrow (e) {
	textbox.focus();
	rename_guard = this;
	textbox.value = this.lmntal_process.guard;
    }

    //====================================
    // Process Context
    //====================================
    function create_new_process_context (parent_process, name, x, y) {
	var process_ctx =  base_atom(parent_process, name, x, y, "#process_context");
	process_ctx.lmntal_process = new ProcessContexts(name);
	parent_process.push(process_ctx.lmntal_process);

	return process_ctx;
    }

    //====================================
    // Free Link
    //====================================
    function create_new_free_link (parent_process, linkname) {
	var newFreeLink = document.createElementNS(svgns, "use");
	newFreeLink.setAttributeNS(xlinkns, "href", "#free_link");
	newFreeLink.addEventListener("mouseleave", mouseleave_on_atom, false);
	newFreeLink.addEventListener("mousedown", mousedown_on_atom, false);
	newFreeLink.addEventListener("mouseup", mouseup_on_freelink, false);
	layer4.appendChild(newFreeLink);

	newFreeLink.linkname = linkname;

	console.log("create free link.");

	newFreeLink.lmntal_process = new Atom();
	newFreeLink.parent_process = parent_process;

	return newFreeLink;
    }

    function mouseup_on_freelink (e) {
	latestlink = null;
	if(link_from_atom == null) return;
	if (link_from_atom.linkname == undefined) {
	    conect_atom(link_from_atom, this, this.linkname);
	} else {
	    var equal_atom = new Atom('"="');
	    add_link(equal_atom, new Link(link_from_atom.linkname, 0));
	    add_link(equal_atom, new Link(this.linkname, 0));
	    this.parent_process.lmntal_process.root.push(equal_atom);
	}
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
