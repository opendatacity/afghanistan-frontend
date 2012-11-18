
var canvas, renderer, documents, documentsIndex, currentLayout;
var $pages = [];
var layoutingDuration = 500;

$(function () {
	initData();
	
	$('#layoutButtons').append($('<button class="btn active">Quartalsweise</button>').click(function () {
		setLayout(layouts.quarterly, layoutingDuration);
	}));
	$('#layoutButtons').append($('<button class="btn">Nach Qualität</button>').click(function () {
		setLayout(layouts.quality, layoutingDuration);
	}));
	$('#layoutButtons').append($('<button class="btn">Noch mehr Funktionen demnächst!</button>'));
	
	$('#impressum').hide();
	
	$('#link-impressum').popover({
		html: true,
		content: $('#impressum').html(),
		placement: 'top'
	});
	
	$('#lightbox-controls a').click(function(e){
		$(this).blur();
		e.preventDefault();
	});
	
	canvas = $('#canvas');
	renderer = new Renderer(canvas);
	documents = new Documents(renderer);
	setLayout(layouts.quarterly, 0);

	hashCheck();
	
	$(window).bind('hashchange', function(e){
		hashCheck();
	});

	$(window).bind('onhashchange', function(e){
		hashCheck();
	});
	
	$(window).resize((function () {
		var resizeStarted = false;
		var resizeInProg = false;
		var check = function () {
			if (resizeInProg) {
				resizeInProg = false;
				setTimeout(check, 250);
			} else {
				relayout(layoutingDuration);
				resizeStarted = false;
			}
		}
		return function () {
			resizeInProg = true;
			if (!resizeStarted) check();
			resizeStarted = true;
		}
	})())
		
	initSearch();
});

function relayout(duration) {
	documents.newLayout(currentLayout, duration);
}

function setLayout(layout, duration) {
	if (layout === currentLayout) return;
	if (currentLayout && currentLayout.hide) currentLayout.hide(duration);
	if (layout.show) layout.show(duration);
	if (currentLayout === undefined) {
		documents.newLayout(layout, 0);
	} else {
		documents.newLayout(layout, duration);
	}
	currentLayout = layout;
}

var layouts = {
	quality: {
		maxY: 0,
		show: function () {
			this.maxY = 0;
			var temp = [];
			for (var i = 0; i < $documents.length; i++) temp[i] = {index:i, quality:$documents[i].qualitySum};
			temp.sort(function (a,b) {
				return b.quality - a.quality;
			});
			var a = [];
			for (var i = 0; i < temp.length; i++) a[temp[i].index] = i;
			this.lookup = a;
		},
		projection: function () {
			var w0 = $('#canvas').innerWidth()-40;
			var w = w0 - 120;
			var n = Math.floor(w/41);
			if (n < 5) n = 5;
			var x0 = 100+(w-(n*41 - 20))/2;
			var lookup = this.lookup;
			var me = this;
			return function (index, data) {
				var i = lookup[index];
				var x = ((307-i) % n)*41+20 + x0;
				var y = Math.floor((307-i)/n)*50 + 20;
				if (me.maxY < y) me.maxY = y;
				return {x:x, y:y};
			}
		},
		lookup: []
	},
	quarterly: {
		maxY: 0,
		show: function (duration) {
			if (!this.labels) {
				this.maxY = 0;
				this.labels = $('<div style="display:none"></div>');
				var projection = this.projection();
				for (var i = 2005; i <= 2012; i++) {
					var p = projection(0, {w:0, j:i});
					this.labels.append($('<div class="backgroundLabel">'+i+'</div>').css({top:p.y+1, left:20}));
					if (this.maxY < p.y) this.maxY = p.y+20;
				}
				canvas.append(this.labels);
			}
			this.labels.fadeIn(duration);
		},
		hide: function (duration) {
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


