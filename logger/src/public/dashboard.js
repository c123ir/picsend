// تنظیمات اولیه
const socket = io(window.socketConfig.url, {
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});
let isLive = true; // تغییر به true برای شروع در حالت زنده
let logs = [];
let filteredLogs = [];
let currentView = 'realtime';
let isPlaying = false;
let playbackSpeed = 1;
let currentTimeRange = 1440; // 24 ساعت به دقیقه

// فیلترهای پیش‌فرض
const filters = {
    levels: ['error', 'warn', 'info', 'debug'],
    services: new Set(),
    search: '',
    timeRange: currentTimeRange
};

// آمار و ارقام
let stats = {
    totalLogs: 0,
    criticalErrors: 0,
    activeServices: 0,
    logsPerMinute: 0,
    levelCounts: {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0
    }
};

// نمودارها
let distributionChart;

// راه‌اندازی نوار زمان
function initializeTimeSlider() {
    const slider = document.getElementById('timelineHandle');
    const track = document.querySelector('.timeline-track');
    let isDragging = false;
    
    slider.addEventListener('mousedown', (e) => {
        isDragging = true;
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const trackRect = track.getBoundingClientRect();
        let position = (e.clientX - trackRect.left) / trackRect.width;
        position = Math.max(0, Math.min(1, position));
        
        // تبدیل موقعیت به دقیقه (1 دقیقه تا 30 روز)
        const minMinutes = 1;
        const maxMinutes = 43200; // 30 روز
        currentTimeRange = Math.round(minMinutes + (maxMinutes - minMinutes) * position);
        
        // به‌روزرسانی ظاهر اسلایدر
        slider.style.right = `${position * 100}%`;
        document.querySelector('.timeline-progress').style.width = `${position * 100}%`;
        
        // به‌روزرسانی متن نمایشی
        document.getElementById('timeRangeDisplay').textContent = formatTimeRange(currentTimeRange);
        
        // اعمال فیلتر جدید
        filters.timeRange = currentTimeRange;
        applyFilters();
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// اتصال به سرور
socket.on('connect', () => {
    updateConnectionStatus(true);
    if (isLive) {
        fetchLogs();
    }
});

socket.on('disconnect', () => {
    updateConnectionStatus(false);
});

// دریافت لاگ جدید
socket.on('log', (log) => {
    console.log('New log received:', log);
    if (isLive) {
        saveLogToFile(log);
        addLog(log);
        updateUI();
    }
});

// به‌روزرسانی وضعیت اتصال
function updateConnectionStatus(connected) {
    const status = document.getElementById('connectionStatus');
    status.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
    status.querySelector('.status-text').textContent = connected ? 'متصل به سرور' : 'قطع اتصال';
}

// افزودن لاگ جدید
function addLog(log) {
    // تبدیل timestamp به شیء Date
    log.timestamp = new Date(log.timestamp);
    
    // افزودن به لیست لاگ‌ها
    logs.unshift(log);
    
    // به‌روزرسانی سرویس‌های فعال
    filters.services.add(log.source);
    
    // به‌روزرسانی آمار
    stats.totalLogs++;
    stats.levelCounts[log.level]++;
    
    if (log.level === 'error') {
        stats.criticalErrors++;
    }
    
    // به‌روزرسانی میانگین لاگ در دقیقه
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    stats.logsPerMinute = logs.filter(l => l.timestamp.getTime() > oneMinuteAgo).length;
    
    // اعمال فیلترها
    applyFilters();
}

// اعمال فیلترها
function applyFilters() {
    filteredLogs = logs.filter(log => {
        // فیلتر سطح
        if (!filters.levels.includes(log.level)) return false;
        
        // فیلتر سرویس
        if (filters.services.size > 0 && !filters.services.has(log.source)) return false;
        
        // فیلتر جستجو
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            if (!log.message.toLowerCase().includes(searchLower) &&
                !log.source.toLowerCase().includes(searchLower)) {
                return false;
            }
        }
        
        // فیلتر زمانی
        const logTime = log.timestamp.getTime();
        const now = Date.now();
        const timeRangeMs = filters.timeRange * 60 * 1000;
        if (now - logTime > timeRangeMs) return false;
        
        return true;
    });
    
    updateUI();
}

// به‌روزرسانی رابط کاربری
function updateUI() {
    updateStats();
    updateLogTable();
    updateCharts();
    updateFilters();
}

// به‌روزرسانی آمار
function updateStats() {
    document.getElementById('totalLogs').textContent = stats.totalLogs.toLocaleString();
    document.getElementById('criticalErrors').textContent = stats.criticalErrors.toLocaleString();
    document.getElementById('activeServices').textContent = filters.services.size;
    document.getElementById('logsPerMinute').textContent = stats.logsPerMinute.toLocaleString();
    
    // به‌روزرسانی تعداد هر سطح
    document.getElementById('errorCount').textContent = stats.levelCounts.error;
    document.getElementById('warnCount').textContent = stats.levelCounts.warn;
    document.getElementById('infoCount').textContent = stats.levelCounts.info;
    document.getElementById('debugCount').textContent = stats.levelCounts.debug;
}

// به‌روزرسانی جدول لاگ‌ها
function updateLogTable() {
    const table = document.getElementById('logTable');
    if (!table) {
        console.error('Log table element not found');
        return;
    }
    
    table.innerHTML = '';
    
    filteredLogs.forEach(log => {
        const row = document.createElement('tr');
        row.className = 'log-row animate__animated animate__fadeIn';
        
        const time = moment(log.timestamp).format('jYYYY/jMM/jDD HH:mm:ss');
        
        row.innerHTML = `
            <td>
                <div class="fw-bold">${time}</div>
            </td>
            <td>
                <span class="status-badge status-${log.level}">
                    <i class="mdi mdi-${getLogLevelIcon(log.level)} me-1"></i>
                    ${log.level}
                </span>
            </td>
            <td>
                <span class="badge bg-light text-dark">
                    ${log.source}
                </span>
            </td>
            <td>${log.message}</td>
            <td>
                <button class="btn btn-sm btn-light" onclick="showLogDetails('${encodeURIComponent(JSON.stringify(log))}')">
                    <i class="mdi mdi-information"></i>
                </button>
            </td>
        `;
        
        table.appendChild(row);
    });
}

// به‌روزرسانی نمودارها
function updateCharts() {
    if (distributionChart) {
        distributionChart.destroy();
    }
    
    const ctx = document.getElementById('logDistributionChart');
    distributionChart = new ApexCharts(ctx, {
        series: [{
            name: 'تعداد لاگ',
            data: [
                stats.levelCounts.error,
                stats.levelCounts.warn,
                stats.levelCounts.info,
                stats.levelCounts.debug
            ]
        }],
        chart: {
            type: 'donut',
            height: 250
        },
        labels: ['خطا', 'هشدار', 'اطلاعات', 'دیباگ'],
        colors: ['#ef4444', '#f59e0b', '#06b6d4', '#475569'],
        legend: {
            position: 'bottom'
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    });
    
    distributionChart.render();
}

// به‌روزرسانی فیلترها
function updateFilters() {
    // به‌روزرسانی فیلتر سطح
    document.querySelectorAll('.level-badge').forEach(badge => {
        const level = badge.dataset.level;
        badge.classList.toggle('active', filters.levels.includes(level));
    });
    
    // به‌روزرسانی فیلتر سرویس
    const serviceFilter = document.getElementById('serviceFilter');
    serviceFilter.innerHTML = '';
    
    Array.from(filters.services).sort().forEach(service => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
            <input class="form-check-input" type="checkbox" id="service-${service}" 
                ${filters.services.has(service) ? 'checked' : ''}>
            <label class="form-check-label" for="service-${service}">
                ${service}
            </label>
        `;
        serviceFilter.appendChild(div);
    });
    
    // به‌روزرسانی نمایش بازه زمانی
    document.getElementById('timeRangeDisplay').textContent = formatTimeRange(filters.timeRange);
}

// نمایش جزئیات لاگ
function showLogDetails(logData) {
    const log = JSON.parse(decodeURIComponent(logData));
    const modal = new bootstrap.Modal(document.getElementById('logDetailModal'));
    
    document.getElementById('logTime').textContent = moment(log.timestamp).format('YYYY/MM/DD HH:mm:ss');
    document.getElementById('logLevel').textContent = log.level;
    document.getElementById('logSource').textContent = log.source;
    document.getElementById('logDetail').textContent = JSON.stringify(log, null, 2);
    
    modal.show();
}

// دریافت آیکون مناسب برای هر سطح لاگ
function getLogLevelIcon(level) {
    const icons = {
        error: 'alert-circle',
        warn: 'alert',
        info: 'information',
        debug: 'bug-outline'
    };
    return icons[level] || 'circle';
}

// تبدیل دقیقه به متن قابل نمایش
function formatTimeRange(minutes) {
    if (minutes < 60) {
        return `${minutes} دقیقه اخیر`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours} ساعت اخیر`;
    } else if (minutes < 10080) {
        const days = Math.floor(minutes / 1440);
        return `${days} روز اخیر`;
    } else {
        const weeks = Math.floor(minutes / 10080);
        return `${weeks} هفته اخیر`;
    }
}

// دریافت لاگ‌ها از سرور
async function fetchLogs() {
    try {
        console.log('Fetching logs...'); // برای دیباگ
        const response = await fetch(`/api/logs?${new URLSearchParams({
            levels: filters.levels.join(','),
            services: Array.from(filters.services).join(','),
            search: filters.search,
            timeRange: filters.timeRange
        })}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received logs:', data); // برای دیباگ
        
        if (data.success) {
            logs = data.logs.map(log => ({
                ...log,
                timestamp: new Date(log.timestamp)
            }));
            applyFilters();
        }
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}

// تغییر نما
document.querySelectorAll('.nav-link').forEach(tab => {
    tab.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentView = tab.dataset.view;
        
        const mainContent = document.querySelector('.main-content');
        
        switch (currentView) {
            case 'realtime':
                mainContent.innerHTML = document.getElementById('realtimeTemplate').innerHTML;
                isLive = true;
                fetchLogs();
                break;
                
            case 'analytics':
                mainContent.innerHTML = document.getElementById('analyticsTemplate').innerHTML;
                isLive = false;
                updateAnalytics();
                break;
                
            case 'archive':
                mainContent.innerHTML = document.getElementById('archiveTemplate').innerHTML;
                isLive = false;
                loadArchiveLogs();
                break;
        }
    });
});

// نمایش زنده
document.getElementById('liveBtn').addEventListener('click', () => {
    isLive = !isLive;
    const liveBtn = document.getElementById('liveBtn');
    liveBtn.classList.toggle('active', isLive);
    
    if (isLive) {
        fetchLogs();
    }
});

// راه‌اندازی اولیه
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing dashboard...'); // برای دیباگ
    initializeTimeSlider();
    fetchLogs();
    updateUI();
});

// رویدادهای فیلترها
document.querySelectorAll('.level-badge').forEach(badge => {
    badge.addEventListener('click', () => {
        const level = badge.dataset.level;
        if (filters.levels.includes(level)) {
            filters.levels = filters.levels.filter(l => l !== level);
        } else {
            filters.levels.push(level);
        }
        applyFilters();
    });
});

document.getElementById('resetLevelFilter').addEventListener('click', () => {
    filters.levels = ['error', 'warn', 'info', 'debug'];
    applyFilters();
});

// رویدادهای دکمه‌های شناور
document.getElementById('refreshBtn').addEventListener('click', fetchLogs);
document.getElementById('exportBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`/api/logs/export?${new URLSearchParams({
            levels: filters.levels.join(','),
            services: Array.from(filters.services).join(','),
            search: filters.search,
            timeRange: filters.timeRange
        })}`);
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${moment().format('YYYY-MM-DD-HH-mm-ss')}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('خطا در خروجی گرفتن از لاگ‌ها:', error);
    }
});

document.getElementById('scrollTopBtn').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// کپی کردن جزئیات لاگ
document.getElementById('copyLogBtn').addEventListener('click', () => {
    const logDetail = document.getElementById('logDetail').textContent;
    navigator.clipboard.writeText(logDetail).then(() => {
        const copyBtn = document.getElementById('copyLogBtn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="mdi mdi-check me-1"></i>کپی شد';
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    });
});

// به‌روزرسانی تحلیل‌ها
function updateAnalytics() {
    // نمودار توزیع سطح لاگ‌ها
    const levelDistributionElement = document.getElementById('logLevelDistribution');
    if (levelDistributionElement) {
        const levelDistribution = new ApexCharts(levelDistributionElement, {
            series: [{
                name: 'تعداد لاگ',
                data: [
                    stats.levelCounts.error,
                    stats.levelCounts.warn,
                    stats.levelCounts.info,
                    stats.levelCounts.debug
                ]
            }],
            chart: {
                type: 'donut',
                height: 350
            },
            labels: ['خطا', 'هشدار', 'اطلاعات', 'دیباگ'],
            colors: ['#ef4444', '#f59e0b', '#06b6d4', '#475569'],
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        });
        levelDistribution.render();
    }

    // نمودار فعالیت سرویس‌ها
    const serviceData = Array.from(filters.services).map(service => ({
        service,
        count: logs.filter(log => log.source === service).length
    }));

    const serviceActivity = new ApexCharts(document.getElementById('serviceActivity'), {
        series: [{
            name: 'تعداد لاگ',
            data: serviceData.map(d => d.count)
        }],
        chart: {
            type: 'bar',
            height: 350
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: true,
            }
        },
        dataLabels: {
            enabled: false
        },
        xaxis: {
            categories: serviceData.map(d => d.service),
        },
        colors: ['#2563eb']
    });
    serviceActivity.render();

    // نمودار روند خطاها
    const errorTrendData = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const time = new Date(now - i * 3600000);
        const count = logs.filter(log => {
            const logTime = new Date(log.timestamp);
            return log.level === 'error' && 
                   logTime > new Date(time - 3600000) && 
                   logTime <= time;
        }).length;
        errorTrendData.unshift({ time, count });
    }

    const errorTrend = new ApexCharts(document.getElementById('errorTrend'), {
        series: [{
            name: 'تعداد خطا',
            data: errorTrendData.map(d => d.count)
        }],
        chart: {
            type: 'area',
            height: 350,
            zoom: {
                enabled: true
            }
        },
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth'
        },
        xaxis: {
            categories: errorTrendData.map(d => moment(d.time).format('HH:mm')),
            labels: {
                rotate: -45
            }
        },
        colors: ['#ef4444'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.2,
                stops: [0, 90, 100]
            }
        }
    });
    errorTrend.render();
}

// بارگذاری لاگ‌های آرشیو
async function loadArchiveLogs() {
    const startDate = $('#startDate').val();
    const endDate = $('#endDate').val();
    const search = document.getElementById('archiveSearch').value;

    if (!startDate || !endDate) {
        alert('لطفاً تاریخ شروع و پایان را وارد کنید');
        return;
    }

    try {
        const response = await fetch(`/api/logs/archive?${new URLSearchParams({
            startDate: moment.from(startDate, 'fa', 'YYYY/MM/DD').format('YYYY-MM-DD'),
            endDate: moment.from(endDate, 'fa', 'YYYY/MM/DD').format('YYYY-MM-DD'),
            search
        })}`);
        
        const data = await response.json();
        if (data.success) {
            const table = document.getElementById('archiveTable');
            table.innerHTML = '';
            
            data.logs.forEach(log => {
                const row = document.createElement('tr');
                row.className = 'log-row animate__animated animate__fadeIn';
                
                const time = moment(log.timestamp).format('jYYYY/jMM/jDD HH:mm:ss');
                
                row.innerHTML = `
                    <td>
                        <div class="fw-bold">${time}</div>
                    </td>
                    <td>
                        <span class="status-badge status-${log.level}">
                            <i class="mdi mdi-${getLogLevelIcon(log.level)} me-1"></i>
                            ${log.level}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-light text-dark">
                            ${log.source}
                        </span>
                    </td>
                    <td>${log.message}</td>
                    <td>
                        <button class="btn btn-sm btn-light" onclick="showLogDetails('${encodeURIComponent(JSON.stringify(log))}')">
                            <i class="mdi mdi-information"></i>
                        </button>
                    </td>
                `;
                
                table.appendChild(row);
            });
        }
    } catch (error) {
        console.error('خطا در دریافت لاگ‌های آرشیو:', error);
        alert('خطا در دریافت لاگ‌ها');
    }
}

// ذخیره خودکار لاگ‌ها
function saveLogToFile(log) {
    const date = moment(log.timestamp).format('YYYYMMDD');
    const fileName = `logs_${date}.json`;
    
    fetch('/api/logs/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fileName,
            log: {
                ...log,
                timestamp: moment(log.timestamp).format(),
                browser: navigator.userAgent,
                consoleErrors: window.consoleErrors || []
            }
        })
    }).catch(error => console.error('خطا در ذخیره لاگ:', error));
}

// ثبت خطاهای کنسول مرورگر
window.consoleErrors = [];
const originalConsoleError = console.error;
console.error = function(...args) {
    window.consoleErrors.push({
        timestamp: new Date(),
        message: args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ')
    });
    originalConsoleError.apply(console, args);
};

// رویدادهای آرشیو
document.getElementById('searchArchive')?.addEventListener('click', loadArchiveLogs); 