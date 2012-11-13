
var
	wordList = [],
	wordDocuments = {},
	pageCount = 0,
	date2Document = [];

function initSearch() {
	$('#searchBox')
		.change(search)
		.keyup(search)
		.typeahead({source:wordList});
	$('#searchReset').click(searchReset);
}

function search() {
	var docs = [];
	for (var i = 0; i < pageCount; i++) docs[i] = 0;
	
	query = $('#searchBox').val();
	query = query.toLowerCase().split(' ');
	
	for (var i = 0; i < query.length; i++) {
		var searchWord = query[i];
		if (searchWord != '') {
			for (var j = 0; j < wordDocuments.length; j++) {
				var word = wordDocuments[j].word;
				var d = wordDocuments[j].docs;
				if (word.indexOf(searchWord) >= 0) {
					for (var k = 0; k < d.length; k++) {
						docs[d[k]]++;
					}
				}
			}
		}
	}
	
	for (var i = 0; i < $documents.length; i++) {
		$documents[i].resultCount = docs[i];
	}
	documents.updateResultMarkers(true);
}

function searchReset() {
	for (var i = 0; i < $documents.length; i++) {
		$documents[i].resultCount = 0;
	}
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
	
	wordDocuments = [];
	for (var word in $word_articles) {
		wordList.push(word);
		var s = $word_articles[word];
		
		var pages = [];
		var docs = [];
		var usedDocs = {};
		
		var id0 = decodeNumber(s, 0, 3);
		
		pages.push(id0);
		for (var i = 3; i < s.length; i++) {
			var d = decodeNumber(s, i, 1);
			id0 += d;
			if (d != 63) {
				pages.push(id0);
				var date = $dates[id0];
				var docId = date2Document[date[0]][date[1]];
				if (usedDocs[docId] === undefined) {
					usedDocs[docId] = true;
					docs.push(docId);
				}
			}
		}
		
		var smallWord = word.toLowerCase();
		wordDocuments.push({word:smallWord, docs:docs, pages:pages});
	}
}
