
var
	wordList = [],
	wordDocuments = {},
	pageCount = 0,
	date2Document = [],
	$word_articles = {};

function initSearch() {
	
	$.getJSON('data/word_articles.json', function (data) {
		$word_articles = data;
	
		wordDocuments = [];
		for (var word in $word_articles) {
			wordList.push(word);
			var s = $word_articles[word];
			
			var foundPages = [];
			
			var id0 = decodeNumber(s, 0, 3);
			
			foundPages.push(id0);
			for (var i = 3; i < s.length; i++) {
				var d = decodeNumber(s, i, 1);
				id0 += d;
				if (d != 63) foundPages.push(id0);
			}
			
			var smallWord = word.toLowerCase();
			wordDocuments.push({word:smallWord, pages:foundPages});
		}
			
		$('#searchBox')
			.removeAttr('disabled')
			.change(search)
			.keyup(search)
			.typeahead({source:wordList});
		$('#searchReset').click(searchReset);
		
	});
}

function search() {
	var query = $('#searchBox').val();
	
	// Wenn nichts gesucht wird, dann die Suche zurück setzen.
	if ($.trim(query) == '') {
		searchReset();
		return;
	}
	
	// Welche gültigen Suchbegriffe werden verwendet
	var temp = query.toLowerCase().split(' ');
	query = [];
	for (var i = 0; i < temp.length; i++) {
		if (temp[i] != '') {
			query.push(temp[i]);
		}
	}
	
	// gefundenen Seiten initialisieren
	var pages = [];
	for (var i = 0; i < $pages.length; i++) pages[i] = [];
	
	// Suchbegriffe durchsuchen
	for (var i = 0; i < query.length; i++) {
		var searchWord = query[i];
		for (var j = 0; j < wordDocuments.length; j++) {
			var word = wordDocuments[j].word;
			if (word.indexOf(searchWord) >= 0) {
				var p = wordDocuments[j].pages;
				for (var k = 0; k < p.length; k++) {
					var l = pages[p[k]];
					if (l[i] === undefined) {
						l[i] = 1;
					} else {
						l[i]++;
					}
				}
			}
		}
	}
	
	// gefundene Seiten sind nur die, auf denen alle Suchbegriffe vorkommen
	var n = query.length;
	for (var i = 0; i < $pages.length; i++) {
		var min = 1e10;
		for (var j = 0; j < n; j++) {
			var v = pages[i][j] || 0;
			if (min > v) {
				min = v;
			}
		}
		$pages[i].resultCount = min;
	}
	
	// gefundene Dokumente sind nur die, die eine "gefundene Seite" enthalten
	for (var i = 0; i < $documents.length; i++) {
		var sum = 0;
		var pageIds = $documents[i].pageIds;
		for (var j = 0; j < pageIds.length; j++) {
			sum += $pages[pageIds[j]].resultCount
		}
		$documents[i].resultCount = sum / $documents[i].c;
	}
		
	documents.updateResultMarkers(true);
}

function searchReset() {
	for (var i = 0; i < $documents.length; i++) $documents[i].resultCount = 1;
	for (var i = 0; i <     $pages.length; i++)     $pages[i].resultCount = 1;
	documents.updateResultMarkers(false);
}

var base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-=!?.,#";
var base64Decode = {};
for (var i = 0; i < base64.length; i++) base64Decode[base64.substr(i,1)] = i;

function decodeNumber(s, i0, length) {
	if (length == 1) return base64Decode[s.charAt(i0)];
	
	var value = 0;
	for (var i = i0; i < i0+length; i++) {
		var v = base64Decode[s.charAt(i)];
		value = value*64 + v;
	}
	return value;
}

function initData() {
	pageCount = 0;
	for (var i = 0; i < $documents.length; i++) {
		var doc = $documents[i];
		
		if (date2Document[doc.j] === undefined) date2Document[doc.j] = [];
		date2Document[doc.j][doc.w] = i;
		
		doc.pageIds = [];
		for (var j = 0; j < doc.c; j++) {
			doc.pageIds.push(pageCount+j);
		}
		pageCount += doc.c;
		
		var week = '00'+doc.w;
		week = week.substr(week.length-2);
		
		doc.title = doc.j+'-'+week;
		
		doc.title_ = parseInt(doc.w)+"/"+doc.j;
		
		quality = $quality[doc.j][week];
		quality = quality.split('');
		
		var qSum = 0;
		for (var j = 0; j < quality.length; j++) {
			var q = parseInt(quality[j]);
			quality[j] = q;
			qSum += Math.pow(q, 0.25);
		}
		
		doc.quality = quality;
		doc.qualitySum = Math.pow(qSum/quality.length, 4);
	}
	
	for (var i = 0; i < pageCount; i++) $pages[i] = {};
}
