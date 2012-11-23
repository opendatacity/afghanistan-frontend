
var canvas, renderer, documents, documentsIndex, currentDoc, currentLayout;
var $pages = [];
var layoutingDuration = 700;
var disqus_shortname, disqus_identifier, disqus_url, disqus_title;

$(function () {
	initData();
	
	$('#layoutButtons').append($('<button class="btn active">Nach Zeit</button>').click(function () {
		setLayout(layouts.time, layoutingDuration);
	}));
	$('#layoutButtons').append($('<button class="btn">Nach Qualität</button>').click(function () {
		setLayout(layouts.quality, layoutingDuration);
	}));
	/*
	$('#layoutButtons').append($('<button class="btn">Presse</button>').click(function () {
		setLayout(layouts.media, layoutingDuration);
	}));
	*/
	
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

	$('#intro-more-button').click(function(){
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
	setLayout(layouts.time, 0);

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
	
	$('#logo').click(function(){
		window.location.reload(true);
	});
		
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

function date2string(d) {
	var days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Sonnabend'];
	var months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
	d = (d-25569)*86400000;
	d = new Date(d);
	return d.getDate()+'. '+months[d.getMonth()]+' '+d.getFullYear()+' ('+days[d.getDay()]+')';
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
	time: {
		maxY: 0,
		show: function (duration) {
			if (!this.labels) {
				this.maxY = 0;
				this.labels = $('<div style="display:none"></div>');
				this.labelList = [];
				var projection = this.projection();
				for (var i = 2005; i <= 2012; i++) {
					var p = projection(0, {w:1, j:i});
					var label = $('<div class="backgroundLabel">'+i+'</div>').css({top:p.y+1, left:p.x-90, width:635});
					this.labelList.push({label:label, jahr:i});
					this.labels.append(label);
					if (this.maxY < p.y) this.maxY = p.y+20;
				}
				canvas.append(this.labels);
			}
			this.labels.delay(duration/2).fadeIn(duration/2);
		},
		hide: function (duration) {
			if (this.labels) this.labels.fadeOut(duration/2);
		},
		labelList: [],
		labels: false,
		projection: function () {
			var width = $('#canvas').innerWidth();
			var nx = 13;
			var ny = 4;
			var labelWidth = 635;
			if (width < 660) {
				nx = 9;
				ny = 6;
				labelWidth = 471;
			}
			var x0 = (width - (120+41*nx))/2;
			var me = this;
			me.maxY = 0;
			var f = function (i, data) {
				var w = data.w + (nx - 1);
				var x = (w % nx)*41+90 + x0;
				var y = ((- Math.floor(w/nx) - 1 + (2013 - data.j)*ny))*50+30;
				if (me.maxY < y) me.maxY = y;
				return {x:x, y:y};
			}
			for (var i = 0; i < this.labelList.length; i++) {
				var p = f(0, {w:1, j:this.labelList[i].jahr});
				this.labelList[i].label.animate({top:p.y+1, left:x0, width:labelWidth}, layoutingDuration);
			}
			return f;
		}
	}/*,
	media: {
		articles: false,
		maxY: 0,
		date2week: function (d) {
			return Math.floor((41161-d)/7);
		},
		show: function (duration) {
			if (!this.articles) {
				this.articles = $('<div class="articles" style="display:none"></div>');
				var projection = this.projection();
				var rowLength = [];
				this.maxY = 0;
				var me = this;
				for (var i = 0; i < $events.length; i++) {
					(function () {
						var event = $events[i];
						var url = event.q1;
						if (url == '') url = event.q2;
						var domain = url.match(/:\/\/(.[^/]+)/);
						if (domain != null) {
							domain = domain[1];
							var imgUrl = $favicons[domain];
							imgUrl = 'favicon/'+imgUrl+'.png';
							
							var p = projection(0, {s:event.s});
							var xi = (rowLength[p.yi] === undefined) ? 0 : rowLength[p.yi];
							rowLength[p.yi] = xi+1;
					
							var article = $('<a href="javascript:;" class="event" style="top:'+(p.y+7)+'px;left:'+(xi*18+p.x0+130)+'px"><img src="'+imgUrl+'"></a>');
							
							article.popover({
								html:true,
								title: function () {
									return event.t
								},
								content:function () {
									return event.d
								},
								trigger:'focus',
								placement:'bottom'
							});
							
							article.tooltip({html:true, placement:'right', title:function () {
								return '<b>'+event.t+'</b><br>'+date2string(event.s);
							}});
							
							me.articles.append(article);
							if (me.maxY < p.y) me.maxY = p.y+20;
						}
					})()
				}
				canvas.append(this.articles);
			}
			this.articles.delay(duration/2).fadeIn(duration/2);
		},
		hide: function (duration) {
			if (this.articles) this.articles.fadeOut(duration/2);
		},
		projection: function () {
			var me = this;
			var width = $('#canvas').innerWidth();
			var x0 = (width - 578)/2;
			var f = function (i, data) {
				var w  = me.date2week(data.s);
				var x  = (3-(w % 4))*31+x0;
				var yi = Math.floor(w/4);
				var y  = yi*40+20;
				return { x:x, y:y, yi:yi, x0:x0 };
			}
			return f;
		}
	}*/
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


