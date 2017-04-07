var setSong = function(songNumber) {
    if (currentSoundFile) {
        currentSoundFile.stop();
    }
    
    currentlyPlayingSongNumber = parseInt(songNumber);
  currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
    //#1
    currentSoundFile = new buzz.sound(currentSongFromAlbum.audioUrl, {
        //#2
        formats: [ 'mp3' ], 
        preload: true
    });
    
    setVolume(currentVolume);
};

var seek = function(time) {
    if (currentSoundFile) {
        currentSoundFile.setTime(time);
    }
};

var setVolume = function(volume) {
    if (currentSoundFile) {
        currentSoundFile.setVolume(volume);
    }
};

var getSongNumberCell = function(number) {
    return $('.song-item-number[data-song-number="' + number + '"]');
};

var createSongRow = function(songNumber, songName, songLength) {
     var template =
        '<tr class="album-view-song-item">'
     + '  <td class="song-item-number" data-song-number="' + songNumber + '">' + songNumber + '</td>'
     + '  <td class="song-item-title">' + songName + '</td>'
     + '  <td class="song-item-duration">' + filterTimeCode(songLength) + '</td>'
     + '</tr>'
     ;
     var $row = $(template);
    
    var clickHandler = function() {
        var songNumber = parseInt($(this).attr('data-song-number'));

	if (currentlyPlayingSongNumber !== null) {
		// Revert to song number for currently playing song because user started playing new song.
		var currentlyPlayingCell = getSongNumberCell(currentlyPlayingSongNumber);
		currentlyPlayingCell.html(currentlyPlayingSongNumber);
	}
if (currentlyPlayingSongNumber !== songNumber) {
    setSong(songNumber);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();
    currentSongFromAlbum = currentAlbum.songs[songNumber - 1];
    
    var $volumeFill = $('.volume .fill');
    var $volumeThumb = $('.volume .thumb');
    $volumeFill.width(currentVolume + '%');
    $volumeThumb.css({left: currentVolume + '%'});

    $(this).html(pauseButtonTemplate);
    updatePlayerBarSong();
} else if (currentlyPlayingSongNumber === songNumber) {
		if (currentSoundFile.isPaused()) {
            (this).html(pauseButtonTemplate);
            $('.main-controls .play-pause').html(playerBarPauseButton);
            currentSoundFile.play();
        } else {
            $(this).html(playButtonTemplate);
            $('.main-controls .play-pause').html(playerBarPlayButton);
            currentSoundFile.pause();
        }
	}
}; 
    
     var onHover = function(event) {
         var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));

        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(playButtonTemplate);
        }
     };
     var offHover = function(event) {
         var songNumberCell = $(this).find('.song-item-number');
        var songNumber = parseInt(songNumberCell.attr('data-song-number'));

        if (songNumber !== currentlyPlayingSongNumber) {
            songNumberCell.html(songNumber);
        }
     };
    //#1
    $row.find('.song-item-number').click(clickHandler);
    //#2
    $row.hover(onHover, offHover);
    //#3
    return $row;
 };

    var setCurrentAlbum = function(album) { 
     currentAlbum = album;
     //#1 
     var $albumTitle = $('.album-view-title');
     var $albumArtist = $('.album-view-artist');
     var $albumReleaseInfo = $('.album-view-release-info');
     var $albumImage = $('.album-cover-art');
     var $albumSongList = $('.album-view-song-list');
        
    //#2
    $albumTitle.text(album.title);
    $albumArtist.text(album.artist);
    $albumReleaseInfo.text(album.year + ' ' + album.label);
    $albumImage.attr('src', album.albumArtUrl);

    //#3
    $albumSongList.empty();
    
    //#4
    for (var i = 0; i < album.songs.length; i++) {
        var $newRow = createSongRow(i + 1, album.songs[i].title, album.songs[i].duration)
        $albumSongList.append($newRow);
    }
};

var updateSeekBarWhileSongPlays = function() {
     if (currentSoundFile) {
         // #10
         currentSoundFile.bind('timeupdate', function(event) {
             // #11
             var seekBarFillRatio = this.getTime() / this.getDuration();
             var $seekBar = $('.seek-control .seek-bar');
 
             updateSeekPercentage($seekBar, seekBarFillRatio);
             setCurrentTimeInPlayerBar();
             setTotalTimeinPlayerBar();
         });
     }
 };

var updateSeekPercentage = function($seekBar, seekBarFillRatio) {
    var offsetXPercent = seekBarFillRatio * 100;
    //#1
    offsetXPercent = Math.max(0, offsetXPercent);
    offsetXPercent = Math.min(100, offsetXPercent);
    
    //#2
    var percentageString = offsetXPercent + '%';
    $seekBar.find('.fill').width(percentageString);
    $seekBar.find('.thumb').css({left: percentageString});
};

/* Review:
- $('.player-bar .seek-bar). Does this specify the exact location of the seek bar? How?
- Review including a click event within this function
- How is this updated automatically for both seek bars? Are they recognized by JS automatically? 
*/

var setupSeekBars = function() {
    var $seekBars = $('.player-bar .seek-bar');
    
    $seekBars.click(function(event) {
        //#3
        var offsetX = event.pageX - $(this).offset().left;
        var barWidth = $(this).width();
        //#4
        var seekBarFillRatio = offsetX / barWidth;
        //#5
        
        if($(this).parent().attr('class') == 'seek-control') {
            seek(seekBarFillRatio * currentSoundFile.getDuration());
        } else {
            setVolume(seekBarFillRatio * 100);
        }
        
        updateSeekPercentage($(this), seekBarFillRatio);
    });
    
    $seekBars.find('.thumb').mousedown(function(event) {
      //#8
      var $seekBar = $(this).parent();
        
      //#9
      $(document).bind('mousemove.thumb', function(event) {
          var offsetX = event.pageX - $seekBar.offset().left;
          var barWidth = $seekBar.width();
          var seekBarFillRatio = offsetX / barWidth;
          
          if ($seekBar.parent().attr('class') == 'seek-control') {
                seek(seekBarFillRatio * currentSoundFile.getDuration());   
            } else {
                setVolume(seekBarFillRatio);
            }
          
          updateSeekPercentage($seekBar, seekBarFillRatio);
      });
        //#10
    $(document).bind('mouseup.thumb', function() {
    $(document).unbind('mousemove.thumb');
    $(document).unbind('mouseup.thumb');
         });
    });
};


var setCurrentTimeInPlayerBar = function(currentTime) {
    if (currentSoundFile) {
    $('.currently-playing .current-time').text(filterTimeCode(currentSoundFile.getTime()));
    }
}

var setTotalTimeinPlayerBar = function(totalTime) {
    if (currentSoundFile) {
     $('.currently-playing .total-time').text(filterTimeCode(currentSoundFile.getDuration()));   
    }
};

var filterTimeCode = function(timeInSeconds) {
    var minutes = Math.floor(timeInSeconds / 60);
    var seconds = Math.floor(timeInSeconds - (minutes * 60));
    
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    
    return minutes + ":" + seconds;
}

var trackIndex = function(album, song) {
     return album.songs.indexOf(song);
 };

var updatePlayerBarSong = function () {
    $('.currently-playing .song-name').text(currentSongFromAlbum.title);
    $('.currently-playing .artist-name').text(currentAlbum.artist);
    $('.currently-playing .artist-song-mobile').text(currentSongFromAlbum.title + "  - " + currentAlbum.artist);
    
    $('.main-controls .play-pause').html(playerBarPauseButton);
    setTotalTimeinPlayerBar();
};

var nextSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    // Note that we're _incrementing_ the song here
    currentSongIndex++;

    if (currentSongIndex >= currentAlbum.songs.length) {
        currentSongIndex = 0;
    }

    // Save the last song number before changing it
    var lastSongNumber = currentlyPlayingSongNumber;

    // Set a new current song
    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();

    // Update the Player Bar information
    updatePlayerBarSong();

    var $nextSongNumberCell = getSongNumberCell( currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);

    $nextSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var previousSong = function() {
    var currentSongIndex = trackIndex(currentAlbum, currentSongFromAlbum);
    // Note that we're _decrementing_ the index here
    currentSongIndex--;

    if (currentSongIndex < 0) {
        currentSongIndex = currentAlbum.songs.length - 1;
    }

    // Save the last song number before changing it
    var lastSongNumber = currentlyPlayingSongNumber;

    // Set a new current song
    setSong(currentSongIndex + 1);
    currentSoundFile.play();
    updateSeekBarWhileSongPlays();

    // Update the Player Bar information
    updatePlayerBarSong();

    $('.main-controls .play-pause').html(playerBarPauseButton);

    var $previousSongNumberCell = getSongNumberCell(currentlyPlayingSongNumber);
    var $lastSongNumberCell = getSongNumberCell(lastSongNumber);    

    $previousSongNumberCell.html(pauseButtonTemplate);
    $lastSongNumberCell.html(lastSongNumber);
};

var togglePlayFromPlayerBar = function() {
    // 1. Song is paused and the play button is clicked
    // 1a. SongNumberCell is changed from play to pause
    // 1b. HTML of player bar's play button to a pause button
    
    if (currentSoundFile.isPaused()) {
        getSongNumberCell(currentlyPlayingSongNumber);
        $('.main-controls .play-pause').html(playerBarPauseButton);
        currentSoundFile.play();
    } else if (currentSoundFile) {
        getSongNumberCell(currentlyPlayingSongNumber);
        $('.main-controls .play-pause').html(playerBarPlayButton);
        currentSoundFile.pause();
    }
};

var playButtonTemplate = '<a class="album-song-button"><span class="ion-play"></span></a>';

var pauseButtonTemplate = '<a class="album-song-button"><span class="ion-pause"></span></a>';

var playerBarPlayButton = '<span class="ion-play"></span>';
var playerBarPauseButton = '<span class="ion-pause"></span>';


// Store state of playing songs
var currentAlbum = null;
var currentlyPlayingSongNumber = null;
var currentSongFromAlbum = null;
var currentSoundFile = null;
var currentVolume = 80;

var $previousButton = $('.main-controls .previous');
var $nextButton = $('.main-controls .next');
var $playPauseOnBar = $('.main-controls .play-pause');

$(document).ready(function() {
    setCurrentAlbum(albumPicasso);
    setupSeekBars();
    $previousButton.click(previousSong);
    $nextButton.click(nextSong);
    $playPauseOnBar.click(togglePlayFromPlayerBar);
});