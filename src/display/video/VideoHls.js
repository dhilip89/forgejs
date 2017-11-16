/**
 * HLS video controller.
 *
 * @constructor FORGE.VideoHls
 * @param {FORGE.Viewer} viewer - {@link FORGE.Viewer} reference.
 * @param {string} key - The video file id reference.
 * @param {?(string|FORGE.VideoQuality|Array<(string|FORGE.VideoQuality)>)=} config - Either a {@link FORGE.VideoQuality} or a string URL.
 * @param {string=} qualityMode - The default quality mode.
 * @extends {FORGE.VideoBase}
 *
 * @todo  ability to call the QualityAbort event.
 * @todo  add protection controller and protection key controller to be able to manage external secured streams (DRM)
 * @todo  Add subtitles management with <track> and VTT/TTML(EBU-TT-D) files
 */
FORGE.VideoHls = function(viewer, key, config, qualityMode)
{
    /**
     * The video identifier.
     * @name FORGE.VideoHls#_key
     * @type {string}
     * @private
     */
    this._key = key;

    /**
     * {@link FORGE.VideoQuality} for this video, it can be temporarily a string into the constructor.
     * @name FORGE.VideoHls#_config
     * @type {?(string|FORGE.VideoQuality|Array<(string|FORGE.VideoQuality)>)}
     * @private
     */
    this._config = config || null;

    /**
     * The manifest URL.
     * @name FORGE.VideoHls#_manifestUrl
     * @type {string}
     * @private
     */
    this._manifestUrl = "";

    /**
     * Array of {@link FORGE.VideoQuality}.
     * @name  FORGE.VideoHls#_qualities
     * @type {Array<FORGE.VideoQuality>}
     * @private
     */
    this._qualities = null;

    /**
     * The index of the current quality (if -1 no video is selected as the current one).
     * @name  FORGE.Video#_currentQuality
     * @type {number}
     * @private
     */
    // this._currentQuality = -1;

    /**
     * First quality is initialized?
     * @name  FORGE.VideoHls#_qualityInitialized
     * @type {boolean}
     * @private
     */
    // this._qualityInitialized = false;

    /**
     * Default quality mode, it can be either "auto" or "manual", modes are listed by FORGE.VideoQualityMode constants.
     * @name FORGE.VideoHls#_defaultQualityMode
     * @type {string}
     * @private
     */
    this._defaultQualityMode = qualityMode || FORGE.VideoQualityMode.AUTO;

    /**
     * Current Quality mode.
     * @name  FORGE.VideoHls#_qualityMode
     * @type {string}
     * @private
     */
    this._qualityMode = "";

    /**
     * Video object that handle the dom and some stats about the video.
     * @name FORGE.VideoHls#_video
     * @type {Object}
     * @private
     */
    this._video = null;

    /**
     * Does the video loop?
     * @name  FORGE.VideoHls#_loop
     * @type {boolean}
     * @private
     */
    this._loop = false;

    /**
     * The volume of the video.
     * @name  FORGE.VideoHls#_volume
     * @type {number}
     * @private
     */
    this._volume = 1;

    /**
     * Is the video volume is muted?
     * @name  FORGE.VideoHls#_muted
     * @type {boolean}
     * @private
     */
    this._muted = false;

    /**
     * Private reference to the previous volume before mute.
     * @name  FORGE.VideoHls#_mutedVolume
     * @type {number}
     * @private
     */
    this._mutedVolume = 0;

    /**
     * Playback rate of the video
     * @name FORGE.VideoHls#_playbackRate
     * @type {number}
     * @private
     */
    this._playbackRate = 1;

    /**
     * Does the video have received its metaData?
     * @name  FORGE.VideoHls#_metaDataLoaded
     * @type {boolean}
     * @private
     */
    this._metaDataLoaded = false;

    /**
     * The hls.js Media Player library.<br>
     * The hls.js library must be loaded prior to the video instanciation!
     * @name  FORGE.VideoHls#_hlsMediaPlayer
     * @type {Hls.MediaPlayer}
     * @private
     */
    this._hlsMediaPlayer = null;

    /**
     * The hls stream info object.
     * @name  FORGE.VideoHls#_streamInfo
     * @type {StreamInfo}
     * @private
     */
    this._streamInfo = null;

    /**
     * The current index for video.
     * @name FORGE.VideoHls#_currentIndex
     * @type {number}
     * @private
     */
    this._currentVideoIndex = 0;

    /**
     * The current pending index for video.
     * @name FORGE.VideoHls#_currentPendingIndex
     * @type {number}
     * @private
     */
    this._currentVideoPendingIndex = 0;

    /**
     * The current index for audio.
     * @name FORGE.VideoHls#_currentIndex
     * @type {number}
     * @private
     */
    this._currentAudioIndex = 0;

    /**
     * The current pending index for audio.
     * @name FORGE.VideoHls#_currentPendingIndex
     * @type {number}
     * @private
     */
    this._currentAudioPendingIndex = 0;

    /**
     * The hls media player video metrics object.
     * @name  FORGE.VideoHls#_playerVideoMetrics
     * @type {Object}
     * @private
     */
    this._playerVideoMetrics = null;

    /**
     * The hls media player audio metrics object.
     * @name  FORGE.VideoHls#_playerAudioMetrics
     * @type {Object}
     * @private
     */
    this._playerAudioMetrics = null;

    /**
     * The hls stream metrics object.
     * @name  FORGE.VideoHls#_hlsMetrics
     * @type {hlsMetrics}
     * @private
     */
    this._hlsMetrics = null;

    /**
     * The monitoring object.
     * @name  FORGE.VideoHls#_monitoring
     * @type {Object}
     * @private
     */
    this._monitoring = null;

    /**
     * On load start event dispatcher.
     * @name  FORGE.VideoHls#_onLoadStart
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onLoadStart = null;

    /**
     * On loaded metadata event dispatcher.
     * @name  FORGE.VideoHls#_onLoadedMetaData
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onLoadedMetaData = null;

    /**
     * On loaded data event dispatcher.
     * @name  FORGE.VideoHls#_onLoadedData
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onLoadedData = null;

    /**
     * On progress event dispatcher.
     * @name  FORGE.VideoHls#_onProgress
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onProgress = null;

    /**
     * On duration change event dispatcher.
     * @name  FORGE.VideoHls#_onDurationChange
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onDurationChange = null;

    /**
     * On can play event dispatcher.
     * @name  FORGE.VideoHls#_onCanPlay
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onCanPlay = null;

    /**
     * On can play through event dispatcher.
     * @name  FORGE.VideoHls#_onCanPlayThrough
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onCanPlayThrough = null;

    /**
     * On play event dispatcher.
     * @name  FORGE.VideoHls#_onPlay
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onPlay = null;

    /**
     * On pause event dispatcher.
     * @name  FORGE.VideoHls#_onPause
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onPause = null;

    /**
     * On time update event dispatcher.
     * @name  FORGE.VideoHls#_onTimeUpdate
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onTimeUpdate = null;

    /**
     * On current time change event dispatcher.
     * @name FORGE.VideoHls#_onCurrentTimeChange
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onCurrentTimeChange = null;

    /**
     * On volume change event dispatcher.
     * @name  FORGE.VideoHls#_onVolumeChange
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onVolumeChange = null;

    /**
     * On seeking event dispatcher.
     * @name  FORGE.VideoHls#_onSeeking
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onSeeking = null;

    /**
     * On seeked event dispatcher.
     * @name  FORGE.VideoHls#_onSeeked
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onSeeked = null;

    /**
     * On ended event dispatcher.
     * @name  FORGE.VideoHls#_onEnded
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onEnded = null;

    /**
     * On error event dispatcher.
     * @name  FORGE.VideoHls#_onError
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onError = null;

    /**
     * On stalled event dispatcher.
     * @name  FORGE.VideoHls#_onStalled
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onStalled = null;

    /**
     * On rate change event dispatcher.
     * @name  FORGE.VideoHls#_onRateChange
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onRateChange = null;

    /**
     * On playing event dispatcher.
     * @name  FORGE.VideoHls#_onPlaying
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onPlaying = null;

    /**
     * On mute event dispatcher.
     * @name  FORGE.VideoHls#_onMute
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onMute = null;

    /**
     * On unmute event dispatcher.
     * @name  FORGE.VideoHls#_onUnmute
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onUnmute = null;

    /**
     * On qualityRequest event dispatcher.
     * @name  FORGE.VideoHls#_onQualityRequest
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onQualityRequest = null;

    /**
     * On qualityChange event dispatcher.
     * @name  FORGE.VideoHls#_onQualityChange
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onQualityChange = null;

    /**
     * On qualityAbort event dispatcher.
     * @name  FORGE.VideoHls#_onQualityAbort
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onQualityAbort = null;

    /**
     * On qualties loaded event dispatcher.
     * @name  FORGE.VideoHls#_onQualitiesLoaded
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onQualitiesLoaded = null;

    /**
     * On qualityModeChange event dispatcher.
     * @name  FORGE.VideoHls#_onQualityModeChange
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onQualityModeChange = null;

    /**
     * On metrics changed event dispatcher.
     * @name  FORGE.VideoHls#_onMetricsChanged
     * @type {?FORGE.EventDispatcher}
     * @private
     */
    this._onMetricsChanged = null;

    /**
     * Event handler for current video load start binded to this.
     * @name FORGE.VideoHls#_onLoadStartBind
     * @type {Function}
     * @private
     */
    this._onLoadStartBind = null;

    /**
     * Event handler for current video loaded meta data binded to this.
     * @name FORGE.VideoHls#_onLoadedMetaDataBind
     * @type {Function}
     * @private
     */
    this._onLoadedMetaDataBind = null;

    /**
     * Event handler for current video loaded data binded to this.
     * @name FORGE.VideoHls#_onLoadedDataBind
     * @type {Function}
     * @private
     */
    this._onLoadedDataBind = null;

    /**
     * Event handler for current video progress binded to this.
     * @name FORGE.VideoHls#_onProgressBind
     * @type {Function}
     * @private
     */
    this._onProgressBind = null;

    /**
     * Event handler for current video duration change binded to this.
     * @name FORGE.VideoHls#_onDurationChangeBind
     * @type {Function}
     * @private
     */
    this._onDurationChangeBind = null;

    /**
     * Event handler for current video can play binded to this.
     * @name FORGE.VideoHls#_onCanPlayBind
     * @type {Function}
     * @private
     */
    this._onCanPlayBind = null;

    /**
     * Event handler for current video can play throught binded to this.
     * @name FORGE.VideoHls#_onCanPlayThroughBind
     * @type {Function}
     * @private
     */
    this._onCanPlayThroughBind = null;

    /**
     * Event handler for current video play binded to this.
     * @name FORGE.VideoHls#_onPlayBind
     * @type {Function}
     * @private
     */
    this._onPlayBind = null;

    /**
     * Event handler for current video pause binded to this.
     * @name FORGE.VideoHls#_onPauseBind
     * @type {Function}
     * @private
     */
    this._onPauseBind = null;

    /**
     * Event handler for current video time update binded to this.
     * @name FORGE.VideoHls#_onTimeUpdateBind
     * @type {Function}
     * @private
     */
    this._onTimeUpdateBind = null;

    /**
     * Event handler for current video volume change binded to this.
     * @name FORGE.VideoHls#_onVolumeChangeBind
     * @type {Function}
     * @private
     */
    this._onVolumeChangeBind = null;

    /**
     * Event handler for current video seeking binded to this.
     * @name FORGE.VideoHls#_onSeekingBind
     * @type {Function}
     * @private
     */
    this._onSeekingBind = null;

    /**
     * Event handler for current video seeked binded to this.
     * @name FORGE.VideoHls#_onSeekedBind
     * @type {Function}
     * @private
     */
    this._onSeekedBind = null;

    /**
     * Event handler for current video ended binded to this.
     * @name FORGE.VideoHls#_onEndedBind
     * @type {Function}
     * @private
     */
    this._onEndedBind = null;

    /**
     * Event handler for current video error binded to this.
     * @name FORGE.VideoHls#_onErrorBind
     * @type {Function}
     * @private
     */
    this._onErrorBind = null;

    /**
     * Event handler for current video stalled binded to this.
     * @name FORGE.VideoHls#_onStalledBind
     * @type {Function}
     * @private
     */
    this._onStalledBind = null;

    /**
     * Event handler for current video rate change binded to this.
     * @name FORGE.VideoHls#_onRateChangeBind
     * @type {Function}
     * @private
     */
    this._onRateChangeBind = null;

    /**
     * Event handler for current video playing binded to this.
     * @name FORGE.VideoHls#_onPlayingBind
     * @type {Function}
     * @private
     */
    this._onPlayingBind = null;

    /**
     * Event handler for current video quality request binded to this.
     * @name  FORGE.VideoHls#_onQualityRequestBind
     * @type {Function}
     * @private
     */
    this._onQualityRequestBind = null;

    /**
     * Event handler for current video quality change binded to this.
     * @name  FORGE.VideoHls#_onQualityChangeBind
     * @type {Function}
     * @private
     */
    this._onQualityChangeBind = null;

    /**
     * Event handler for current video quality change aborted binded to this.
     * @name  FORGE.VideoHls#_onQualityAbortBind
     * @type {Function}
     * @private
     */
    //this._onQualityAbortBind = null;

    /**
     * Event handler for stream switch completed.
     * @name  FORGE.VideoHls#_onSwitchCompletedBind
     * @type {Function}
     * @private
     */
    this._onSwitchCompletedBind = null;

    /**
     * Event handler for metrics changed.
     * @name  FORGE.VideoHls#_onMetricsChangedBind
     * @type {Function}
     * @private
     */
    this._onMetricsChangedBind = null;

    FORGE.VideoBase.call(this, viewer, "VideoHls");
};

FORGE.VideoHls.prototype = Object.create(FORGE.VideoBase.prototype);
FORGE.VideoHls.prototype.constructor = FORGE.VideoHls;

/**
 * Media types list.
 * @name FORGE.VideoHls.mediaType
 * @type {Object}
 * @const
 */
FORGE.VideoHls.mediaType = {};

/**
 * @name FORGE.VideoHls.mediaType.VIDEO
 * @type {string}
 * @const
 */
FORGE.VideoHls.mediaType.VIDEO = "video";

/**
 * @name FORGE.VideoHls.mediaType.AUDIO
 * @type {string}
 * @const
 */
FORGE.VideoHls.mediaType.AUDIO = "audio";

/**
 * Boot sequence.
 * @method FORGE.VideoHls#_boot
 * @private
 */
FORGE.VideoHls.prototype._boot = function()
{
    FORGE.VideoBase.prototype._boot.call(this);

    if (typeof Hls === "undefined")
    {
        throw "FORGE.VideoHls._boot: Can't create HLS video stream without hls.js Media Player.";
    }

    if (Hls.isSupported() === false)
    {
        throw "FORGE.VideoHls._boot: HLS video stream is not supported by your browser.";
    }

    //register the uid
    this._uid = this._key;
    this._register();

    this._loadHlsMediaPlayerSourceBind = this._loadHlsMediaPlayerSource.bind(this);

    this._onLoadStartBind = this._onLoadStartHandler.bind(this);
    this._onDurationChangeBind = this._onDurationChangeHandler.bind(this);
    this._onLoadedMetaDataBind = this._onLoadedMetaDataHandler.bind(this);
    this._onLoadedDataBind = this._onLoadedDataHandler.bind(this);
    this._onProgressBind = this._onProgressHandler.bind(this);
    this._onCanPlayBind = this._onCanPlayHandler.bind(this);
    this._onCanPlayThroughBind = this._onCanPlayThroughHandler.bind(this);
    this._onPlayBind = this._onPlayHandler.bind(this);
    this._onPauseBind = this._onPauseHandler.bind(this);
    this._onTimeUpdateBind = this._onTimeUpdateHandler.bind(this);
    this._onVolumeChangeBind = this._onVolumeChangeHandler.bind(this);
    this._onSeekingBind = this._onSeekingHandler.bind(this);
    this._onSeekedBind = this._onSeekedHandler.bind(this);
    this._onEndedBind = this._onEndedHandler.bind(this);
    this._onErrorBind = this._onErrorHandler.bind(this);
    this._onStalledBind = this._onStalledHandler.bind(this);
    this._onRateChangeBind = this._onRateChangeHandler.bind(this);
    this._onPlayingBind = this._onPlayingHandler.bind(this);
    this._onQualityRequestBind = this._onQualityRequestHandler.bind(this);
    this._onQualityChangeBind = this._onQualityChangeHandler.bind(this);
    //this._onQualityAbortBind = this._onQualityAbortHandler.bind(this);

    // HLS specific
    this._onSwitchCompletedBind = this._onSwitchCompletedHandler.bind(this);
    this._onMetricsChangedBind = this._onMetricsChangedHandler.bind(this);

    //Listen to the main volume change to adapt the video volume accordingly.
    this._viewer.audio.onVolumeChange.add(this._mainVolumeChangeHandler, this);

    //Listen to the enabled state of the sound manager.
    this._viewer.audio.onDisable.add(this._disableSoundHandler, this);

    //force the creation of "onQualitiesLoaded" event dispatcher and memorize it's data
    this._onQualitiesLoaded = new FORGE.EventDispatcher(this, true);

    if (this._config !== null)
    {
        this.load(this._config);
    }

    this._viewer.display.register(this);
    this._notifyReady();
    this._applyPending(false);
};

/**
 * Parse the video configuration object.
 * @method FORGE.VideoHls#_parseConfig
 * @private
 * @param  {?(string|FORGE.VideoQuality|Array<(string|FORGE.VideoQuality)>)} config - The config object to parse.
 * @return {string} Returns the manifest url for HLS.
 */
FORGE.VideoHls.prototype._parseConfig = function(config)
{
    if (config !== null)
    {
        if (FORGE.Utils.isTypeOf(config, "string") === true)
        {
            config = [config];
        }
        else if (FORGE.Utils.isTypeOf(config, "VideoQuality") === true)
        {
            config = [config];
        }

        if (FORGE.Utils.isArrayOf(config, "string") === true)
        {
            this._manifestUrl = config[0];
        }
        else if (FORGE.Utils.isArrayOf(config, "VideoQuality") === true)
        {
            this._manifestUrl = config[0].url;
        }
    }

    return this._manifestUrl;
};

/**
 * Notify that the dispay object has been resized.<br>
 * This method ovverrides the {@link FORGE.DisplayObject} method.
 * @method  FORGE.VideoHls#_notifyResize
 * @private
 * @param  {PropertyToUpdate} data - The data contains the property that have changed.
 */
FORGE.VideoHls.prototype._notifyResize = function(data)
{
    var video = this._video;

    if (video !== null && video.element !== null)
    {
        video.element.setAttribute("width", this.pixelWidth);
        video.element.setAttribute("height", this.pixelHeight);
    }

    FORGE.DisplayObject.prototype._notifyResize.call(this, data);
};

/**
 * Create placeholders objects for videos and theirs attributes.
 * @method FORGE.VideoHls#_createVideoObject
 * @private
 * @return {Object} Returns the populated videos array.
 */
FORGE.VideoHls.prototype._createVideoObject = function()
{
    var video = {
        index: 0,
        element: null,
        buffer: null,
        played: null
    };

    this._video = video;

    return video;
};

/**
 * Populate a video object with an element <video> and a buffer/played {@link FORGE.VideoTimeRanges} managers.
 * @method  FORGE.VideoHls#_createVideoTag
 * @private
 * @return {Object} Returns the populated video object.
 */
FORGE.VideoHls.prototype._createVideoTag = function()
{
    //Create a video tag and get the quality
    var element = document.createElement("video");
    element.setAttribute("webkit-playsinline", "webkit-playsinline");
    element.setAttribute("width", this.pixelWidth);
    element.setAttribute("height", this.pixelHeight);
    element.volume = 0;
    element.playbackRate = this._playbackRate;
    element.crossOrigin = "anonymous";
    element.id = "FORGE-VideoHls-" + this._uid;

    var buffer = new FORGE.VideoTimeRanges(element, "buffered");
    var played = new FORGE.VideoTimeRanges(element, "played");

    //Update the video object with the element and fresh buffer and played
    var video = this._video;
    video.element = element;
    video.buffer = buffer;
    video.played = played;
    video.lastTimeStamp = 0;

    return video;
};

/**
 * Get a property of the video element of the current video object.
 * @method  FORGE.VideoHls#_getCurrentVideoElementProperty
 * @param  {string} property - The property you want to get from the current video element.
 * @param  {*} defaultReturnValue - The default return value if the video object or its element is null.
 * @return {*} Return the requested property value or the default one if necessary.
 * @private
 */
FORGE.VideoHls.prototype._getCurrentVideoElementProperty = function(property, defaultReturnValue)
{
    var video = this._video;

    if (video !== null && video.element !== null)
    {
        return video.element[property];
    }

    return defaultReturnValue;
};

/**
 * Create instance of the hls.js Media Player.
 * @method FORGE.VideoHls#_initHlsMediaPlayer
 * @private
 */
FORGE.VideoHls.prototype._initHlsMediaPlayer = function()
{
    var hlsConfig = {
        autoStartLoad: false, // start after Hls.Events.MANIFEST_PARSED
        startPosition : -1, // startTime
        debug: true,
        startLevel: undefined,
        enableWebVTT: true,
        enableCEA708Captions: true,
        stretchShortVideoTrack: false,
        maxAudioFramesDrift : 1,
        forceKeyFrameOnDiscontinuity: true
    };

    // create the Media Player
    this._hlsMediaPlayer = new Hls(hlsConfig);

    // add video tag element and video source file
    this._hlsMediaPlayer.attachMedia(this._video.element);

    // hls Media Player is ready?
    this._hlsMediaPlayer.on(Hls.Events.MEDIA_ATTACHED, this._loadHlsMediaPlayerSourceBind);

    if (this._qualityMode === "")
    {
        this._setQualityMode(this._defaultQualityMode);
    }
};

/**
 * Load source into the hls.js Media Player.
 * @method FORGE.VideoHls#_loadHlsMediaPlayerSource
 * @private
 */
FORGE.VideoHls.prototype._loadHlsMediaPlayerSource = function()
{
    console.log("video and hls.js are now bound together !");
    this._hlsMediaPlayer.loadSource(this._manifestUrl);
    // this._hlsMediaPlayer.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
    //     console.log("manifest loaded, found " + data.levels.length + " quality level");
    // });

    this._installEvents();

    this._addVideoToDom();
};

/**
 * Add video element to the DOM.
 * @method FORGE.VideoHls#_addVideoToDom
 * @private
 */
FORGE.VideoHls.prototype._addVideoToDom = function()
{
    // Remove video tag from our container div
    this._dom.innerHTML = "";

    this._dom.appendChild(this._video.element);
};

/**
 * Bind native events handler for the current video.
 * @method FORGE.VideoHls#_installEvents
 * @private
 */
FORGE.VideoHls.prototype._installEvents = function()
{
    this._hlsMediaPlayer.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
        console.log("manifest loaded, found " + data.levels.length + " quality level");
    });

    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["CAN_PLAY"], this._onCanPlayBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["ERROR"], this._onErrorBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_ENDED"], this._onEndedBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_ERROR"], this._onErrorBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_METADATA_LOADED"], this._onLoadedMetaDataBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_PAUSED"], this._onPauseBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_PROGRESS"], this._onProgressBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_SEEKING"], this._onSeekingBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_SEEKED"], this._onSeekedBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_STARTED"], this._onPlayBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_TIME_UPDATED"], this._onTimeUpdateBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["QUALITY_CHANGE_RENDERED"], this._onQualityChangeBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["QUALITY_CHANGE_REQUESTED"], this._onQualityRequestBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["STREAM_INITIALIZED"], this._onLoadStartBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_PLAYING"], this._onPlayingBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["BUFFER_EMPTY"], this._onStalledBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PLAYBACK_RATE_CHANGED"], this._onRateChangeBind);

    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["PERIOD_SWITCH_COMPLETED"], this._onSwitchCompletedBind);
    // this._hlsMediaPlayer.on(Hls.MediaPlayer.events["METRIC_CHANGED"], this._onMetricsChangedBind);

    this._video.element.addEventListener("loadeddata", this._onLoadedDataBind, false);
    this._video.element.addEventListener("durationchange", this._onDurationChangeBind, false);
    this._video.element.addEventListener("canplaythrough", this._onCanPlayThroughBind, false);
    this._video.element.addEventListener("volumechange", this._onVolumeChangeBind, false);
};

/**
 * Unbind events handler for video.
 * @method FORGE.VideoHls#_uninstallEvents
 * @private
 */
FORGE.VideoHls.prototype._uninstallEvents = function()
{
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["CAN_PLAY"], this._onCanPlayBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["ERROR"], this._onErrorBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_ENDED"], this._onEndedBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_ERROR"], this._onErrorBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_METADATA_LOADED"], this._onLoadedMetaDataBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_PAUSED"], this._onPauseBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_PROGRESS"], this._onProgressBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_SEEKING"], this._onSeekingBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_SEEKED"], this._onSeekedBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_STARTED"], this._onPlayBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_TIME_UPDATED"], this._onTimeUpdateBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["QUALITY_CHANGE_RENDERED"], this._onQualityChangeBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["QUALITY_CHANGE_REQUESTED"], this._onQualityRequestBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["STREAM_INITIALIZED"], this._onLoadStartBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_PLAYING"], this._onPlayingBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["BUFFER_EMPTY"], this._onStalledBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PLAYBACK_RATE_CHANGED"], this._onRateChangeBind);

    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["PERIOD_SWITCH_COMPLETED"], this._onSwitchCompletedBind);
    // this._hlsMediaPlayer.off(Hls.MediaPlayer.events["METRIC_CHANGED"], this._onMetricsChangedBind);

    this._video.element.removeEventListener("loadeddata", this._onLoadedDataBind, false);
    this._video.element.removeEventListener("durationchange", this._onDurationChangeBind, false);
    this._video.element.removeEventListener("canplaythrough", this._onCanPlayThroughBind, false);
    this._video.element.removeEventListener("volumechange", this._onVolumeChangeBind, false);
};

/**
 * Private event handler for loadStart.
 * @method  FORGE.VideoHls#_onLoadStartHandler
 * @param  {Event} event - The native video event.
 * @private
 */
FORGE.VideoHls.prototype._onLoadStartHandler = function(event)
{
    var element = this._video.element;
    this.log("onLoadStart [readyState: " + element.readyState + "]");

    //populate qualities array with the HLS bitrates info list
    this._createQualitiesFromBitrateInfoList(this._manifestUrl, this._hlsMediaPlayer.getBitrateInfoListFor(FORGE.VideoHls.mediaType.VIDEO));

    if (this._onLoadStart !== null)
    {
        this._onLoadStart.dispatch(event);
    }
};

/**
 * Create a qualities array from the bitrates info list.
 * @method FORGE.VideoHls#_createQualitiesFromBitrateInfoList
 * @param  {string} url - The manifest url.
 * @param  {Array<BitrateInfo>} bitrates - The bitrates array.
 * @param  {boolean=} checkURL - URL must be checked?
 * @return {Array<FORGE.VideoQuality>} The qualities array.
 * @private
 */
FORGE.VideoHls.prototype._createQualitiesFromBitrateInfoList = function(url, bitrates, checkURL)
{
    var qualities = [];
    var quality;

    if (bitrates !== null)
    {
        for (var i = 0, ii = bitrates.length; i < ii; i++)
        {
            if (checkURL === true && FORGE.URL.isValid(url) === false)
            {
                throw "FORGE.Video: URL " + url + " is invalid";
            }

            quality = new FORGE.VideoQuality(url);
            quality.id = bitrates[i].qualityIndex;
            quality.bitrate = bitrates[i].bitrate;
            quality.width = bitrates[i].width;
            quality.height = bitrates[i].height;

            qualities.push(quality);
        }

        this._qualities = /** @type {Array<FORGE.VideoQuality>} */ (qualities);

        if (this._onQualitiesLoaded !== null)
        {
            this._onQualitiesLoaded.dispatch(qualities);
        }
    }
    else
    {
        this.destroy();
    }

    return qualities;
};

/**
 * Get the index of a {@link FORGE.VideoQuality} that is in the _videoQualities array.
 * @method  FORGE.VideoHls#_indexOfQuality
 * @private
 * @param  {FORGE.VideoQuality} quality - The quality you need to get its index.
 * @return {number} Returns the index of the quality if found, -1 if not found.
 */
FORGE.VideoHls.prototype._indexOfQuality = function(quality)
{
    var q;
    for (var i = 0, ii = this._qualities.length; i < ii; i++)
    {
        q = this._qualities[i];

        if (q === quality)
        {
            return i;
        }
    }

    return -1;
};

/**
 * Private event handler for period switch completed.
 * @method  FORGE.VideoHls#_onSwitchCompletedHandler
 * @param  {SwitchEvents} event - The hls.js media player event.
 * @private
 */
FORGE.VideoHls.prototype._onSwitchCompletedHandler = function(event)
{
    var element = this._video.element;
    this.log("_onSwitchCompleted [readyState: " + element.readyState + "]");

    this._streamInfo = /** @type {StreamInfo} */ (event.toStreamInfo);
};

/**
 * Private event handler for mertics changed.
 * @method  FORGE.VideoHls#_onMetricsChangedHandler
 * @param  {MetricChangedEvents} event - The hls.js media player event.
 * @private
 */
FORGE.VideoHls.prototype._onMetricsChangedHandler = function(event)
{
    var element = this._video.element;
    this.log("_onMetricsChangedHandler [readyState: " + element.readyState + "]");

    if (this._playerVideoMetrics === null)
    {
        this._playerVideoMetrics = this._hlsMediaPlayer.getMetricsFor(FORGE.VideoHls.mediaType.VIDEO);
    }

    if (this._playerAudioMetrics === null)
    {
        this._playerAudioMetrics = this._hlsMediaPlayer.getMetricsFor(FORGE.VideoHls.mediaType.AUDIO);
    }

    if (this._hlsMetrics === null)
    {
        this._hlsMetrics = this._hlsMediaPlayer.gethlsMetrics();
    }

    //set the current quality index
    // if (this._playerVideoMetrics !== null && this._hlsMetrics !== null)
    // {
    //     var repSwitch = /** @type {RepresentationSwitch} */ (this._hlsMetrics.getCurrentRepresentationSwitch(this._playerVideoMetrics));
    //     if (repSwitch !== null)
    //     {
    //         this._currentQuality = this._hlsMetrics.getIndexForRepresentation(repSwitch.to, this._streamInfo.index);
    //         if(this._qualityInitialized === false)
    //         {
    //             this._setRequestQuality(this._currentQuality);
    //             this._qualityInitialized = true;
    //         }
    //     }
    // }

    if (this._onMetricsChanged !== null)
    {
        var metrics;

        if (event.mediaType === FORGE.VideoHls.mediaType.VIDEO)
        {
            metrics = this._getMetricsFor(FORGE.VideoHls.mediaType.VIDEO, this._playerVideoMetrics, this._hlsMetrics);
            if (metrics)
            {
                this._monitoring = {
                    "videoBitrate": metrics.bitrate,
                    "videoIndex": metrics.index,
                    "videoPendingIndex": metrics.pendingIndex,
                    "videoMaxIndex": metrics.maxIndex,
                    "videoBufferLength": metrics.bufferLength,
                    "videoDroppedFrames": metrics.droppedFrames
                        //"videoRequestsQueue": metrics.requestsQueue
                };
            }
        }

        if (event.mediaType === FORGE.VideoHls.mediaType.AUDIO)
        {
            metrics = this._getMetricsFor(FORGE.VideoHls.mediaType.AUDIO, this._playerAudioMetrics, this._hlsMetrics);
            if (metrics)
            {
                this._monitoring = {
                    "audioBitrate": metrics.bitrate,
                    "audioIndex": metrics.index,
                    "audioPendingIndex": metrics.pendingIndex,
                    "audioMaxIndex": metrics.maxIndex,
                    "audioBufferLength": metrics.bufferLength,
                    "audioDroppedFrames": metrics.droppedFrames
                        //"audioRequestsQueue": metrics.requestsQueue
                };
            }
        }

        this._onMetricsChanged.dispatch(event);
    }
};


/**
 * Prepare a metrics object for video/audio data.
 * @method  FORGE.VideoHls#_getMetricsFor
 * @param {string} type - The video or audio type.
 * @param {Object} metrics - The player video or audio metrics.
 * @param {hlsMetrics} hlsMetrics - The hls stream video or audio metrics.
 * @return {?Object} The monitoring object
 * @private
 */
FORGE.VideoHls.prototype._getMetricsFor = function(type, metrics, hlsMetrics)
{
    if (metrics !== null && hlsMetrics !== null)
    {
        var streamIndex = this._streamInfo.index;
        var repSwitch, maxIndex, bufferLevel, droppedFramesMetrics, bitrate, index, pendingIndex, bufferLength, droppedFrames; //httpRequests requestsQueue pendingValue

        repSwitch = /** @type {RepresentationSwitch} */ (hlsMetrics.getCurrentRepresentationSwitch(metrics));
        if (repSwitch !== null)
        {
            // index = hlsMetrics.getIndexForRepresentation(repSwitch.to, streamIndex);
            bitrate = Math.round(hlsMetrics.getBandwidthForRepresentation(repSwitch.to, streamIndex) / 1000);
        }
        if (isNaN(bitrate) || bitrate === undefined)
        {
            bitrate = 0;
        }

        if (type === FORGE.VideoHls.mediaType.VIDEO)
        {
            index = this._currentVideoIndex + 1;
            pendingIndex = this._currentVideoPendingIndex + 1;
        }
        else if (type === FORGE.VideoHls.mediaType.AUDIO)
        {
            index = this._currentAudioIndex + 1;
            pendingIndex = this._currentAudioPendingIndex + 1;
        }

        if (isNaN(index) || index === undefined)
        {
            index = 0;
        }
        if (isNaN(pendingIndex) || pendingIndex === undefined)
        {
            pendingIndex = 0;
        }

        maxIndex = hlsMetrics.getMaxIndexForBufferType(type, streamIndex);
        if (isNaN(maxIndex) || maxIndex === undefined)
        {
            maxIndex = 0;
        }

        bufferLevel = hlsMetrics.getCurrentBufferLevel(metrics);
        if (bufferLevel !== null)
        {
            bufferLength = bufferLevel.toPrecision(5);
        }
        if (isNaN(bufferLength) || bufferLength === undefined)
        {
            bufferLength = 0;
        }

        //httpRequests = hlsMetrics.getHttpRequests(metrics);

        droppedFramesMetrics = /** @type {DroppedFrames} */ (hlsMetrics.getCurrentDroppedFrames(metrics));
        if (droppedFramesMetrics !== null)
        {
            droppedFrames = droppedFramesMetrics.droppedFrames;
        }

        //pendingValue = this._hlsMediaPlayer.getQualityFor(type);

        //requestsQueue = hlsMetrics.getRequestsQueue(metrics);

        var result = {
            bitrate: bitrate,
            index: index,
            pendingIndex: pendingIndex,
            maxIndex: maxIndex,
            bufferLength: bufferLength,
            droppedFrames: droppedFrames
                //requestsQueue: requestsQueue
        };

        return result;
    }

    return null;
};

/**
 * Private event handler for quality change.
 * @method  FORGE.VideoHls#_onQualityChangeHandler
 * @private
 * @param  {QualityEvents} event - The hls.js media player event.
 */
FORGE.VideoHls.prototype._onQualityChangeHandler = function(event)
{
    var element = this._video.element;
    this.log("onQualityChange [readyState: " + element.readyState + "]");

    if (event.mediaType === FORGE.VideoHls.mediaType.AUDIO)
    {
        this._currentAudioIndex = event.newQuality;
        this._currentAudioPendingIndex = event.newQuality;
    }
    else if (event.mediaType === FORGE.VideoHls.mediaType.VIDEO)
    {
        this._currentVideoIndex = event.newQuality;
        this._currentVideoPendingIndex = event.newQuality;

        if (this._onQualityChange !== null)
        {
            this._onQualityChange.dispatch(this._currentVideoPendingIndex);
        }
    }
};

/**
 * Private event handler for quality request.
 * @method  FORGE.VideoHls#_onQualityRequestHandler
 * @private
 * @param  {QualityEvents} event - The hls.js media player event.
 */
FORGE.VideoHls.prototype._onQualityRequestHandler = function(event)
{
    var element = this._video.element;
    this.log("onQualityRequest [readyState: " + element.readyState + "]");

    if (event.mediaType === FORGE.VideoHls.mediaType.AUDIO)
    {
        this._currentAudioIndex = event.oldQuality;
        this._currentAudioPendingIndex = event.newQuality;
    }
    else if (event.mediaType === FORGE.VideoHls.mediaType.VIDEO)
    {
        this._currentVideoIndex = event.oldQuality;
        this._currentVideoPendingIndex = event.newQuality;

        if (this._onQualityRequest !== null)
        {
            this._onQualityRequest.dispatch(this._currentVideoPendingIndex);
        }
    }
};

/**
 * Private event handler for quality request aborted.
 * @method  FORGE.VideoHls#_onQualityAbortHandler
 * @private
 * @param  {Event} event - The hls.js media player event.
 */
// FORGE.VideoHls.prototype._onQualityAbortHandler = function(event)
// {
//     var element = this._video.element;
//     this.log("onQualityAbort [readyState: "+element.readyState+"]");

//     if(this._onQualityAbort !== null)
//     {
//         this._onQualityAbort.dispatch(this._video.requestIndex);
//     }
// };

/**
 * Private event handler for durationChange.
 * @method  FORGE.VideoHls#_onDurationChangeHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onDurationChangeHandler = function(event)
{
    var element = this._video.element;
    this.log("onDurationChange [readyState: " + element.readyState + "]");

    //@firefox - FF disptach durationchange twice on readystate HAVE_METADATA (1) & HAVE_ENOUGH_DATA (4)
    //I will not dispatch this event if readystate is HAVE_ENOUGH_DATA (4) !
    if (this._onDurationChange !== null && element.readyState === HTMLMediaElement.HAVE_METADATA)
    {
        this._onDurationChange.dispatch(event);
    }
};

/**
 * Private event handler for loadedMetaData.
 * @method  FORGE.VideoHls#_onLoadedMetaDataHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onLoadedMetaDataHandler = function(event)
{
    var element = this._video.element;
    this.log("onLoadedMetaData [readyState: " + element.readyState + "]");

    this._metaDataLoaded = true;

    if (this._onLoadedMetaData !== null)
    {
        this._onLoadedMetaData.dispatch(event);
    }
};

/**
 * Private event handler for loadedData.
 * @method  FORGE.VideoHls#_onLoadedDataHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onLoadedDataHandler = function(event)
{
    var element = this._video.element;
    this.log("onLoadedData [readyState: " + element.readyState + "]");

    if (this._onLoadedData !== null)
    {
        this._onLoadedData.dispatch(event);
    }
};

/**
 * Private event handler for progress.
 * @method  FORGE.VideoHls#_onProgressHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onProgressHandler = function(event)
{
    //var element = this._video.element;
    //this.log("onProgress [readyState: "+element.readyState+"]");

    if (this._onProgress !== null)
    {
        this._onProgress.dispatch(event);
    }
};

/**
 * Private event handler for canPlay.
 * @method  FORGE.VideoHls#_onCanPlayHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onCanPlayHandler = function(event)
{
    var element = this._video.element;
    this.log("onCanPlay [readyState: " + element.readyState + "]");

    this._canPlay = true;

    if (this._onCanPlay !== null)
    {
        this._onCanPlay.dispatch(event);
    }
};

/**
 * Private event handler for canPlayThrough.
 * @method  FORGE.VideoHls#_onCanPlayThroughHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onCanPlayThroughHandler = function(event)
{
    var element = this._video.element;
    this.log("onCanPlayThrough [readyState: " + element.readyState + "]");

    this._canPlay = true;

    if (this._onCanPlayThrough !== null)
    {
        this._onCanPlayThrough.dispatch(event);
    }
};

/**
 * Private event handler for play.
 * @method  FORGE.VideoHls#_onPlayHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onPlayHandler = function(event)
{
    var element = this._video.element;
    this.log("onPlay [readyState: " + element.readyState + "]");

    if (this._onPlay !== null)
    {
        this._onPlay.dispatch(event);
    }
};

/**
 * Private event handler for pause.
 * @method  FORGE.VideoHls#_onPauseHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onPauseHandler = function(event)
{
    var element = this._video.element;
    this.log("onPause [readyState: " + element.readyState + "]");

    this._playing = false;

    if (this._onPause !== null)
    {
        this._onPause.dispatch(event);
    }
};

/**
 * Private event handler for timeUpdate.
 * @method  FORGE.VideoHls#_onTimeUpdateHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onTimeUpdateHandler = function(event)
{
    //var element = this._video.element;
    //this.log("onTimeUpdate [readyState: "+element.readyState+"]");

    if (this._onTimeUpdate !== null)
    {
        this._onTimeUpdate.dispatch(event);
    }
};

/**
 * Private event handler for volumeChange.
 * @method  FORGE.VideoHls#_onVolumeChangeHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onVolumeChangeHandler = function(event)
{
    var element = this._video.element;
    this.log("onVolumeChange [readyState: " + element.readyState + "]");

    //I do not dispatch the volume change if readyState is HAVE_NOTHING (0).
    //because I set the volume at 0 when I create the video element, it is not usefull to dispatch this internal volume change ?
    if (this._onVolumeChange !== null && element.readyState !== HTMLMediaElement.HAVE_NOTHING)
    {
        this._onVolumeChange.dispatch(event);
    }
};

/**
 * Private event handler for seeking.
 * @method  FORGE.VideoHls#_onSeekingHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onSeekingHandler = function(event)
{
    var element = this._video.element;
    this.log("onSeeking [readyState: " + element.readyState + "]");

    this._canPlay = false;

    if (this._onSeeking !== null)
    {
        this._onSeeking.dispatch(event);
    }
};

/**
 * Private event handler for seeked.
 * @method  FORGE.VideoHls#_onSeekedHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onSeekedHandler = function(event)
{
    var element = this._video.element;
    this.log("onSeeked [readyState: " + element.readyState + "]");

    this._canPlay = false;

    if (this._onSeeked !== null)
    {
        this._onSeeked.dispatch(event);
    }
};

/**
 * Private event handler for ended.
 * @method  FORGE.VideoHls#_onEndedHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onEndedHandler = function(event)
{
    var element = this._video.element;
    this.log("onEnded [readyState: " + element.readyState + "]");

    this._playing = false;
    //this._dom.currentTime = 0;
    this._endCount++;

    if (this._loop === true)
    {
        this.play();
    }

    if (this._onEnded !== null)
    {
        this._onEnded.dispatch(event);
    }
};

/**
 * Private event handler for error.
 * @method  FORGE.VideoHls#_onErrorHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onErrorHandler = function(event)
{
    var element = this._video.element;
    this.log("onError [readyState: " + element.readyState + "]");

    if (this._onError !== null)
    {
        this._onError.dispatch(event);
    }
};

/**
 * Private event handler for stalled.
 * @method  FORGE.VideoHls#_onStalledHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onStalledHandler = function(event)
{
    var element = this._video.element;
    this.log("onStalled [readyState: " + element.readyState + "]");

    if (this._onStalled !== null)
    {
        this._onStalled.dispatch(event);
    }
};

/**
 * Private event handler for rate change.
 * @method  FORGE.VideoHls#_onRateChangeHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onRateChangeHandler = function(event)
{
    var element = this._video.element;
    this.log("onRateChange [readyState: " + element.readyState + "]");

    if (this._onRateChange !== null)
    {
        this._onRateChange.dispatch(event);
    }
};

/**
 * Private event handler for playing.
 * @method  FORGE.VideoHls#_onPlayingHandler
 * @private
 * @param  {Event} event - The native video event.
 */
FORGE.VideoHls.prototype._onPlayingHandler = function(event)
{
    var element = this._video.element;
    this.log("onPlaying [readyState: " + element.readyState + "]");

    if (this._onPlaying !== null)
    {
        this._onPlaying.dispatch(event);
    }
};

/**
 * Destroy a video object at a specified index, wiil look at the video object into _videos array then detoy it.
 * @method FORGE.VideoHls#_destroyVideo
 * @private
 */
FORGE.VideoHls.prototype._destroyVideo = function()
{
    this.log("_destroyVideo");

    if (this._hlsMediaPlayer !== null && this._hlsMediaPlayer.isReady() === true)
    {
        this._uninstallEvents();

        this._hlsMediaPlayer.pause();
        this._hlsMediaPlayer.reset();
    }

    var video = this._video;
    var element = video.element;

    if (typeof element !== "undefined" && element !== null)
    {
        if (element.parentNode === this._dom)
        {
            this._dom.removeChild(element);
        }
    }

    element = null;
    video.element = null;

    if (video.buffer !== null)
    {
        video.buffer.destroy();
        video.buffer = null;
    }

    if (video.played !== null)
    {
        video.played.destroy();
        video.played = null;
    }

    video = null;
};

/**
 * Handles the disable status of the sound manager.
 * @method FORGE.VideoHls#_disableSoundHandler
 * @private
 */
FORGE.VideoHls.prototype._disableSoundHandler = function()
{
    var v = this._video;

    if (v !== null && v.element !== null && this._viewer.audio.enabled === false)
    {
        this._hlsMediaPlayer.setVolume(0);
    }
};

/**
 * Handles the main volume change, update the volume factor to the video volume.
 * @method FORGE.VideoHls#_mainVolumeChangeHandler
 * @private
 */
FORGE.VideoHls.prototype._mainVolumeChangeHandler = function()
{
    this._updateVolume();
};

/**
 * Apply the main volume factor to the video volume.
 * @method FORGE.VideoHls#_updateVolume
 * @private
 */
FORGE.VideoHls.prototype._updateVolume = function()
{
    var v = this._video;

    if (v !== null && v.element !== null && this._viewer.audio.enabled === true)
    {
        this._hlsMediaPlayer.setVolume(this._volume * this._viewer.audio.volume);
        if (this._muted === true)
        {
            this._hlsMediaPlayer.setMute(true);
        }
        else
        {
            this._hlsMediaPlayer.setMute(false);
        }
    }
};

/**
 * Apply the requested quality index.
 * @method FORGE.VideoHls#_setRequestQuality
 * @param {number} index - The quality index.
 * @private
 */
FORGE.VideoHls.prototype._setRequestQuality = function(index)
{
    this._currentVideoPendingIndex = index;

    if (this._streamInfo !== null && this._hlsMediaPlayer !== null && this._hlsMediaPlayer.isReady() === true && this._hlsMetrics !== null)
    {
        var streamIndex = this._streamInfo.index;
        var maxVideoIndex = this._hlsMetrics.getMaxIndexForBufferType(FORGE.VideoHls.mediaType.VIDEO, streamIndex);
        var maxAudioIndex = this._hlsMetrics.getMaxIndexForBufferType(FORGE.VideoHls.mediaType.AUDIO, streamIndex);

        var newVideoIndex = index,
            newAudioIndex = index;

        // zero based indexes
        if (newVideoIndex >= maxVideoIndex)
        {
            newVideoIndex = maxVideoIndex - 1;
        }
        if (newVideoIndex < 0)
        {
            newVideoIndex = 0;
        }
        if (newAudioIndex >= maxAudioIndex)
        {
            newAudioIndex = maxAudioIndex - 1;
        }
        if (newAudioIndex < 0)
        {
            newAudioIndex = 0;
        }

        this._hlsMediaPlayer.setQualityFor(FORGE.VideoHls.mediaType.VIDEO, newVideoIndex);
        this._hlsMediaPlayer.setQualityFor(FORGE.VideoHls.mediaType.AUDIO, newAudioIndex);
    }

    // Update the volume for the requested video
    this._updateVolume();
};

/**
 * Sets the quality mode.<br>
 * This activate or deactivate the adaptative bitrate switching for video and audio (ABR).
 * @method  FORGE.VideoHls#_setQualityMode
 * @private
 * @param {string} mode - Quality mode to be set.
 */
FORGE.VideoHls.prototype._setQualityMode = function(mode)
{
    if (this._qualityMode === mode)
    {
        return;
    }

    if (mode === FORGE.VideoQualityMode.AUTO || mode === FORGE.VideoQualityMode.MANUAL)
    {
        this._qualityMode = mode;

        // if (this._hlsMediaPlayer !== null && this._hlsMediaPlayer.isReady() === true)
        // {
        //     if (mode === FORGE.VideoQualityMode.MANUAL)
        //     {
        //         this._hlsMediaPlayer.setAutoSwitchQualityFor(FORGE.VideoHls.mediaType.VIDEO, false);
        //         this._hlsMediaPlayer.setAutoSwitchQualityFor(FORGE.VideoHls.mediaType.AUDIO, false);
        //     }
        //     else
        //     {
        //         this._hlsMediaPlayer.setAutoSwitchQualityFor(FORGE.VideoHls.mediaType.VIDEO, true);
        //         this._hlsMediaPlayer.setAutoSwitchQualityFor(FORGE.VideoHls.mediaType.AUDIO, true);
        //     }
        // }

        if (this._onQualityModeChange !== null)
        {
            this._onQualityModeChange.dispatch(this._qualityMode);
        }
    }
};

/**
 * Load a config or a video url to the source.
 * @method FORGE.VideoHls#load
 * @param {?(string|FORGE.VideoQuality|Array<(string|FORGE.VideoQuality)>)} config - The {@link FORGE.VideoQuality} or the url string to load.
 */
FORGE.VideoHls.prototype.load = function(config)
{
    //parse the config in parameters
    this._parseConfig(config);

    if (this._manifestUrl === "")
    {
        throw "FORGE.VideoHls : Can't create video with no manifest!";
    }

    //Create place holders for video and video element
    this._createVideoObject();
    this._createVideoTag();

    this._initHlsMediaPlayer();
};

/**
 * Plays the video.
 * @method  FORGE.VideoHls#play
 * @param {number=} time - Current video time to start playback.
 * @param {boolean=} loop - Media must be looped?
 */
FORGE.VideoHls.prototype.play = function(time, loop)
{
    FORGE.VideoBase.prototype.play.call(this, time, loop);

    if (this._hlsMediaPlayer !== null && this._hlsMediaPlayer.isReady() === true)
    {
        this._hlsMediaPlayer.play();
        this._playing = true;
        this._paused = false;
        this._playCount++;
    }
};

/**
 * Pauses the video.
 * @method  FORGE.VideoHls#pause
 */
FORGE.VideoHls.prototype.pause = function()
{
    if (this._hlsMediaPlayer !== null && this._hlsMediaPlayer.isReady() === true)
    {
        this._hlsMediaPlayer.pause();
        this._playing = false;
        this._paused = true;
    }
};

/**
 * Stop the video the video (pause it and set time to 0).
 * @method  FORGE.VideoHls#stop
 */
FORGE.VideoHls.prototype.stop = function()
{
    if (this._hlsMediaPlayer !== null && this._hlsMediaPlayer.isReady() === true)
    {
        this._hlsMediaPlayer.pause();
        this._hlsMediaPlayer.seek(0);
        this._video.element.currentTime = 0;
        this._playing = false;
        this._paused = true;
    }
};

/**
 * Toggles the playback status, if play toggle to pause and vice versa.
 * @method  FORGE.VideoHls#togglePlayback
 */
FORGE.VideoHls.prototype.togglePlayback = function()
{
    if (this._playing === true || this._viewer.audio.enabled === false)
    {
        this.pause();
    }
    else
    {
        this.play();
    }
};

/**
 * Mute the video sound.
 * @method  FORGE.VideoHls#mute
 */
FORGE.VideoHls.prototype.mute = function()
{
    if (this._muted === true || this._viewer.audio.enabled === false)
    {
        return;
    }

    this._muted = true;
    this._mutedVolume = this._volume;

    this._volume = 0;
    this._updateVolume();

    if (this._onMute !== null)
    {
        this._onMute.dispatch();
    }
};

/**
 * Unmute the video sound.
 * @method  FORGE.VideoHls#unmute
 * @param {number=} volume - The volume to be restored on unmute.
 */
FORGE.VideoHls.prototype.unmute = function(volume)
{
    if (this._muted === false)
    {
        return;
    }

    var v = (typeof volume === "number") ? volume : this._mutedVolume;

    this._muted = false;
    this._volume = FORGE.Math.clamp(v, 0, 1);
    this._updateVolume();

    if (this._onUnmute !== null)
    {
        this._onUnmute.dispatch();
    }
};

/**
 * Enable/Disable the buffer-occupancy-based (BOLA) ABR rule set.<br>
 * BOLA white paper: http://arxiv.org/abs/1601.06748.
 * @method  FORGE.VideoHls#enableBufferOccupancyABR
 * @param {boolean} bool - Is the BOLA rule set is activated?
 */
FORGE.VideoHls.prototype.enableBufferOccupancyABR = function(bool)
{
    if (this._hlsMediaPlayer !== null && this._hlsMediaPlayer.isReady() === true)
    {
        this._hlsMediaPlayer.enableBufferOccupancyABR(bool);
    }
};

/**
 * Destroy method.
 * @method FORGE.VideoHls#destroy
 */
FORGE.VideoHls.prototype.destroy = function()
{
    this._destroyVideo();

    if (this._onLoadStart !== null)
    {
        this._onLoadStart.destroy();
        this._onLoadStart = null;
    }

    if (this._onLoadedMetaData !== null)
    {
        this._onLoadedMetaData.destroy();
        this._onLoadedMetaData = null;
    }

    if (this._onLoadedData !== null)
    {
        this._onLoadedData.destroy();
        this._onLoadedData = null;
    }

    if (this._onProgress !== null)
    {
        this._onProgress.destroy();
        this._onProgress = null;
    }

    if (this._onDurationChange !== null)
    {
        this._onDurationChange.destroy();
        this._onDurationChange = null;
    }

    if (this._onCanPlay !== null)
    {
        this._onCanPlay.destroy();
        this._onCanPlay = null;
    }

    if (this._onCanPlayThrough !== null)
    {
        this._onCanPlayThrough.destroy();
        this._onCanPlayThrough = null;
    }

    if (this._onPlay !== null)
    {
        this._onPlay.destroy();
        this._onPlay = null;
    }

    if (this._onPause !== null)
    {
        this._onPause.destroy();
        this._onPause = null;
    }

    if (this._onTimeUpdate !== null)
    {
        this._onTimeUpdate.destroy();
        this._onTimeUpdate = null;
    }

    if (this._onCurrentTimeChange !== null)
    {
        this._onCurrentTimeChange.destroy();
        this._onCurrentTimeChange = null;
    }

    if (this._onVolumeChange !== null)
    {
        this._onVolumeChange.destroy();
        this._onVolumeChange = null;
    }

    if (this._onSeeking !== null)
    {
        this._onSeeking.destroy();
        this._onSeeking = null;
    }

    if (this._onSeeked !== null)
    {
        this._onSeeked.destroy();
        this._onSeeked = null;
    }

    if (this._onEnded !== null)
    {
        this._onEnded.destroy();
        this._onEnded = null;
    }

    if (this._onError !== null)
    {
        this._onError.destroy();
        this._onError = null;
    }

    if (this._onStalled !== null)
    {
        this._onStalled.destroy();
        this._onStalled = null;
    }

    if (this._onRateChange !== null)
    {
        this._onRateChange.destroy();
        this._onRateChange = null;
    }

    if (this._onPlaying !== null)
    {
        this._onPlaying.destroy();
        this._onPlaying = null;
    }

    if (this._onQualityRequest !== null)
    {
        this._onQualityRequest.destroy();
        this._onQualityRequest = null;
    }

    if (this._onQualityChange !== null)
    {
        this._onQualityChange.destroy();
        this._onQualityChange = null;
    }

    if (this._onQualityAbort !== null)
    {
        this._onQualityAbort.destroy();
        this._onQualityAbort = null;
    }

    if (this._onQualitiesLoaded !== null)
    {
        this._onQualitiesLoaded.destroy();
        this._onQualitiesLoaded = null;
    }

    if (this._onQualityModeChange !== null)
    {
        this._onQualityModeChange.destroy();
        this._onQualityModeChange = null;
    }

    if (this._onMetricsChanged !== null)
    {
        this._onMetricsChanged.destroy();
        this._onMetricsChanged = null;
    }

    this._onLoadStartBind = null;
    this._onLoadedMetaDataBind = null;
    this._onLoadedDataBind = null;
    this._onProgressBind = null;
    this._onDurationChangeBind = null;
    this._onCanPlayBind = null;
    this._onCanPlayThroughBind = null;
    this._onPlayBind = null;
    this._onPauseBind = null;
    this._onTimeUpdateBind = null;
    this._onVolumeChangeBind = null;
    this._onSeekingBind = null;
    this._onSeekedBind = null;
    this._onEndedBind = null;
    this._onErrorBind = null;
    this._onPlayingBind = null;
    this._onStalledBind = null;
    this._onRateChangeBind = null;
    this._onQualityRequestBind = null;
    this._onQualityChangeBind = null;
    //this._onQualityAbortBind = null;
    this._onMetricsChangedBind = null;

    //Unbind main volume event
    this._viewer.audio.onVolumeChange.remove(this._mainVolumeChangeHandler, this);

    this._viewer.audio.onDisable.remove(this._disableSoundHandler, this);

    this._hlsMediaPlayer = null;
    this._playerVideoMetrics = null;
    this._playerAudioMetrics = null;
    this._hlsMetrics = null;

    this._monitoring = null;
    this._streamInfo = null;

    this._config = null;

    this._qualities = null;

    this._video = null;

    FORGE.VideoBase.prototype.destroy.call(this);
};

/**
 * Get the monitoring object related to the video.
 * @name FORGE.VideoHls#monitoring
 * @type {Object}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "monitoring",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._monitoring;
    }
});

/**
 * Get and set the quality index of the video.
 * @name FORGE.VideoHls#quality
 * @type {(number|FORGE.VideoQuality)}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "quality",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._qualities[this._currentVideoIndex];
    },

    /** @this {FORGE.VideoHls} */
    set: function(value)
    {
        if (typeof value === "number" && value >= 0 && value < this._qualities.length)
        {
            this._setQualityMode(FORGE.VideoQualityMode.MANUAL);
            this._setRequestQuality(value);
        }
        else if (FORGE.Utils.isTypeOf(value, "VideoQuality") === true)
        {
            var i = this._indexOfQuality(value);

            if (i !== -1)
            {
                this._setQualityMode(FORGE.VideoQualityMode.MANUAL);
                this._setRequestQuality(i);
            }
            else
            {
                throw "Unknown quality";
            }
        }
        else
        {
            throw "Video quality " + value + " out of bounds";
        }
    }
});

/**
 * Get and set the quality mode.<br>
 * Available quality mode are listed in FORGE.VideoQualityMode const.
 * @name  FORGE.VideoHls#qualityMode
 * @type {string}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "qualityMode",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._qualityMode;
    },

    /** @this {FORGE.VideoHls} */
    set: function(value)
    {
        if (value === FORGE.VideoQualityMode.AUTO || value === FORGE.VideoQualityMode.MANUAL)
        {
            this._setQualityMode(value);
        }
    }
});

/**
 * Get the quality array.
 * @name  FORGE.VideoHls#qualities
 * @readonly
 * @type {Array<FORGE.VideoQuality>}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "qualities",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._qualities;
    }
});

/**
 * Get the requested quality index, returns -1 if no request is being processed.
 * @name  FORGE.VideoHls#requestIndex
 * @readonly
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "requestIndex",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._currentVideoPendingIndex;
    }
});

/**
 * Get the current quality index, returns -1 if no current is playing.
 * @name  FORGE.VideoHls#currentIndex
 * @readonly
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "currentIndex",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._currentVideoIndex;
    }
});

/**
 * Get the video object array.
 * @name  FORGE.VideoHls#video
 * @readonly
 * @type {Object}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "video",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._video;
    }
});

/**
 * Get the html element of the current video.
 * @name FORGE.VideoHls#element
 * @readonly
 * @type {?HTMLVideoElement}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "element",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        var video = this._video;

        if (video !== null && video.element !== null)
        {
            return video.element;
        }

        return null;
    }
});

/**
 * Get the {@link FORGE.VideoTimeRanges} of the video for buffered ranges.
 * @name FORGE.VideoHls#buffer
 * @readonly
 * @type {?FORGE.VideoTimeRanges}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "buffer",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        var video = this._video;

        if (video !== null && video.buffer !== null)
        {
            return video.buffer;
        }

        return null;
    }
});

/**
 * Get the {@link FORGE.VideoTimeRanges} of the video for played ranges.
 * @name FORGE.VideoHls#played
 * @readonly
 * @type {?FORGE.VideoTimeRanges}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "played",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        var video = this._video;

        if (video !== null && video.played !== null)
        {
            return video.played;
        }

        return null;
    }
});

/**
 * Get the original width of the video source.
 * @name FORGE.VideoHls#originalWidth
 * @readonly
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "originalWidth",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._getCurrentVideoElementProperty("videoWidth", 0);
    }
});

/**
 * Get the original height of the video source.
 * @name FORGE.VideoHls#originalHeight
 * @readonly
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "originalHeight",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._getCurrentVideoElementProperty("videoHeight", 0);
    }
});

/**
 * Get and set the currentTime  of the video.
 * @name FORGE.VideoHls#currentTime
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "currentTime",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._hlsMediaPlayer.time();
    },

    /** @this {FORGE.VideoHls} */
    set: function(value)
    {
        if (typeof value === "number") // && value < this.duration) //@todo see if we can put video currentTime in pending if no metadata received ?
        {
            this._hlsMediaPlayer.seek(value);

            if (this._onCurrentTimeChange !== null)
            {
                this._onCurrentTimeChange.dispatch(value);
            }
        }
    }
});

/**
 * Get and set the currentTime  of the video in milliseconds.
 * @name FORGE.VideoHls#currentTimeMS
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "currentTimeMS",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this.currentTime * 1000;
    },

    /** @this {FORGE.VideoHls} */
    set: function(value)
    {
        this.currentTime = value / 1000;
    }
});

/**
 * Get the remainingTime of the video.
 * @name FORGE.VideoHls#remainingTime
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "remainingTime",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this.duration - this.currentTime;
    }
});

/**
 * Get the duration of the video in seconds.
 * @name FORGE.VideoHls#duration
 * @readonly
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "duration",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._hlsMediaPlayer.duration();
    }
});

/**
 * Get the duration of the video in milli seconds.
 * @name FORGE.VideoHls#durationMS
 * @readonly
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "durationMS",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return Math.round(this.duration * 1000);
    }
});

/**
 * Get the metaDataLoaded status of the video.
 * @name FORGE.VideoHls#metaDataLoaded
 * @readonly
 * @type {boolean}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "metaDataLoaded",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._metaDataLoaded;
    }
});

/**
 * Get and set the loop status of the video.
 * @name FORGE.VideoHls#loop
 * @type {boolean}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "loop",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._loop;
    },

    /** @this {FORGE.VideoHls} */
    set: function(value)
    {
        if (typeof value === "boolean")
        {
            this._loop = value;
        }
    }
});

/**
 * Get and set the volume of the video.
 * Set a volume unmute the video
 * @name FORGE.VideoHls#volume
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "volume",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._volume;
    },

    /** @this {FORGE.VideoHls} */
    set: function(value)
    {
        if (typeof value === "number")
        {
            this._volume = FORGE.Math.clamp(value, 0, 1);
            this._muted = false;
            this._updateVolume();
        }
    }
});

/**
 * Get and set the mute status of the video.
 * @name FORGE.VideoHls#muted
 * @type {boolean}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "muted",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._muted;
    },

    /** @this {FORGE.VideoHls} */
    set: function(value)
    {
        if (Boolean(value) === true)
        {
            this.mute();
        }
        else
        {
            this.unmute();
        }
    }
});

/**
 * Get and set the playback rate of the video.
 * @name FORGE.VideoHls#playbackRate
 * @type {number}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "playbackRate",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this._playbackRate;
    },

    /** @this {FORGE.VideoHls} */
    set: function(value)
    {
        if(typeof value === "number")
        {
            this._playbackRate = Math.abs(value);

            if (this._video !== null && this._video.element !== null)
            {
                this._video.element.playbackRate = this._playbackRate;
            }
        }
    }
});

/**
 * Get the "onLoadStart" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onLoadStart
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onLoadStart",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onLoadStart === null)
        {
            this._onLoadStart = new FORGE.EventDispatcher(this);
        }

        return this._onLoadStart;
    }
});

/**
 * Get the "onLoadedMetaData" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onLoadedMetaData
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onLoadedMetaData",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onLoadedMetaData === null)
        {
            this._onLoadedMetaData = new FORGE.EventDispatcher(this);
        }

        return this._onLoadedMetaData;
    }
});

/**
 * Get the "onLoadedData" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onLoadedData
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onLoadedData",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onLoadedData === null)
        {
            this._onLoadedData = new FORGE.EventDispatcher(this);
        }

        return this._onLoadedData;
    }
});

/**
 * Get the "onProgress" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onProgress
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onProgress",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onProgress === null)
        {
            this._onProgress = new FORGE.EventDispatcher(this);
        }

        return this._onProgress;
    }
});

/**
 * Get the "onDurationChange" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onDurationChange
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onDurationChange",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onDurationChange === null)
        {
            this._onDurationChange = new FORGE.EventDispatcher(this);
        }

        return this._onDurationChange;
    }
});

/**
 * Get the "onCanPlay" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onCanPlay
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onCanPlay",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onCanPlay === null)
        {
            this._onCanPlay = new FORGE.EventDispatcher(this);
        }

        return this._onCanPlay;
    }
});

/**
 * Get the "onCanPlayThrough" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onCanPlayThrough
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onCanPlayThrough",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onCanPlayThrough === null)
        {
            this._onCanPlayThrough = new FORGE.EventDispatcher(this);
        }

        return this._onCanPlayThrough;
    }
});

/**
 * Get the "onPlay" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onPlay
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onPlay",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onPlay === null)
        {
            this._onPlay = new FORGE.EventDispatcher(this);
        }

        return this._onPlay;
    }
});

/**
 * Get the "onPause" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onPause
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onPause",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onPause === null)
        {
            this._onPause = new FORGE.EventDispatcher(this);
        }

        return this._onPause;
    }
});

/**
 * Get the "onTimeUpdate" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onTimeUpdate
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onTimeUpdate",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onTimeUpdate === null)
        {
            this._onTimeUpdate = new FORGE.EventDispatcher(this);
        }

        return this._onTimeUpdate;
    }
});

/**
 * Get the "onCurrentTimeChange" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onCurrentTimeChange
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onCurrentTimeChange",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onCurrentTimeChange === null)
        {
            this._onCurrentTimeChange = new FORGE.EventDispatcher(this);
        }

        return this._onCurrentTimeChange;
    }
});

/**
 * Get the "onVolumeChange" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onVolumeChange
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onVolumeChange",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onVolumeChange === null)
        {
            this._onVolumeChange = new FORGE.EventDispatcher(this);
        }

        return this._onVolumeChange;
    }
});

/**
 * Get the "onSeeking" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onSeeking
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onSeeking",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onSeeking === null)
        {
            this._onSeeking = new FORGE.EventDispatcher(this);
        }

        return this._onSeeking;
    }
});

/**
 * Get the "onSeeked" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onSeeked
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onSeeked",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onSeeked === null)
        {
            this._onSeeked = new FORGE.EventDispatcher(this);
        }

        return this._onSeeked;
    }
});

/**
 * Get the "onEnded" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onEnded
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onEnded",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onEnded === null)
        {
            this._onEnded = new FORGE.EventDispatcher(this);
        }

        return this._onEnded;
    }
});

/**
 * Get the "onError" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onError
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onError",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onError === null)
        {
            this._onError = new FORGE.EventDispatcher(this);
        }

        return this._onError;
    }
});

/**
 * Get the "onStalled" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onStalled
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onStalled",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onStalled === null)
        {
            this._onStalled = new FORGE.EventDispatcher(this);
        }

        return this._onStalled;
    }
});

/**
 * Get the "onRateChange" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onRateChange
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onRateChange",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onRateChange === null)
        {
            this._onRateChange = new FORGE.EventDispatcher(this);
        }

        return this._onRateChange;
    }
});

/**
 * Get a copy of the "onStalled" event for the "onWaiting" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onWaiting
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onWaiting",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        return this.onStalled;
    }
});

/**
 * Get the "onPlaying" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onPlaying
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onPlaying",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onPlaying === null)
        {
            this._onPlaying = new FORGE.EventDispatcher(this);
        }

        return this._onPlaying;
    }
});

/**
 * Get the "onQualityRequest" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onQualityRequest
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onQualityRequest",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onQualityRequest === null)
        {
            this._onQualityRequest = new FORGE.EventDispatcher(this);
        }

        return this._onQualityRequest;
    }
});

/**
 * Get the "onQualityChange" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onQualityChange
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onQualityChange",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onQualityChange === null)
        {
            this._onQualityChange = new FORGE.EventDispatcher(this);
        }

        return this._onQualityChange;
    }
});

/**
 * Get the "onQualityAbort" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onQualityAbort
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onQualityAbort",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onQualityAbort === null)
        {
            this._onQualityAbort = new FORGE.EventDispatcher(this);
        }

        return this._onQualityAbort;
    }
});

/**
 * Get the "onMetricsChanged" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onMetricChanged
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onMetricsChanged",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onMetricsChanged === null)
        {
            this._onMetricsChanged = new FORGE.EventDispatcher(this);
        }

        return this._onMetricsChanged;
    }
});

/**
 * Get the "onQualitiesLoaded" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onQualitiesLoaded
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onQualitiesLoaded",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onQualitiesLoaded === null)
        {
            this._onQualitiesLoaded = new FORGE.EventDispatcher(this, true);
        }

        return this._onQualitiesLoaded;
    }
});

/**
 * Get the "onQualityModeChange" event {@link FORGE.EventDispatcher} of the video.
 * @name FORGE.VideoHls#onQualityModeChange
 * @readonly
 * @type {FORGE.EventDispatcher}
 */
Object.defineProperty(FORGE.VideoHls.prototype, "onQualityModeChange",
{
    /** @this {FORGE.VideoHls} */
    get: function()
    {
        if (this._onQualityModeChange === null)
        {
            this._onQualityModeChange = new FORGE.EventDispatcher(this);
        }

        return this._onQualityModeChange;
    }
});
