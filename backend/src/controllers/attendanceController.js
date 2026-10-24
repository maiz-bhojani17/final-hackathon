const attendanceService = require('../services/attendanceService');

class AttendanceController {
  async checkIn(req, res, next) {
    try {
      const empId = req.user.employeeId?._id || req.user.employeeId;
      if (!empId) {
        return res.status(400).json({ message: 'No employee record linked to user account.' });
      }

      const { checkInSource = 'web', location, faceDetected } = req.body;
      const result = await attendanceService.checkIn(
        { employeeId: empId, checkInSource, location, faceDetected },
        req
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async checkOut(req, res, next) {
    try {
      const empId = req.user.employeeId?._id || req.user.employeeId;
      if (!empId) {
        return res.status(400).json({ message: 'No employee record linked to user account.' });
      }

      const result = await attendanceService.checkOut(empId, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getDailyBoard(req, res, next) {
    try {
      const { date } = req.query;
      const board = await attendanceService.getDailyBoard(date);
      res.json(board);
    } catch (err) {
      next(err);
    }
  }

  async getCalendar(req, res, next) {
    try {
      let targetEmployeeId = req.query.employeeId;

      if (req.user.role === 'employee') {
        const empId = req.user.employeeId?._id || req.user.employeeId;
        if (!empId) return res.status(403).json({ message: 'No employee linked to your account.' });
        targetEmployeeId = empId;
      } else if (!targetEmployeeId) {
        const empId = req.user.employeeId?._id || req.user.employeeId;
        targetEmployeeId = empId;
      }

      const calendar = await attendanceService.getCalendar({
        employeeId: targetEmployeeId,
        month: req.query.month
      });
      res.json(calendar);
    } catch (err) {
      next(err);
    }
  }

  async requestCorrection(req, res, next) {
    try {
      const empId = req.user.employeeId?._id || req.user.employeeId;
      if (!empId) {
        return res.status(400).json({ message: 'No employee linked to your account.' });
      }

      const { date, requestedCheckIn, requestedCheckOut, reason } = req.body;
      const result = await attendanceService.requestCorrection(
        { employeeId: empId, date, requestedCheckIn, requestedCheckOut, reason },
        req
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getPendingCorrections(req, res, next) {
    try {
      const pending = await attendanceService.getPendingCorrections();
      res.json(pending);
    } catch (err) {
      next(err);
    }
  }

  async reviewCorrection(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reviewComment } = req.body;
      const result = await attendanceService.reviewCorrection({ correctionId: id, status, reviewComment }, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttendanceController();
