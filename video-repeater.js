javascript: (function () {

var alwaysNew = false; /* true: 바뀐 자막은 항상 새로운 자막으로 간주 */
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
  'hide':  '<svg width="16" height="16" fill="black" viewBox="0 0 16 16"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/><path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/></svg>',
  'prev':  '<svg width="16" height="16" fill="black" viewBox="0 0 16 16"><path d="M.5 3.5A.5.5 0 0 0 0 4v8a.5.5 0 0 0 1 0V8.753l6.267 3.636c.54.313 1.233-.066 1.233-.697v-2.94l6.267 3.636c.54.314 1.233-.065 1.233-.696V4.308c0-.63-.693-1.01-1.233-.696L8.5 7.248v-2.94c0-.63-.692-1.01-1.233-.696L1 7.248V4a.5.5 0 0 0-.5-.5z"/></svg>',
  'next':  '<svg width="16" height="16" fill="black" viewBox="0 0 16 16"><path d="M15.5 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V8.753l-6.267 3.636c-.54.313-1.233-.066-1.233-.697v-2.94l-6.267 3.636C.693 12.703 0 12.324 0 11.693V4.308c0-.63.693-1.01 1.233-.696L7.5 7.248v-2.94c0-.63.693-1.01 1.233-.696L15 7.248V4a.5.5 0 0 1 .5-.5z"/></svg>',
  'close': '<svg width="16" height="16" fill="black" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>'
};

var period = 0.12; /* 배치 잡 주기 (in sec) */
var adjTime = period / 2; /* 스크립트 시간 보정치 */
var styleCenter = 'display: flex; align-items: center;';

var boxKey = 'vrepeater-dp'; /* 툴 박스 div의 ID */
var repeatOptions = [1, 2, 3, 5, 10, 15, 20, 30, 50, 100]; /* 반복 회수 옵션 */

var v = getVideoBox();
var b10Button = _$(".rwd-10sec-icon");
var clkEvent = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
var vUrl = window.location.href;
var isOK = vUrl.indexOf("disneyplus.com") >= 0 && !isundef(v);

var repeatCount = 1; /* 반복 회수 */
var repeatLimit = 3; /* 최대 반복 회수. repeatOptions에 정의된 값 중 하나 선택 */
var hidingBox = null; /* 자막 가리게 */
var playing = v && !v.paused; /* Playing 여부 */
var holding = false;

var scriptInfo = null; /* 추출 중인 스크립트 저장 멤버. start(in ms), end, script */
var incomingItem = null;
var checker = null; /* 배치 잡을 위한 Timer ID */
var currentScript = ''; /* 스크립트 변경 여부 확인을 위한 최신 값 유지 멤버 */

function setHTML(id, html) {
  if( !(id in domMap) ) { return; }
  domMap[id].innerHTML = html;
}

function handleCounterChanged(ev) {
  repeatLimit = Number(ev.target.value);
}

function jumpTo(reset) {
  if( scriptInfo === null ) {
    return;
  }

  holding = true;
  if( reset ) { repeatCount = 1; }

  v.pause();

  var sTime = scriptInfo.start;
  var sIdx = scriptInfo.index;

  /* 시간차가 많은 경우 임의로 currentTime을 변경하면 stalled될 수 있어 10초 뒤로 버튼을 이용함 */
  if( v.currentTime - sTime < 1.5 ) { /* 적정한 수치는 고려 필요 */
    b10Button.dispatchEvent(clkEvent);
    setTimeout(() => { v.currentTime = sTime - adjTime; v.play(); holding = false; }, 1200);
  } else {
    setTimeout(() => {
      v.currentTime = sTime - adjTime;
      setTimeout(() => { v.play(); holding = false; console.log('jumpTo', sIdx); }, 200)
    }, 200);
  }  
}

function playTo(offset) {
  if( v ) {
    repeatCount = 1;
    scriptInfo = null;
    incomingItem = null;

    if( offset < 0 ) {
      holding = true;
      var sTime = v.currentTime;
      b10Button.dispatchEvent(clkEvent);
      setTimeout(() => { v.currentTime = sTime + offset; holding = false; v.play(); }, 1200);
    } else {
      v.currentTime += offset;
    }
  }
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

      if( !isundef(hidingBox) ) {
        hidingBox.remove();
        hidingBox = null;
      }
    };
  } else if( 'show' === type ) {
    return (ev) => {
      if( !isundef(hidingBox) ) {
        hidingBox.remove();
        hidingBox = null;
        setHTML('vrepeater-button-show', iconMap['hide']);
      } else {
        hidingBox = _g('div');
        hidingBox.style = 'position: fixed; z-index: 9999; background-color: rgba(0, 0, 0, 0.98);';
        hidingBox.innerHTML = '&nbsp;';

        adjustHiderPos();

        document.body.appendChild(hidingBox);
        setHTML('vrepeater-button-show', iconMap['show']);
      }
      console.log('script', scriptInfo);
    };
  } else if( 'prev' === type ) {
    return (ev) => { playTo(-5); };
  } else if( 'next' === type ) {
    return (ev) => { playTo(5); };
  } else {
    return function (ev) {
      console.log('handleClick:', type, ev);
    };
  }
}

function getIconHtml(btype) {
  if( 'play' === btype ) {
    return playing ? iconMap['pause'] : iconMap['play'];
  } else if( 'show' === btype ) {
    return isundef(hidingBox) ? iconMap['hide'] : iconMap['show'];
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
  return alwaysNew || /[A-Z]/.test( text[0] ) || text[0] === '"' || text[0] === "'" || text[0] === '♪' || text[0] === '-';
}

function isValid(si) {
  return si && si.text && si.text !== '';
}

function pushScript(text, time) {
  var cTime = (new Date()).getTime();

  if( text === null ) {
    if( isValid(scriptInfo) && (cTime - scriptInfo.cTime) > 800 ) {
      scriptInfo.end = time - adjTime;
      incomingItem = { cTime, index: (scriptInfo.index + 1), text: '', start: time };
    }
    return;
  }

  if( text.startsWith('\n') ) {
    text = text.substring(1);
  }

  if( text.startsWith('(') ) {
    /* 동작 --> 마지막 시간 기록 */
    if( isValid(scriptInfo) ) {
      scriptInfo.end = time - adjTime;
      incomingItem = { cTime, index: (scriptInfo.index + 1), text: '', start: time };
    }
    currentScript = '';
    return;
  }

  if( currentScript === text ) {
    return;
  }

  var sOn = scriptInfo !== null;
  currentScript = text;

  if( isNewLine(text) ) {
    if( sOn && isundef(scriptInfo.end) ) {
      scriptInfo.end = time;
    }

    incomingItem = { cTime, index: (sOn ? scriptInfo.index + 1 : 1), text: text, start: (time - adjTime) };

    if( !sOn || scriptInfo.text === '' ) {
      scriptInfo = incomingItem;
    }
  } else if( sOn ) {
    scriptInfo.text += (' ' + text);
    scriptInfo.end = null;
  }
}

function adjustHiderPos(s) {
  if( isundef(hidingBox) ) {
    return;
  }

  if( !s ) {
    s = getScriptBox();
  }

  if( !s ) {
    return;
  }

  var rect = s.getBoundingClientRect();
  hidingBox.style = 'position: fixed; z-index: 9999; background-color: rgba(0, 0, 0, 0.98);'
    + 'left: ' + rect.left + 'px; '
    + 'top: ' + rect.top + 'px; '
    + 'width: ' + rect.width + 'px; '
    + 'height: ' + rect.height + 'px; ';
}

function batch() {
  if( !v || holding ) { return; }

  if( playing !== !v.paused ) {
    playing = !v.paused;
    setHTML('vrepeater-button-play', getIconHtml('play'));
  }

  if( !playing ) { return; }

  if( scriptInfo && scriptInfo.end && v.currentTime >= scriptInfo.end  ) {
    repeatCount += 1;
    if( repeatCount > repeatLimit ) { /* 지정한 반복 회수 도달 */
      repeatCount = 1;
      /* console.log('move to next', JSON.stringify(scriptInfo), incomingItem); */
      scriptInfo = incomingItem;
      incomingItem = null;
    } else {
      jumpTo(false); /* 현재 스크립트 반복 */
    }
    setHTML(boxKey + '-counter', '' + repeatCount);
  }

  s = getScriptBox();
  if( s ) { adjustHiderPos(s); }

  if( scriptInfo === null || repeatCount === 1) {
    if( s ) {
      if( scriptInfo === null || v.currentTime > scriptInfo.start ) {
        pushScript(s.innerText.trim(), v.currentTime);
      }
    } else {
      pushScript(null, v.currentTime);
    }
  }
}

function main() {
  var mainBox = _$('#' + boxKey);

  if( isundef(mainBox) ) {
    console.log('create control box for video-repeater');

    mainBox = _g('div', boxKey);
    mainBox.style = 'position: fixed; z-index: 9999; top: 0px; right:0px; padding: 2px 4px;'
      + 'background-color: lightgray; border: 1px solid gray; border-radius: 0 0 4px 4px;'
      + 'display: flex; flex-direction: column; flex-wrap: nowrap; justify-content: space-evenly;';

    var line1 = _g('div', boxKey + '-line1');
    line1.style = styleCenter;

    var counterDiv = _g('div', boxKey + '-counter');
    counterDiv.style = 'display: inline-block; width: 20px; font-size: 0.9rem; text-align: center;';
    counterDiv.innerHTML = '' + repeatCount;
    line1.appendChild(counterDiv);

    var sepDiv = _g('div', boxKey + '-sep');
    sepDiv.style = 'display: inline-block; text-align: center;';
    sepDiv.innerHTML = '&nbsp;/&nbsp;';
    line1.appendChild(sepDiv);

    var countSelector = _g('select', boxKey + '-selector');
    countSelector.style = 'width: 50px; height: 24px; font-size: 0.9rem';

    repeatOptions.map(n => {
      var elem = _g('option');
      elem.value = n;
      if( n === repeatLimit ) {
        elem.selected = true;
      }
      elem.innerHTML = n === -1 ? '∞' : '' + n;
      countSelector.appendChild(elem);
    });

    countSelector.addEventListener('change', handleCounterChanged);

    line1.appendChild(countSelector);

    ['play', 'prev', 'next', 'show', 'close'].map(k => {
      line1.appendChild( createButton(k) );
      return k;
    });

    mainBox.appendChild(line1);

    /* var line2 = _g('div', boxKey + '-line2');
    line2.style = 'height: 36px; padding: 0 4px;' + styleCenter;
    line2.innerHTML = 'line #2';
    
    mainBox.appendChild(line2); */

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
