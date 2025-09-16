const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.cjs');
const quotaService = require('../services/quotaService.cjs');
const arrearsService = require('../services/arrearsService.cjs');
const cronService = require('../services/cronService.cjs');

// Get financial summary for a building
router.get('/summary', authenticate, async (req, res) => {
  try {
    const { buildingId, year, month } = req.query;
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    if (!effectiveBuildingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Building ID is required' 
      });
    }
    
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || (new Date().getMonth() + 1);
    
    const summary = await quotaService.getFinancialSummary(
      effectiveBuildingId,
      currentYear,
      currentMonth
    );
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting financial summary:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get pending payments for current month
router.get('/pending-payments', authenticate, async (req, res) => {
  try {
    const pendingPayments = await quotaService.getPendingPaymentsForMonth();
    
    res.json({
      success: true,
      data: pendingPayments
    });
  } catch (error) {
    console.error('Error getting pending payments:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Mark payment as received
router.post('/payments/:transactionId/receive', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const paymentData = req.body;
    
    const result = await quotaService.markPaymentAsReceived(transactionId, paymentData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error marking payment as received:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get arrears for a building
router.get('/arrears', authenticate, async (req, res) => {
  try {
    const { buildingId } = req.query;
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    if (!effectiveBuildingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Building ID is required' 
      });
    }
    
    const arrears = await arrearsService.getBuildingArrears(effectiveBuildingId);
    
    res.json({
      success: true,
      data: arrears
    });
  } catch (error) {
    console.error('Error getting arrears:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get member arrears
router.get('/arrears/member/:memberId', authenticate, async (req, res) => {
  try {
    const { memberId } = req.params;
    
    const arrears = await arrearsService.getMemberArrears(memberId);
    
    res.json({
      success: true,
      data: arrears
    });
  } catch (error) {
    console.error('Error getting member arrears:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get arrears statistics
router.get('/arrears/statistics', authenticate, async (req, res) => {
  try {
    const { buildingId } = req.query;
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    if (!effectiveBuildingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Building ID is required' 
      });
    }
    
    const statistics = await arrearsService.getArrearsStatistics(effectiveBuildingId);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting arrears statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate arrears report
router.get('/arrears/report', authenticate, async (req, res) => {
  try {
    const { buildingId } = req.query;
    const effectiveBuildingId = buildingId || req.user?.building_id;
    
    if (!effectiveBuildingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Building ID is required' 
      });
    }
    
    const report = await arrearsService.generateArrearsReport(effectiveBuildingId);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating arrears report:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create payment plan for member
router.post('/payment-plans', authenticate, async (req, res) => {
  try {
    const { memberId, ...planData } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Member ID is required' 
      });
    }
    
    const paymentPlan = await arrearsService.createPaymentPlan(memberId, planData);
    
    res.json({
      success: true,
      data: paymentPlan
    });
  } catch (error) {
    console.error('Error creating payment plan:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate monthly quotas (manual trigger)
router.post('/quotas/generate', authenticate, async (req, res) => {
  try {
    // Only admins can trigger this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthenticateorized' 
      });
    }
    
    const result = await quotaService.generateMonthlyQuotas();
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating quotas:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Generate monthly report (manual trigger)
router.post('/reports/monthly', authenticate, async (req, res) => {
  try {
    // Only admins can trigger this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthenticateorized' 
      });
    }
    
    const report = await quotaService.generateMonthlyReport();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check overdue payments (manual trigger)
router.post('/arrears/check', authenticate, async (req, res) => {
  try {
    // Only admins can trigger this
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthenticateorized' 
      });
    }
    
    const overdueMembers = await arrearsService.checkOverduePayments();
    
    res.json({
      success: true,
      data: {
        count: overdueMembers.length,
        members: overdueMembers
      }
    });
  } catch (error) {
    console.error('Error checking overdue payments:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Cron job management endpoints (admin only)
router.post('/cron/trigger/:jobName', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthenticateorized' 
      });
    }
    
    const { jobName } = req.params;
    const result = await cronService.triggerJob(jobName);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error triggering cron job:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;