const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.cjs');
const arrearsTrackingService = require('../services/arrearsTrackingService.cjs');

// Obtener resumen de morosidad para un edificio
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { buildingId, includeDetails } = req.query;
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    if (!effectiveBuildingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Building ID es requerido' 
      });
    }
    
    const data = await arrearsTrackingService.getBuildingArrearsSum(
      effectiveBuildingId,
      { includeDetails: includeDetails === 'true' }
    );
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error obteniendo resumen de morosidad:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obtener historial de morosidad de un miembro
router.get('/member/:memberId', authenticate, async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const history = await arrearsTrackingService.getMemberArrearsHistory(memberId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error obteniendo historial de morosidad:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Marcar pago como recibido
router.post('/payment/:transactionId', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const paymentData = req.body;
    
    const result = await arrearsTrackingService.markPaymentReceived(
      transactionId,
      paymentData
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error marcando pago como recibido:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Obtener configuración de morosidad
router.get('/config', authenticate, async (req, res) => {
  try {
    const { buildingId } = req.query;
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    if (!effectiveBuildingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Building ID es requerido' 
      });
    }
    
    const config = await arrearsTrackingService.getArrearsConfig(effectiveBuildingId);
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Actualizar configuración de morosidad (solo admin)
router.put('/config', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const { buildingId, ...configData } = req.body;
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    if (!effectiveBuildingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Building ID es requerido' 
      });
    }
    
    const result = await arrearsTrackingService.updateArrearsConfig(
      effectiveBuildingId,
      configData
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generar reporte de morosidad
router.get('/report', authenticate, async (req, res) => {
  try {
    const { buildingId, startDate, endDate } = req.query;
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    if (!effectiveBuildingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Building ID es requerido' 
      });
    }
    
    const report = await arrearsTrackingService.generateArrearsReport(
      effectiveBuildingId,
      { startDate, endDate }
    );
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generando reporte:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Forzar chequeo de pagos vencidos (solo admin)
router.post('/check-overdue', authenticate, authorize('admin', 'super_admin'), async (req, res) => {
  try {
    const result = await arrearsTrackingService.checkAndUpdateOverduePayments();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error chequeando pagos vencidos:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;