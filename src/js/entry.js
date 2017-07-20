import '../less/index.less';

//数据接口
let dataUrl = './data/data.json';

//作用域
let $scope = $(document.body);

let AudioManager = function (audioData) {
    //绑定数据
    this.dataList = audioData;
    //索引
    this.index = 0;

    this.len = audioData.length;

    this.audio = new Audio();


    this.audio.preload = 'auto';

    this.duration = audioData[0].duration;

    this.setAudio();

    this.autoplay = false;

};

AudioManager.prototype = {
    playNext: function () {
        this.index++;

        if (this.index === this.len) {
            this.index = 0
        }

        this.setAudio();
    },
    playPrev: function () {
        this.index--;

        if (this.index === -1) {
            this.index = this.len-1;
        }

        this.setAudio();
    },
    playIndex: function (index) {
        this.index = index

        this.autoplay = true;

        this.setAudio();
    },
    setAudio: function () {

        let data = this.dataList[this.index];

        this.duration = data.duration;
        this.audio.src = data.audio;
        this.audio.load();

        if (this.autoplay) {
            this.play();
        }
        $scope.trigger('changeAudio');
    },
    play: function () {
        this.autoplay = true;
        this.audio.play();
    },
    pause: function () {
        this.autoplay = false;
        this.audio.pause();
    },
    getCurrentInfo: function () {
        return this.dataList[this.index];
    },
    getPlayRatio: function () {
        return this.audio.currentTime / this.duration;
    },
    getCurrentTime: function (ratio) {
        let curTime;
        if(ratio){
            curTime = ratio * this.duration;
        }else{
            curTime = this.audio.currentTime;
        }

        return Math.round(curTime);
    },
    jumpToPlay: function (ratio) {

        let time = ratio * this.duration;
        console.log(time);

        this.audio.currentTime = time;
        console.log(this.audio.currentTime);
        this.play();
    }
};

let controlManager = (function () {
    let $songImg = $scope.find('.song-img img');
    let $songInfo = $scope.find('.song-info');
    let $songDuration = $scope.find('.all-time');
    let $curTime = $scope.find('.cur-time');
    let $proTop = $scope.find('.pro-top');
    let likeList = [false, false, false, false, false];
    let frameId;

    //渲染背景图
    function setImageBg (img) {
        $songImg.attr('src', img.src);
        blurImg(img,$scope.find('.content-wrapper'));
    }

    //渲染歌曲信息
    function renderInfo (info) {
        let html = `<h1 class="song-name">`+info.song+`</h1>
                    <h3 class="singer-name">`+info.singer+`</h3>
                    <h3 class="album">`+info.album+`</h3>
                    <h3 class="rhythm">`+info.rhythm+`</h3>
                    <h3 class="Lyric">`+info.lyric+`</h3>`;
        $songInfo.html(html);
    }

    //渲染时间
    function formatTime (duration) {
        let minute = Math.floor(duration / 60);
        let second = duration - minute * 60;
        minute < 10 ? minute = '0' + minute: minute;
        second < 10 ? second = '0' + second: second;
        return minute + ':' + second;
    }

    //渲染页面
    function renderPage () {
        let curInfo = audioManager.getCurrentInfo();

        //图片信息
        let img = new Image();
        img.onload = function () {
            setImageBg(this)
        };
        img.src = curInfo.image;
        //重置图片旋转
        $songImg.removeClass('move');
        $songImg.css({animationPlayState : '',transform : ''});

        //歌曲信息
        renderInfo(curInfo);

        //渲染时间
        $songDuration.text(formatTime(curInfo.duration));

        //收藏按钮
        if (likeList[audioManager.index]) {
            $scope.find('.like-btn').addClass('checked');
        } else {
            $scope.find('.like-btn').removeClass('checked');
        }
        if(audioManager.autoplay){
            $songImg.addClass('move');
            $songImg.css({transform : 'rotate(0deg)'});
        }

    }

    //绑定页面事件
    function addControlEvent () {
        //播放暂停
        $scope.find('.play-btn').on('click', function () {
            let $this = $(this);
            if($this.hasClass('playing')){
                audioManager.pause();
                cancelAnimationFrame(frameId);

                $songImg.css({animationPlayState : 'paused'});
            }else{
                audioManager.play();
                setProgress();

                if($songImg.hasClass('move')){
                    $songImg.css({animationPlayState : 'running'});
                }else{
                    $songImg.addClass('move')
                }
            }
            $this.toggleClass('playing');
        });
        //上一首
        $scope.find('.prev-btn').on('click',function () {
            audioManager.playPrev();
            $scope.trigger('changeAudio');
        });
        //下一首
        $scope.find('.next-btn').on('click',function () {
            audioManager.playNext();
            $scope.trigger('changeAudio');
        });
        //收藏
        $scope.find('.like-btn').on('click',function () {
            let index = audioManager.index;
            console.log(likeList[index]);
            if (likeList[index]) {
                $('.like-btn').removeClass('checked');
                likeList[index] = false;
            } else {
                $('.like-btn').addClass('checked');
                likeList[index] = true;
            }
        });
    }

    //进度条移动
    function setProtopTranslate (percent) {
        let value;
        if(percent !== 0){
            value = percent + '%'
        }
        $proTop.css({
            transform: 'translateX('+value+')',
            '-webkit-transform': 'translateX('+value+')'
        })
    }

    //播放进度条
    function setProgress () {
        let frame = function () {
            let ratio = audioManager.getPlayRatio();
            let transparentPercent = (ratio - 1) * 100;
            let time = formatTime(audioManager.getCurrentTime());
            $curTime.text(time);
            if(ratio <= 1){
                setProtopTranslate(transparentPercent);
                frameId = requestAnimationFrame(frame)
            }else{
                setProtopTranslate(0);
                cancelAnimationFrame(frameId);
            }
        };
        frame()
    }

    //重置进度条
    function resetProgess () {
        setProtopTranslate(-100);
        $curTime.text('00:00');
    }

    //拖拽进度条小球
    function bindProgressEvent () {
        let $slidePoint = $scope.find('.slide-point'),
            offset = $scope.find('.pro-wrap').offset(),
            offsetX = offset.left,
            width = $scope.find('.pro-wrap').width();

        $slidePoint.on('touchstart', function (e) {
            cancelAnimationFrame(frameId);
        }).on('touchmove', function (e) {

            let X = e.changedTouches[0].clientX - offsetX,
                ratio = X / width,
                translatePercent = (ratio - 1) * 100,
                time = formatTime(audioManager.getCurrentTime(ratio));

            if(ratio > 1 || ratio < 0){
                return false;
            }

            $curTime.text(time);
            setProtopTranslate(translatePercent);

        }).on('touchend', function (e) {

            let ratio = (e.changedTouches[0].clientX - offsetX) / width;
            audioManager.jumpToPlay(ratio);
            setProgress();
            $scope.find('.play-btn').addClass('playing');
        })
    }

    //管理仓库
    function init () {
        renderPage();
        addControlEvent();
        bindProgressEvent();
        $scope.on('changeAudio', function () {
            renderPage();
            audioManager.autoplay ? setProgress() :resetProgess();
        })
    }

    return {
        init: init
    }
}());


let audioManager;

function success (d) {
    audioManager = new AudioManager(d);
    controlManager.init();
    playList.init(d);
}

function getData (url,cb){
    $.ajax({
        url : url,
        type : 'GET',
        success : cb,
        error : () => {
            alert('出错了');
        }
    })
}

getData(dataUrl,success);

let playList = (function () {

    let $playList = $scope.find('.play-list'),
        $container = $scope.find('ul');

    function renderList(data) {
        let html = '';

        for (let len = data.length, i = 0; i < len; i++) {
            let cur = data[i];

            html += '<li data-index="' + i + '"><h3>' + cur.song + '<span> - ' + cur.singer + '</span></h3></li>';
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
            console.log(index);

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