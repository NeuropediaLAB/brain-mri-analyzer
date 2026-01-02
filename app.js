class BrainMRIAnalyzer {
    constructor() {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.image = null;
        this.pcPoints = [];
        this.brainPoints = [];
        this.measureMode = null;
        this.pixelScale = 0.5;
        this.isAutoDetecting = false;
        this.draggedPoint = null;
        this.draggedPointType = null;
        this.isDragging = false;
        this.mouseDownTime = 0;
        this.mouseDownPos = { x: 0, y: 0 };
        
        this.initEventListeners();
    }

    initEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this.loadImage(file);
        });
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.loadImage(file);
        });
        
        document.getElementById('measurePCBtn').addEventListener('click', () => {
            this.measureMode = 'pc';
            this.isAutoDetecting = false;
            this.updateModeIndicator();
        });
        
        document.getElementById('measureBrainBtn').addEventListener('click', () => {
            this.measureMode = 'brain';
            this.isAutoDetecting = false;
            this.updateModeIndicator();
        });
        
        document.getElementById('autoPCBtn').addEventListener('click', () => {
            this.autoDetectSkull();
        });
        
        document.getElementById('autoBrainBtn').addEventListener('click', () => {
            this.autoDetectBrain();
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearMarks();
        });
        
        document.getElementById('calculateBtn').addEventListener('click', () => {
            this.calculateResults();
        });
        
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResults();
        });
        
        this.canvas.addEventListener('dblclick', (e) => {
            if (this.measureMode && !this.isAutoDetecting) {
                e.preventDefault();
                this.addPoint(e);
            }
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.startDrag(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            this.doDrag(e);
            this.updateCursor(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.endDrag(e);
        });
        
        this.canvas.addEventListener('mouseleave', (e) => {
            this.endDrag(e);
        });
        
        document.getElementById('pixelScale').addEventListener('change', (e) => {
            this.pixelScale = parseFloat(e.target.value) || 0.5;
        });
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.image = new Image();
            this.image.onload = () => {
                document.getElementById('uploadArea').style.display = 'none';
                document.getElementById('canvasContainer').style.display = 'block';
                this.setupCanvas();
                this.drawImage();
            };
            this.image.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    setupCanvas() {
        setTimeout(() => {
            const parentWidth = this.canvas.parentElement.clientWidth || 800;
            const scale = parentWidth / this.image.width;
            
            this.canvas.width = this.image.width * scale;
            this.canvas.height = this.image.height * scale;
            this.displayScale = scale;
            this.drawImage();
        }, 10);
    }

    drawImage() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar diámetros y mediciones del cráneo
        if (this.pcPoints.length > 2) {
            this.drawPolygon(this.pcPoints, '#00ff00');
            this.drawDiameters(this.pcPoints, '#ff00ff', '#00ffff', true);
        }
        
        // Dibujar diámetros y mediciones del cerebro
        if (this.brainPoints.length > 2) {
            this.drawPolygon(this.brainPoints, '#ff0000');
            this.drawDiameters(this.brainPoints, '#ff99ff', '#99ffff', false);
        }
        
        this.drawPoints(this.pcPoints, '#00ff00');
        this.drawPoints(this.brainPoints, '#ff0000');
        
        // Dibujar leyenda
        this.drawLegend();
    }

    drawPoints(points, color) {
        points.forEach((point, index) => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 7, 0, 2 * Math.PI);
            this.ctx.fillStyle = color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Número del punto en fondo negro
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(point.x + 9, point.y - 18, 18, 14);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(index + 1, point.x + 11, point.y - 8);
        });
    }

    drawPolygon(points, color) {
        if (points.length < 2) return;
        
        this.ctx.beginPath();
        this.ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        
        this.ctx.closePath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.fillStyle = color + '33';
        this.ctx.fill();
    }
    
    drawDiameters(points, colorTransversal, colorAP, isSkull) {
        if (points.length < 4) return;
        
        // Encontrar puntos extremos
        let maxX = -Infinity, minX = Infinity, maxY = -Infinity, minY = Infinity;
        let maxXPoint = null, minXPoint = null, maxYPoint = null, minYPoint = null;
        
        points.forEach(p => {
            if (p.x > maxX) { maxX = p.x; maxXPoint = p; }
            if (p.x < minX) { minX = p.x; minXPoint = p; }
            if (p.y > maxY) { maxY = p.y; maxYPoint = p; }
            if (p.y < minY) { minY = p.y; minYPoint = p; }
        });
        
        const pixelScale = parseFloat(document.getElementById('pixelScale').value) || 0.5;
        
        // Diámetro transversal (horizontal)
        if (maxXPoint && minXPoint) {
            const transversalPx = Math.sqrt(Math.pow(maxXPoint.x - minXPoint.x, 2) + Math.pow(maxXPoint.y - minXPoint.y, 2));
            const transversalCm = (transversalPx * pixelScale / 10).toFixed(1);
            
            this.ctx.strokeStyle = colorTransversal;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(minXPoint.x, minXPoint.y);
            this.ctx.lineTo(maxXPoint.x, maxXPoint.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Etiqueta
            const midX = (minXPoint.x + maxXPoint.x) / 2;
            const midY = (minXPoint.y + maxXPoint.y) / 2;
            const label = isSkull ? `DT: ${transversalCm} cm` : `${transversalCm} cm`;
            this.drawLabel(midX, midY - 15, label, colorTransversal);
        }
        
        // Diámetro anteroposterior (vertical)
        if (maxYPoint && minYPoint) {
            const apPx = Math.sqrt(Math.pow(maxYPoint.x - minYPoint.x, 2) + Math.pow(maxYPoint.y - minYPoint.y, 2));
            const apCm = (apPx * pixelScale / 10).toFixed(1);
            
            this.ctx.strokeStyle = colorAP;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(minYPoint.x, minYPoint.y);
            this.ctx.lineTo(maxYPoint.x, maxYPoint.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            // Etiqueta
            const midX = (minYPoint.x + maxYPoint.x) / 2;
            const midY = (minYPoint.y + maxYPoint.y) / 2;
            const label = isSkull ? `DAP: ${apCm} cm` : `${apCm} cm`;
            this.drawLabel(midX + 15, midY, label, colorAP);
        }
        
        // Mostrar perímetro/área en esquina superior izquierda
        if (isSkull && points.length >= 3) {
            const perimeter = this.calculatePerimeter(points);
            const perimeterCm = (perimeter * pixelScale / 10).toFixed(1);
            this.drawInfoBox(20, 20, `PC: ${perimeterCm} cm`, '#00ff00');
        }
        
        if (!isSkull && points.length >= 3) {
            const area = this.calculateArea(points);
            const areaCm2 = (area * Math.pow(pixelScale / 10, 2)).toFixed(1);
            this.drawInfoBox(20, 50, `Área: ${areaCm2} cm²`, '#ff0000');
        }
    }
    
    drawLabel(x, y, text, color) {
        this.ctx.save();
        this.ctx.font = 'bold 13px Arial';
        const metrics = this.ctx.measureText(text);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x - 5, y - 17, metrics.width + 10, 22);
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }
    
    drawInfoBox(x, y, text, color) {
        this.ctx.save();
        this.ctx.font = 'bold 16px Arial';
        const metrics = this.ctx.measureText(text);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(x - 5, y - 19, metrics.width + 15, 28);
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, x, y);
        this.ctx.restore();
    }
    
    drawLegend() {
        const x = this.canvas.width - 200;
        const y = 20;
        
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(x, y, 190, 115);
        
        this.ctx.font = 'bold 13px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('Leyenda:', x + 10, y + 22);
        
        this.ctx.font = '11px Arial';
        
        // Cráneo
        this.ctx.fillStyle = '#00ff00';
        this.ctx.fillText('━━ Perímetro Cefálico', x + 10, y + 42);
        
        // Diámetros cráneo
        this.ctx.fillStyle = '#ff00ff';
        this.ctx.fillText('- - - DT (Transversal)', x + 10, y + 59);
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.fillText('- - - DAP (Anteropost.)', x + 10, y + 76);
        
        // Cerebro
        this.ctx.fillStyle = '#ff0000';
        this.ctx.fillText('━━ Área Cerebral', x + 10, y + 96);
        
        this.ctx.restore();
    }

    addPoint(e) {
        if (!this.measureMode) {
            alert('⚠️ Primero seleccione un modo:\n• Manual Cráneo (verde)\n• Manual Cerebro (rojo)');
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.measureMode === 'pc') {
            this.pcPoints.push({ x, y });
            console.log('Punto añadido al cráneo:', { x, y });
        } else if (this.measureMode === 'brain') {
            this.brainPoints.push({ x, y });
            console.log('Punto añadido al cerebro:', { x, y });
        }
        
        this.drawImage();
    }

    startDrag(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.mouseDownTime = Date.now();
        this.mouseDownPos = { x, y };
        
        const hitRadius = 10;
        
        for (let i = 0; i < this.pcPoints.length; i++) {
            const p = this.pcPoints[i];
            const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
            if (dist <= hitRadius) {
                this.draggedPoint = i;
                this.draggedPointType = 'pc';
                this.isDragging = true;
                this.canvas.style.cursor = 'grabbing';
                e.preventDefault();
                console.log('Arrastrando punto cráneo:', i);
                return;
            }
        }
        
        for (let i = 0; i < this.brainPoints.length; i++) {
            const p = this.brainPoints[i];
            const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
            if (dist <= hitRadius) {
                this.draggedPoint = i;
                this.draggedPointType = 'brain';
                this.isDragging = true;
                this.canvas.style.cursor = 'grabbing';
                e.preventDefault();
                console.log('Arrastrando punto cerebro:', i);
                return;
            }
        }
        
        this.draggedPoint = null;
        this.draggedPointType = null;
        this.isDragging = false;
    }

    doDrag(e) {
        if (!this.isDragging || this.draggedPoint === null) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.draggedPointType === 'pc') {
            this.pcPoints[this.draggedPoint] = { x, y };
        } else if (this.draggedPointType === 'brain') {
            this.brainPoints[this.draggedPoint] = { x, y };
        }
        
        this.drawImage();
    }

    endDrag(e) {
        this.isDragging = false;
        this.draggedPoint = null;
        this.draggedPointType = null;
        this.updateCursor(e);
    }

    updateCursor(e) {
        if (this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const hitRadius = 10;
        let overPoint = false;
        
        for (let i = 0; i < this.pcPoints.length; i++) {
            const p = this.pcPoints[i];
            const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
            if (dist <= hitRadius) {
                overPoint = true;
                break;
            }
        }
        
        if (!overPoint) {
            for (let i = 0; i < this.brainPoints.length; i++) {
                const p = this.brainPoints[i];
                const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
                if (dist <= hitRadius) {
                    overPoint = true;
                    break;
                }
            }
        }
        
        this.canvas.style.cursor = overPoint ? 'grab' : 'crosshair';
    }

    clearMarks() {
        if (this.measureMode === 'pc') {
            this.pcPoints = [];
        } else if (this.measureMode === 'brain') {
            this.brainPoints = [];
        } else {
            this.pcPoints = [];
            this.brainPoints = [];
        }
        this.drawImage();
    }

    updateModeIndicator() {
        const modes = {
            'pc': 'Modo: Perímetro Cefálico (verde)',
            'brain': 'Modo: Área Cerebral (rojo)'
        };
        
        if (this.measureMode) {
            alert(modes[this.measureMode]);
        }
    }

    autoDetectSkull() {
        if (!this.image) {
            alert('Por favor cargue una imagen primero');
            return;
        }

        this.isAutoDetecting = true;
        this.measureMode = 'pc';
        
        // Análisis básico de la imagen para dimensionar correctamente
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.image, 0, 0, this.canvas.width, this.canvas.height);
        
        const imageData = tempCtx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Encontrar área brillante (contenido de la imagen)
        let minX = this.canvas.width, maxX = 0;
        let minY = this.canvas.height, maxY = 0;
        let sumX = 0, sumY = 0, count = 0;
        
        // Escaneo rápido para dimensiones
        for (let y = 0; y < this.canvas.height; y += 3) {
            for (let x = 0; x < this.canvas.width; x += 3) {
                const idx = (y * this.canvas.width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                if (brightness > 30) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    sumX += x;
                    sumY += y;
                    count++;
                }
            }
        }
        
        // Centro basado en contenido real de la imagen
        const centerX = count > 100 ? sumX / count : this.canvas.width / 2;
        const centerY = count > 100 ? sumY / count : this.canvas.height / 2;
        
        // Radio: usar el menor de los detectados con margen
        const detectedWidth = maxX - minX;
        const detectedHeight = maxY - minY;
        const radius = Math.min(detectedWidth, detectedHeight) / 2.2;
        
        const numPoints = 72;
        const points = [];
        
        // Generar CIRCUNFERENCIA (no elipse)
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            points.push({ x, y });
        }
        
        this.pcPoints = points;
        this.drawImage();
        
        alert('✅ Circunferencia de referencia creada\n\n📍 AJUSTE MANUAL REQUERIDO:\n• ARRASTRE cada punto al borde del cráneo\n• DOBLE CLICK para agregar puntos adicionales\n• Siga la tabla externa del cráneo\n• Nivel de glándula pineal');
        
        this.isAutoDetecting = false;
    }

    findBrainRegion(data, width, height) {
        let minX = width, maxX = 0, minY = height, maxY = 0;
        let totalX = 0, totalY = 0, count = 0;
        
        // Margen más conservador para no excluir demasiado
        const marginX = width * 0.08;
        const marginY = height * 0.08;
        
        // Buscar región de tejido cerebral (rango de gris más amplio)
        for (let y = marginY; y < height - marginY; y++) {
            for (let x = marginX; x < width - marginX; x++) {
                const idx = (y * width + x) * 4;
                const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                // Rango más amplio para capturar tejido cerebral
                if (brightness > 30 && brightness < 220) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    totalX += x;
                    totalY += y;
                    count++;
                }
            }
        }
        
        // Validación más tolerante
        if (count < 500) {
            return { found: false };
        }
        
        const centerX = totalX / count;
        const centerY = totalY / count;
        const detectedWidth = maxX - minX;
        const detectedHeight = maxY - minY;
        
        return {
            found: true,
            centerX,
            centerY,
            width: detectedWidth,
            height: detectedHeight,
            minX,
            maxX,
            minY,
            maxY
        };
    }

    autoDetectBrain() {
        if (!this.image) {
            alert('Por favor cargue una imagen primero');
            return;
        }
        
        if (this.pcPoints.length < 10) {
            alert('⚠️ Primero debe marcar el perímetro cefálico (cráneo)\nEl cerebro se marca dentro del cráneo.');
            return;
        }

        this.isAutoDetecting = true;
        this.measureMode = 'brain';
        
        // Calcular centro y radio del perímetro cefálico
        let centerX = 0, centerY = 0;
        this.pcPoints.forEach(p => {
            centerX += p.x;
            centerY += p.y;
        });
        centerX /= this.pcPoints.length;
        centerY /= this.pcPoints.length;
        
        // Calcular radio promedio del cráneo
        let avgRadius = 0;
        this.pcPoints.forEach(p => {
            const r = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
            avgRadius += r;
        });
        avgRadius /= this.pcPoints.length;
        
        // Circunferencia cerebral: 75% del radio craneal
        // Espacio para LCR entre cráneo y cerebro
        const brainRadius = avgRadius * 0.75;
        
        const numPoints = 72;
        const points = [];
        
        // Generar CIRCUNFERENCIA cerebral
        for (let i = 0; i < numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const x = centerX + brainRadius * Math.cos(angle);
            const y = centerY + brainRadius * Math.sin(angle);
            points.push({ x, y });
        }
        
        this.brainPoints = points;
        this.drawImage();
        
        alert('✅ Circunferencia cerebral de referencia creada\n\n📍 AJUSTE MANUAL REQUERIDO:\n• ARRASTRE puntos al borde interno del LCR\n• El LCR es brillante (hiperintenso en T2)\n• Siga el contorno del parénquima cerebral\n• Excluya espacios de LCR');
        
        this.isAutoDetecting = false;
    }

    getMaxRadiusInDirection(centerX, centerY, angle) {
        // Encontrar el punto más lejano del perímetro cefálico en esta dirección
        let maxDist = 0;
        
        for (let p of this.pcPoints) {
            const pointAngle = Math.atan2(p.y - centerY, p.x - centerX);
            const angleDiff = Math.abs(pointAngle - angle);
            
            if (angleDiff < 0.2) { // ~11 grados
                const dist = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
                if (dist > maxDist) maxDist = dist;
            }
        }
        
        return maxDist > 0 ? maxDist * 0.95 : 200;
    }

    smoothPoints(points, iterations = 3) {
        let smoothed = [...points];
        
        for (let iter = 0; iter < iterations; iter++) {
            const newPoints = [];
            for (let i = 0; i < smoothed.length; i++) {
                const prev = smoothed[(i - 1 + smoothed.length) % smoothed.length];
                const curr = smoothed[i];
                const next = smoothed[(i + 1) % smoothed.length];
                
                newPoints.push({
                    x: (prev.x + curr.x * 2 + next.x) / 4,
                    y: (prev.y + curr.y * 2 + next.y) / 4
                });
            }
            smoothed = newPoints;
        }
        
        return smoothed;
    }

    calculateOtsuThreshold(data, width, height) {
        const histogram = new Array(256).fill(0);
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = Math.floor((data[i] + data[i + 1] + data[i + 2]) / 3);
            histogram[brightness]++;
        }
        
        const total = width * height;
        let sum = 0;
        for (let i = 0; i < 256; i++) {
            sum += i * histogram[i];
        }
        
        let sumB = 0;
        let wB = 0;
        let wF = 0;
        let maxVar = 0;
        let threshold = 0;
        
        for (let i = 0; i < 256; i++) {
            wB += histogram[i];
            if (wB === 0) continue;
            
            wF = total - wB;
            if (wF === 0) break;
            
            sumB += i * histogram[i];
            const mB = sumB / wB;
            const mF = (sum - sumB) / wF;
            
            const varBetween = wB * wF * (mB - mF) * (mB - mF);
            
            if (varBetween > maxVar) {
                maxVar = varBetween;
                threshold = i;
            }
        }
        
        return threshold;
    }

    getLocalBrightness(data, x, y, width) {
        let sum = 0;
        let count = 0;
        
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const idx = ((y + dy) * width + (x + dx)) * 4;
                if (idx >= 0 && idx < data.length - 2) {
                    sum += (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                    count++;
                }
            }
        }
        
        return count > 0 ? sum / count : 0;
    }

    getGradient(data, x, y, width) {
        const idx = (y * width + x) * 4;
        const idxRight = (y * width + (x + 1)) * 4;
        const idxDown = ((y + 1) * width + x) * 4;
        
        if (idxDown >= data.length - 2 || idxRight >= data.length - 2) return 0;
        
        const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        const right = (data[idxRight] + data[idxRight + 1] + data[idxRight + 2]) / 3;
        const down = (data[idxDown] + data[idxDown + 1] + data[idxDown + 2]) / 3;
        
        const gx = right - center;
        const gy = down - center;
        
        return Math.sqrt(gx * gx + gy * gy);
    }

    filterOutliers(points, centerX, centerY) {
        if (points.length < 10) return points;
        
        const distances = points.map(p => 
            Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
        );
        
        const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;
        const variance = distances.reduce((a, b) => a + Math.pow(b - avgDist, 2), 0) / distances.length;
        const stdDev = Math.sqrt(variance);
        
        return points.filter((p, i) => 
            Math.abs(distances[i] - avgDist) < 2 * stdDev
        );
    }

    calculatePerimeter(points) {
        if (points.length < 3) return 0;
        
        let perimeter = 0;
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            perimeter += distance;
        }
        
        return perimeter * this.pixelScale / 10;
    }

    calculateArea(points) {
        if (points.length < 3) return 0;
        
        let area = 0;
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % points.length];
            area += (p1.x * p2.y - p2.x * p1.y);
        }
        
        area = Math.abs(area) / 2;
        return area * Math.pow(this.pixelScale / 10, 2);
    }

    estimateVolume(area) {
        const sliceThickness = parseFloat(document.getElementById('sliceThickness').value) || 5;
        return area * sliceThickness * 1.2;
    }

    getPercentile(pc, age) {
        const referenceData = {
            0: { p3: 31.5, p50: 34.5, p97: 37.5 },
            1: { p3: 43, p50: 46, p97: 49 },
            3: { p3: 46, p50: 49, p97: 52 },
            5: { p3: 47.5, p50: 50, p97: 52.5 },
            10: { p3: 49, p50: 51.5, p97: 54 },
            18: { p3: 52, p50: 55, p97: 58 }
        };
        
        const ageKeys = Object.keys(referenceData).map(Number).sort((a, b) => a - b);
        let closestAge = ageKeys[0];
        
        for (let i = 0; i < ageKeys.length; i++) {
            if (Math.abs(ageKeys[i] - age) < Math.abs(closestAge - age)) {
                closestAge = ageKeys[i];
            }
        }
        
        const ref = referenceData[closestAge];
        
        if (pc < ref.p3) return '< P3 (Microcefalia)';
        if (pc < ref.p50) return 'P3-P50 (Normal bajo)';
        if (pc <= ref.p97) return 'P50-P97 (Normal)';
        return '> P97 (Macrocefalia)';
    }

    calculateZScore(pc, age, sex = null) {
        // Datos normativos basados en WHO y literatura científica
        const referenceData = {
            male: {
                0: { mean: 34.5, sd: 1.5 },
                0.5: { mean: 42.0, sd: 1.4 },
                1: { mean: 46.1, sd: 1.4 },
                2: { mean: 48.4, sd: 1.3 },
                3: { mean: 49.5, sd: 1.3 },
                5: { mean: 50.4, sd: 1.3 },
                7: { mean: 51.2, sd: 1.3 },
                10: { mean: 52.0, sd: 1.3 },
                15: { mean: 54.5, sd: 1.4 },
                18: { mean: 56.0, sd: 1.5 }
            },
            female: {
                0: { mean: 33.9, sd: 1.3 },
                0.5: { mean: 40.7, sd: 1.3 },
                1: { mean: 44.9, sd: 1.3 },
                2: { mean: 47.2, sd: 1.2 },
                3: { mean: 48.3, sd: 1.2 },
                5: { mean: 49.2, sd: 1.2 },
                7: { mean: 50.0, sd: 1.2 },
                10: { mean: 50.8, sd: 1.2 },
                15: { mean: 53.0, sd: 1.3 },
                18: { mean: 54.5, sd: 1.4 }
            }
        };
        
        // Si no se especifica sexo, usar promedio
        let dataToUse = referenceData.male;
        if (sex === 'female') {
            dataToUse = referenceData.female;
        } else if (!sex) {
            // Promedio de ambos sexos
            dataToUse = {};
            for (let ageKey in referenceData.male) {
                const maleData = referenceData.male[ageKey];
                const femaleData = referenceData.female[ageKey];
                dataToUse[ageKey] = {
                    mean: (maleData.mean + femaleData.mean) / 2,
                    sd: (maleData.sd + femaleData.sd) / 2
                };
            }
        }
        
        const ageKeys = Object.keys(dataToUse).map(Number).sort((a, b) => a - b);
        let closestAge = ageKeys[0];
        let minDiff = Math.abs(age - closestAge);
        
        for (let i = 0; i < ageKeys.length; i++) {
            const diff = Math.abs(ageKeys[i] - age);
            if (diff < minDiff) {
                minDiff = diff;
                closestAge = ageKeys[i];
            }
        }
        
        const ref = dataToUse[closestAge];
        const zScore = (pc - ref.mean) / ref.sd;
        
        let interpretation = '';
        let category = 'normal';
        
        if (zScore < -3) {
            interpretation = 'Microcefalia severa';
            category = 'severe-micro';
        } else if (zScore < -2) {
            interpretation = 'Microcefalia moderada';
            category = 'moderate-micro';
        } else if (zScore < -1.5) {
            interpretation = 'Límite bajo';
            category = 'borderline-low';
        } else if (zScore <= 1.5) {
            interpretation = 'Normal';
            category = 'normal';
        } else if (zScore <= 2) {
            interpretation = 'Límite alto';
            category = 'borderline-high';
        } else if (zScore <= 3) {
            interpretation = 'Macrocefalia moderada';
            category = 'moderate-macro';
        } else {
            interpretation = 'Macrocefalia severa';
            category = 'severe-macro';
        }
        
        return { value: zScore, interpretation, category };
    }

    calculateCircularity(points) {
        // Índice de circularidad: 4π × Área / Perímetro²
        // Valor 1.0 = círculo perfecto, <1.0 = más irregular
        
        if (points.length < 3) return 0;
        
        const area = this.calculateArea(points);
        const perimeter = this.calculatePerimeter(points) * 10; // Convertir a mm
        
        if (perimeter === 0) return 0;
        
        const circularity = (4 * Math.PI * (area * 100)) / (perimeter * perimeter);
        
        return Math.min(circularity, 1.0);
    }

    calculateBrainSkullRatio() {
        // Ratio del área cerebral respecto al área craneal
        if (this.pcPoints.length < 3 || this.brainPoints.length < 3) return 0;
        
        const skullArea = this.calculateArea(this.pcPoints);
        const brainArea = this.calculateArea(this.brainPoints);
        
        if (skullArea === 0) return 0;
        
        return brainArea / skullArea;
    }

    calculateDiameters(points) {
        // Calcula diámetros AP (anteroposterior) y transversal
        if (points.length < 3) return { ap: 0, trans: 0 };
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        points.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });
        
        // Convertir a mm
        const transversal = (maxX - minX) * this.pixelScale;
        const anteroposterior = (maxY - minY) * this.pixelScale;
        
        return { ap: anteroposterior, trans: transversal };
    }

    calculateMeasurementConfidence() {
        // Índice de confianza basado en circularidad y número de puntos
        if (this.pcPoints.length < 10) return 0;
        
        const circularity = this.calculateCircularity(this.pcPoints);
        const pointsScore = Math.min(this.pcPoints.length / 72, 1.0);
        
        // Verificar distribución uniforme de puntos
        let centerX = 0, centerY = 0;
        this.pcPoints.forEach(p => {
            centerX += p.x;
            centerY += p.y;
        });
        centerX /= this.pcPoints.length;
        centerY /= this.pcPoints.length;
        
        // Calcular varianza de ángulos
        const angles = this.pcPoints.map(p => 
            Math.atan2(p.y - centerY, p.x - centerX)
        ).sort((a, b) => a - b);
        
        const expectedGap = (2 * Math.PI) / this.pcPoints.length;
        let angleVariance = 0;
        for (let i = 0; i < angles.length; i++) {
            const gap = i < angles.length - 1 
                ? angles[i + 1] - angles[i]
                : (2 * Math.PI + angles[0]) - angles[angles.length - 1];
            angleVariance += Math.pow(gap - expectedGap, 2);
        }
        angleVariance /= this.pcPoints.length;
        const uniformityScore = Math.max(0, 1 - angleVariance);
        
        // Confianza compuesta
        const confidence = (circularity * 0.5 + pointsScore * 0.2 + uniformityScore * 0.3);
        
        return Math.min(confidence, 1.0);
    }

    exportResults() {
        if (this.pcPoints.length < 3) {
            alert('No hay resultados para exportar. Por favor complete las mediciones.');
            return;
        }
        
        const age = document.getElementById('patientAge').value;
        const sex = document.getElementById('patientSex').value;
        const timestamp = new Date().toISOString();
        
        const pc = this.calculatePerimeter(this.pcPoints);
        const brainArea = this.brainPoints.length >= 3 ? this.calculateArea(this.brainPoints) : 0;
        const brainVolume = brainArea > 0 ? this.estimateVolume(brainArea) : 0;
        const circularity = this.calculateCircularity(this.pcPoints);
        const diameters = this.calculateDiameters(this.pcPoints);
        const confidence = this.calculateMeasurementConfidence();
        
        let zScoreData = null;
        if (age) {
            zScoreData = this.calculateZScore(pc, parseFloat(age), sex || null);
        }
        
        const report = {
            metadata: {
                timestamp: timestamp,
                software: "Brain MRI Analyzer v2.0",
                methodology: "Automated OFC-MRI measurement (PMC8326831 based)"
            },
            patient: {
                age: age || 'No especificada',
                sex: sex || 'No especificado'
            },
            measurements: {
                cranialPerimeter: {
                    value: pc.toFixed(2),
                    unit: 'cm'
                },
                diameters: {
                    anteroposterior: diameters.ap.toFixed(2),
                    transversal: diameters.trans.toFixed(2),
                    unit: 'mm'
                },
                brainArea: {
                    value: brainArea.toFixed(2),
                    unit: 'cm²'
                },
                brainVolume: {
                    value: brainVolume.toFixed(0),
                    unit: 'cm³'
                }
            },
            indices: {
                circularity: circularity.toFixed(3),
                brainSkullRatio: this.brainPoints.length >= 3 
                    ? (this.calculateBrainSkullRatio() * 100).toFixed(1) + '%'
                    : 'N/A',
                measurementConfidence: (confidence * 100).toFixed(1) + '%'
            },
            statistics: zScoreData ? {
                zScore: zScoreData.value.toFixed(2),
                interpretation: zScoreData.interpretation,
                category: zScoreData.category
            } : null,
            qualityControl: {
                numberOfPoints: this.pcPoints.length,
                circularityCheck: circularity > 0.85 ? 'PASS' : 'WARNING',
                confidenceLevel: confidence > 0.75 ? 'HIGH' : confidence > 0.5 ? 'MEDIUM' : 'LOW'
            }
        };
        
        // Crear y descargar archivo JSON
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brain-mri-analysis-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('✅ Resultados exportados correctamente\nFormato: JSON con metodología OFC-MRI');
    }

    getDiagnosis(pc, volume, age) {
        const referenceVolumes = {
            0: { low: 300, normal: 375, high: 450 },
            1: { low: 850, normal: 950, high: 1050 },
            3: { low: 1050, normal: 1150, high: 1250 },
            5: { low: 1150, normal: 1250, high: 1350 },
            10: { low: 1250, normal: 1350, high: 1450 },
            18: { low: 1250, normal: 1350, high: 1500 }
        };
        
        const ageKeys = Object.keys(referenceVolumes).map(Number).sort((a, b) => a - b);
        let closestAge = ageKeys[0];
        
        for (let i = 0; i < ageKeys.length; i++) {
            if (Math.abs(ageKeys[i] - age) < Math.abs(closestAge - age)) {
                closestAge = ageKeys[i];
            }
        }
        
        const volRef = referenceVolumes[closestAge];
        const pcPercentile = this.getPercentile(pc, age);
        
        let craniumStatus = 'normal';
        let brainStatus = 'normal';
        
        if (pcPercentile.includes('< P3')) {
            craniumStatus = 'micro';
        } else if (pcPercentile.includes('> P97')) {
            craniumStatus = 'macro';
        }
        
        if (volume < volRef.low) {
            brainStatus = 'micro';
        } else if (volume > volRef.high) {
            brainStatus = 'macro';
        }
        
        let diagnosis = '';
        let cssClass = 'normal';
        
        if (craniumStatus === 'micro' && brainStatus === 'micro') {
            diagnosis = '🔴 MICROCEFALIA con MICROENCEFALIA<br>Perímetro cefálico reducido con parénquima cerebral disminuido.<br>Sugiere: Trastorno del desarrollo cerebral primario.';
            cssClass = 'micro';
        } else if (craniumStatus === 'micro' && brainStatus === 'normal') {
            diagnosis = '🟡 MICROCEFALIA sin MICROENCEFALIA<br>Perímetro cefálico reducido pero parénquima cerebral normal.<br>Sugiere: Craneosinostosis u otras causas óseas.';
            cssClass = 'micro';
        } else if (craniumStatus === 'macro' && brainStatus === 'macro') {
            diagnosis = '🔴 MACROCEFALIA con MACROENCEFALIA<br>Perímetro cefálico aumentado con parénquima cerebral aumentado.<br>Sugiere: Megalencefalia, condiciones de sobrecrecimiento.';
            cssClass = 'macro';
        } else if (craniumStatus === 'macro' && brainStatus === 'normal') {
            diagnosis = '🟡 MACROCEFALIA sin MACROENCEFALIA<br>Perímetro cefálico aumentado pero parénquima cerebral normal.<br>Sugiere: Hidrocefalia, espacios extraaxiales aumentados.';
            cssClass = 'macro';
        } else {
            diagnosis = '✅ HALLAZGOS NORMALES<br>Perímetro cefálico y volumen encefálico dentro de rangos normales para la edad.';
            cssClass = 'normal';
        }
        
        return { diagnosis, cssClass };
    }

    calculateResults() {
        const age = parseFloat(document.getElementById('patientAge').value);
        const sex = document.getElementById('patientSex').value;
        
        if (!age) {
            alert('Por favor ingrese la edad del paciente');
            return;
        }
        
        if (this.pcPoints.length < 3) {
            alert('Por favor marque al menos 3 puntos en el perímetro cefálico');
            return;
        }
        
        if (this.brainPoints.length < 3) {
            alert('Por favor marque al menos 3 puntos en el área cerebral');
            return;
        }
        
        const pc = this.calculatePerimeter(this.pcPoints);
        const brainArea = this.calculateArea(this.brainPoints);
        const brainVolume = this.estimateVolume(brainArea);
        const percentile = this.getPercentile(pc, age);
        const zScoreData = this.calculateZScore(pc, age, sex || null);
        const circularity = this.calculateCircularity(this.pcPoints);
        const brainSkullRatio = this.calculateBrainSkullRatio();
        const diameters = this.calculateDiameters(this.pcPoints);
        const confidence = this.calculateMeasurementConfidence();
        const diagnosisData = this.getDiagnosis(pc, brainVolume, age);
        
        document.getElementById('pcValue').textContent = pc.toFixed(2) + ' cm';
        document.getElementById('brainAreaValue').textContent = brainArea.toFixed(2) + ' cm²';
        document.getElementById('brainVolumeValue').textContent = brainVolume.toFixed(0) + ' cm³';
        document.getElementById('pcPercentile').textContent = percentile;
        
        let zScoreColor = '#667eea';
        if (zScoreData.category.includes('severe')) zScoreColor = '#e74c3c';
        else if (zScoreData.category.includes('moderate')) zScoreColor = '#e67e22';
        else if (zScoreData.category.includes('borderline')) zScoreColor = '#f39c12';
        
        document.getElementById('pcZScore').innerHTML = 
            `<span style="color: ${zScoreColor}">${zScoreData.value.toFixed(2)}</span> (${zScoreData.interpretation})`;
        
        document.getElementById('circularityIndex').textContent = 
            circularity.toFixed(3) + ' ' + (circularity > 0.85 ? '✓ Buena' : '⚠ Revisar forma');
        
        document.getElementById('brainSkullRatio').textContent = 
            (brainSkullRatio * 100).toFixed(1) + '%' + 
            (brainSkullRatio < 0.5 ? ' ⚠ Bajo' : brainSkullRatio > 0.8 ? ' ⚠ Alto' : ' ✓');
        
        let confidenceColor = '#67e22';
        let confidenceIcon = '✓';
        if (confidence < 0.5) {
            confidenceColor = '#e74c3c';
            confidenceIcon = '⚠';
        } else if (confidence < 0.75) {
            confidenceColor = '#f39c12';
            confidenceIcon = '⚠';
        }
        
        document.getElementById('measurementConfidence').innerHTML = 
            `<span style="color: ${confidenceColor}">${(confidence * 100).toFixed(1)}%</span> ${confidenceIcon}`;
        
        document.getElementById('diameters').textContent = 
            `${diameters.ap.toFixed(1)} × ${diameters.trans.toFixed(1)} mm`;
        
        const diagnosisPanel = document.getElementById('diagnosisPanel');
        diagnosisPanel.innerHTML = '<strong>Diagnóstico Diferencial:</strong><br><br>' + diagnosisData.diagnosis;
        diagnosisPanel.className = 'diagnosis ' + diagnosisData.cssClass;
        
        document.getElementById('resultsPanel').style.display = 'block';
        
        diagnosisPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BrainMRIAnalyzer();
});
