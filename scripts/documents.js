

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
		$('#canvas').animate({height:layout.maxY+50}, duration);
		$('#main').animate({height:layout.maxY+100}, duration);
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

function Document(data, index, renderer) {
	var me = this;
	me.data = data;
	var thumbId = data.t.charAt(0);
	var imageUrl = 'style/thumb'+thumbId+'-transparent.png';
	var color = qualityToColor(data.qualitySum);

	function startReader(index, data, viewObject) {
	}

	var viewObject = renderer.drawImage(imageUrl, 'thumb', color, 'Unterrichtung des Parlaments '+data.title_);
	
	$(viewObject).click(function(){
		Lightbox(data.title+"-01");
	});
	
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
				var y = Math.floor(i / 6)*46;
				thumbs.push('<div class="thumb" style="opacity:'+opacity+';left:'+x+'px; top:'+y+'px; background-color:'+color+'; background-image:url(\'style/thumb'+t+'-transparent.png\')"></div>');
				if (maxY < y) maxY = y;
			}
			return '<div style="position:relative; height:'+(maxY+35)+'px">'+thumbs.join('')+'</div>';
		},
		trigger:'hover',
		placement:'bottom'
	});
	
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


function qualityToColor(v) {
	// rot, gelb, grün
	var r = Math.round((v < 1 ? 1 : 2-v)*255);
	var g = Math.round((v < 1 ? v : 1  )*255);
	var b = 0;
	return 'rgb('+r+','+g+','+b+')';
}

function Renderer(target) {
	var me = this;
	
	me.drawImage = function (url, className, backgroundColor, title) {
		var div = $('<div class="'+className+'" title="'+title+'" style="background-color:'+backgroundColor+';background-image:url(\''+url+'\')" ></div>');
		//var img = $('<img src="'+url+'"/>');
		//div.append(img);
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
	
		$lb.fadeOut('fast');
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
		
		for (var i=1; i<data.c; i++) {
			
			d = (i<10)?'0'+i:i;
			
			$lbel = $('<a href="javascript:;" class="lightbox-item" id="lightbox-item-'+issue+'-'+d+'">irks</a>');
			$lbel.data({issue:issue,page:d});
			$lbel.click(function(){
				$(this).blur();
				LightboxPage($(this).data('issue'), $(this).data('page'));
			});
			$lbel.tooltip({
				title: "Seite "+i,
				placement: "top"
			});
			$lbel.append('<img src="http://wiki.derwesten-recherche.org/images/thumb/'+issue+'-'+d+'.png/90px-'+issue+'-'+d+'.png" />');
			$lbnav.append($lbel);

		}

		$lbnav.css({width: ((data.c*40)+40)});
				
	}
	
	$lb.fadeIn('fast');
	
	LightboxPage(issue, page);
	
}

function LightboxPage(issue,page) {

	var conf = $('#lightbox').data();
	
	$('#lightbox-header').html('<h2>'+conf.week+'/'+conf.year+'</h2><h3>Seite '+page+'/'+conf.pages+'</h3>');
	$('#lightbox-viewport-doc').html('<img src="http://wiki.derwesten-recherche.org/images/'+issue+'-'+page+'.png" />');
	//'<div id="lightbox-viewport-navigation"><a href="http://wiki.derwesten-recherche.org/wiki/'+issue+'-'+page+'">Transkript ansehen</a></div>');

	$('#lightbox-viewport-doc').html('<img src="http://wiki.derwesten-recherche.org/images/'+issue+'-'+page+'.png" />');
	
	$('#lightbox-viewport-trans').addClass('loading');
	
	$.ajax({
		url: 'data/t/'+issue+'-'+page+'.json',
		method: 'GET',
		contentType: 'json',
		success: function(data) {
			$('#lightbox-viewport-trans').html('<p>'+data.content+'</p>');
			$('#lightbox-viewport-trans').removeClass('loading');
			setTimeout(function(){
				$('#lightbox-viewport-trans').removeClass('loading');
			},1000);
		}
	});

	$('#lightbox-viewport-improve-button').attr('href','http://wiki.derwesten-recherche.org/index.php?title='+issue+'-'+page+'&action=edit');
	
	$('#share-twitter').attr('href','https://twitter.com/intent/tweet?url=http%3A%2F%2Fafghanistan.derwesten-recherche.de%2F%23'+issue+'-'+page+'&text=Die+Afghansistan+Papiere%2C+Ausgabe+'+conf.week+'%2F'+conf.year+'+Seite+'+page+'+%23afghanistan+%23leak&via=wazrechereche&related=wazrechereche');
	$('#share-facebook').attr('href','http://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fafghanistan.derwesten-recherche.de%2F%23'+issue+'-'+page+'&t=Die+Afghansistan+Papiere%2C+Ausgabe+'+conf.week+'%2F'+conf.year+'+Seite+'+page);
	$('#share-google').attr('href','https://plus.google.com/share?url=http%3A%2F%2Fafghanistan.derwesten-recherche.de%2F%23'+issue+'-'+page);
	
	$('.lightbox-item').removeClass('active');
	$('#lightbox-item-'+issue+'-'+page).addClass('active');
	location.hash=issue+'-'+page;

}

function hashCheck() {
		
	if (location.hash && location.hash.substr(1).match(/^20[0-9]{2}-[0-9]{2}-[0-9]{2}/) && documentsIndex.hasOwnProperty(location.hash.substr(1,7))) {
		
		Lightbox(location.hash.substr(1));
		
	}
	
}
