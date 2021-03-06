/*! Copyright (c) 2013 - Peter Coles (mrcoles.com)
 *  Licensed under the MIT license: http://mrcoles.com/media/mit-license.txt
 */

(function() {

    //
    // Setup keys!
    //

    var notesOffset = 0;

    var blackKeys = {
        1: 1,
        3: 3,
        6: 1,
        8: 2,
        10: 3
    };
    $.each(blackKeys, function(k, v) {
        blackKeys[k] = ' black black'+v;;
    });

    function blackKeyClass(i) {
        return blackKeys[(i % 12) + (i < 0 ? 12 : 0)] || '';
    }

    var $keys = $('<div>', {'class': 'keys'}).appendTo('#piano');

    var buildingPiano = false;

    var isIos = navigator.userAgent.match(/(iPhone|iPad)/i);

    function buildPiano() {
        if (buildingPiano) return;
        buildingPiano = true;

        $keys.trigger('build-start.piano');
        $keys.empty().off('.play');

        function addKey(i) {
            var dataURI = isIos ? '' : Notes.getDataURI(i);

            // trick to deal with note getting hit multiple times before finishing...
            var sounds = [
                new Audio(dataURI),
                new Audio(dataURI),
                new Audio(dataURI)
            ];
            var curSound = 0;
            var pressedTimeout;
            dataURI = null;
            function play(evt) {
                // sound
                sounds[curSound].pause();
                try {
                    sounds[curSound].currentTime = 0.001; //HACK - was for mobile safari, but sort of doesn't matter...
                } catch (x) {
                    console.log(x);
                }
                sounds[curSound].play();
                curSound = ++curSound % sounds.length;

                var $k = $keys.find('[data-key='+i+']').addClass('pressed');

                //TODO - it'd be nice to have a single event for triggering and reading
                $keys.trigger('played-note.piano', [i, $k]);

                // visual feedback
                window.clearTimeout(pressedTimeout);
                pressedTimeout = window.setTimeout(function() {
                    $k.removeClass('pressed');
                }, 200);
            }
            $keys.on('note-'+i+'.play', play);
            var $key = $('<div>', {
                'class': 'key' + blackKeyClass(i),
                'data-key': i,
                mousedown: function(evt) { $keys.trigger('note-'+i+'.play'); }
            }).appendTo($keys);
        }

        // delayed for-loop to stop browser from crashing :'(
        // go slower on Chrome...
        var i = -12, max = 14, addDelay = /Chrome/i.test(navigator.userAgent) ? 80 : 0;
        (function go() {
            addKey(i + notesOffset);
            if (++i < max) {
                window.setTimeout(go, addDelay);
            } else {
                buildingPiano = false;
                $keys.trigger('build-done.piano');
            }
        })();
    }

    buildPiano();


    //
    // Setup synth controls
    //

    function camelToText(x) {
        x = x.replace(/([A-Z])/g, ' $1');
        return x.charAt(0).toUpperCase() + x.substring(1);
    }

    $.each(['volume', 'style'], function(i, setting) {
        var $opts = $('<div>', {
            'class': 'opts',
            html: '<p><strong>' + camelToText(setting) + ':</strong></p>'
        }).appendTo('#synth-settings');

        $.each(DataGenerator[setting], function(name, fn) {
            if (name != 'default') {
                $('<p>')
                    .append($('<a>', {
                        text: camelToText(name),
                        href: '#',
                        'class': fn === DataGenerator[setting].default ? 'selected' : '',
                        click: function(evt) {
                            evt.preventDefault();
                            DataGenerator[setting].default = fn;
                            buildPiano();
                            var $this = $(this);
                            $this.closest('.opts').find('.selected').removeClass('selected');
                            $this.addClass('selected');
                        }
                    }))
                    .appendTo($opts);
            }
        });
    });


    //
    // Setup keyboard interaction
    //

    var keyNotes = {
        /*a*/ 65: 0, // c
        /*c*/ 67: 0, // c
        /*w*/ 87: 1, // c#
        /*s*/ 83: 2, // d
        /*e*/ 69: 3, // d#
        /*d*/ 68: 4, // e
        /*f*/ 70: 5, // f
         /*r*/ 82: 5, // f
        /*t*/ 84: 6, // f#
        /*m*/ 77: 6, // f#
        /*g*/ 71: 7, // g
        /*y*/ 89: 8, // g#
        /*v*/ 86: 8, // g#
        /*h*/ 72: 9, // a
        /*q*/ 81: 9, // a
        /*u*/ 85: 10, // a#
        /*b*/ 66: 10, // a#
        /*j*/ 74: 11, // b
        /*b*/ 78: 11, // b
        /*k*/ 75: 12, // c
        /*i*/ 73: 12, // c
        /*o*/ 79: 13, // c#
        /*z*/ 90: 13, // c#
        /*l*/ 76: 14, // d
        /*p*/ 80: 15, // d#
        /*x*/ 88: 15, // d#

        /*1*/ 49: 1, // c#
        /*2*/ 50: 3, // d#
        /*3*/ 51: 4, // e
        /*4*/ 52: 7, // g
        /*5*/ 53: 8, // g#
        /*6*/ 54: 9, // a
        /*7*/ 55: 10, // a#
        /*8*/ 56: 12, // c
        /*9*/ 57: 13, // c#
        /*0*/ 48: 14, // d
    };
    var notesShift = -12;
    var downKeys = {};

    function isModifierKey(evt) {
        return evt.metaKey || evt.shiftKey || evt.altKey;
    }

    $(window).keydown(function(evt) {
        var keyCode = evt.keyCode;
        // prevent repeating keys
        if (!downKeys[keyCode] && !isModifierKey(evt)) {
            downKeys[keyCode] = 1;
            var key = keyNotes[keyCode];
            if (typeof key != 'undefined') {
                $keys.trigger('note-'+(key+notesShift+notesOffset)+'.play');
                evt.preventDefault();
            } else if (evt.keyCode == 188) {
                notesShift = -12;
            } else if (evt.keyCode == 190) {
                notesShift = 0;
            } else if (keyCode == 37 || keyCode == 39) {
                notesOffset += (keyCode == 37 ? -1 : 1) * 12;
                buildPiano();
            }
        }
    }).keyup(function(evt) {
        delete downKeys[evt.keyCode];
    });



    //
    // Scroll nav
    //
    $.each([['#info', '#below'], ['#top', '#content']], function(i, x) {
        $(x[0]).click(function() {
            $('html,body').animate({
                scrollTop: $(x[1]).offset().top
            }, 1000);
        });
    });


        // button
        var bW = 20,
            bH = 20,
            $loop = $('.loop'),
            $button = $('<canvas>', {
                css: {
                    position: 'absolute',
                    top: (parseInt($loop.css('top')) + 1) + 'px',
                    right: (parseInt($loop.css('right')) + 34) + 'px',
                    width: bW,
                    height: bH,
                    cursor: 'pointer'
                }
            })
            .attr('width', bW)
            .attr('height', bH)
            .appendTo('#piano'),
            button = $button.get(0),
            bctx = button.getContext('2d'),
            coords = [
                [15, 1],
                [5, 9],
                [9, 11],
                [5, 19],
                [15, 11],
                [11, 9]
            ],
            coordsLen = coords.length;

        bctx.strokeStyle = 'rgba(0,0,0,.5)';
        bctx.lineWidth = .5;

        function draw() {
            bctx.fillStyle = shouldAnimate ? 'rgba(255,255,0,.75)' : 'rgba(0,0,0,.25)';
            bctx.clearRect(0, 0, bW, bH);
            bctx.beginPath();
            for (var i=0; i<coordsLen; i++) {
                bctx[i == 0 ? 'moveTo' : 'lineTo'](coords[i][0], coords[i][1]);
            }
            bctx.closePath();
            if (shouldAnimate) bctx.stroke();
            bctx.fill();
        }
        draw();

        // handlers
        function toggleAnimate(evt) {
            if (evt.type === 'click' || (evt.keyCode == 56 && !isModifierKey(evt))) {
                shouldAnimate = !shouldAnimate;
                draw();
            }
        }
        $(window).keyup(toggleAnimate);
        $('.toggle-animate').click(toggleAnimate);
        $button.click(toggleAnimate);
    })();

    if (isIos) {
        $(function() {
            var $note = $('<div>', {
                'class': 'note',
                'text': 'Note: sound does not work on iOS, but you can still enjoy pretty wave forms!'
            }).appendTo('body');

            window.setTimeout(function() {
                $note.fadeOut();
            }, 6000);
        });
    }



    // the below code was a failed experiment to support iOS...

    // //
    // // Generate files for dl...
    // //

    // function generateFilesForDL() {
    //     // backup solution for iOS... since they won't play my files :'(
    //     // add audio elts to page and then download them all!
    //     // https://addons.mozilla.org/en-US/firefox/addon/downthemall/?src=search

    //     for (var i=0; i<5; i++) {
    //         var dataURI = Notes.getDataURI(i);
    //         $('body').prepend("<br><br>");
    //         $('<audio>', {controls: 'controls'})
    //             .append('Note ' + i)
    //             .append($('<source>', {
    //                 src: dataURI,
    //                 type: 'audio/wav'
    //             }))
    //             .prependTo('body');
    //         $('body').prepend(i + ": ");
    //     }

    //     $('body').prepend("<br><br>");
    //     $('<audio>', {controls: 'controls', src: 'note.caf', type: 'audio/wav'}).prependTo('body');
    //     $('body').prepend("note: ");

    // }
    // generateFilesForDL();


