var allPageIds = [];

function Documents(renderer) {
	var me = this;
	
	var documents = [];
	documentsIndex = {};
	for (var i = 0; i < $documents.length; i++) {
		documents[i] = new Document($documents[i], i, renderer);
		documentsIndex[$documents[i].title] = i;
	}
	
	me.newLayout = function (layout, duration) {
		var f = layout.projection();
		var delayFactor = (duration > 0) ? 1 : 0;
		for (var i = 0; i < documents.length; i++) {
			documents[i].newPosition(f, duration, delayFactor*(documents.length-i));
		}
		$('#canvas').animate({height:layout.maxY+ 50}, duration);
		$('#main'  ).animate({height:layout.maxY+100}, duration);
	}
	
	me.updateResultMarkers = function (showResult) {
		if (showResult) {
			var max = 0.0001;
			for (var i = 0; i < $documents.length; i++) {
				if (max < $documents[i].resultCount) max = $documents[i].resultCount
			}
			for (var i = 0; i < documents.length; i++) documents[i].updateResultMarker(showResult, max);
		} else {
			for (var i = 0; i < documents.length; i++) documents[i].updateResultMarker(showResult);
		}
	}
	
	me.docs = documents;
	
	return me;
}

function showReader(pageId) {
	Lightbox(pageId);
}

function Document(data, index, renderer) {
	var me = this;
	me.data = data;
	var thumbId = data.t.charAt(0);
	var imageUrl = 'style/thumb'+thumbId+'-transparent.png';
	var color = qualityToColor(data.qualitySum);

	var viewObject = renderer.drawImage(imageUrl, 'thumb', color);
	
	for (var z = 0; z < data.c; z++) {
		allPageIds.push(data.title + '-' + ((z<10) ? '0'+z : z));
	}
	
	viewObject.popover({
		html:true,
		content:function () {
			var thumbs = [];
			var maxY = 0;
			for (var i = 0; i < data.c; i++) {
				var resultCount = $pages[data.pageIds[i]].resultCount;
				var opacity = (resultCount < 1) ? 0.1 : 1;
				var t = data.t.charAt(i);
				var color = qualityToColor(data.quality[i]);
				var x = (i % 6)*37;
				var y = Math.floor(i / 6)*46+5;
				var s = data.title+'-'+(i+101).toFixed().substr(1,2)
				thumbs.push('<div onclick="showReader(\''+s+'\')" class="thumb" title="Seite '+(i+1)+'" style="opacity:'+opacity+';left:'+x+'px; top:'+y+'px; background-color:'+color+'; background-image:url(\'style/thumb'+t+'-transparent.png\')"></div>');
				if (maxY < y) maxY = y;
			}
			return '<div style="position:relative; height:' + (maxY+35) + 'px">' + thumbs.join('') + '</div>';
		},
		trigger:'focus',
		placement:'bottom'
	});
	
	viewObject.tooltip({html:true, placement:'right', title:function () {
		var title = 'Ausgabe '+data.w+'/'+data.j;
		if (searchActive) {
			title += '<br>('+data.pageResultCount+' Seite'+(data.pageResultCount != 1 ? 'n' : '')+' mit Treffern)';
		} else {
			title += '<br>('+data.c+' Seiten)';
		}
		return title;
	}});
	
	me.newPosition = function (f, duration, delay) {
		var pos = f(index, data);
		data.pos = pos;
		if (duration <= 0) {
			renderer.setPosition(viewObject, pos.x, pos.y);
		} else {
			renderer.moveToPosition(viewObject, pos.x, pos.y, duration, delay);
		}
	}
	
	me.updateResultMarker = function (showResult, max) {
		var duration = 250;
		var opacity = 1;
		var scale = 1;
		if (showResult) {
			if (data.resultCount <= 0) {
				opacity = 0.1;
			} else {
				opacity = Math.min(0.3 + data.resultCount/max, 1);
			}
		}
		viewObject.transition({opacity:opacity, duration:0 });
	}
	
	return me;
}

var gradient = [
	[255, 255,  50],
	[  0, 242, 250],
	[  0,   0,  50]
];

function qualityToColor(v, lightness) {
	if (lightness === undefined) lightness = 1;
	var i = Math.floor(v);
	if (i > 1) i = 1;
	v = (v - i);
	
	var r = Math.round(((gradient[0][i+1]-gradient[0][i])*v + gradient[0][i])*lightness);
	var g = Math.round(((gradient[1][i+1]-gradient[1][i])*v + gradient[1][i])*lightness);
	var b = Math.round(((gradient[2][i+1]-gradient[2][i])*v + gradient[2][i])*lightness);
	return 'rgb('+r+','+g+','+b+')';
}

function Renderer(target) {
	var me = this;
	
	me.drawImage = function (url, className, backgroundColor) {
		var div = $('<div class="'+className+'" style="background-color:'+backgroundColor+';background-image:url(\''+url+'\')" tabindex="0"></div>');
		target.append(div);
		return div;
	}
	
	me.setPosition = function (obj, x, y) {
		obj.css({left:x, top:y})
	}
	
	me.moveToPosition = function (obj, x, y, duration, delay) {
		if (Modernizr.csstransforms) {
			obj.transition({left:x+'px', top:y+'px', duration:duration, delay:delay, easing:'in-out'})
		} else {
			obj.animate({left:x, top:y}, duration, 'smooth')
		}
	}
	
	me.click = function (obj, f) {
		obj.click(f);
	}
	
	return me;
}

$.easing.smooth = function(p) {
	return p < 0.5 ?
		Math.pow( p * 2, 3) / 2 :
		1 - Math.pow( p * -2 + 2, 3 ) / 2;
}

function Lightbox(h) {
	
	var issue = h.substr(0,7);
	var page = h.substr(8,2);
		
	var data = documents.docs[documentsIndex[issue]].data;

	var $lb = $('#lightbox');
	
	if ($lb.data('issue') !== issue) {
	
		$lb.data({
			year: data.j,
			week: data.w,
			page: page,
			pages: data.c,
			issue: issue
		});
		
		var $lbnav = $('#lightbox-navigation-items');
		
		$lbnav.html('');
		
		var $lbel;
		
		for (var i=1; i <= data.c; i++) {
			
			d = (i<10) ? '0'+i : i;
			
			var opacity = ($pages[data.pageIds[i-1]].resultCount < 1) ? 0.5 : 1;
			var color = qualityToColor(data.quality[i-1]);
			
			$lbel = $('<a href="javascript:;" class="lightbox-item" id="lightbox-item-'+issue+'-'+d+'" style="background-color:'+color+'; border-color:'+color+'; color:'+color+'; opacity:'+opacity+'"></a>');
			$lbel.data({ issue:issue, page:d, quality: data.quality[i-1] });
			$lbel.click(function(){
				$(this).blur();
				location.hash='!/'+$(this).data('issue')+'-'+$(this).data('page');
				LightboxPage($(this).data('issue'), $(this).data('page'));
			});
			$lbel.tooltip({
				title: "Seite "+i,
				placement: "top"
			});
			
			$lbel.append('<img src="data/images/thumb/'+issue+'-'+d+'.png/90px-'+issue+'-'+d+'.png">');
			
			$lbnav.append($lbel);
		}

		$lbnav.css({width: (data.c*40 + 60)});
				
	}
	
	$lb.fadeIn('fast');
	
	LightboxPage(issue, page);
	
}

function LightboxPage(issue, page) {

	if (currentDoc === issue+'-'+page) {
		return;
	} else {
		currentDoc = issue+'-'+page;
		location.hash = '!/'+issue+'-'+page;
	}
	
	$('#lightbox-improve').remove();
	if ($('#lightbox-item-'+currentDoc).data('quality') < 1) {
		$('#lightbox-content').append($('<div id="lightbox-improve" class="alert alert-error"><button type="button" class="close" data-dismiss="alert">×</button><strong>Hilf mit!</strong> Dieses Dokument muss kontrolliert werden. <a class="btn btn-primary btn-mini" style="margin-left:50px" href="http://wiki.derwesten-recherche.org/wiki/'+currentDoc+'">Transkript bearbeiten</a></div>'));
	} 
	
	var conf = $('#lightbox').data();
	
	$('#lightbox-headline').html('<h2>'+conf.week+'/'+conf.year+' <small>Seite '+parseInt(page,10)+'/'+conf.pages+'</small></h2>');

	$('#lightbox-viewport-doc').html('<img src="data/images/'+issue+'-'+page+'.png" />');
	
	$('#lightbox-viewport-trans').addClass('loading');
	
	$.ajax({
		url: 'data/t/'+issue+'-'+page+'.json',
		method: 'GET',
		dataType: 'json',
		success: function(data) {
			$('#lightbox-viewport-trans').html('<p>'+data.content+'</p>');
			$('#lightbox-viewport-trans').removeClass('loading');
			setTimeout(function(){
				$('#lightbox-viewport-trans').removeClass('loading');
			},1000);
		}
	});

	$('#lightbox-viewport-improve-button').attr('href','http://wiki.derwesten-recherche.org/index.php?title='+issue+'-'+page+'&action=edit');
	
	$('#share-twitter').attr('href','https://twitter.com/intent/tweet?url=http%3A%2F%2Fafghanistan.derwesten-recherche.de%2F%23%21%2F'+issue+'-'+page+'&text=Die+Afghanistan+Papiere%2C+Ausgabe+'+conf.week+'%2F'+conf.year+'+Seite+'+page+'+%23afpa+%23leak&via=wazrechereche&related=wazrechereche');
	$('#share-facebook').attr('href','http://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fafghanistan.derwesten-recherche.de%2F%23%21%2F'+issue+'-'+page+'&t=Die+Afghanistan+Papiere%2C+Ausgabe+'+conf.week+'%2F'+conf.year+'+Seite+'+page);
	$('#share-google').attr('href','https://plus.google.com/share?url=http%3A%2F%2Fafghanistan.derwesten-recherche.de%2F%23%21%2F'+issue+'-'+page);

	
	if (typeof DISQUS !== "undefined" && disqus_identifier !== issue) {	

	 	disqus_identifier = issue;
	 	disqus_url = location.href;
		disqus_title = "Die Afghanistan Papiere "+conf.week+'/'+conf.year;

		DISQUS.reset({
			reload: true,
			config: function () {  
				this.page.identifier = disqus_identifier;  
				this.page.url = location.href.replace(/-[0-9]{2}$/,'-01');
				this.page.title = disqus_title;
			}
		});
	}
	
	$('.lightbox-item').removeClass('active');
	$('#lightbox-item-'+issue+'-'+page).addClass('active');

}

function hashCheck() {
		
	if (location.hash && location.hash.substr(3,10).match(/^20[0-9]{2}-[0-9]{2}-[0-9]{2}/) && documentsIndex.hasOwnProperty(location.hash.substr(3,7))) {
		
		Lightbox(location.hash.substr(3));
		
	} else if (location.hash) {
		
		switch(location.hash.substr(3)) {
			case "impressum":
				$('#link-impressum').popover('show');
				$("html,body").animate({ scrollTop: $(document).height() }, "slow");
			break;
			case "download":
				$('#download-container').fadeIn('fast');
			break;
			case "faq":
				$('#faq-container').fadeIn('fast');
			break;
			case "mehr-informationen":
				$('#info-container').fadeIn('fast');
			break;
			default:
				location.hash='!/';
			break;
			
		}
		
	}
	
}

function randomDoc() {
	return allPageIds[(Math.floor(Math.random()*10000000) % allPageIds.length)];
}
