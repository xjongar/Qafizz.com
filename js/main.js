// Update UTC time
function updateUTCTime() {
    const now = new Date();
    const utcString = now.toISOString().slice(0, 19).replace('T', ' ');
    document.getElementById('utc-time').textContent = utcString;
}

// Update time every second
setInterval(updateUTCTime, 1000);

// Initial time update
updateUTCTime();

// Sample data update function
function updateStats() {
    // These would typically come from your backend
    const stats = {
        userCount: Math.floor(Math.random() * 1000),
        sessionCount: Math.floor(Math.random() * 500),
        responseTime: Math.floor(Math.random() * 100)
    };

    document.getElementById('userCount').textContent = stats.userCount;
    document.getElementById('sessionCount').textContent = stats.sessionCount;
    document.getElementById('responseTime').textContent = `${stats.responseTime}ms`;
}

// Update stats every 5 seconds
setInterval(updateStats, 5000);

// Initial update
updateStats();

// Add smooth scrolling for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});