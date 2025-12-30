// Global schedule data variable
let scheduleData = null;
let lastUpdated = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadScheduleData();
    renderSchedule();
    setupEventListeners();
    updateLastUpdated();
    calculateStatistics();
});

// Load schedule data from JSON file
async function loadScheduleData() {
    try {
        const response = await fetch('schedule.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        scheduleData = await response.json();
        lastUpdated = new Date();
        console.log('Schedule data loaded successfully');
    } catch (error) {
        console.error('Error loading schedule data:', error);
        showNotification('Error loading schedule data. Using default data.', 'error');
        // Load default data structure
        scheduleData = getDefaultScheduleData();
        lastUpdated = new Date();
    }
}

function getDefaultScheduleData() {
    return {
        "weekDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "timeSlots": [
            "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
            "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"
        ],
        "activities": [
            {
                "day": "Monday",
                "startTime": "9:00 AM",
                "endTime": "12:00 PM",
                "title": "Project Work",
                "type": "work",
                "description": "Working on the quarterly report"
            },
            {
                "day": "Monday",
                "startTime": "1:00 PM",
                "endTime": "4:00 PM",
                "title": "Free Time",
                "type": "free-time",
                "description": "Available for meetings or personal tasks"
            },
            {
                "day": "Tuesday",
                "startTime": "10:00 AM",
                "endTime": "11:30 AM",
                "title": "Team Meeting",
                "type": "meeting",
                "description": "Weekly team sync"
            },
            {
                "day": "Wednesday",
                "startTime": "2:00 PM",
                "endTime": "5:00 PM",
                "title": "Client Presentation",
                "type": "work",
                "description": "Presenting Q3 results"
            },
            {
                "day": "Thursday",
                "startTime": "7:00 AM",
                "endTime": "9:00 AM",
                "title": "Gym Session",
                "type": "personal",
                "description": "Morning workout"
            },
            {
                "day": "Friday",
                "startTime": "3:00 PM",
                "endTime": "6:00 PM",
                "title": "Free Time",
                "type": "free-time",
                "description": "Open for scheduling"
            },
            {
                "day": "Saturday",
                "startTime": "10:00 AM",
                "endTime": "2:00 PM",
                "title": "Family Time",
                "type": "personal",
                "description": "Weekend activities"
            },
            {
                "day": "Sunday",
                "startTime": "7:00 PM",
                "endTime": "8:00 PM",
                "title": "Planning Session",
                "type": "work",
                "description": "Planning for next week"
            }
        ]
    };
}

// Render the schedule grid
function renderSchedule() {
    if (!scheduleData) return;
    
    const grid = document.getElementById('scheduleGrid');
    const legendContainer = document.getElementById('legendContainer');
    
    // Clear existing content
    grid.innerHTML = '';
    legendContainer.innerHTML = '';
    
    // Create time slot headers (left column)
    grid.appendChild(createCell('time-header', 'Time / Day'));
    
    // Create day headers
    scheduleData.weekDays.forEach(day => {
        grid.appendChild(createCell('day-header', day));
    });
    
    // Create time slots and schedule cells
    scheduleData.timeSlots.forEach((time, timeIndex) => {
        // Time label cell
        grid.appendChild(createCell('time-slot', time));
        
        // Schedule cells for each day
        scheduleData.weekDays.forEach(day => {
            const cell = document.createElement('div');
            cell.className = 'schedule-cell';
            cell.dataset.day = day;
            cell.dataset.time = time;
            cell.dataset.timeIndex = timeIndex;
            
            // Check if there's an activity for this cell
            const activity = findActivityForCell(day, time);
            if (activity) {
                const activityElement = createActivityElement(activity, time);
                cell.appendChild(activityElement);
            }
            
            grid.appendChild(cell);
        });
    });
    
    // Create legend
    renderLegend();
    
    // Highlight current time
    highlightCurrentTime();
}

function createCell(className, content) {
    const cell = document.createElement('div');
    cell.className = className;
    cell.textContent = content;
    return cell;
}

function createActivityElement(activity, cellTime) {
    const activityElement = document.createElement('div');
    activityElement.className = `activity ${activity.type}`;
    activityElement.innerHTML = `
        <div class="activity-title">${activity.title}</div>
        <div class="activity-details">
            ${activity.startTime} - ${activity.endTime}<br>
            ${activity.description}
        </div>
    `;
    
    activityElement.title = `${activity.title}\n${activity.startTime} - ${activity.endTime}\n${activity.description}`;
    activityElement.dataset.activityId = activity.title.replace(/\s+/g, '-').toLowerCase();
    
    // Calculate height based on duration
    const duration = calculateDuration(activity.startTime, activity.endTime);
    const height = duration / 60 * 50; // 50px per hour
    activityElement.style.height = `${height}px`;
    
    // Calculate top position
    const topPosition = calculatePosition(activity.startTime, cellTime);
    activityElement.style.top = `${topPosition}px`;
    
    // Add click event to edit activity
    activityElement.addEventListener('click', function(e) {
        e.stopPropagation();
        editActivity(activity);
    });
    
    return activityElement;
}

function renderLegend() {
    const legendContainer = document.getElementById('legendContainer');
    const activityTypes = [
        { type: 'free-time', label: 'Free Time' },
        { type: 'busy', label: 'Busy / Occupied' },
        { type: 'meeting', label: 'Meetings' },
        { type: 'work', label: 'Work / Projects' },
        { type: 'personal', label: 'Personal' }
    ];
    
    activityTypes.forEach(item => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color ${item.type}"></div>
            <span class="legend-text">${item.label}</span>
        `;
        legendContainer.appendChild(legendItem);
    });
}

function findActivityForCell(day, time) {
    return scheduleData.activities.find(activity => {
        return activity.day === day && activity.startTime === time;
    });
}

function calculateDuration(startTime, endTime) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    return end - start;
}

function calculatePosition(activityStartTime, cellTime) {
    if (activityStartTime === cellTime) return 0;
    
    const activityStartMinutes = timeToMinutes(activityStartTime);
    const cellTimeMinutes = timeToMinutes(cellTime);
    
    if (activityStartMinutes < cellTimeMinutes) return 0;
    
    return 0;
}

function timeToMinutes(timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    return hours * 60 + (minutes || 0);
}

function formatTime(hours, minutes) {
    const ampm = hours >= 12 ? 'PM' : 'AM';
    let displayHours = hours % 12;
    displayHours = displayHours ? displayHours : 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

function highlightCurrentTime() {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = formatTime(currentHour, currentMinute);
    
    const cells = document.querySelectorAll('.schedule-cell');
    cells.forEach(cell => {
        if (cell.dataset.day === currentDay) {
            const cellTimeMinutes = timeToMinutes(cell.dataset.time);
            const currentTimeMinutes = timeToMinutes(currentTimeStr);
            
            if (Math.abs(cellTimeMinutes - currentTimeMinutes) < 60) {
                cell.classList.add('current-time');
            }
        }
    });
}

function editActivity(activity) {
    const editor = document.getElementById('jsonEditor');
    const textarea = document.getElementById('jsonData');
    
    // Create a copy of the schedule data for editing
    const editableData = JSON.parse(JSON.stringify(scheduleData));
    
    // Find and highlight the activity in the JSON
    const jsonString = JSON.stringify(editableData, null, 2);
    textarea.value = jsonString;
    
    editor.style.display = 'block';
    textarea.focus();
    
    // Scroll to the activity in the JSON
    const activityIndex = editableData.activities.findIndex(a => 
        a.day === activity.day && 
        a.startTime === activity.startTime
    );
    
    if (activityIndex !== -1) {
        // Simple highlight - in a real app you might want to implement syntax highlighting
        setTimeout(() => {
            const lines = jsonString.split('\n');
            let lineNumber = 0;
            for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(`"${activity.title}"`)) {
                    lineNumber = i;
                    break;
                }
            }
            
            textarea.setSelectionRange(0, 0);
            const lineHeight = 20;
            textarea.scrollTop = lineNumber * lineHeight;
        }, 100);
    }
}

function calculateStatistics() {
    if (!scheduleData) return;
    
    let totalHours = 0;
    let freeHours = 0;
    let workHours = 0;
    
    scheduleData.activities.forEach(activity => {
        const duration = calculateDuration(activity.startTime, activity.endTime);
        const hours = duration / 60;
        
        totalHours += hours;
        
        if (activity.type === 'free-time') {
            freeHours += hours;
        } else if (activity.type === 'work') {
            workHours += hours;
        }
    });
    
    document.getElementById('totalHours').textContent = totalHours.toFixed(1);
    document.getElementById('freeHours').textContent = freeHours.toFixed(1);
    document.getElementById('workHours').textContent = workHours.toFixed(1);
    document.getElementById('activitiesCount').textContent = scheduleData.activities.length;
}

function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdated) {
        lastUpdatedElement.textContent = lastUpdated.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Edit JSON button
    document.getElementById('editJsonBtn').addEventListener('click', function() {
        const editor = document.getElementById('jsonEditor');
        const textarea = document.getElementById('jsonData');
        textarea.value = JSON.stringify(scheduleData, null, 2);
        editor.style.display = 'block';
        textarea.focus();
        showNotification('JSON editor opened. Edit your schedule data.', 'info');
    });

    // Save JSON button
    document.getElementById('saveJsonBtn').addEventListener('click', function() {
        saveJsonChanges();
    });

    // Reset JSON button
    document.getElementById('resetJsonBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to reset to default schedule data?')) {
            scheduleData = getDefaultScheduleData();
            renderSchedule();
            calculateStatistics();
            document.getElementById('jsonEditor').style.display = 'none';
            showNotification('Schedule reset to default data.', 'info');
        }
    });

    // Cancel JSON editing
    document.getElementById('cancelJsonBtn').addEventListener('click', function() {
        document.getElementById('jsonEditor').style.display = 'none';
        showNotification('JSON editor closed without saving.', 'warning');
    });

    // Export PDF button
    document.getElementById('exportPdfBtn').addEventListener('click', function() {
        exportToPDF();
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        renderSchedule();
        calculateStatistics();
        showNotification('Schedule refreshed!', 'success');
    });

    // Load from JSON file button
    document.getElementById('loadJsonBtn').addEventListener('click', function() {
        document.getElementById('jsonFileInput').click();
    });

    // Save to JSON file button
    document.getElementById('saveJsonFileBtn').addEventListener('click', function() {
        saveToJsonFile();
    });

    // JSON file input change
    document.getElementById('jsonFileInput').addEventListener('change', function(e) {
        loadFromJsonFile(e.target.files[0]);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S to save JSON
        if ((e.ctrlKey || e.metaKey) && e.key === 's' && 
            document.getElementById('jsonEditor').style.display === 'block') {
            e.preventDefault();
            saveJsonChanges();
        }
        
        // Escape to close JSON editor
        if (e.key === 'Escape' && 
            document.getElementById('jsonEditor').style.display === 'block') {
            document.getElementById('jsonEditor').style.display = 'none';
        }
    });
}

function saveJsonChanges() {
    try {
        const newData = JSON.parse(document.getElementById('jsonData').value);
        
        // Validate the data structure
        if (!newData.weekDays || !newData.timeSlots || !newData.activities) {
            throw new Error('Invalid JSON structure. Must include weekDays, timeSlots, and activities.');
        }
        
        // Update schedule data
        scheduleData = newData;
        lastUpdated = new Date();
        
        // Re-render everything
        renderSchedule();
        calculateStatistics();
        updateLastUpdated();
        
        document.getElementById('jsonEditor').style.display = 'none';
        showNotification('Schedule updated successfully!', 'success');
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
        console.error('JSON parse error:', error);
    }
}

function saveToJsonFile() {
    if (!scheduleData) return;
    
    const dataStr = JSON.stringify(scheduleData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    // Create download link
    const downloadLink = document.createElement('a');
    downloadLink.download = `schedule-${new Date().toISOString().split('T')[0]}.json`;
    downloadLink.href = URL.createObjectURL(dataBlob);
    downloadLink.click();
    
    URL.revokeObjectURL(downloadLink.href);
    showNotification('Schedule data saved to JSON file!', 'success');
}

function loadFromJsonFile(file) {
    if (!file) return;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const newData = JSON.parse(e.target.result);
            
            // Validate the data structure
            if (!newData.weekDays || !newData.timeSlots || !newData.activities) {
                throw new Error('Invalid JSON file structure.');
            }
            
            scheduleData = newData;
            lastUpdated = new Date();
            
            // Re-render everything
            renderSchedule();
            calculateStatistics();
            updateLastUpdated();
            
            showNotification('Schedule loaded from JSON file successfully!', 'success');
        } catch (error) {
            showNotification(`Error loading file: ${error.message}`, 'error');
            console.error('Error parsing JSON file:', error);
        }
    };
    
    reader.onerror = function() {
        showNotification('Error reading the file.', 'error');
    };
    
    reader.readAsText(file);
}

// Export to PDF function with GRID layout - VERSÃO CORRIGIDA
function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            throw new Error('jsPDF library not loaded');
        }
        
        const doc = new jsPDF('l', 'mm', 'a4');
        
        // Colors for PDF (RGB format)
        const colors = {
            background: [245, 247, 250],
            header: [44, 62, 80],
            timeSlot: [248, 249, 250],
            timeSlotAlt: [241, 243, 244],
            freeTime: [39, 174, 96],
            busy: [231, 76, 60],
            meeting: [52, 152, 219],
            work: [155, 89, 182],
            personal: [243, 156, 18],
            gridLine: [233, 236, 239],
            currentTime: [52, 152, 219, 30]
        };
        
        // PDF dimensions
        const pageWidth = 297; // A4 landscape
        const pageHeight = 210;
        const margin = 15;
        const gridWidth = pageWidth - (margin * 2);
        const gridHeight = pageHeight - (margin * 2) - 25;
        
        // Calculate cell dimensions
        const timeColumnWidth = 25;
        const dayColumnWidth = (gridWidth - timeColumnWidth) / 7;
        const timeRowHeight = gridHeight / (scheduleData.timeSlots.length + 1); // +1 for header row
        
        // Title - CORREÇÃO: Garantir strings
        doc.setFontSize(24);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('WEEKLY AVAILABILITY SCHEDULE'.toString(), pageWidth / 2, margin - 5, { align: 'center' });
        
        // Subtitle
        doc.setFontSize(12);
        doc.setTextColor(127, 140, 141);
        doc.setFont('helvetica', 'normal');
        doc.text('7:00 AM - 8:00 PM • Monday to Sunday'.toString(), pageWidth / 2, margin + 5, { align: 'center' });
        
        // Generation info
        doc.setFontSize(10);
        const generatedDate = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Generated: ${generatedDate}`.toString(), margin, pageHeight - margin);
        
        // Page number
        doc.text('Page 1/1'.toString(), pageWidth - margin, pageHeight - margin, { align: 'right' });
        
        // Draw the grid container
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, margin + 15, gridWidth, gridHeight, 'FD');
        
        // Draw day headers
        doc.setFillColor(...colors.header);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        
        scheduleData.weekDays.forEach((day, index) => {
            const x = margin + timeColumnWidth + (index * dayColumnWidth);
            const y = margin + 15;
            
            // Day header background
            doc.setFillColor(...colors.header);
            doc.rect(x, y, dayColumnWidth, timeRowHeight, 'F');
            
            // Day text - CORREÇÃO: Garantir strings
            doc.setTextColor(255, 255, 255);
            doc.text(day.substring(0, 3).toUpperCase().toString(), x + (dayColumnWidth / 2), y + (timeRowHeight / 2), { align: 'center' });
            
            // Full day name below
            doc.setFontSize(8);
            doc.text(day.toString(), x + (dayColumnWidth / 2), y + (timeRowHeight / 2) + 4, { align: 'center' });
            doc.setFontSize(11);
        });
        
        // Draw time header
        doc.setFillColor(...colors.header);
        doc.rect(margin, margin + 15, timeColumnWidth, timeRowHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text('TIME'.toString(), margin + (timeColumnWidth / 2), margin + 15 + (timeRowHeight / 2), { align: 'center' });
        
        // Draw time slots and grid cells
        scheduleData.timeSlots.forEach((time, timeIndex) => {
            const y = margin + 15 + timeRowHeight + (timeIndex * timeRowHeight);
            
            // Time slot cell
            const bgColor = timeIndex % 2 === 0 ? colors.timeSlot : colors.timeSlotAlt;
            doc.setFillColor(...bgColor);
            doc.rect(margin, y, timeColumnWidth, timeRowHeight, 'F');
            
            // Time text
            doc.setTextColor(108, 117, 125);
            doc.setFontSize(9);
            doc.text(time.toString(), margin + (timeColumnWidth / 2), y + (timeRowHeight / 2), { align: 'center' });
            
            // Draw grid cells for each day
            scheduleData.weekDays.forEach((day, dayIndex) => {
                const x = margin + timeColumnWidth + (dayIndex * dayColumnWidth);
                
                // Cell background
                const cellBgColor = timeIndex % 2 === 0 ? colors.timeSlot : colors.timeSlotAlt;
                doc.setFillColor(...cellBgColor);
                doc.rect(x, y, dayColumnWidth, timeRowHeight, 'F');
                
                // Check for activity in this cell
                const activity = findActivityForCell(day, time);
                if (activity) {
                    drawActivityInPDF(doc, activity, x, y, dayColumnWidth, timeRowHeight, colors, timeIndex);
                }
                
                // Draw cell borders
                doc.setDrawColor(...colors.gridLine);
                doc.setLineWidth(0.2);
                doc.rect(x, y, dayColumnWidth, timeRowHeight, 'S');
            });
            
            // Draw time slot border
            doc.setDrawColor(...colors.gridLine);
            doc.setLineWidth(0.2);
            doc.rect(margin, y, timeColumnWidth, timeRowHeight, 'S');
        });
        
        // Draw outer borders
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.5);
        
        // Main grid border
        doc.rect(margin, margin + 15, gridWidth, gridHeight, 'S');
        
        // Day headers border
        doc.rect(margin + timeColumnWidth, margin + 15, gridWidth - timeColumnWidth, timeRowHeight, 'S');
        
        // Time column border
        doc.rect(margin, margin + 15, timeColumnWidth, gridHeight, 'S');
        
        // Draw current time indicator if applicable
        drawCurrentTimeIndicator(doc, margin, timeColumnWidth, dayColumnWidth, timeRowHeight, colors);
        
        // Draw legend on the right side
        drawLegendInPDF(doc, pageWidth, pageHeight, margin, colors);
        
        // Add summary statistics
        drawStatisticsInPDF(doc, pageWidth, pageHeight, margin, colors);
        
        // Save the PDF
        doc.save(`availability-schedule-${new Date().toISOString().split('T')[0]}.pdf`);
        
        showNotification('PDF with grid layout generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification(`Error generating PDF: ${error.message}`, 'error');
    }
}

// Helper function to draw activities in PDF - VERSÃO CORRIGIDA
function drawActivityInPDF(doc, activity, x, y, width, height, colors, timeIndex) {
    // Get activity color based on type
    let color;
    switch(activity.type) {
        case 'free-time':
            color = colors.freeTime;
            break;
        case 'busy':
            color = colors.busy;
            break;
        case 'meeting':
            color = colors.meeting;
            break;
        case 'work':
            color = colors.work;
            break;
        case 'personal':
            color = colors.personal;
            break;
        default:
            color = [200, 200, 200];
    }
    
    // Calculate activity height based on duration
    const duration = calculateDuration(activity.startTime, activity.endTime);
    const activityHeight = (duration / 60) * height;
    
    // Draw activity rectangle with border
    doc.setFillColor(...color);
    doc.setDrawColor(...color.map(c => Math.max(0, c - 40))); // Darker border
    doc.setLineWidth(0.3);
    
    // Add some padding inside the cell
    const padding = 1;
    const activityX = x + padding;
    const activityY = y + padding;
    const activityWidth = width - (padding * 2);
    
    doc.roundedRect(activityX, activityY, activityWidth, activityHeight - (padding * 2), 1, 1, 'FD');
    
    // Add activity text - CORREÇÃO: Garantir que o texto seja string
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    
    // Truncate text if too long
    let title = activity.title.toString(); // Garantir string
    if (title.length > 15) {
        title = title.substring(0, 13) + '...';
    }
    
    // Center text in activity box
    const textX = activityX + (activityWidth / 2);
    const textY = activityY + (activityHeight / 2) - (padding * 2);
    
    doc.text(title, textX, textY, { align: 'center' });
    
    // Add time range for multi-hour activities
    if (duration > 60) {
        doc.setFontSize(6);
        const timeText = `${activity.startTime.replace(' ', '')}-${activity.endTime.replace(' ', '')}`;
        doc.text(timeText.toString(), textX, textY + 3, { align: 'center' }); // Garantir string
    }
    
    // Reset font for next operations
    doc.setFont('helvetica', 'normal');
}

// Helper function to draw legend in PDF
function drawLegendInPDF(doc, pageWidth, pageHeight, margin, colors) {
    const legendX = pageWidth - margin - 60;
    const legendY = margin + 15;
    
    // Legend title
    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('LEGEND', legendX + 30, legendY, { align: 'center' });
    
    const legendItems = [
        { type: 'free-time', label: 'Free Time' },
        { type: 'busy', label: 'Busy' },
        { type: 'meeting', label: 'Meeting' },
        { type: 'work', label: 'Work' },
        { type: 'personal', label: 'Personal' }
    ];
    
    legendItems.forEach((item, index) => {
        const y = legendY + 10 + (index * 8);
        
        // Color box
        let color;
        switch(item.type) {
            case 'free-time': color = colors.freeTime; break;
            case 'busy': color = colors.busy; break;
            case 'meeting': color = colors.meeting; break;
            case 'work': color = colors.work; break;
            case 'personal': color = colors.personal; break;
            default: color = [200, 200, 200];
        }
        
        doc.setFillColor(...color);
        doc.rect(legendX, y - 2, 6, 6, 'F');
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.1);
        doc.rect(legendX, y - 2, 6, 6, 'S');
        
        // Label
        doc.setFontSize(8);
        doc.setTextColor(44, 62, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, legendX + 10, y + 1);
    });
}

// Helper function to draw current time indicator
function drawCurrentTimeIndicator(doc, margin, timeColumnWidth, dayColumnWidth, timeRowHeight, colors) {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = formatTime(currentHour, currentMinute);
    
    // Find the day index
    const dayIndex = scheduleData.weekDays.indexOf(currentDay);
    if (dayIndex === -1) return;
    
    // Find the time slot
    const timeIndex = scheduleData.timeSlots.findIndex(time => {
        const cellTimeMinutes = timeToMinutes(time);
        const currentTimeMinutes = timeToMinutes(currentTimeStr);
        return Math.abs(cellTimeMinutes - currentTimeMinutes) < 60;
    });
    
    if (timeIndex === -1) return;
    
    // Calculate position
    const x = margin + timeColumnWidth + (dayIndex * dayColumnWidth);
    const y = margin + 15 + timeRowHeight + (timeIndex * timeRowHeight);
    
    // Draw current time indicator
    doc.setDrawColor(...colors.meeting);
    doc.setLineWidth(0.8);
    doc.setLineDashPattern([3, 3], 0);
    doc.rect(x + 2, y + 2, dayColumnWidth - 4, timeRowHeight - 4, 'S');
    doc.setLineDashPattern([], 0);
    
    // Add "NOW" text
    doc.setFontSize(7);
    doc.setTextColor(...colors.meeting);
    doc.setFont('helvetica', 'bold');
    doc.text('NOW', x + (dayColumnWidth / 2), y + timeRowHeight - 3, { align: 'center' });
}

// Helper function to draw statistics in PDF - VERSÃO CORRIGIDA
function drawStatisticsInPDF(doc, pageWidth, pageHeight, margin, colors) {
    const statsY = pageHeight - margin - 25;
    const statsWidth = 200;
    const statsX = margin;
    
    // Statistics background
    doc.setFillColor(248, 249, 250);
    doc.rect(statsX, statsY, statsWidth, 20, 'F');
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(0.3);
    doc.rect(statsX, statsY, statsWidth, 20, 'S');
    
    // Calculate statistics
    let totalHours = 0;
    let freeHours = 0;
    let workHours = 0;
    let meetingHours = 0;
    let personalHours = 0;
    let busyHours = 0;
    
    scheduleData.activities.forEach(activity => {
        const duration = calculateDuration(activity.startTime, activity.endTime);
        const hours = duration / 60;
        
        totalHours += hours;
        
        switch(activity.type) {
            case 'free-time': freeHours += hours; break;
            case 'work': workHours += hours; break;
            case 'meeting': meetingHours += hours; break;
            case 'personal': personalHours += hours; break;
            case 'busy': busyHours += hours; break;
        }
    });
    
    // Statistics title
    doc.setFontSize(9);
    doc.setTextColor(44, 62, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('SCHEDULE STATISTICS', statsX + 10, statsY + 7);
    
    // Statistics values - CORREÇÃO: Converter números para strings
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const stats = [
        { label: 'Total Hours:', value: totalHours.toFixed(1).toString() },
        { label: 'Free Time:', value: freeHours.toFixed(1).toString() },
        { label: 'Work Hours:', value: workHours.toFixed(1).toString() },
        { label: 'Meetings:', value: meetingHours.toFixed(1).toString() },
        { label: 'Activities:', value: scheduleData.activities.length.toString() }
    ];
    
    stats.forEach((stat, index) => {
        const x = statsX + 10 + (index * 38);
        doc.text(stat.label, x, statsY + 16);
        doc.setFont('helvetica', 'bold');
        doc.text(stat.value.toString(), x, statsY + 20); // Garantir que seja string
        doc.setFont('helvetica', 'normal');
    });
    
    // Availability percentage - CORREÇÃO: Converter para string
    const availabilityPercentage = totalHours > 0 ? ((freeHours / totalHours) * 100).toFixed(1) : 0;
    doc.setFontSize(9);
    doc.setTextColor(...colors.freeTime);
    doc.setFont('helvetica', 'bold');
    doc.text(`${availabilityPercentage.toString()}% Available`, statsX + statsWidth - 10, statsY + 14, { align: 'right' });
}

// Also update the CSS for better print support in the existing style.css

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// Make scheduleData accessible globally for debugging
window.scheduleData = scheduleData;
window.app = {
    renderSchedule,
    calculateStatistics,
    exportToPDF,
    saveToJsonFile
};