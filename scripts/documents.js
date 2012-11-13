
var popoverVisible = undefined;

function Documents(renderer) {
	var me = this;
	
	var documents = [];
	for (var i = 0; i < $documents.length; i++) {
		documents[i] = new Document($documents[i], i, renderer);
	}
	
	me.setPosition = function (f) {
		for (var i = 0; i < documents.length; i++) documents[i].setPosition(f);
	}
	
	me.moveToPosition = function (f, duration) {
		for (var i = 0; i < documents.length; i++) documents[i].moveToPosition(f, 500, (documents.length-i)*1);
	}
	
	me.updateResultMarkers = function (show) {
		for (var i = 0; i < documents.length; i++) documents[i].updateResultMarker(show);
	}
	
	$(document).click(function(e) {
		if (popoverVisible !== undefined) {
			$('.thumb').stop().popover('hide')
			popoverVisible = undefined
		}
	});
	
	return me;
}

function Document(data, index, renderer) {
	var me = this;
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
		trigger:'manual',
		placement:'bottom'
	});
	
	viewObject.tooltip({
		placement: 'bottom'
	});
		
	viewObject.click(viewObject, function (e) {
		//startReader(index, data, viewObject);
		//$('.thumb.popped').popover('hide');
		if (popoverVisible !== viewObject) {
			if (popoverVisible) popoverVisible.popover('hide');
			popoverVisible = viewObject;
			viewObject.tooltip('destroy');
			viewObject.stop().popover('show');
			unselect();
		} else {
			popoverVisible.popover('hide');
			viewObject.tooltip({placement: 'bottom'});
			popoverVisible = undefined;
		}
		e.preventDefault();
		return false;
	});
	
	me.setPosition = function (f) {
		var pos = f(index, data);
		renderer.setPosition(viewObject, pos.x, pos.y);
	}
	
	me.moveToPosition = function (f, duration, delay) {
		var pos = f(index, data);
		renderer.moveToPosition(viewObject, pos.x, pos.y, duration, delay);
	}
	
	me.updateResultMarker = function (show) {
		if (!show || (data.resultCount > 0)) {
			viewObject.animate({opacity:1}, 250);
		} else {
			viewObject.animate({opacity:0.2}, 250);
		}
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