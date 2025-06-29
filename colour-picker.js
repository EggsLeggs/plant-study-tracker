// Colour picker variables
let colourPickerActivityIndex = null;
let selectedColour = null;

const colours = {
  "sleep": "#6a8caf",
  "study": "#d8c8f8",
  "noodle": "#c8d8f8"
};
const otherColours = ['#a8d8a8', '#f8c8c8', '#f8e8c8'];
let colourMap = {};
let colourIndex = 0;

// Load custom colours from localStorage
let customColours = JSON.parse(localStorage.getItem('customColours')) || [];

function assignColour(name) {
  const key = name.toLowerCase();
  if (colours[key]) return colours[key];
  if (!colourMap[key]) {
    colourMap[key] = otherColours[colourIndex % otherColours.length];
    colourIndex++;
  }
  return colourMap[key];
}

// Colour picker functions
function getAllAvailableColours() {
  const defaultColours = Object.values(colours);
  const usedColours = Object.values(colourMap);
  const allColours = [...defaultColours, ...otherColours, ...customColours, ...usedColours];
  
  // Remove duplicates and limit to 8 colours
  const uniqueColours = [...new Set(allColours)];
  return uniqueColours.slice(0, 8);
}

function saveCustomColours() {
  localStorage.setItem('customColours', JSON.stringify(customColours));
}

function openColourPicker(activityIndex) {
  colourPickerActivityIndex = activityIndex;
  selectedColour = activities[activityIndex].colour;
  
  const modal = document.getElementById('colourPickerModal');
  const colourGrid = document.getElementById('colourGrid');
  const customInput = document.getElementById('customColourInput');
  
  // Clear existing colours and custom input
  colourGrid.innerHTML = '';
  customInput.value = '';
  
  // Get all available colours (limited to 8)
  const availableColours = getAllAvailableColours();
  
  // Create colour options
  availableColours.forEach(colour => {
    const colourOption = document.createElement('div');
    colourOption.className = 'colour-option';
    colourOption.style.backgroundColor = colour;
    colourOption.title = colour;
    
    if (colour === selectedColour) {
      colourOption.classList.add('selected');
    }
    
    colourOption.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.colour-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // Add selected class to clicked option
      colourOption.classList.add('selected');
      selectedColour = colour;
    });
    
    colourGrid.appendChild(colourOption);
  });
  
  modal.style.display = 'flex';
}

function closeColourPicker() {
  const modal = document.getElementById('colourPickerModal');
  modal.style.display = 'none';
  colourPickerActivityIndex = null;
  selectedColour = null;
}

function applyColourChange() {
  if (colourPickerActivityIndex !== null && selectedColour) {
    activities[colourPickerActivityIndex].colour = selectedColour;
    saveAndRefresh();
  }
  closeColourPicker();
}

function isValidHexColour(hex) {
  // Check if it's a valid hex colour (with or without #)
  const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(hex);
}

function addCustomColour() {
  const input = document.getElementById('customColourInput');
  let hexColour = input.value.trim();
  
  // Add # if not present
  if (hexColour && !hexColour.startsWith('#')) {
    hexColour = '#' + hexColour;
  }
  
  // Validate hex colour
  if (!isValidHexColour(hexColour)) {
    alert('Please enter a valid hex colour (e.g., #ff0000 or #f00)');
    return;
  }
  
  // Convert 3-digit hex to 6-digit
  if (hexColour.length === 4) {
    hexColour = '#' + hexColour[1] + hexColour[1] + hexColour[2] + hexColour[2] + hexColour[3] + hexColour[3];
  }
  
  const normalizedColour = hexColour.toLowerCase();
  
  // Check if this colour already exists in the grid
  const colourGrid = document.getElementById('colourGrid');
  const existingOptions = Array.from(colourGrid.children);
  const existingOption = existingOptions.find(option => {
    const optionColour = option.style.backgroundColor;
    // Convert RGB to hex for comparison if needed
    if (optionColour.startsWith('rgb')) {
      const rgb = optionColour.match(/\d+/g);
      const hexFromRgb = '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
      return hexFromRgb === normalizedColour;
    }
    return optionColour.toLowerCase() === normalizedColour;
  });
  
  // If colour already exists, just select it
  if (existingOption) {
    document.querySelectorAll('.colour-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    existingOption.classList.add('selected');
    selectedColour = normalizedColour;
    input.value = '';
    return;
  }
  
  // Check if this is a new custom colour that should be saved
  const predefinedColours = [...Object.values(colours), ...otherColours, ...Object.values(colourMap)];
  const isNewCustomColour = !predefinedColours.includes(normalizedColour) && !customColours.includes(normalizedColour);
  
  if (isNewCustomColour) {
    customColours.push(normalizedColour);
    saveCustomColours();
  }
  
  // Select this colour
  selectedColour = normalizedColour;
  
  // Remove selected class from all existing options
  document.querySelectorAll('.colour-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  
  // Create a new colour option for the custom colour
  const customColourOption = document.createElement('div');
  customColourOption.className = 'colour-option selected';
  customColourOption.style.backgroundColor = selectedColour;
  customColourOption.title = `Custom: ${selectedColour}`;
  
  customColourOption.addEventListener('click', () => {
    document.querySelectorAll('.colour-option').forEach(opt => {
      opt.classList.remove('selected');
    });
    customColourOption.classList.add('selected');
    selectedColour = normalizedColour;
  });
  
  // Add to grid (replace first custom colour if we're at limit)
  if (colourGrid.children.length >= 8) {
    // Find the first colour that's not in predefined colours
    const predefinedColours = [...Object.values(colours), ...otherColours];
    const customColourIndex = Array.from(colourGrid.children).findIndex(option => {
      const optionColour = option.style.backgroundColor;
      let hexColour = optionColour;
      
      // Convert RGB to hex for comparison if needed
      if (optionColour.startsWith('rgb')) {
        const rgb = optionColour.match(/\d+/g);
        hexColour = '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
      }
      
      return !predefinedColours.includes(hexColour.toLowerCase());
    });
    
    // If we found a custom colour, replace it; otherwise replace the last one
    const indexToReplace = customColourIndex !== -1 ? customColourIndex : colourGrid.children.length - 1;
    
    // If we're replacing a custom colour, remove it from the customColours array
    if (customColourIndex !== -1) {
      const replacedOption = colourGrid.children[customColourIndex];
      const replacedColour = replacedOption.style.backgroundColor;
      let replacedHex = replacedColour;
      
      if (replacedColour.startsWith('rgb')) {
        const rgb = replacedColour.match(/\d+/g);
        replacedHex = '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
      }
      
      const colourIndex = customColours.indexOf(replacedHex.toLowerCase());
      if (colourIndex > -1) {
        customColours.splice(colourIndex, 1);
        saveCustomColours();
      }
    }
    
    colourGrid.removeChild(colourGrid.children[indexToReplace]);
  }
  colourGrid.appendChild(customColourOption);
  
  // Clear input
  input.value = '';
}

// Colour picker event listeners
function initializeColourPicker() {
  // Close colour picker when clicking outside the modal
  document.getElementById('colourPickerModal').addEventListener('click', (e) => {
    if (e.target.id === 'colourPickerModal') {
      closeColourPicker();
    }
  });

  // Add Enter key support for custom colour input
  document.getElementById('customColourInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCustomColour();
    }
  });
}
