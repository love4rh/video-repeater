javascript: (function () {

var domMap = {}; /* 생성한 DOM 객체 맵. 성능 개선을 위한 멤버임 */

function isundef(o) { return o === null || typeof o === 'undefined'; }
function _$(selector) { return document.querySelector(selector); }
function _g(tag, id) { var o = document.createElement(tag); if( id ) { o.id = id; domMap[id] = o; } return o; }

/* 비디오 DOM 객체 가져오기. 디즈니에 종속적임 */
function getVideoBox() { return _$('video'); }
/* 스크립트 DOM 객체 가져오기. 디즈니에 종속적임 */
function getScriptBox() { return _$('.dss-subtitle-renderer-cue-positioning-box'); }

/* 버튼 아이콘 */
var iconMap = {
  'play':  '<svg width="16" height="16" fill="black" viewBox="0 0 16 16"><path d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"/></svg>',
  'pause': '<svg width="16" height="16" fill="black" viewBox="0 0 16 16"><path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/></svg>',
  'show':  '<svg width="16" height="16" fill="black" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>',
  'close': '<svg width="16" height="16" fill="black" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>'
};

var period = 0.12; /* 배치 잡 주기 (in sec) */
var adjTime = period / 2; /* 스크립트 시간 보정치 */
var styleCenter = 'display: flex; align-items: center;';

var boxKey = 'vrepeater-dp'; /* 툴 박스 div의 ID */

var v = getVideoBox();
var vUrl = window.location.href;
var isOK = vUrl.indexOf("disneyplus.com") >= 0 && !isundef(v);
var movieID = getMovieID();

var playing = v && !v.paused; /* Playing 여부 */

var scriptInfo = []; /* 추출 중인 스크립트 저장 멤버. start(in ms), end, script */
var checker = null; /* 배치 잡을 위한 Timer ID */
var currentScript = ''; /* 스크립트 변경 여부 확인을 위한 최신 값 유지 멤버 */


function setHTML(id, html) {
  if( !(id in domMap) ) { return; }
  domMap[id].innerHTML = html;
}

function handleClick(type) {
  if( 'play' === type ) {
    return (ev) => {
      if( isundef(v) ) {
        return;
      }

      if( v.paused ) {
        setHTML('vrepeater-button-play', iconMap['pause']);
        v.play();
      } else {
        setHTML('vrepeater-button-play', iconMap['play']);
        v.pause();
      }
    };
  } else if( 'close' === type ) {
    return (ev) => {
      if( checker ) {
        clearInterval(checker);
        checker = null;
      }

      var panel = _$('#' + boxKey);
      if( panel ) {
        panel.remove();
      }
    };
  } else if( 'show' === type ) {
    return (ev) => {
      /* 상태 표시 */
      console.log('script', scriptInfo);
    };
  } else if( 'step' === type ) {
    return (ev) => {
      optGoing = !optGoing;
      console.log('movie id:', getMovieID());
      setHTML('vrepeater-button-step', getIconHtml('step'));
    };
  } else {
    return function (ev) {
      console.log('handleClick:', type, ev);
    };
  }
}

function getIconHtml(btype) {
  if( 'play' === btype ) {
    return playing ? iconMap['pause'] : iconMap['play'];
  } else if( 'step' === btype ) {
    return optGoing ? iconMap['step'] : iconMap['going'];
  }

  return iconMap[btype];
}

function createButton(btype) {
  var elem = _g('button', 'vrepeater-button-' + btype);

  elem.style = 'width: 32px; height: 32px; margin: 0 2px; ' + styleCenter;
  setHTML(elem.id, getIconHtml(btype));

  elem.addEventListener('click', handleClick(btype));

  return elem;
}

function getMovieID() {
  var p = window.location.href;
  return p.substring(p.lastIndexOf('/') + 1);
}

function isNewLine(text) {
  return /[A-Z]/.test( text[0] ) || text[0] === '"' || text[0] === "'" || text[0] === '♪';
}

/* si: script, start, end */
function sendScript(idx, si) {
  const host = 'https://gx.tool4.us/pushScript'; /* http://127.0.0.1:9090/pushText */
  const xhr = new window.XMLHttpRequest();

  xhr.onload = function () {
    if ( xhr.status === 200 || xhr.status === 201 ) {
      /* success: xhr.responseText */
    } else {
      /* error: xhr.responseText, xhr.status*/
    }

    if ( xhr.readyState === 4 ) {
      /* complete(); */
    }
  };

  xhr.withCredentials = false;
  xhr.open('POST', host, true);

  xhr.timeout = 24000;

  var data = {
    index: idx,
    movieID,
    start: si.start,
    end: si.end,
    text: si.script
  };

  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.send(JSON.stringify(data));
}

function pushScript(text, time) {
  const ll = scriptInfo.length;

  if( text !== null ) {
    if( text.startsWith('\n') ) {
      text = text.substring(1);
    }

    if( text.startsWith('(') ) { /* 동작 */
      text = null;
    } else {
      text = text.replaceAll('\n', ' ');
    }
  }

  if( text === null && ll > 0 ) {
    if( isundef(scriptInfo[ll - 1].end) ) {
      scriptInfo[ll - 1].end = time;
      sendScript(ll, scriptInfo[ll - 1]);
    }
  } else if( !isundef(text) && currentScript !== text ) {
    currentScript = text;
    if( isNewLine(text) ) {
      time -= adjTime;
      if( ll > 0 && isundef(scriptInfo[ll - 1].end) ) {
        scriptInfo[ll - 1].end = time;
        sendScript(ll, scriptInfo[ll - 1]);
      }
      scriptInfo.push({ script:text, start:time });
    } else if( ll > 0 ) {
      scriptInfo[ll - 1].script += (' ' + text);
      sendScript(ll, scriptInfo[ll - 1]);
    }
  }
}

function batch() {
  if( !v ) { return; }

  if( playing !== !v.paused ) {
    playing = !v.paused;
    setHTML('vrepeater-button-play', getIconHtml('play'));
  }

  if( !playing ) { return; }

  var sLen = scriptInfo.length;

  s = getScriptBox();
  if( s ) {
    if( sLen === 0 || v.currentTime > scriptInfo[sLen - 1].start ) {
      pushScript(s.innerText.trim(), v.currentTime);
    }
  } else {
    pushScript(null, v.currentTime);
  }
}

function main() {
  var mainBox = _$('#' + boxKey);

  if( isundef(mainBox) ) {
    console.log('create main box for video-repeater');

    mainBox = _g('div', boxKey);
    mainBox.style = 'position: fixed; z-index: 9999; top: 0px; right:0px; padding: 2px 4px;'
      + 'background-color: lightgray; border: 1px solid gray; border-radius: 0 0 4px 4px;'
      + 'display: flex; flex-direction: column; flex-wrap: nowrap; justify-content: space-evenly;';

    var line1 = _g('div', boxKey + '-line1');
    line1.style = styleCenter;

    ['play', 'show', 'close'].map(k => {
      line1.appendChild( createButton(k) );
      return k;
    });

    mainBox.appendChild(line1);

    document.body.appendChild(mainBox);
  } else {
    console.log('main box for video-repeater already craeted');
  }

  if( isundef(checker) ) {
    checker = setInterval(batch, period * 1000);
  }
}

if( isOK ) {
  main();
} else {
  alert('only available in disneyplus and video must be being played');
}

})();
