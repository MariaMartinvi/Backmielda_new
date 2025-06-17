// Progress Tracker - Sistema de seguimiento en tiempo real
// Permite ver el progreso de generación de historias paso a paso

const EventEmitter = require('events');

class ProgressTracker extends EventEmitter {
  constructor(storyId) {
    super();
    this.storyId = storyId;
    this.startTime = Date.now();
    this.phases = {
      story: { name: 'Generando historia', progress: 0, status: 'pending' },
      audio: { name: 'Generando audio', progress: 0, status: 'pending' },
      mixing: { name: 'Mezclando con música', progress: 0, status: 'pending' }
    };
    this.currentPhase = null;
    this.estimatedTotalTime = 0;
    this.streamedText = '';
    
    console.log(`📊 === PROGRESS TRACKER INICIADO ===`);
    console.log(`🆔 Story ID: ${this.storyId}`);
    console.log(`⏰ Inicio: ${new Date().toISOString()}`);
  }

  // Iniciar una nueva fase
  startPhase(phaseName, estimatedDuration = 0) {
    if (this.phases[phaseName]) {
      this.currentPhase = phaseName;
      this.phases[phaseName].status = 'active';
      this.phases[phaseName].estimatedDuration = estimatedDuration;
      this.phases[phaseName].startTime = Date.now();
      
      console.log(`🎬 === INICIANDO FASE: ${this.phases[phaseName].name.toUpperCase()} ===`);
      console.log(`⏱️ Duración estimada: ${estimatedDuration}ms`);
      
      this.emit('phaseStart', {
        storyId: this.storyId,
        phase: phaseName,
        phaseName: this.phases[phaseName].name,
        estimatedDuration,
        timestamp: Date.now()
      });
    }
  }

  // Actualizar progreso de la fase actual
  updateProgress(progress, details = {}) {
    if (this.currentPhase && this.phases[this.currentPhase]) {
      const oldProgress = this.phases[this.currentPhase].progress;
      this.phases[this.currentPhase].progress = Math.min(100, Math.max(0, progress));
      
      // Solo emitir si hay cambio significativo (evitar spam)
      if (Math.abs(progress - oldProgress) >= 5 || progress === 100 || details.forceEmit) {
        const elapsed = Date.now() - this.phases[this.currentPhase].startTime;
        const eta = this.calculateETA(progress, elapsed);
        
        console.log(`📈 Generando historia`);
        
        this.emit('progressUpdate', {
          storyId: this.storyId,
          phase: this.currentPhase,
          phaseName: 'Generando historia',
          progress: 0, // No mostrar porcentaje
          details: { detail: 'Generando historia' }, // Solo mensaje simple
          elapsed: elapsed,
          eta: eta,
          timestamp: Date.now()
        });
      }
    }
  }

  // Streaming de texto en tiempo real
  appendText(textChunk) {
    this.streamedText += textChunk;
    
    console.log(`📝 Texto streaming: +${textChunk.length} chars (total: ${this.streamedText.length})`);
    
    this.emit('textStream', {
      storyId: this.storyId,
      chunk: textChunk,
      totalText: this.streamedText,
      totalLength: this.streamedText.length,
      timestamp: Date.now()
    });
  }

  // Completar una fase
  completePhase(result = {}) {
    if (this.currentPhase && this.phases[this.currentPhase]) {
      this.phases[this.currentPhase].status = 'completed';
      this.phases[this.currentPhase].progress = 100;
      this.phases[this.currentPhase].endTime = Date.now();
      this.phases[this.currentPhase].duration = this.phases[this.currentPhase].endTime - this.phases[this.currentPhase].startTime;
      
      console.log(`✅ === FASE COMPLETADA: ${this.phases[this.currentPhase].name.toUpperCase()} ===`);
      console.log(`⏱️ Duración real: ${this.phases[this.currentPhase].duration}ms`);
      
      this.emit('phaseComplete', {
        storyId: this.storyId,
        phase: this.currentPhase,
        phaseName: this.phases[this.currentPhase].name,
        duration: this.phases[this.currentPhase].duration,
        result: result,
        timestamp: Date.now()
      });
      
      this.currentPhase = null;
    }
  }

  // Marcar una fase como error
  failPhase(error) {
    if (this.currentPhase && this.phases[this.currentPhase]) {
      this.phases[this.currentPhase].status = 'failed';
      this.phases[this.currentPhase].error = error.message;
      this.phases[this.currentPhase].endTime = Date.now();
      
      console.error(`❌ === FASE FALLÓ: ${this.phases[this.currentPhase].name.toUpperCase()} ===`);
      console.error(`💥 Error: ${error.message}`);
      
      this.emit('phaseError', {
        storyId: this.storyId,
        phase: this.currentPhase,
        phaseName: this.phases[this.currentPhase].name,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  // Calcular tiempo estimado restante
  calculateETA(progress, elapsed) {
    if (progress <= 0) return 0;
    const totalEstimated = (elapsed / progress) * 100;
    return Math.max(0, totalEstimated - elapsed);
  }

  // Obtener resumen completo del progreso
  getStatus() {
    const totalElapsed = Date.now() - this.startTime;
    const completedPhases = Object.values(this.phases).filter(p => p.status === 'completed').length;
    const totalPhases = Object.keys(this.phases).length;
    const overallProgress = (completedPhases / totalPhases) * 100;
    
    return {
      storyId: this.storyId,
      startTime: this.startTime,
      totalElapsed,
      overallProgress,
      completedPhases,
      totalPhases,
      currentPhase: this.currentPhase,
      phases: this.phases,
      streamedTextLength: this.streamedText.length,
      timestamp: Date.now()
    };
  }

  // Completar todo el proceso
  complete(finalResult = {}) {
    const totalDuration = Date.now() - this.startTime;
    
    console.log(`🎉 === GENERACIÓN COMPLETA ===`);
    console.log(`⏱️ Tiempo total: ${totalDuration}ms`);
    console.log(`📊 Fases completadas: ${Object.values(this.phases).filter(p => p.status === 'completed').length}`);
    console.log(`📝 Texto generado: ${this.streamedText.length} caracteres`);
    
    this.emit('complete', {
      storyId: this.storyId,
      totalDuration,
      phases: this.phases,
      streamedText: this.streamedText,
      result: finalResult,
      timestamp: Date.now()
    });
  }

  // Log detallado para debugging
  logProgress(message, data = {}) {
    const elapsed = Date.now() - this.startTime;
    console.log(`📊 [${elapsed}ms] ${message}`, data);
    
    this.emit('log', {
      storyId: this.storyId,
      message,
      data,
      elapsed,
      timestamp: Date.now()
    });
  }
}

// Factory para crear trackers
function createProgressTracker(storyId) {
  return new ProgressTracker(storyId);
}

// Manager global para múltiples trackers
class ProgressManager {
  constructor() {
    this.activeTrackers = new Map();
  }

  createTracker(storyId) {
    const tracker = new ProgressTracker(storyId);
    this.activeTrackers.set(storyId, tracker);
    
    // Limpiar cuando se complete
    tracker.on('complete', () => {
      setTimeout(() => {
        this.activeTrackers.delete(storyId);
      }, 60000); // Mantener por 1 minuto después de completar
    });
    
    return tracker;
  }

  getTracker(storyId) {
    return this.activeTrackers.get(storyId);
  }

  getAllTrackers() {
    return Array.from(this.activeTrackers.values()).map(t => t.getStatus());
  }

  removeTracker(storyId) {
    this.activeTrackers.delete(storyId);
  }
}

// Instancia global del manager
const progressManager = new ProgressManager();

module.exports = {
  ProgressTracker,
  createProgressTracker,
  progressManager
}; 