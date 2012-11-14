
var canvas, renderer, documents, currentLayout;

$(function () {
	initData();
	
	$('#layoutButtons').append($('<button class="btn">Kompakt</button>').click(function () { 
		$('#canvas').css('min-height', '850px');
		setLayout(layouts.compact, 1000);
	}));
	$('#layoutButtons').append($('<button class="btn">nach Qualität</button>').click(function () { 
		$('#canvas').css('min-height', '850px');
		setLayout(layouts.quality, 1000);
	}));
	$('#layoutButtons').append($('<button class="btn">Quartalsweise</button>').click(function () { 
		$('#canvas').css('min-height', '1550px');
		setLayout(layouts.quarterly, 1000);
	}));
	
	canvas = $('#canvas');
	renderer = new Renderer(canvas);
	documents = new Documents(renderer);
	documents.setPosition(layouts.compact.projection());
	setLayout(layouts.compact, 0);
	
	initSearch();
});

function setLayout(layout, duration) {
	if (layout === currentLayout) return;
	if (currentLayout && currentLayout.end) currentLayout.end(duration);
	if (layout.init) layout.init(duration);
	documents.moveToPosition(layout.projection(), duration);
	currentLayout = layout;
}

var layouts = {
	compact: {
		projection: function () {
			var w = $('#canvas').innerWidth()-40;
			var n = Math.floor(w/41);
			return function (i, data) {
				return {
					x: ((307-i) % n)*41+20,
					y: Math.floor((307-i)/n)*50+20
				}
			}
		}
	},
	quality: {
		init: function () {
			var temp = [];
			for (var i = 0; i < $documents.length; i++) {
				temp[i] = {index:i, quality:$documents[i].qualitySum};
			}
			temp.sort(function (a,b) {
				return b.quality - a.quality;
			});
			var a = [];
			for (var i = 0; i < temp.length; i++) {
				a[temp[i].index] = i;
			}
			this.lookup = a;
		},
		projection: function () {
			var w = $('#canvas').innerWidth()-40;
			var n = Math.floor(w/41);
			var lookup = this.lookup;
			return function (index, data) {
				var i = lookup[index];
				return {
					x: ((307-i) % n)*41+20,
					y: Math.floor((307-i)/n)*50+20
				}
			}
		},
		lookup: []
	},
	quarterly: {
		init: function (duration) {
			if (!this.labels) {
				this.labels = $('<div style="display:none"></div>');
				var projection = this.projection();
				for (var i = 2005; i <= 2012; i++) {
					var p = projection(0, {w:0, j:i});
					this.labels.append($('<div class="backgroundLabel">'+i+'</div>').css({top:p.y+1, left:20}));
				}
				canvas.append(this.labels);
			}
			this.labels.fadeIn(duration);
		},
		end: function (duration) {
			if (this.labels) this.labels.fadeOut(duration);
		},
		labels: false,
		projection: function () {
			return function (i, data) {
				return {
					x: (data.w % 13)*41+120,
					y: (30-(Math.floor(data.w/13) + (data.j - 2005)*4))*50+30
				}
			}
		}
	}
};

function initCanvas() {
/*
	// weeks
	var dMin = 36920;
	var dMax = 41190;
	for (var d = dMin; d <= dMax; d += 14) {
		var x = date2position(d, 'dailyX');
		timeline.append($('<div class="week" style="left:'+x+'px; width:14px;"></div>'))
	}
	
	// months
	var months = ['Jan','Feb','März','April','Mai','Juni','Juli','Aug','Sep','Okt','Nov','Dez'];
	var mMin = 2001*12 + 1 - 1;
	var mMax = 2012*12 + 9 - 1;
	for (var m = mMin; m <= mMax; m++) {
		var dt0 = new Date(Math.floor(m/12), (m % 12), 1);
		var dt1 = new Date(Math.floor((m+1)/12), ((m+1) % 12), 1);
		
		var t0 = dt0.getTime();
		var t1 = dt1.getTime();
		
		var x0 = time2position(t0, 'dailyX');
		var x1 = time2position(t1, 'dailyX');
		
		var text = '<br>' + months[m % 12];
		if (m % 12 == 0) text = Math.floor(m/12) + text;
		
		timeline.append($('<div class="month" style="left:'+(x1-30)+'px; width:'+(x0-x1)+'px">'+text+'</div>'))
	}	
	
	
	for (var i = 0; i < documents.length; i++) {
		var document = documents[i];
		var t = date2time(document.s);
		var p = date2position(document.s, '4weekly');
		var thumb = 'style/thumb' + document.t.substr(0,1) + '.png';
		timeline.append($('<div class="documenticon" style="left:'+p.x+'px; top:'+(p.y+300)+'px; background-image:url('+thumb+')"></div>'))
	}
	
	// events
	var freeCols = [];
	for (var i = 0; i < events.length; i++) {
		var event = events[i];
		//if (event.t != '') {
			var x = date2position(event.s, 'weeklyX');
			
			var y = 0;
			if (freeCols[x] !== undefined) y = freeCols[x]+1;
			freeCols[x] = y;
			
			var rad = Math.round(Math.sqrt(event.p + event.m + 1)*2);
			var c1 = Math.round(255*event.p/(event.p + event.m + 1));
			var c2 = Math.round(255*event.m/(event.p + event.m + 1));
			var color = 'rgb(' + c2 + ',0,' + c1 + ')';
			
			y = 230 - y*14;
			event.x = x;
			event.y = y;
			
			var eventNode = $('<div class="event" style="left:'+(x-rad-1)+'px;top:'+(y-rad)+'px;height:'+(rad*2)+'px;width:'+(rad*2)+'px;background:'+color+'"></div>');
			timeline.append(eventNode);
			eventNode.hover((function () {
				var e = event;
				return function () {
					hover.show();
					hover.css({left:e.x+6,top:e.y+6});
					hover.html('<b>' + e.t + '</b><br>' + e.d);
				}
			})(), function () {
				hover.hide();
			});
		//}
	}
	*/
}

function unselect() {
	if (window.getSelection) {
		if (window.getSelection().empty) {
			window.getSelection().empty();
		} else if (window.getSelection().removeAllRanges) {
			window.getSelection().removeAllRanges();
		}
	} else if (document.selection) {
		document.selection.empty();
	}
}



