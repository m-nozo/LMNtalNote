var Process = function (parent) {
    this.root = new Empty();
};
Process.prototype.encode = function () {
    return this.root.encode();
};


var Empty = function () {
};
Empty.prototype.encode = function () {
    return '()';
};


var Mole = function (left, right) {
    this.left  = left;
    this.right = right;
};
Mole.prototype.encode = function () {
    return `${this.left.encode()}, ${this.right.encode()}`;
};


var Atom = function (name) {
    this.parent = null;
    this.name  = name;
    this.links = [];
    this.angle = 0;
};
Atom.prototype.encode = function () {
    var sorted_links = this.links.sort(function (a,b) {return ((360+a.angle-this.angle)%360 < (360+b.angle-this.angle)%360) ? -1 : 1});
    return `${this.name}(${sorted_links.toString()})`;
};


var Link = function (name, angle) {
    this.name = name;
    this.angle = angle;
};
Link.prototype.toString = function () {
    return this.name;
};


var Membrane = function () {
    this.parent = null;
    this.process = new Process();
};
Membrane.prototype.encode = function () {
    return `{ ${this.process.encode()} }`;
};


var Rule = function () {
    this.parent = null;
    this.head  = new Process();
    this.body  = new Process();
    this.guard = '';
};
Rule.prototype.encode = function () {
    return `( ${this.head.encode()} :- ${this.guard.encode()} | ${this.body.encode()} )`;
};


var ProcessContexts = function (name) {
    this.name = name;
    this.links = [];
};
ProcessContexts.prototype.encode = function () {
    return `$${this.name}[${this.links.toString()}]`;
};


/*
  push Process
*/
Process.prototype.push = function (process) {
    this.root = new Mole(this.root, process);
    process.parent = this.root;
};

/*
  pop Process
*/
Atom.prototype.pop = function () {
    this.parent.right = new Empty();
    return this;
};

Membrane.prototype.pop = function () {
    this.parent.right = new Empty();
    return this;
};

Rule.prototype.pop = function () {
    this.parent.right = new Empty();
    return this;
};
