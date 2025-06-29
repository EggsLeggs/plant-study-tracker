const canvas = document.getElementById("dayClock");
const ctx = canvas.getContext("2d");
const radius = canvas.width / 2;
ctx.translate(radius, radius);

let activities = JSON.parse(localStorage.getItem('dailyActivities')) || [];
let selectedIndex = null;
let segments = [];

let colorPickerActivityIndex = null;
let selectedColor = null;

const colours = {
  "sleep": "#6a8caf",
  "study": "#d8c8f8",
  "noodle": "#c8d8f8"
};
const otherColours = ['#a8d8a8', '#f8c8c8', '#f8e8c8'];
let colourMap = {};
let colourIndex = 0;

function assignColor(name) {
  const key = name.toLowerCase();
  if (colours[key]) return colours[key];
  if (!colourMap[key]) {
    colourMap[key] = otherColours[colourIndex % otherColours.length];
    colourIndex++;
  }
  return colourMap[key];
}

function drawClock() {
  ctx.clearRect(-radius, -radius, canvas.width, canvas.height);
  segments = [];

  // outer ring
  ctx.beginPath();
  ctx.arc(0, 0, radius - 5, 0, 2 * Math.PI);
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#0a485e";
  ctx.stroke();

  // Draw all segments first
  activities.forEach((act, index) => {
    const startAngle = (timeToDecimal(act.start) / 24) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (timeToDecimal(act.end) / 24) * 2 * Math.PI - Math.PI / 2;

    const midAngle = (startAngle + endAngle) / 2;
    const centreX = Math.cos(midAngle) * 10;
    const centreY = Math.sin(midAngle) * 10;

    segments.push({ startAngle, endAngle, index });

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0, 0, radius - 10, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = act.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#e7f1e7";
    ctx.stroke();  // FIXME: this overlaps the centre ever so slightly
  });

  // Redraws the selected activity to ensure border is on top
  if (selectedIndex !== null && activities[selectedIndex]) {
    const act = activities[selectedIndex];
    const startAngle = (timeToDecimal(act.start) / 24) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (timeToDecimal(act.end) / 24) * 2 * Math.PI - Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0, 0, radius - 10, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // hour labels
  ctx.fillStyle = "#0a485e";
  ctx.font = "14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let h = 0; h < 24; h++) {
    const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
    const x = Math.cos(angle) * (radius - 25);
    const y = Math.sin(angle) * (radius - 25);
    ctx.fillText(h.toString().padStart(2, '0'), x, y);
  }

  // hour hand
  const now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  const angle = (hour / 24) * 2 * Math.PI - Math.PI / 2;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(angle) * (radius - 35), Math.sin(angle) * (radius - 35));
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#0a485e";
  ctx.stroke();

  requestAnimationFrame(drawClock);
}

function clockClicker(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - radius;
  const y = e.clientY - rect.top - radius;
  const clickAngle = Math.atan2(y, x);
  const angle = (clickAngle + 2 * Math.PI) % (2 * Math.PI);
  const dist = Math.sqrt(x * x + y * y);

  if (dist > radius - 15 || dist < 0) return;

  selectedIndex = null;
  for (const segment of segments) {
    const start = (segment.startAngle + 2 * Math.PI) % (2 * Math.PI);
    const end = (segment.endAngle + 2 * Math.PI) % (2 * Math.PI);

    if (start < end) {
      if (angle >= start && angle <= end) {
        selectedIndex = segment.index;
        break;
      }
    } else {
      if (angle >= start || angle <= end) {
        selectedIndex = segment.index;
        break;
      }
    }
  }
}

function formatTimeInput(input) { // error handling
  if (!input || typeof input !== 'string') return 0;

  // trims whitespace, validates with a basic regex
  const timeRegex = /^(\d{1,2})(:(\d{1,2}))?$/;
  const match = input.trim().match(timeRegex);

  if (!match) return 0;

  const hours = parseInt(match[1], 10) || 0;
  const minutes = parseInt(match[3], 10) || 0;

  // hour validation shitttt
  if (hours > 24) return 0;
  if (minutes < 0 || minutes >= 60) return 0;

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function addActivity() {
  const name = document.getElementById("activityName").value.trim();
  const start = formatTimeInput(document.getElementById("startTime").value);
  const end = formatTimeInput(document.getElementById("endTime").value);

  if (!name || !start || !end || timeToDecimal(start) >= timeToDecimal(end)) {
    alert("Please enter a valid activity and time range.");
    return;
  }

  const color = assignColor(name);
  activities.push({ name, start, end, color });
  saveAndRefresh();

  document.getElementById('activityName').value = ''; // emptying fields
  document.getElementById('startTime').value = '';
  document.getElementById('endTime').value = '';
}

function editSelected() {
  if (selectedIndex == null) {
    alert("Please select an activity on the clock.");
    return;
  }
  const act = activities[selectedIndex];
  document.getElementById("activityName").value = act.name;
  document.getElementById("startTime").value = act.start;
  document.getElementById("endTime").value = act.end;
  activities.splice(selectedIndex, 1);
  selectedIndex = null;
  saveAndRefresh();
}

function deleteSelected() {
  if (selectedIndex == null) {
    alert("Please select an activity on the clock.");
    return;
  }
  activities.splice(selectedIndex, 1);
  selectedIndex = null;
  saveAndRefresh();
}

function clearSchedule() {
  if (confirm("Are you sure you want to clear the entire schedule?")) {
    activities = [];
    saveAndRefresh();
  }
};


function saveAndRefresh() {
  localStorage.setItem('dailyActivities', JSON.stringify(activities));
  updateSchedule();
}

function updateSchedule() {
  const list = document.getElementById("scheduleList");
  list.innerHTML = "";

  const sortedActivities = activities
    .map((act, originalIndex) => ({ ...act, originalIndex }))
    .sort((a, b) => timeToDecimal(a.start) - timeToDecimal(b.start));

  sortedActivities.forEach((act) => {
    const row = document.createElement("li");
    row.innerHTML = `
      <span class="activity-display" style="display: flex; align-items: center;">
        <span style="display: inline-block; width: 80px;">${act.start} - ${act.end}</span>
        <span class="color-box" style="background-color: ${act.color}" onclick="openColorPicker(${act.originalIndex})" title="Click to change color"></span>
        <span style="flex: 1;">${act.name}</span>
      </span>`;
    list.appendChild(row);
  });
}

function timeToDecimal(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h + m / 60;
}

// Color picker functions
function getAllAvailableColors() {
  const defaultColors = Object.values(colours);
  const usedColors = Object.values(colourMap);
  const allColors = [...defaultColors, ...otherColours, ...usedColors];
  
  // Remove duplicates
  return [...new Set(allColors)];
}

function openColorPicker(activityIndex) {
  colorPickerActivityIndex = activityIndex;
  selectedColor = activities[activityIndex].color;
  
  const modal = document.getElementById('colorPickerModal');
  const colorGrid = document.getElementById('colorGrid');
  
  // Clear existing colors
  colorGrid.innerHTML = '';
  
  // Get all available colors
  const availableColors = getAllAvailableColors();
  
  // Create color options
  availableColors.forEach(color => {
    const colorOption = document.createElement('div');
    colorOption.className = 'color-option';
    colorOption.style.backgroundColor = color;
    
    if (color === selectedColor) {
      colorOption.classList.add('selected');
    }
    
    colorOption.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      colorOption.classList.add('selected');
      selectedColor = color;
    });
    
    colorGrid.appendChild(colorOption);
  });
  
  modal.style.display = 'flex';
}

function closeColorPicker() {
  const modal = document.getElementById('colorPickerModal');
  modal.style.display = 'none';
  colorPickerActivityIndex = null;
  selectedColor = null;
}

function applyColorChange() {
  if (colorPickerActivityIndex !== null && selectedColor) {
    activities[colorPickerActivityIndex].color = selectedColor;
    saveAndRefresh();
  }
  closeColorPicker();
}

canvas.addEventListener("click", clockClicker);

// Close color picker when clicking outside the modal
document.getElementById('colorPickerModal').addEventListener('click', (e) => {
  if (e.target.id === 'colorPickerModal') {
    closeColorPicker();
  }
});

updateSchedule();
drawClock();
