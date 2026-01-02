# Analizador MRI Cerebral 🧠

Aplicación web para el cálculo del perímetro cefálico (PC) y volumen encefálico a partir de imágenes MRI axiales, permitiendo el diagnóstico diferencial entre micro/macrocefalia con o sin micro/macroencefalia.

## Características

- 📊 **Cálculo de Perímetro Cefálico**: Medición precisa mediante marcación de puntos
- 🧮 **Estimación de Volumen Encefálico**: Cálculo basado en área cerebral
- 📈 **Percentiles por Edad**: Comparación con curvas de crecimiento normales
- 🎯 **Diagnóstico Diferencial Automatizado**:
  - Microcefalia con microencefalia
  - Microcefalia sin microencefalia
  - Macrocefalia con macroencefalia
  - Macrocefalia sin macroencefalia
  - Hallazgos normales
- 🖼️ **Interfaz Intuitiva**: Drag & drop para cargar imágenes
- 📋 **Valores de Referencia**: Tabla integrada por grupos de edad

## Uso

### Inicio Rápido con Docker

```bash
cd brain-mri-analyzer
docker-compose up -d
```

Acceda a la aplicación en: `http://localhost:8080`

### Uso Manual (sin Docker)

Simplemente abra `index.html` en cualquier navegador moderno.

## Flujo de Trabajo

1. **Cargar Imagen MRI**: Arrastre o seleccione una imagen MRI axial
2. **Ingresar Datos**:
   - Edad del paciente
   - Escala de píxeles (mm/pixel)
   - Grosor del corte MRI
3. **Medir Perímetro Cefálico**:
   - Click en "Medir Perímetro Cefálico"
   - Marque puntos alrededor del cráneo (mínimo 3)
4. **Medir Área Cerebral**:
   - Click en "Medir Área Cerebral"
   - Marque puntos del parénquima cerebral (mínimo 3)
5. **Calcular**: Click en "Calcular Resultados"
6. **Revisar Diagnóstico**: El sistema mostrará automáticamente el diagnóstico diferencial

## Criterios Diagnósticos

### Microcefalia con Microencefalia
- PC < P3 + Volumen cerebral disminuido
- **Sugiere**: Trastornos del desarrollo cerebral primario (malformaciones, infecciones congénitas, síndromes genéticos)

### Microcefalia sin Microencefalia
- PC < P3 + Volumen cerebral normal
- **Sugiere**: Craneosinostosis, displasias óseas

### Macrocefalia con Macroencefalia
- PC > P97 + Volumen cerebral aumentado
- **Sugiere**: Megalencefalia, síndromes de sobrecrecimiento, metabolopatías

### Macrocefalia sin Macroencefalia
- PC > P97 + Volumen cerebral normal
- **Sugiere**: Hidrocefalia, colecciones extraaxiales, aumento de espacios LCR

## Valores de Referencia

| Edad | PC Normal (cm) | Volumen Cerebral (cm³) |
|------|----------------|------------------------|
| Recién nacido | 34-36 | 350-400 |
| 1 año | 45-47 | 900-1000 |
| 3 años | 48-50 | 1100-1200 |
| 5 años | 49-51 | 1200-1300 |
| Adulto | 54-58 | 1200-1500 |

## Tecnologías

- HTML5 Canvas para procesamiento de imágenes
- JavaScript vanilla (sin dependencias)
- CSS3 con gradientes modernos
- Docker/Nginx para despliegue

## Limitaciones

- Las mediciones dependen de la calidad de la imagen MRI
- La escala de píxeles debe ser ingresada manualmente
- El volumen es una estimación basada en un solo corte axial
- Los valores de referencia son aproximados y deben validarse con tablas específicas

## Notas Clínicas

⚠️ **Este software es una herramienta de apoyo diagnóstico. Todas las mediciones y diagnósticos deben ser validados por un profesional médico cualificado.**

Las diferencias entre micro/macrocefalia con o sin alteración del parénquima son fundamentales para:
- Orientar estudios adicionales
- Establecer pronóstico
- Guiar manejo terapéutico
- Determinar necesidad de intervención neuroquirúrgica

## Licencia

Uso educativo y clínico. No distribuir sin autorización.

## Autor

Desarrollado para análisis neurológico pediátrico y diagnóstico diferencial de alteraciones del tamaño cefálico.
