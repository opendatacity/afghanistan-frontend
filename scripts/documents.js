

function Documents(renderer) {
	var me = this;
	
	var documents = [];
	for (var i = 0; i < $documents.length; i++) {
		documents[i] = new Document($documents[i], i, renderer);
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
		var max = 0;
		if (showResult) {
			for (var i = 0; i < $documents.length; i++) {
				if (max < $documents[i].resultCount) max = $documents[i].resultCount
			}
			for (var i = 0; i < documents.length; i++) documents[i].updateResultMarker(showResult, max);
		} else {
			for (var i = 0; i < documents.length; i++) documents[i].updateResultMarker(showResult);
		}
	}
	
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
		Lightbox(data);
	});
	
	viewObject.popover({
		html:true,
		content:function () {
			var thumbs = [];
			var maxY = 0;
			for (var i = 0; i < data.c; i++) {
				var resultCount = $pages[data.pageIds[i]].resultCount;
				var opacity = (resultCount < 1) ? 0.2 : 1;
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
				scale = 0.4;
			} else {
				opacity = 0.2 + 0.8*data.resultCount/max;
			}
		}
		viewObject.transition({scale:scale, opacity:opacity, duration:0 });
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

function Lightbox(data) {
		
	console.log(data);

	w = (parseInt(data.w)<10)?'0'+data.w:data.w;
	
	$('#lightbox-header').html('<h2>'+data.w+'/'+data.j+'</h2><h3>Seite 1/'+data.c+'</h3>');
	
	$('#lightbox-navigation-items').html('');
	
	var el,j;
	
	$('#lightbox-navigation-items').css({
		width: ((data.c*40)+40)
	})
	
	for (var i=1; i < data.c; i++) {
		
		d = (i<10)?'0'+i:i;
		el = $('<a href="javascript:;" class="lightbox-item" id="item-'+i+'"></a>');
		el.data('conf',{
			w: w,
			j: data.j,
			i: i,
			c: data.c,
			d: d
		});
		el.click(function(){
			var conf = $(this).data('conf');
			console.log(conf);
			$('#lightbox-header').html('<h2>'+conf.w+'/'+conf.j+'</h2><h3>Seite '+conf.i+'/'+conf.c+'</h3>');
			$('#lightbox-viewport').html('<img src="http://wiki.derwesten-recherche.org/images/'+conf.j+'-'+conf.w+'-'+conf.d+'.png" />');
			$('.lightbox-item').removeClass('active');
			$('#item-'+conf.i).addClass('active');
			
		});
		el.append('<img src="http://wiki.derwesten-recherche.org/images/thumb/'+data.j+'-'+w+'-'+d+'.png/90px-'+data.j+'-'+w+'-'+d+'.png" />');
		$('#lightbox-navigation-items').append(el);
		
	}
	
	$('#item-1').addClass('active');

	$('#lightbox-viewport').html('<img src="http://wiki.derwesten-recherche.org/images/'+data.j+'-'+w+'-01.png" />')
	
	$('#lightbox').show();
	
}