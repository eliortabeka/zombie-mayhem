'use strict';
$(document).ready(function() {
  const ZOMBIEMAYEM = (function () {

    // Cache te DOM
    let $canves = $('#canves'),
      $overlayScreen = $canves.find('.overlay-screen'),
      $gameCover = $canves.find('.game-cover'),
      $killedTitle = $canves.find('.killed-status span'),
      $lifeIcons = $canves.find('.life'),
      $muteMusic = $canves.find('#mute-music'),
      $muteSounds = $canves.find('#mute-sounds'),
      $ammoTitle = $canves.find('.ammo'),
      $reloadHint = $canves.find('.reload-hint'),
      $reloadHintSpinner = $reloadHint.find('.reload-trigger'),
      $pasueGameTrigger = $canves.find('#pause-game');

    // Sounds
    const SHOOT_SOUND = 'SHOOT_SOUND',
      NO_AMMO_SOUND = 'NO_AMMO_SOUND',
      RELOAD_SOUND = 'RELOAD_SOUND',
      ROAR_1 = 'ROAR_1',
      ROAR_2 = 'ROAR_2',
      ROAR_3 = 'ROAR_3',
      ROAR_4 = 'ROAR_4',
      ROAR_5 = 'ROAR_5',
      ROAR_6 = 'ROAR_6',
      LAUGHTER = 'LAUGHTER',
      SOUNDTRACK = 'SOUNDTRACK',
      PUNCH_1 = 'PUNCH_1',
      PUNCH_2 = 'PUNCH_2',
      PUNCH_3 = 'PUNCH_3',
      PUNCH_4 = 'PUNCH_4';

    // General
    let pauseZombieTracking;

    // Game Info
    let mutedMusic = false,
      mutedSounds = false,
      gamePaused = false,
      life = 3,
      zombieKilled = 0,
      wave = 0,
      ammo = 6;

    // Random number
    const getRandom = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    // Zombie Frequency per Level
    const WAVE_1_ZOMBIE_FRQ = getRandom(1300, 1700),
      WAVE_2_ZOMBIE_FRQ = getRandom(1500, 1900),
      WAVE_3_ZOMBIE_FRQ = getRandom(1700, 2100),
      WAVE_4_ZOMBIE_FRQ = getRandom(1800, 2400);

    // Zombie Quantity per Level
    const WAVE_1_ZOMBIE_QTY = getRandom(5, 7),
      WAVE_2_ZOMBIE_QTY = getRandom(7, 10),
      WAVE_3_ZOMBIE_QTY = getRandom(10, 14),
      WAVE_4_ZOMBIE_QTY = getRandom(14, 17),
      ALL_ZOMBIES = WAVE_1_ZOMBIE_QTY + WAVE_2_ZOMBIE_QTY + WAVE_3_ZOMBIE_QTY + WAVE_4_ZOMBIE_QTY;

    // Load sounds
    (function loadSound() {
      createjs.Sound.registerSound('sounds/shoot.mp3', SHOOT_SOUND);
      createjs.Sound.registerSound('sounds/noammo.mp3', NO_AMMO_SOUND);
      createjs.Sound.registerSound('sounds/reload.mp3', RELOAD_SOUND);
      createjs.Sound.registerSound('sounds/roar/1.mp3', ROAR_1);
      createjs.Sound.registerSound('sounds/roar/2.mp3', ROAR_2);
      createjs.Sound.registerSound('sounds/roar/3.mp3', ROAR_3);
      createjs.Sound.registerSound('sounds/roar/4.mp3', ROAR_4);
      createjs.Sound.registerSound('sounds/roar/5.mp3', ROAR_5);
      createjs.Sound.registerSound('sounds/roar/6.mp3', ROAR_6);
      createjs.Sound.registerSound('sounds/laughter.mp3', LAUGHTER);
      createjs.Sound.registerSound('sounds/soundtrack.mp3', SOUNDTRACK);
      createjs.Sound.registerSound('sounds/punch/1.mp3', PUNCH_1);
      createjs.Sound.registerSound('sounds/punch/2.mp3', PUNCH_2);
      createjs.Sound.registerSound('sounds/punch/3.mp3', PUNCH_3);
      createjs.Sound.registerSound('sounds/punch/4.mp3', PUNCH_4);
    })();

    const playSound = function (sound) {
      createjs.Sound.play(sound);
    };

    // Create Zombie
    const createZombies = function() {
      let zombieType = wave === 1 ? getRandom(1, 3) : wave === 2 ? getRandom(1, 4) : getRandom(1, 6);
      $canves.append($('<div class="zombie zombie-'+ zombieType +' walk-speed-'+ getRandom(1, 6) +' walk-delay-'+ getRandom(1, 6) +'" data-strength="'+ zombieType +'"><div class="strength-bar"></div></div>'));
    };

    const setHandlers = function (){
      // Shoot Handler
      $canves.on('click', function() {
        if(ammo > 0) {
          ammo--;
          if(!mutedSounds) { playSound(SHOOT_SOUND); }
          $ammoTitle.attr('data-ammo', ammo);
        }
        if(ammo === 0) {
          $reloadHint.addClass('visible');
          if(!mutedSounds) { playSound(NO_AMMO_SOUND); }
        }
      });

      // Reload Handler
      $('body').on('keydown', function(e){
        if(e.which === 82) {
          if(ammo !== 6) {
            reload();
          }
        }
      });
      $reloadHintSpinner.on('click', function () {
        if(ammo === 0) {
          reload();
          return false;
        }
      });

      // Zombie Kill Handler
      $canves.delegate('.zombie', 'click', function(e) {
        if(zombieKilled >= ALL_ZOMBIES) {
          return false;
        }

        if(ammo === 0) {
          if(!mutedSounds) { playSound(NO_AMMO_SOUND); }
          return false;
        }

        let $this = $(this),
          strength = e.target.dataset.strength.toString(),
          $strengthBar = $this.find('.strength-bar');

        if(strength === '1' && strength !== 0) {
          zombieKilled++;
          $killedTitle.html(zombieKilled);
          $this.css('pointer-events', 'none');
          $strengthBar.addClass('hide');

          setTimeout(function () {
            $this.addClass('killed');
            if(!mutedSounds) { playSound('ROAR_' + getRandom(1, 6)); }
          }, 220);
          setTimeout(function () {
            $this.fadeOut(function () {
              $this.remove();
            });
          }, 370);
          calcWave();
        }

        strength--;
        $this.attr('data-strength', strength);
      });
    };

    // interval function From http://thecodeship.com/web-development/alternative-to-javascript-evil-setinterval/
    const interval = function(func, wait, times){
      const interv = function(w, t){
        return function(){
          if(typeof t === 'undefined' || t-- > 0){
            setTimeout(interv, w);
            try{
              func.call(null);
            }
            catch(e){
              t = 0;
              throw e.toString();
            }
          }
        };
      }(wait, times);

      setTimeout(interv, wait);
    };

    // Start Waves
    const startWave = function(frequency, quantity) {
      $('body').off('keydown');
      $canves.off('click');
      $reloadHint.removeClass('visible');
      pauseZombieTracking=true;
      wave++;

      $overlayScreen.find('.level-title span').html(wave);
      $canves.addClass('level-message');
      $canves.attr('data-wave', wave);

      setTimeout(function() {
        interval(function(){
          createZombies()
        }, frequency, quantity);
      }, 1000);

      setTimeout(function() {
        $canves.removeClass('level-message');
        if(wave===1) { $canves.removeClass('intro'); }

        // Start Track Zombies
        pauseZombieTracking=false;
        trackZombies();
        setHandlers();
      }, 2200);
    };

    // End Game
    const endGame = function(endType) {
      $('body').off('keydown');
      $canves.off('click');
      pauseZombieTracking=true;
      let screenType = endType === 'lose' ? 'game-over' : 'end-game';

      $canves.addClass(screenType);
      if(!mutedMusic) { playSound(LAUGHTER); }

      $canves.find('.restart-hint').on('click', function () {
        $canves.removeClass(screenType);
        // reset game
        resetGame();
        if(endType === 'win') {
          startGame();
        } else {
          if(!mutedMusic) { playSound(SOUNDTRACK); }
          startGame();
        }
      });
    };

    // Calc Wave
    const calcWave = function() {
      if(zombieKilled === WAVE_1_ZOMBIE_QTY) {
        // Start Wave 2
        if(!mutedMusic) { playSound(SOUNDTRACK); }
        startWave(WAVE_2_ZOMBIE_FRQ, WAVE_2_ZOMBIE_QTY);
      } else if(zombieKilled === (WAVE_1_ZOMBIE_QTY + WAVE_2_ZOMBIE_QTY)) {
        // Start Wave 3
        if(!mutedMusic) { playSound(SOUNDTRACK); }
        startWave(WAVE_3_ZOMBIE_FRQ, WAVE_3_ZOMBIE_QTY);
      } else if(zombieKilled === (WAVE_1_ZOMBIE_QTY + WAVE_2_ZOMBIE_QTY + WAVE_3_ZOMBIE_QTY)) {
        // Start Wave 4
        if(!mutedMusic) { playSound(SOUNDTRACK); }
        startWave(WAVE_4_ZOMBIE_FRQ, WAVE_4_ZOMBIE_QTY);
      } else if (zombieKilled >= ALL_ZOMBIES) {
        // End Game
        endGame('win');
      }
    };

    // Track Zombies on screen
    let trackZombies = function repeatOften() {
      let $zombie = $('.zombie');

      if ($zombie.length !== 0) {
        for (let i = 0, z = $zombie.length; i < z; i++) {
          let zombieWidth = $zombie.eq(i).width() - 20;

          if ($zombie.eq(i).hasClass('tracking')) {
            if ($zombie.eq(i).position().left.toFixed() <= (-zombieWidth)) {
              $zombie.eq(i).remove();
              createZombies();
              life--;
              if(!mutedSounds) { playSound('PUNCH_' + getRandom(1, 4)); }
              $lifeIcons.find('.heart-icon').not('.hide').eq(-1).addClass('hide');
            }
          } else {
            $zombie.eq(i).addClass('tracking');
          }
        }
      }

      if(life !== 0) {
        if(!pauseZombieTracking) { requestAnimationFrame(trackZombies); }
      } else {
        endGame('lose');
      }
    };

    // Reload Ammo
    const reload = function() {
      if(!mutedSounds) { playSound(RELOAD_SOUND); }
      ammo = 6;

      setTimeout(function () {
        $ammoTitle.addClass('reload');
      }, 120);
      setTimeout(function () {
        $ammoTitle.attr('data-ammo', ammo);
      }, 150);
      setTimeout(function () {
        $ammoTitle.removeClass('reload');
      }, 250);

      $reloadHint.removeClass('visible');
    };

    // Mute Music
    $muteMusic.on('click', function () {
      let $this = $(this);
      $this.toggleClass('muted');
      if(!mutedMusic) {
        createjs.Sound.stop();
        mutedMusic = true;
      } else {
        mutedMusic = false;
      }
      if(ammo !== 0){ammo++;}
    });

    // Mute Sounds
    $muteSounds.on('click', function () {
      let $this = $(this);
      $this.toggleClass('muted');
      !mutedSounds ? mutedSounds = true : mutedSounds = false;
      if(ammo !== 0){ammo++;}
    });

    // Pause Game
    $pasueGameTrigger.on('click', function () {
      let $this = $(this);

      if(!gamePaused) {
        $this.addClass('paused');
        $canves.addClass('game-paused');
        createjs.Sound.stop();
        $('body').off('keydown');
        $canves.off('click');
        gamePaused = true;
      } else {
        $this.removeClass('paused');
        $canves.removeClass('game-paused');
        setHandlers();
        gamePaused = false;
      }
    });

    const resetGame = function () {
      zombieKilled = 0;
      wave = 0;
      ammo = 6;
      life = 3;
      $lifeIcons.find('.heart-icon').removeClass('hide');
      $killedTitle.html(zombieKilled);
      $ammoTitle.attr('data-ammo', ammo);
      createjs.Sound.stop();
      // Clear all zombies on screen
      $('.zombie').remove();
    };

    // Start Game
    const startGame = function() {
      // reset game
      resetGame();

      // Game Cover
      $gameCover.fadeIn('slow', function () {
        $canves.attr('data-wave', '1');
      });
      setTimeout(function () {
        $gameCover.fadeOut('slow', function () {
          // Start Wave 1
          if(!mutedMusic) { playSound(SOUNDTRACK); }
          startWave(WAVE_1_ZOMBIE_FRQ, WAVE_1_ZOMBIE_QTY);
        });
      },2500);
    };


    // Preload from http://stackoverflow.com/a/10999147
    const preload = function(files, cb) {
      var len = files.length;
      $(files.map(function(f) {
        return '<img src="'+f+'" />';
      }).join('')).load(function () {
        if(--len===0) {
          cb();
        }
      });
    };

    return {
      initInto: function() {
        $canves.find('.zombie-loader').addClass('zombie-' + getRandom(1, 3));
        // Preload all games graphics
        preload([
          'images/zombies/zombie-1.png',
          'images/zombies/zombie-2.png',
          'images/zombies/zombie-3.png',
          'images/background/bg-1.png',
          'images/background/bg-2.png',
          'images/background/bg-3.png',
          'images/background/bg-4.png',
          'images/ui/cover.jpg',
          'images/ui/frame.png',
          'images/ui/icons.png',
          'images/zombies/zombie-1-death.png',
          'images/zombies/zombie-2-death.png',
          'images/zombies/zombie-3-death.png',
          'images/zombies/zombie-4.png',
          'images/zombies/zombie-4-death.png',
          'images/zombies/zombie-5.png',
          'images/zombies/zombie-5-death.png',
          'images/zombies/zombie-6.png',
          'images/zombies/zombie-6-death.png'
        ], function() {
          $canves.find('.loader').remove();
          startGame();
        });
      },
      killed: zombieKilled,
      ammoLeft: ammo
    }
  })();

  // Init Game
  ZOMBIEMAYEM.initInto();
});
