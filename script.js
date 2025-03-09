// Timer State
let timeLeft = 50 * 60;
let isRunning = false;
let isBreak = false;
let sessionsCompleted = 0;
let timerId = null;

// YouTube Player
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    document.getElementById('startBtn').disabled = false;
}

// Add to timer state
let studyDuration = 50;
let breakDuration = 10;

// Timer Controls
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const seconds = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('time').textContent = `${minutes}:${seconds}`;
    
    // Get current session duration
    const currentDuration = isBreak ? breakDuration : studyDuration;
    const progressPercent = ((currentDuration * 60 - timeLeft) / (currentDuration * 60)) * 100;
    document.getElementById('progress').style.width = `${progressPercent}%`;
}

function updateDurations() {
    const newStudy = parseInt(document.getElementById('studyTime').value) || 25;
    const newBreak = parseInt(document.getElementById('breakTime').value) || 5;
    
    if (!isRunning) {
        // Calculate remaining percentage
        const totalDuration = isBreak ? breakDuration : studyDuration;
        const remainingPercentage = timeLeft / (totalDuration * 60);
        
        // Update durations
        studyDuration = newStudy;
        breakDuration = newBreak;
        
        // Adjust timeLeft based on new duration
        timeLeft = Math.round((isBreak ? newBreak : newStudy) * 60 * remainingPercentage);
        updateDisplay();
    }
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        const videoId = extractVideoId(document.getElementById('youtubeUrl').value);
        
        if (videoId) {
            if (player.getVideoUrl().includes(videoId)) {
                player.playVideo();
            } else {
                player.loadVideoById({
                    videoId: videoId,
                    startSeconds: 0
                });
            }
        }
        
        timerId = setInterval(() => {
            timeLeft--;
            updateDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerId);
                isRunning = false;
                handleSessionEnd();
            }
        }, 1000);
    }
}

function handleSessionEnd() {
    if (!isBreak) {
        // Study session ended
        sessionsCompleted++;
        document.getElementById('sessionCount').textContent = sessionsCompleted;
        timeLeft = breakDuration * 60;
        isBreak = true;
    } else {
        // Break session ended
        timeLeft = studyDuration * 60;
        isBreak = false;
    }
    
    // Reset progress bar
    document.getElementById('progress').style.width = '0%';
    // Force reflow to reset animation
    void document.getElementById('progress').offsetWidth;
    
    startTimer();
}

// Add missing extractVideoId function
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Add event listener for start button
document.getElementById('startBtn').addEventListener('click', startTimer);

// Add pause functionality
document.getElementById('pauseBtn').addEventListener('click', () => {
    if (isRunning) {
        clearInterval(timerId);
        isRunning = false;
        player.pauseVideo();
    } else {
        // Capture current playback time before updating
        const currentTime = player.getCurrentTime();
        updateDurations();
        
        // Preserve audio position
        if (player.getPlayerState() !== YT.PlayerState.CUED) {
            player.seekTo(currentTime);
        }
    }
});

// Add reset functionality
document.getElementById('resetBtn').addEventListener('click', () => {
    clearInterval(timerId);
    isRunning = false;
    isBreak = false;
    timeLeft = studyDuration * 60;
    updateDisplay();
    player.stopVideo();
    document.getElementById('progress').style.width = '0%';
});

// Add event listeners for inputs
document.getElementById('studyTime').addEventListener('change', updateDurations);
document.getElementById('breakTime').addEventListener('change', updateDurations);

// Update display initialization
function initializeTimer() {
    timeLeft = studyDuration * 60;
    updateDisplay();
}
initializeTimer();  // Call this on page load 