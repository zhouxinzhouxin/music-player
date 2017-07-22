import '../less/index.less';

let dataUrl = './data/data.json';
let $scope = $(document.body);
let $loadingLayer = $('.loading-layer');

/********** AudioManager ********/
let AudioManager = function (dataList) {
    this.dataList = dataList;
    this.index = 0;
    this.len = dataList.length;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.duration = dataList[0].duration;
    this.setAudio();
    this.bindAudioEvent();
    this.autoPlay = false;
};

AudioManager.prototype = {
    playNext: function () {
        this.index++;
        if (this.index === this.len) {
            this.index = 0;
        }
        this.setAudio();
    },
    playPrev: function () {
        this.index--;

        if (this.index === -1) {
            this.index = this.len - 1;
        }
        this.setAudio();
    },
    playIndex: function (index) {
        this.index = index;
        this.autoPlay = true;

        this.setAudio();
    },
    getCurInfo: function () {
        return this.dataList[this.index];
    },
    bindAudioEvent: function () {
        let _self = this;

        $(this.audio).on('ended', function () {
            _self.playNext();
        }).on('canplaythrough', function () {
            $loadingLayer.hide();
        });
    },
    setAudio: function () {
        let data = this.dataList[this.index];

        this.duration = data.duration;
        this.audio.src = data.audio;
        this.audio.load();

        if (this.autoPlay) {
            this.play();
        }

        $scope.trigger('changeAudio');
    },
    getDurationTime: function () {
        return this.duration;
    },
    getCurTime: function (ratio) {
        let curTime;

        if (ratio) {
            curTime = ratio * this.duration;
        } else {
            curTime = this.audio.currentTime;
        }

        return Math.round(curTime);
    },
    jumpToPlay: function (ratio) {

        let audioTime = ratio * this.duration;

        this.audio.currentTime = audioTime;

        this.audio.play();
    },
    getPlayRation: function () {
        return this.audio.currentTime / this.duration;
    },
    play: function () {
        this.autoPlay = true;
        this.audio.play();
    },
    pause: function () {
        this.autoPlay = false;
        this.audio.pause();
    }
};
/********** AudioManager End ********/

/********** controlManager Start ********/
let controlManager = (function () {
    let $songImg = $scope.find('.song-img img'),
        $songInfo = $scope.find('.song-info'),
        $likeBtn = $scope.find('.like-btn'),
        $playBtn = $scope.find('.play-btn'),
        $timeCur = $scope.find('.cur-time'),
        $timeDuration = $scope.find('.all-time'),
        $proTop = $scope.find('.pro-top'),
        likeList = [false, false, false, false, false],
        frameId;

    function addControlEvent() {
        $playBtn.on('click', function () {
            if ($(this).hasClass('playing')) {
                audioManager.pause();
                cancelAnimationFrame(frameId);
            } else {
                audioManager.play();
                setProcess();
            }
            $(this).toggleClass('playing');
        });
        $('.next-btn').on('click', function () {
            audioManager.playNext();
        });
        $('.prev-btn').on('click', function () {
            audioManager.playPrev();
        });
        $('.like-btn').on('click', function () {
            let index = audioManager.index;

            if (likeList[index]) {
                $('.like-btn').removeClass('disabled');
                 likeList[index] = false;

            } else {
                $('.like-btn').addClass('disabled');
                likeList[index] = true;
            }
        });
    }

    function formatTime(during) {
        let minute = Math.floor(during / 60),
            second = during - minute * 60;

        if (minute < 10) {
            minute = '0' + minute;
        }
        if (second < 10) {
            second = '0' + second;
        }

        return minute + ':' + second;
    }

    function setProTopTranslate(translatePercent) {
        let val = translatePercent;

        if (translatePercent != 0) {
            val = translatePercent + '%';
        }


        $proTop.css({
            transform: 'translateX(' + val + ')',
            '-webkit-transform': 'translateX(' + val + ')'
        });
    }

    function setProcess() {
        cancelAnimationFrame(frameId); 

        let frame = function () {
                let playRatio = audioManager.getPlayRation(),
                    translatePercent = (playRatio - 1) * 100,
                    time = formatTime(audioManager.getCurTime());

                $timeCur.text(time);

                if (translatePercent <= 1) {
                    setProTopTranslate(translatePercent);
                    frameId = requestAnimationFrame(frame);
                } else {
                    setProTopTranslate(0);
                    cancelAnimationFrame(frameId);
                }
            };
        frame();
    }

    function resetProcess() {
        setProTopTranslate(-100);

        $timeCur.text('00:00');
    }

    function renderPage() {
        let curData = audioManager.getCurInfo(),
            setImage = function (src) {
                let img = new Image();

                $(img).on('load', function () {
                    $songImg.attr('src', src);
                    blurImg(this, $('.content-wrap'));
                });

                img.src = src;
            };

        renderInfo(curData);
        setImage(curData.image);
        $timeDuration.text(formatTime(audioManager.getDurationTime()));
        if (likeList[audioManager.index]) {
            $likeBtn.addClass('disabled');
        } else {
            $likeBtn.removeClass('disabled');
        }
    }

    function renderInfo(info) {
        let html = '<h1 class="song-name">' + info.song + '</h1>' +
            '<h3 class="singer-name">' + info.singer + '</h3>' +
            '<h3 class="album-name">' + info.album + '</h3>' +
            '<h3 class="rhythm">' + info.rhythm + '</h3>' +
            '<h3 class="lyric">' + info.lyric + '</h3>';


        $songInfo.html(html);
    }

    function addProcessEvent() {
        let $slidePoint = $('.slide-point'),
            $proTop = $('.pro-top'),
            offsetX = $('.pro-wrap').offset().left,
            width = $('.pro-wrap').width();

        $slidePoint.on('touchstart', function () {
            cancelAnimationFrame(frameId);
        }).on('touchmove', function (e) {
            let x = e.changedTouches[0].clientX - offsetX,
                ration = x / width,
                translatePercent = (ration - 1) * 100,
                time = formatTime(audioManager.getCurTime(ration));

            if (ration > 1||ration < 0) {
                return false;
            }

            $timeCur.text(time);

            $proTop.css({
                transform: 'translateX(' + translatePercent + '%)',
                '-webkit-transform': 'translateX(' + translatePercent + '%)'
            });

            return false;
        }).on('touchend', function (e) {
            let ratio = (e.changedTouches[0].clientX - offsetX) / width;

            audioManager.jumpToPlay(ratio);
            $playBtn.addClass('playing');
            setProcess();
        });
    }

    let init = function () {
        renderPage();
        addControlEvent();
        addProcessEvent();
        $scope.on('changeAudio', function () {
            $loadingLayer.show();
            renderPage();

            if (audioManager.autoPlay) {
                setProcess();
            } else {
                resetProcess();
            }
        });
    };

    return {
        init: init
    }
})();

/********** controlManager End ********/

let audioManager;
let success = function (d) {
    audioManager = new AudioManager(d);

    controlManager.init();
    playList.init(d);
};

function getData(url, cb) {
    $.ajax({
        url: url,
        type: 'GET',
        success: cb,
        error: function () {
            alert('deal wrong');
        }
    })
}

getData(dataUrl, success);

/********** END *********/

let playList = (function () {

    let $playList = $scope.find('.play-list'),
        $container = $scope.find('ul');

    function renderList(data) {
        let html = '';

        for (let len = data.length, i = 0; i < len; i++) {
            let cur = data[i];

            html += '<li data-index="' + i + '"><h4>' + cur.song + '<span> - ' + cur.singer + '</span></h4></li>';
        }

        $container.html(html);
    }

    function show() {
        $container.find('li').removeClass('playing').eq(audioManager.index).addClass('playing');
        $playList.removeClass('hide');
        $playList.addClass('show');
    }

    function hide() {
        $playList.removeClass('show');
        $playList.addClass('hide');
    }

    function bindHash() {
        $(window).on('hashchange', function (e) {
            let param = location.hash.replace('#', '').split('/');

            if (param[0] === 'playlist') {
                show();
            } else {
                hide();
            }
        });
        if (location.hash) {
            $(window).trigger('hashchange');
        }
    }

    function bindEvent() {
        let $listBtn = $scope.find('.list-btn'),
            $closeBtn = $playList.find('.close-btn');

        $listBtn.on('click', function () {
            location.hash = 'playlist';
        });
        $playList.on('click', 'li', function () {
            let self = $(this),
                index = self.data('index');

            self.siblings('.playing').removeClass('playing');
            self.addClass('playing');
            audioManager.playIndex(index);
            $('.play-btn').addClass('playing');
        });
        $closeBtn.on('click', function () {
            location.hash = '';
        });
    }

    function init(data) {
        renderList(data);
        bindHash();
        bindEvent();
    }

    return {
        init: init
    }

})();
