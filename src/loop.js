console.log('Will init Timeliner')

var Timeliner = (function(){
    var self = this;

    // Modules
    const { remote } = require('electron');
    const mainProcess = remote.require('./timeliner.js');

    //Private variables
    var currentFrame = 1;
    var currentTime = 0;
    var totalFrameCount;
    var preloading = false;
    var frameRate;

    //keymode.step -> previousInteger
    var previousInteger;

    self.settings = {};
    self.animations = [];
    self.timeline = [];
    self.modifiers = {
        default:function(x){
            return x;
        },
        beziercurve:function(x, animation){
            var curve = animation.curve;
            var easing = BezierEasing(curve[0], curve[1], curve[2], curve[3]);
            return easing(x);
        }
    }
    self.keymodes = {
        default:function(x, fx){
            fx(x);
        },
        step:function(x, fx){
            x = Math.floor(x)
            if(x !== previousInteger) fx(x);
            previousInteger = x;
        }
    }

    self.Settings = function(settings){
        self.settings.fps = settings.fps;
        self.settings.duration = settings.duration;
        self.settings.parent = settings.parent;
        self.settings.trim = settings.trim;
        totalFrameCount = self.settings.duration*self.settings.fps;
        frameRate = 1000/self.settings.fps;
    }

    self.Play = function(){
        currentFrame = 1;
        self.animations = [];
        clearTimeout(self.to);
        self.Timeline();
        self.render(function(){
            self.preview();
        });
    }

    self.Export = function(){
        currentFrame = 1;
        self.viewFrame(currentFrame);
        self.animations = [];
        clearTimeout(self.to);
        self.Timeline();
        self.render(function(){
            self.export();
        });
    }

    self.Loop = function(animation){
        self.animations.push(animation);
    }

    self.render = function(next) {
        self.renderFrame(currentFrame);
        self.to = setTimeout(function () {
            if(currentFrame > totalFrameCount){
                clearTimeout(self.to);
                currentFrame = 1;
                next();
            }else{
                self.render(next);
            }
            currentFrame++;
        }, 0);
    }

    self.preview = function() {
        console.log('preview', totalFrameCount);
        self.viewFrame(currentFrame);
        self.to = setTimeout(function () {
            if(currentFrame > totalFrameCount){
                clearTimeout(self.to);
                currentFrame = 1;
            }else{
                self.preview();
            }
            currentFrame++;
        }, frameRate);
    }

    self.export = function(){
        console.log('export', totalFrameCount);
        self.exportFrame('frames/'+pad(currentFrame, 4) + '.png', function(){
            self.to = setTimeout(function () {
                if(currentFrame > totalFrameCount){
                    clearTimeout(self.to);
                    currentFrame = 1;
                    mainProcess.exportVideo();
                }else{
                    self.export();
                }
                currentFrame++;
            }, 0);
        });
    }

    self.renderFrame = function(f){
        currentTime = f/self.settings.fps;

        for(var i = 0; i < self.animations.length; i++){
            var opt = self.animations[i];

            var modifier = 'beziercurve';
            // var modifier = (opt.modifier) ? opt.modifier:'default';
            var keymode = (opt.keymode) ? opt.keymode:'default';

            var frameCount = opt.duration*self.settings.fps;
            var startFrame =  opt.start*self.settings.fps;
            var currentAnimationFrame = f - startFrame;
            var rangeValue = opt.to-opt.from;
            var indice = currentAnimationFrame/frameCount;
            if(indice < 0 || indice > 1) continue;
            // indice = Math.max(indice,0);
            // indice = Math.min(indice, 1);

            indice = self.modifiers[modifier](indice, opt);
            var value = opt.from+(indice*rangeValue);
            self.keymodes[keymode](value, function(a){
                opt.value(a, f, currentTime, indice);
            })
        }
    }

    self.viewFrame = function(f){
        console.log(f, 'viewFrame');
        if(!self.timeline[f]){
            console.log(f, "This frame does not exist");
            return
        };
        for(var i = 0; i < self.timeline[f].length; i++){
            var action = self.timeline[f][i];
            self.Artboard[action.fx](action.e, action.v);
        }
    }

    self.stop = function(){
        clearTimeout(self.to);
    }

    self.exportFrame = function(filename, next){
        var parentBounding = self.settings.parent.getBoundingClientRect();
        var mesures = {
            clientWidth:window.innerWidth,
            clientHeight:window.innerHeight,
            parentWidth:parentBounding.width,
            parentHeight:parentBounding.height,
            parentX:parentBounding.x,
            parentY:parentBounding.y,
            trim:self.settings.trim
        }
        mainProcess.log('Rendering frame ' + currentFrame)
        self.viewFrame(currentFrame);
        setTimeout(function(){
            mainProcess.exportFrame(filename, mesures, next);
        }, 500);
    }

    self.Util = {
        magnetize:function(x, pad){
            var shift = x-Math.floor(x);
            shift = Math.abs(shift);
            shift = Math.floor(shift*10);
            var firstPad = pad;
            var lastPad = 10-pad;
            if(shift >= lastPad && shift <=firstPad){
                x = Math.round(x)
            }
            return x;
        }
    }

    self.Artboard = {
        'position-x':function(element, x){
            var replace = "translate(" + x + "px,$2px)";
            var pattern = /translate\(([^px]+)px,([^px]+)px\)/g;
            element.style.transform = element.style.transform.replace(pattern, replace);
        },
        'shadow-y':function(element, x){
            var pattern = /rgba\(([^,]+),([^,]+),([^,]+),([^,]+)\) ([^px]+)px ([^px]+)px ([^px]+)px ([^px]+)px/g;
            var replace = "rgba($1, $2, $3, $4) $5px "+x+"px $7px $8px";
            element.style.boxShadow = element.style.boxShadow.replace(pattern, replace);
        },
        'shadow-blur':function(element, x){
            var pattern = /rgba\(([^,]+),([^,]+),([^,]+),([^,]+)\) ([^px]+)px ([^px]+)px ([^px]+)px ([^px]+)px/g;
            var replace = "rgba($1, $2, $3, $4) $5px $6px "+x+"px $8px";
            element.style.boxShadow = element.style.boxShadow.replace(pattern, replace);
        },
        'shadow-opacity':function(element, x){
            var pattern = /rgba\(([^,]+),([^,]+),([^,]+),([^,]+)\) ([^px]+)px ([^px]+)px ([^px]+)px ([^px]+)px/g;
            var replace = "rgba($1, $2, $3, "+x+") $5px $6px $7px $8px";
            element.style.boxShadow = element.style.boxShadow.replace(pattern, replace);
        },
        'lineargradient':function(element,){
            var pattern = /linear-gradient(([^deg]+)deg, rgb(([^,]+), ([^,]+), ([^,]+)), rgb(([^,]+), ([^,]+), ([^,]+)))/g;
            var replace = "linear-gradient($1deg, rgb($2, $3, $4), rgb($5, $6, $7))";
            element.style.background = element.style.background.replace(pattern, replace);
        },
        scale:function(element, x){
            var replace = "scale(" + x + "," + x + ")";
            var pattern = /scale\(([^px]+),([^px]+)\)/g;
            element.style.transform = element.style.transform.replace(pattern, replace);
        },
        text:function(element, x){
            element.innerText = x;
        }
    }

    self.addKey = function(f, fxName, element, value){
        if(!self.timeline[f]) self.timeline[f] = [];

        self.timeline[f].push({
            fx:fxName,
            e:element,
            v:value
        })
    }

    self.nextFrame = function(){
        currentFrame++;
        viewFrame(currentFrame);
    }

    self.previousFrame = function(){
        currentFrame--;
        viewFrame(currentFrame);
    }


    // Utils
    function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
    }

    return self;
})();