// Initialize Fabric.js canvas
const canvas = new fabric.Canvas('schemaCanvas', {
    width: 1000,
    height: 700,
    backgroundColor: '#ffffff',
    selection: true
});

// Undo/Redo state management
let canvasHistory = [];
let historyStep = -1;
const MAX_HISTORY = 50;

function saveState() {
    // Remove any states after current step (when making changes after undo)
    if (historyStep < canvasHistory.length - 1) {
        canvasHistory = canvasHistory.slice(0, historyStep + 1);
    }
    
    // Save current state
    const json = JSON.stringify(canvas.toJSON(['symbolType']));
    canvasHistory.push(json);
    historyStep++;
    
    // Limit history size
    if (canvasHistory.length > MAX_HISTORY) {
        canvasHistory.shift();
        historyStep--;
    }
    
    updateUndoRedoButtons();
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        const state = canvasHistory[historyStep];
        canvas.loadFromJSON(state, () => {
            canvas.renderAll();
            updateUndoRedoButtons();
        });
    }
}

function redo() {
    if (historyStep < canvasHistory.length - 1) {
        historyStep++;
        const state = canvasHistory[historyStep];
        canvas.loadFromJSON(state, () => {
            canvas.renderAll();
            updateUndoRedoButtons();
        });
    }
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    undoBtn.disabled = historyStep <= 0;
    redoBtn.disabled = historyStep >= canvasHistory.length - 1;
}

// Save initial state
setTimeout(() => saveState(), 100);

// Track canvas changes
canvas.on('object:added', () => saveState());
canvas.on('object:modified', () => saveState());
canvas.on('object:removed', () => saveState());

// Undo/Redo button handlers
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

// Canvas resize functionality
const canvasWrapper = document.querySelector('.canvas-wrapper');
const resizeHandleRight = document.querySelector('.resize-handle-right');
const resizeHandleBottom = document.querySelector('.resize-handle-bottom');
const resizeHandleCorner = document.querySelector('.resize-handle-corner');

let isResizing = false;
let resizeDirection = '';
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;

function startResize(e, direction) {
    isResizing = true;
    resizeDirection = direction;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = canvas.width;
    startHeight = canvas.height;
    e.preventDefault();
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
}

function handleResize(e) {
    if (!isResizing) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    
    if (resizeDirection === 'right' || resizeDirection === 'corner') {
        newWidth = Math.max(400, startWidth + deltaX);
        newWidth = snapToGrid(newWidth); // Snap to grid
    }
    
    if (resizeDirection === 'bottom' || resizeDirection === 'corner') {
        newHeight = Math.max(300, startHeight + deltaY);
        newHeight = snapToGrid(newHeight); // Snap to grid
    }
    
    canvas.setDimensions({ width: newWidth, height: newHeight });
    canvas.renderAll();
}

function stopResize() {
    if (isResizing) {
        isResizing = false;
        saveState(); // Save state after resize
    }
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

resizeHandleRight.addEventListener('mousedown', (e) => startResize(e, 'right'));
resizeHandleBottom.addEventListener('mousedown', (e) => startResize(e, 'bottom'));
resizeHandleCorner.addEventListener('mousedown', (e) => startResize(e, 'corner'));

// Always snap moved objects to grid
canvas.on('object:modified', (e) => {
    e.target.set({
        left: snapToGrid(e.target.left),
        top: snapToGrid(e.target.top)
    });
    
    // Update connected lines when a symbol is moved
    updateConnectedLines(e.target);
});

// Function to update lines connected to a moved symbol
function updateConnectedLines(movedSymbol) {
    if (!movedSymbol.symbolType && !(movedSymbol.type === 'group' && movedSymbol._objects)) {
        return; // Not a symbol
    }
    
    const symbolId = movedSymbol.id || movedSymbol.cacheKey;
    if (!symbolId) return;
    
    canvas.forEachObject((obj) => {
        if (obj.objectType === 'connectionLine') {
            let needsUpdate = false;
            const coords = [obj.x1, obj.y1, obj.x2, obj.y2];
            
            // Check start connection
            if (obj.startConnection && obj.startConnection.symbolId === symbolId) {
                const newPoint = getSymbolConnectionPoint(movedSymbol, obj.startConnection.connectionType);
                coords[0] = newPoint.x;
                coords[1] = newPoint.y;
                needsUpdate = true;
            }
            
            // Check end connection
            if (obj.endConnection && obj.endConnection.symbolId === symbolId) {
                const newPoint = getSymbolConnectionPoint(movedSymbol, obj.endConnection.connectionType);
                coords[2] = newPoint.x;
                coords[3] = newPoint.y;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                obj.set({
                    x1: coords[0],
                    y1: coords[1],
                    x2: coords[2],
                    y2: coords[3]
                });
                obj.setCoords();
            }
        }
    });
    
    canvas.renderAll();
}

// Helper function to get a specific connection point of a symbol
function getSymbolConnectionPoint(symbol, connectionType) {
    const bounds = symbol.getBoundingRect();
    
    switch (connectionType) {
        case 'center':
            return { x: symbol.left, y: symbol.top };
        case 'top':
            return { x: symbol.left, y: bounds.top };
        case 'bottom':
            return { x: symbol.left, y: bounds.top + bounds.height };
        case 'left':
            return { x: bounds.left, y: symbol.top };
        case 'right':
            return { x: bounds.left + bounds.width, y: symbol.top };
        default:
            return { x: symbol.left, y: symbol.top };
    }
}

// Grid settings
let gridEnabled = false;
const gridSize = 20;

// Snap settings
const snapDistance = 25; // Distance in pixels to snap to symbol centers
let snapEnabled = true; // Whether snapping to symbols is enabled

// Drawing mode state
let drawingMode = null; // null, 'line', or 'text'
let linePoints = [];
let snapIndicator = null; // Visual indicator for snap points
let connectionPointIndicators = []; // Visual indicators for all connection points

// Symbol definitions
const symbolDefinitions = {
    lamp: {
        draw: () => {
            const circle = new fabric.Circle({
                radius: 20,
                stroke: 'black',
                strokeWidth: 2,
                fill: 'transparent',
                originX: 'center',
                originY: 'center',
                left: 0,
                top: 0
            });
            const line1 = new fabric.Line([-14, -14, 14, 14], {
                stroke: 'black', strokeWidth: 2,
                originX: 'center', originY: 'center', left: 0, top: 0
            });
            const line2 = new fabric.Line([-14, 14, 14, -14], {
                stroke: 'black', strokeWidth: 2,
                originX: 'center', originY: 'center', left: 0, top: 0
            });
            const group = new fabric.Group([circle, line1, line2], { originX: 'center', originY: 'center' });
            group.set({ symbolType: 'lamp', hasControls: true });
            return group;
        }
    },
    schakelaar: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Line([-20, 0, 0, 0], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Line([0, 0, 20, -15], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Circle({
                    radius: 2,
                    fill: 'black',
                    left: -2,
                    top: -2
                })
            ]);
            group.set({ symbolType: 'schakelaar', hasControls: true });
            return group;
        }
    },
    stopcontact: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Circle({ radius: 20, stroke: 'black', strokeWidth: 2, fill: 'transparent' }),
                new fabric.Circle({ radius: 3, fill: 'black', left: -8, top: 0, originX: 'center', originY: 'center' }),
                new fabric.Circle({ radius: 3, fill: 'black', left: 8, top: 0, originX: 'center', originY: 'center' })
            ]);
            group.set({ symbolType: 'stopcontact', hasControls: true });
            return group;
        }
    },
    zekering: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Rect({
                    width: 30,
                    height: 15,
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent',
                    left: -15,
                    top: -7.5
                }),
                new fabric.Line([-30, 0, -15, 0], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Line([15, 0, 30, 0], {
                    stroke: 'black',
                    strokeWidth: 2
                })
            ]);
            group.set({ symbolType: 'zekering', hasControls: true });
            return group;
        }
    },
    groep: {
        draw: () => {
            const rect = new fabric.Rect({
                width: 50,
                height: 30,
                stroke: 'black',
                strokeWidth: 2,
                fill: 'transparent',
                left: -25,
                top: -15
            });
            const text = new fabric.Text('G', {
                fontSize: 16,
                fill: 'black',
                left: -5,
                top: -8
            });
            const group = new fabric.Group([rect, text]);
            group.set({ symbolType: 'groep', hasControls: true });
            return group;
        }
    },
    aardlekschakelaar: {
        draw: () => {
            const rect = new fabric.Rect({
                width: 50,
                height: 30,
                stroke: 'black',
                strokeWidth: 2,
                fill: 'transparent',
                left: -25,
                top: -15
            });
            const text = new fabric.Text('ALS', {
                fontSize: 12,
                fill: 'black',
                left: -13,
                top: -6
            });
            const group = new fabric.Group([rect, text]);
            group.set({ symbolType: 'aardlekschakelaar', hasControls: true });
            return group;
        }
    },
    kroonluchter: {
        draw: () => {
            const c1 = new fabric.Circle({ radius:15, stroke:'black', strokeWidth:2, fill:'transparent', originX:'center', originY:'center', left:0, top:0 });
            const c2 = new fabric.Circle({ radius:10, stroke:'black', strokeWidth:2, fill:'transparent', originX:'center', originY:'center', left:0, top:0 });
            const c3 = new fabric.Circle({ radius:5, stroke:'black', strokeWidth:2, fill:'transparent', originX:'center', originY:'center', left:0, top:0 });
            const group = new fabric.Group([c1, c2, c3], { originX:'center', originY:'center' });
            group.set({ symbolType: 'kroonluchter', hasControls: true });
            return group;
        }
    },
    wandlamp: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Circle({
                    radius: 15,
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent'
                }),
                new fabric.Line([15, 0, 25, 0], {
                    stroke: 'black',
                    strokeWidth: 2
                })
            ]);
            group.set({ symbolType: 'wandlamp', hasControls: true });
            return group;
        }
    },
    buitenlamp: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Circle({
                    radius: 15,
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent'
                }),
                new fabric.Line([-11, -11, 11, 11], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Circle({
                    radius: 20,
                    stroke: 'black',
                    strokeWidth: 1,
                    fill: 'transparent'
                })
            ]);
            group.set({ symbolType: 'buitenlamp', hasControls: true });
            return group;
        }
    },
    dubbeleSchakelaar: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Line([-25, -5, -10, -5], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Line([-10, -5, 5, -20], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Line([-25, 5, -10, 5], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Line([-10, 5, 5, -10], {
                    stroke: 'black',
                    strokeWidth: 2
                })
            ]);
            group.set({ symbolType: 'dubbeleSchakelaar', hasControls: true });
            return group;
        }
    },
    wisselschakelaar: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Line([-20, 0, -5, 0], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Line([-5, 0, 10, -15], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Line([10, 10, 20, 10], {
                    stroke: 'black',
                    strokeWidth: 2
                }),
                new fabric.Circle({
                    radius: 2,
                    fill: 'black',
                    left: 8,
                    top: 8
                })
            ]);
            group.set({ symbolType: 'wisselschakelaar', hasControls: true });
            return group;
        }
    },
    dimmer: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Circle({
                    radius: 15,
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent'
                }),
                new fabric.Text('D', {
                    fontSize: 14,
                    fill: 'black',
                    left: -4,
                    top: -7
                })
            ]);
            group.set({ symbolType: 'dimmer', hasControls: true });
            return group;
        }
    },
    deurbel: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Circle({
                    radius: 12,
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent',
                    top: -5
                }),
                new fabric.Path('M -10 7 Q 0 15 10 7', {
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent'
                })
            ]);
            group.set({ symbolType: 'deurbel', hasControls: true });
            return group;
        }
    },
    telefoon: {
        draw: () => {
            const rect = new fabric.Rect({
                width: 30,
                height: 30,
                stroke: 'black',
                strokeWidth: 2,
                fill: 'transparent',
                left: -15,
                top: -15,
                rx: 3,
                ry: 3
            });
            const text = new fabric.Text('T', {
                fontSize: 16,
                fill: 'black',
                left: -5,
                top: -8
            });
            const group = new fabric.Group([rect, text]);
            group.set({ symbolType: 'telefoon', hasControls: true });
            return group;
        }
    },
    kookplaat: {
        draw: () => {
            const rect = new fabric.Rect({
                width: 50,
                height: 30,
                stroke: 'black',
                strokeWidth: 2,
                fill: 'transparent',
                left: -25,
                top: -15
            });
            const text = new fabric.Text('KP', {
                fontSize: 14,
                fill: 'black',
                left: -11,
                top: -7
            });
            const group = new fabric.Group([rect, text]);
            group.set({ symbolType: 'kookplaat', hasControls: true });
            return group;
        }
    },
    oven: {
        draw: () => {
            const rect = new fabric.Rect({
                width: 50,
                height: 30,
                stroke: 'black',
                strokeWidth: 2,
                fill: 'transparent',
                left: -25,
                top: -15
            });
            const text = new fabric.Text('O', {
                fontSize: 16,
                fill: 'black',
                left: -5,
                top: -8
            });
            const group = new fabric.Group([rect, text]);
            group.set({ symbolType: 'oven', hasControls: true });
            return group;
        }
    },
    wasmachine: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Circle({
                    radius: 15,
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent'
                }),
                new fabric.Text('WM', {
                    fontSize: 11,
                    fill: 'black',
                    left: -10,
                    top: -5
                })
            ]);
            group.set({ symbolType: 'wasmachine', hasControls: true });
            return group;
        }
    },
    bus: {
        draw: () => {
            const line = new fabric.Line([0, 0, 100, 0], {
                stroke: 'black',
                strokeWidth: 6,
                selectable: true,
                symbolType: 'bus'
            });
            return line;
        }
    },
    meter: {
        draw: () => {
            const group = new fabric.Group([
                new fabric.Circle({
                    radius: 15,
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent'
                }),
                new fabric.Text('kWh', {
                    fontSize: 10,
                    fill: 'black',
                    left: -10,
                    top: -4
                })
            ]);
            group.set({ symbolType: 'meter', hasControls: true });
            return group;
        }
    }
};

// Dynamic ARAI palette population with categories
const paletteContainer = document.getElementById('symbolPalette');
let allSymbols = [];

fetch('araiSymbols.json')
  .then(res => res.json())
  .then(data => {
    // Store all symbols for search
    Object.keys(data).forEach(category => {
      data[category].forEach(item => {
        allSymbols.push({ ...item, category });
      });
    });
    
    // Render with categories
    renderSymbols(data);
  });

function renderSymbols(categorizedData) {
  paletteContainer.innerHTML = '';
  
  Object.keys(categorizedData).forEach(category => {
    // Create category section
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'symbol-category';
    
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'category-header';
    categoryHeader.textContent = category;
    categoryDiv.appendChild(categoryHeader);
    
    // Add symbols in this category
    categorizedData[category].forEach(item => {
      const div = document.createElement('div');
      div.className = 'symbol-item';
      div.draggable = true;
      div.dataset.symbol = item.display;
      div.dataset.iconUrl = item.path;
      div.innerHTML = `
        <img src="${item.path}" alt="${item.display}" width="40" height="40">
        <span>${item.display}</span>
      `;
      categoryDiv.appendChild(div);
    });
    
    paletteContainer.appendChild(categoryDiv);
  });
}

// Search functionality
document.getElementById('symbolSearch').addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  
  if (!searchTerm) {
    // Re-render with categories if search is empty
    const categorizedData = {};
    allSymbols.forEach(item => {
      if (!categorizedData[item.category]) {
        categorizedData[item.category] = [];
      }
      categorizedData[item.category].push(item);
    });
    renderSymbols(categorizedData);
    return;
  }
  
  // Filter and render flat list
  paletteContainer.innerHTML = '';
  const filtered = allSymbols.filter(item => 
    item.display.toLowerCase().includes(searchTerm) ||
    item.category.toLowerCase().includes(searchTerm)
  );
  
  filtered.forEach(item => {
    const div = document.createElement('div');
    div.className = 'symbol-item';
    div.draggable = true;
    div.dataset.symbol = item.display;
    div.dataset.iconUrl = item.path;
    div.innerHTML = `
      <img src="${item.path}" alt="${item.display}" width="40" height="40">
      <span>${item.display}</span>
    `;
    paletteContainer.appendChild(div);
  });
});

// Delegate drag start for dynamic palette
paletteContainer.addEventListener('dragstart', e => {
  const div = e.target.closest('.symbol-item');
  if (!div) return;
  const symbolType = div.dataset.symbol;
  const iconUrl = div.dataset.iconUrl;
  console.log('Dragstart - symbolType:', symbolType, 'iconUrl:', iconUrl);
  e.dataTransfer.setData('symbolType', symbolType);
  if (iconUrl) {
    e.dataTransfer.setData('iconUrl', iconUrl);
  }
  e.dataTransfer.effectAllowed = 'copy';
  console.log('Drag data set');
});

// Handle drop on canvas for static symbols
const canvasElement = document.getElementById('schemaCanvas');
const canvasContainer = canvasElement.parentElement;

// Bind drag events to BOTH canvas and container
canvasElement.addEventListener('dragover', (e) => {
    console.log('Dragover on canvas element');
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

canvasContainer.addEventListener('dragover', (e) => {
    console.log('Dragover on container');
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
});

canvasContainer.addEventListener('drop', (e) => {
    console.log('Drop event triggered on CONTAINER');
    e.preventDefault();
    e.stopPropagation();
    const symbolType = e.dataTransfer.getData('symbolType');
    const iconUrl = e.dataTransfer.getData('iconUrl');
    console.log('Drop data - symbolType:', symbolType, 'iconUrl:', iconUrl);
    
    const rect = canvasElement.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);
    console.log('Drop position:', x, y);
    
    if (iconUrl) {
        console.log('Loading SVG from:', iconUrl);
        // load dropped SVG/PNG icon
        fabric.loadSVGFromURL(iconUrl, (objects, options) => {
            console.log('SVG loaded, objects:', objects.length);
            const obj = fabric.util.groupSVGElements(objects, options);
            obj.set({ 
                left: x, 
                top: y, 
                originX: 'center', 
                originY: 'center', 
                selectable: true,
                symbolType: symbolType,
                id: 'symbol_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            });
            // Scale to reasonable size
            const scale = Math.min(50 / obj.width, 50 / obj.height);
            obj.scale(scale);
            canvas.add(obj);
            canvas.setActiveObject(obj);
            canvas.renderAll();
            console.log('Symbol added to canvas');
        }, null, { crossOrigin: 'anonymous' });
    } else if (symbolType && symbolDefinitions[symbolType]) {
        console.log('Using symbolDefinitions fallback');
        // fallback to code-defined symbol
        const symbol = symbolDefinitions[symbolType].draw();
        symbol.set({ 
            left: x, 
            top: y, 
            originX: 'center', 
            originY: 'center',
            id: 'symbol_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });
        canvas.add(symbol);
        canvas.setActiveObject(symbol);
        canvas.renderAll();
    }
});

canvasElement.addEventListener('drop', (e) => {
    console.log('Drop event triggered');
    e.preventDefault();
    e.stopPropagation();
    const symbolType = e.dataTransfer.getData('symbolType');
    const iconUrl = e.dataTransfer.getData('iconUrl');
    console.log('Drop data - symbolType:', symbolType, 'iconUrl:', iconUrl);
    
    const rect = canvasElement.getBoundingClientRect();
    const x = snapToGrid(e.clientX - rect.left);
    const y = snapToGrid(e.clientY - rect.top);
    console.log('Drop position:', x, y);
    
    if (iconUrl) {
        console.log('Loading SVG from:', iconUrl);
        // load dropped SVG/PNG icon
        fabric.loadSVGFromURL(iconUrl, (objects, options) => {
            console.log('SVG loaded, objects:', objects.length);
            const obj = fabric.util.groupSVGElements(objects, options);
            obj.set({ 
                left: x, 
                top: y, 
                originX: 'center', 
                originY: 'center', 
                selectable: true,
                symbolType: symbolType,
                id: 'symbol_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
            });
            // Scale to reasonable size
            const scale = Math.min(50 / obj.width, 50 / obj.height);
            obj.scale(scale);
            canvas.add(obj);
            canvas.setActiveObject(obj);
            canvas.renderAll();
            console.log('Symbol added to canvas');
        }, null, { crossOrigin: 'anonymous' });
    } else if (symbolType && symbolDefinitions[symbolType]) {
        console.log('Using symbolDefinitions fallback');
        // fallback to code-defined symbol
        const symbol = symbolDefinitions[symbolType].draw();
        symbol.set({ 
            left: x, 
            top: y, 
            originX: 'center', 
            originY: 'center',
            id: 'symbol_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });
        canvas.add(symbol);
        canvas.setActiveObject(symbol);
        canvas.renderAll();
    }
});

// Clear canvas
document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Weet je zeker dat je het schema wilt wissen?')) {
        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();
    }
});

// Export to JSON
document.getElementById('exportJsonBtn').addEventListener('click', () => {
    const json = JSON.stringify(canvas.toJSON(['symbolType']));
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eendraadsschema_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// Import from JSON
document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('jsonFileInput').click();
});

document.getElementById('jsonFileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target.result;
                canvas.loadFromJSON(json, () => {
                    canvas.renderAll();
                    console.log('Schema geladen!');
                });
            } catch (error) {
                alert('Fout bij het laden van het bestand: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    e.target.value = ''; // Reset input
});

// Export to PNG
document.getElementById('exportPngBtn').addEventListener('click', () => {
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // Higher resolution
    });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `eendraadsschema_${Date.now()}.png`;
    a.click();
});

// Export to PDF
document.getElementById('exportPdfBtn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
    });
    
    pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`eendraadsschema_${Date.now()}.pdf`);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Undo (Ctrl+Z or Cmd+Z)
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
    }
    
    // Redo (Ctrl+Y or Cmd+Shift+Z)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
    }
    
    // Delete selected object
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length) {
            activeObjects.forEach(obj => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.renderAll();
        }
    }
    
    // Copy (Ctrl+C or Cmd+C)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone((cloned) => {
                window._clipboard = cloned;
            });
        }
    }
    
    // Paste (Ctrl+V or Cmd+V)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (window._clipboard) {
            window._clipboard.clone((clonedObj) => {
                canvas.discardActiveObject();
                clonedObj.set({
                    left: clonedObj.left + 10,
                    top: clonedObj.top + 10,
                    evented: true,
                });
                if (clonedObj.type === 'activeSelection') {
                    clonedObj.canvas = canvas;
                    clonedObj.forEachObject((obj) => {
                        canvas.add(obj);
                    });
                    clonedObj.setCoords();
                } else {
                    canvas.add(clonedObj);
                }
                window._clipboard.top += 10;
                window._clipboard.left += 10;
                canvas.setActiveObject(clonedObj);
                canvas.requestRenderAll();
            });
        }
    }
});

// Helper function to snap to grid
function snapToGrid(value) {
    return Math.round(value / gridSize) * gridSize;
}

// Helper function to find nearby symbol connection points for snapping
function findNearbySymbolCenter(x, y, customSnapDistance = snapDistance) {
    let closestCenter = null;
    let minDistance = customSnapDistance;
    
    canvas.forEachObject((obj) => {
        // Check if object is a symbol (has symbolType or is an SVG group)
        if (obj.symbolType || (obj.type === 'group' && obj._objects)) {
            // Get the bounding box of the symbol
            const bounds = obj.getBoundingRect();
            
            // Calculate connection points: center, top, bottom, left, right
            const connectionPoints = [
                { x: obj.left, y: obj.top, type: 'center' }, // Center
                { x: obj.left, y: bounds.top, type: 'top' }, // Top center
                { x: obj.left, y: bounds.top + bounds.height, type: 'bottom' }, // Bottom center
                { x: bounds.left, y: obj.top, type: 'left' }, // Left center
                { x: bounds.left + bounds.width, y: obj.top, type: 'right' } // Right center
            ];
            
            // Check each connection point
            connectionPoints.forEach(point => {
                const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestCenter = { x: point.x, y: point.y, symbolId: obj.id || obj.cacheKey, type: point.type };
                }
            });
        }
    });
    
    return closestCenter;
}

// Enhanced snapping function that considers both grid and symbol centers
function snapToGridOrSymbol(x, y) {
    // First check for nearby symbol centers (only if snapping is enabled)
    if (snapEnabled) {
        const symbolCenter = findNearbySymbolCenter(x, y);
        if (symbolCenter) {
            return symbolCenter;
        }
    }
    
    // Fall back to grid snapping if enabled
    if (gridEnabled) {
        return { x: snapToGrid(x), y: snapToGrid(y) };
    }
    
    // No snapping
    return { x, y };
}

// Function to show all connection points when in line drawing mode
function showAllConnectionPoints() {
    hideAllConnectionPoints(); // Clear existing indicators
    
    canvas.forEachObject((obj) => {
        if (obj.symbolType || (obj.type === 'group' && obj._objects)) {
            const bounds = obj.getBoundingRect();
            const connectionPoints = [
                { x: obj.left, y: obj.top, type: 'center' },
                { x: obj.left, y: bounds.top, type: 'top' },
                { x: obj.left, y: bounds.top + bounds.height, type: 'bottom' },
                { x: bounds.left, y: obj.top, type: 'left' },
                { x: bounds.left + bounds.width, y: obj.top, type: 'right' }
            ];
            
            connectionPoints.forEach(point => {
                const indicator = new fabric.Circle({
                    left: point.x,
                    top: point.y,
                    radius: 3,
                    fill: 'rgba(0, 100, 255, 0.6)',
                    stroke: 'blue',
                    strokeWidth: 1,
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    evented: false,
                    excludeFromExport: true
                });
                connectionPointIndicators.push(indicator);
                canvas.add(indicator);
            });
        }
    });
    canvas.renderAll();
}

// Function to hide all connection point indicators
function hideAllConnectionPoints() {
    connectionPointIndicators.forEach(indicator => {
        canvas.remove(indicator);
    });
    connectionPointIndicators = [];
}

// Draw grid on canvas
function drawGrid() {
    const gridLines = [];
    
    // Vertical lines
    for (let i = 0; i < canvas.width / gridSize; i++) {
        const line = new fabric.Line([i * gridSize, 0, i * gridSize, canvas.height], {
            stroke: '#ddd',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        gridLines.push(line);
    }
    
    // Horizontal lines
    for (let i = 0; i < canvas.height / gridSize; i++) {
        const line = new fabric.Line([0, i * gridSize, canvas.width, i * gridSize], {
            stroke: '#ddd',
            strokeWidth: 1,
            selectable: false,
            evented: false,
            excludeFromExport: true
        });
        gridLines.push(line);
    }
    
    return gridLines;
}

// Toggle grid
let gridLines = [];
document.getElementById('toggleGridBtn').addEventListener('click', () => {
    const btn = document.getElementById('toggleGridBtn');
    gridEnabled = !gridEnabled;
    
    if (gridEnabled) {
        gridLines = drawGrid();
        gridLines.forEach(line => canvas.add(line));
        canvas.sendToBack(...gridLines);
        btn.classList.add('active');
        
        // Enable snapping
        canvas.on('object:moving', (e) => {
            if (gridEnabled) {
                e.target.set({
                    left: snapToGrid(e.target.left),
                    top: snapToGrid(e.target.top)
                });
            }
        });
    } else {
        gridLines.forEach(line => canvas.remove(line));
        gridLines = [];
        btn.classList.remove('active');
    }
    
    canvas.renderAll();
});

// Toggle snap to symbols
document.getElementById('toggleSnapBtn').addEventListener('click', () => {
    const btn = document.getElementById('toggleSnapBtn');
    snapEnabled = !snapEnabled;
    
    if (snapEnabled) {
        btn.classList.add('active');
        // Show connection points if in line drawing mode
        if (drawingMode === 'line') {
            showAllConnectionPoints();
        }
    } else {
        btn.classList.remove('active');
        
        // Remove snap indicator and connection points if snapping is disabled
        if (snapIndicator) {
            canvas.remove(snapIndicator);
            snapIndicator = null;
        }
        hideAllConnectionPoints();
        canvas.renderAll();
    }
});

// Line drawing mode
document.getElementById('drawLineBtn').addEventListener('click', () => {
    const btn = document.getElementById('drawLineBtn');
    
    if (drawingMode === 'line') {
        // Cancel line drawing
        drawingMode = null;
        linePoints = [];
        btn.classList.remove('active');
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.selection = true;
        canvas.forEachObject(obj => obj.selectable = true);
        
        // Remove snap indicator and connection points
        if (snapIndicator) {
            canvas.remove(snapIndicator);
            snapIndicator = null;
        }
        hideAllConnectionPoints();
    } else {
        // Start line drawing
        drawingMode = 'line';
        linePoints = [];
        btn.classList.add('active');
        document.getElementById('addTextBtn').classList.remove('active');
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.forEachObject(obj => obj.selectable = false);
        
        // Show all connection points when starting line drawing
        if (snapEnabled) {
            showAllConnectionPoints();
        }
    }
    
    canvas.renderAll();
});

// Canvas click handler for line drawing
canvas.on('mouse:down', (options) => {
    if (drawingMode === 'line') {
        const pointer = canvas.getPointer(options.e);
        const snappedPoint = snapToGridOrSymbol(pointer.x, pointer.y);
        
        linePoints.push(snappedPoint);
        
        if (linePoints.length === 2) {
            // Create the line with connection information
            const line = new fabric.Line([
                linePoints[0].x, linePoints[0].y,
                linePoints[1].x, linePoints[1].y
            ], {
                stroke: 'black',
                strokeWidth: 2,
                selectable: true,
                objectType: 'connectionLine',
                // Store connection information for following symbols
                startConnection: linePoints[0].symbolId ? {
                    symbolId: linePoints[0].symbolId,
                    connectionType: linePoints[0].type
                } : null,
                endConnection: linePoints[1].symbolId ? {
                    symbolId: linePoints[1].symbolId,
                    connectionType: linePoints[1].type
                } : null
            });
            
            canvas.add(line);
            canvas.renderAll();
            
            // Reset for next line
            linePoints = [];
        }
    }
});

// Mouse move handler for visual snap feedback
canvas.on('mouse:move', (options) => {
    if (drawingMode === 'line') {
        const pointer = canvas.getPointer(options.e);
        
        // Remove existing snap indicator
        if (snapIndicator) {
            canvas.remove(snapIndicator);
            snapIndicator = null;
        }
        
        // Show snap indicator if snapping is enabled and near a symbol center
        if (snapEnabled) {
            const symbolCenter = findNearbySymbolCenter(pointer.x, pointer.y);
            if (symbolCenter) {
                snapIndicator = new fabric.Circle({
                    left: symbolCenter.x,
                    top: symbolCenter.y,
                    radius: 8,
                    fill: 'rgba(255, 0, 0, 0.3)',
                    stroke: 'red',
                    strokeWidth: 2,
                    originX: 'center',
                    originY: 'center',
                    selectable: false,
                    evented: false,
                    excludeFromExport: true
                });
                canvas.add(snapIndicator);
                canvas.renderAll();
            }
        }
    }
});

// Add text mode
document.getElementById('addTextBtn').addEventListener('click', () => {
    const btn = document.getElementById('addTextBtn');
    
    if (drawingMode === 'text') {
        // Cancel text mode
        drawingMode = null;
        btn.classList.remove('active');
        canvas.defaultCursor = 'default';
        canvas.hoverCursor = 'move';
        canvas.selection = true;
        canvas.forEachObject(obj => obj.selectable = true);
    } else {
        // Start text mode
        drawingMode = 'text';
        btn.classList.add('active');
        document.getElementById('drawLineBtn').classList.remove('active');
        canvas.defaultCursor = 'text';
        canvas.hoverCursor = 'text';
        canvas.selection = false;
        canvas.discardActiveObject();
        
        // Remove snap indicator and connection points when switching modes
        if (snapIndicator) {
            canvas.remove(snapIndicator);
            snapIndicator = null;
        }
        hideAllConnectionPoints();
    }
    
    canvas.renderAll();
});

// Canvas click handler for text adding
canvas.on('mouse:down', (options) => {
    if (drawingMode === 'text' && !options.target) {
        const pointer = canvas.getPointer(options.e);
        const x = gridEnabled ? snapToGrid(pointer.x) : pointer.x;
        const y = gridEnabled ? snapToGrid(pointer.y) : pointer.y;
        
        const text = prompt('Voer tekst in:', 'Label');
        
        if (text) {
            const textObj = new fabric.IText(text, {
                left: x,
                top: y,
                fontSize: 16,
                fill: 'black',
                fontFamily: 'Arial',
                objectType: 'label'
            });
            
            canvas.add(textObj);
            canvas.setActiveObject(textObj);
            canvas.renderAll();
        }
    }
});

// Enhanced export to exclude grid lines and snap indicators
const originalExportPng = document.getElementById('exportPngBtn').onclick;
document.getElementById('exportPngBtn').onclick = () => {
    // Temporarily hide grid, snap indicator, and connection points
    const tempGridEnabled = gridEnabled;
    if (gridEnabled) {
        gridLines.forEach(line => line.set({ opacity: 0 }));
    }
    if (snapIndicator) {
        snapIndicator.set({ opacity: 0 });
    }
    connectionPointIndicators.forEach(indicator => {
        indicator.set({ opacity: 0 });
    });
    canvas.renderAll();
    
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
    });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = `eendraadsschema_${Date.now()}.png`;
    a.click();
    
    // Restore grid, snap indicator, and connection points
    if (tempGridEnabled) {
        gridLines.forEach(line => line.set({ opacity: 1 }));
    }
    if (snapIndicator) {
        snapIndicator.set({ opacity: 1 });
    }
    connectionPointIndicators.forEach(indicator => {
        indicator.set({ opacity: 1 });
    });
    canvas.renderAll();
};

const originalExportPdf = document.getElementById('exportPdfBtn').onclick;
document.getElementById('exportPdfBtn').onclick = () => {
    // Temporarily hide grid, snap indicator, and connection points
    const tempGridEnabled = gridEnabled;
    if (gridEnabled) {
        gridLines.forEach(line => line.set({ opacity: 0 }));
    }
    if (snapIndicator) {
        snapIndicator.set({ opacity: 0 });
    }
    connectionPointIndicators.forEach(indicator => {
        indicator.set({ opacity: 0 });
    });
    canvas.renderAll();
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
    });
    
    pdf.addImage(dataURL, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`eendraadsschema_${Date.now()}.pdf`);
    
    // Restore grid, snap indicator, and connection points
    if (tempGridEnabled) {
        gridLines.forEach(line => line.set({ opacity: 1 }));
    }
    if (snapIndicator) {
        snapIndicator.set({ opacity: 1 });
    }
    connectionPointIndicators.forEach(indicator => {
        indicator.set({ opacity: 1 });
    });
    canvas.renderAll();
};

console.log('Eendraadsschema Editor geladen! Sleep symbolen naar het canvas om te beginnen.');
