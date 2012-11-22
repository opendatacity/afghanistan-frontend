
var canvas, renderer, documents, documentsIndex, currentDoc, currentLayout;
var $pages = [];
var layoutingDuration = 500;
var disqus_shortname, disqus_identifier, disqus_url, disqus_title;

$(function () {
	initData();
	
	$('#layoutButtons').append($('<button class="btn active">Quartalsweise</button>').click(function () {
		setLayout(layouts.quarterly, layoutingDuration);
	}));
	$('#layoutButtons').append($('<button class="btn">Nach Qualität</button>').click(function () {
		setLayout(layouts.quality, layoutingDuration);
	}));
	/*$('#layoutButtons').append($('<button class="btn">Noch mehr Funktionen demnächst!</button>'));*/
	
	/* intro */
	
	$('#nav-intro').click(function(){
		intro_toggle();
	});

	$('#intro-close').click(function(){
		intro_toggle();
	});

	if ($.cookie('show-intro') === 'false') {
		$('#intro').hide();
	} else {
		$('#nav-intro').parent().addClass('active');
	}

	$('#intro-more').click(function(){
		$('#intro-controls').remove();
		$('#intro-more').fadeIn('fast');
	});

	$($updates.comments).each(function(idx,e){
		$('#sidebar-comments').append($('<div class="sidebar-comment sidebar-subitem"><h3><a href="#!/'+e.link+'">'+e.article+'</a></h3><div class="date">'+e.date+'</div><div class="content"><a href="#!/'+e.link+'">'+e.content+'</a></div></div>'));
	});
	
	$($updates.changes).each(function(idx,e){
		var p = (e.change>=0) ? "+":"";
		$('#sidebar-changes').append($('<div class="sidebar-change sidebar-subitem"><h3><a href="#!/'+e.link+'">'+e.article+'</a></h3><div class="date">'+e.date+'</div><div class="content"><a href="#!/'+e.link+'">'+p+''+e.change+' Zeichen</a></div></div>'));
	});

	$('a','#sidebar-comments').click(function(evt){
		$('a','#lightbox-control-disqus').tab('show');
	});

	$('a','#sidebar-changes').click(function(){
		$('a','#lightbox-control-trans').tab('show');
	});

	$('#impressum').hide();
	
	$('#link-impressum').popover({
		html: true,
		content: $('#impressum').html(),
		placement: 'top',
		trigger: 'click',
	}).click(function(e){
		e.preventDefault();
		if (location.hash==='#!/impressum') {
			location.hash="!/";
		} else {
			location.hash='!/impressum'
		}
	});

	$('#lightbox-controls a').click(function(e){
		$(this).blur();
		e.preventDefault();
	});
	
	$('#lightbox-header-prev').click(function(){
		var d=$('#lightbox').data();
		var i=documentsIndex[d.issue];
		if (i === 0) {
			i = ($documents.length-1);
		} else {
			i--;
		}
		location.hash='!/'+$documents[i].title+'-01';
	});
	
	$('#lightbox-header-next').click(function(){
		var d=$('#lightbox').data();
		var i=documentsIndex[d.issue];
		if (i === ($documents.length-1)) {
			i = 0;
		} else {
			i++;
		}
		location.hash='!/'+$documents[i].title+'-01';
	});
	
	$('#share-twitter').click(function(){
		window.open($(this).attr('href'), "share", "width=500,height=300,status=no,scrollbars=no,resizable=no,menubar=no,toolbar=no");	
	});
	$('#share-facebook').click(function(){
		window.open($(this).attr('href'), "share", "width=500,height=300,status=no,scrollbars=no,resizable=no,menubar=no,toolbar=no");	
	});
	$('#share-google').click(function(){
		window.open($(this).attr('href'), "share", "width=500,height=300,status=no,scrollbars=no,resizable=no,menubar=no,toolbar=no");	
	});
	
	$('#download-document').click(function(){
		var d = $('#lightbox').data();
		location.href="data/images/"+d.issue+"-"+d.page+".png?download";
	});
	$('#download-text').click(function(){
		var d = $('#lightbox').data();
		location.href="download/text/"+d.issue+".txt?download";
	});
	
	disqus_shortname = 'afgpa';
 	disqus_identifier = (location.hash === "" || location.hash === "#") ? "default" : location.hash;
 	disqus_url = location.href;
	disqus_title = "Kommentare";

	(function() {
		var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
		dsq.src = 'http://' + disqus_shortname + '.disqus.com/embed.js';
		(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
	})();
	
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
		
	if ($('html').hasClass('lt-ie9')) {
		$('#search').html('');
	} else {
		initSearch();
	}
	
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
					var p = projection(0, {w:1, j:i});
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
				var w = data.w + 12;
				return {
					x: (w % 13)*41+120,
					y: (30-(Math.floor(w/13) - 1 + (data.j - 2005)*4))*50+30
				}
			}
		}
	}
};

function intro_toggle() {
	if ($('#intro:hidden').length === 0) {
		$('#intro').fadeOut('fast');
		$('#nav-intro').parent().removeClass('active');
		$.cookie('show-intro','false', {expires:7,path:'/'});
	} else {
		$('#intro').fadeIn('fast');
		$('#nav-intro').parent().addClass('active');
		$.cookie('show-intro','true', {expires:7,path:'/'});
	}
}


