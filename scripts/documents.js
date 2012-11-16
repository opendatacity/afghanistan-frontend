

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
	
	var thumbs = [];
	for (var i = 0; i < data.c; i++) {
		var t = data.t.charAt(i);
		var color = qualityToColor(data.quality[i]);
		thumbs.push('<div class="thumb" style="float:left; position:static; margin:5px; background-color:'+color+'; background-image:url(\'style/thumb'+t+'-transparent.png\')"></div>');
	}
	
	viewObject.popover({
		html:true,
		content:thumbs.join('')+'<br clear="both" />',
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