const geolib = require('geolib');
const Attendance = require('../models/Attendance');
const AttendanceCorrection = require('../models/AttendanceCorrection');
const Employee = require('../models/Employee');
const Settings = require('../models/Settings');
const LeaveRequest = require('../models/LeaveRequest');
const Holiday = require('../models/Holiday');
const Notification = require('../models/Notification');
const { recordAudit } = require('../middleware/audit');

class AttendanceService {
  getTodayDateString(d = new Date()) {
    return d.toISOString().split('T')[0];
  }

  async checkIn({ employeeId, checkInSource = 'web', location = null, faceDetected = false }, req = null) {
    const todayStr = this.getTodayDateString();
    const serverNow = new Date();

    // Check existing attendance for today
    const existing = await Attendance.findOne({ employeeId, date: todayStr });
    if (existing) {
      const err = new Error('Attendance already recorded for today. Second check-in is not permitted.');
      err.statusCode = 409;
      throw err;
    }

    const settings = (await Settings.findOne()) || {
      workStartTime: '09:00',
      gracePeriodMinutes: 15,
      halfDayHours: 5,
      officeLocation: { lat: 24.8607, lng: 67.0011, radiusMeters: 150 }
    };

    // Geofence & Location validation if camera or location provided
    let locationResult = null;
    let anomalyFlag = false;

    if (checkInSource === 'camera') {
      if (!faceDetected) {
        const err = new Error('Face verification failed. Exactly one face must be detected.');
        err.statusCode = 400;
        throw err;
      }

      if (!location || location.lat === undefined || location.lng === undefined) {
        const err = new Error('Location is required for camera attendance.');
        err.statusCode = 400;
        throw err;
      }

      if (location.accuracy && location.accuracy > 100) {
        const err = new Error(`GPS accuracy too low (${Math.round(location.accuracy)}m > 100m limit). Please try from an open area.`);
        err.statusCode = 422;
        throw err;
      }

      const office = settings.officeLocation || { lat: 24.8607, lng: 67.0011, radiusMeters: 150 };
      const distance = geolib.getDistance(
        { latitude: location.lat, longitude: location.lng },
        { latitude: office.lat, longitude: office.lng }
      );

      const inside = distance <= (office.radiusMeters || 150);
      if (!inside) {
        const err = new Error(`Outside office geofence. Distance: ${distance}m, allowed: ${office.radiusMeters}m.`);
        err.statusCode = 422;
        throw err;
      }

      locationResult = {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 0,
        distanceMeters: distance,
        insideGeofence: true
      };
    } else if (location && location.lat && location.lng) {
      const office = settings.officeLocation || { lat: 24.8607, lng: 67.0011, radiusMeters: 150 };
      const distance = geolib.getDistance(
        { latitude: location.lat, longitude: location.lng },
        { latitude: office.lat, longitude: office.lng }
      );
      locationResult = {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 0,
        distanceMeters: distance,
        insideGeofence: distance <= (office.radiusMeters || 150)
      };
    }

    // Determine initial status: late or present
    const [startHour, startMin] = (settings.workStartTime || '09:00').split(':').map(Number);
    const graceMin = settings.gracePeriodMinutes ?? 15;

    // Threshold time today
    const threshold = new Date(serverNow);
    threshold.setHours(startHour, startMin + graceMin, 0, 0);

    const isLate = serverNow > threshold;
    const status = isLate ? 'late' : 'present';

    // Anomaly detection: if check-in is extremely early (e.g. before 6am) or very late after 2pm
    if (serverNow.getHours() < 6 || serverNow.getHours() >= 14) {
      anomalyFlag = true;
    }

    const attendance = new Attendance({
      employeeId,
      date: todayStr,
      checkInTime: serverNow,
      status,
      checkInSource,
      location: locationResult,
      faceVerified: checkInSource === 'camera' && faceDetected,
      anomalyFlag
    });

    await attendance.save();

    await recordAudit({
      req,
      action: 'CHECK_IN',
      entity: 'Attendance',
      entityId: attendance._id,
      afterJson: {
        date: todayStr,
        checkInTime: serverNow,
        status,
        checkInSource
      }
    });

    return attendance;
  }

  async checkOut(employeeId, req = null) {
    const todayStr = this.getTodayDateString();
    const serverNow = new Date();

    const attendance = await Attendance.findOne({ employeeId, date: todayStr });
    if (!attendance) {
      const err = new Error('No check-in record found for today. Please check in first.');
      err.statusCode = 404;
      throw err;
    }

    if (attendance.checkOutTime) {
      const err = new Error('Check-out has already been recorded for today.');
      err.statusCode = 409;
      throw err;
    }

    const settings = (await Settings.findOne()) || { halfDayHours: 5 };
    const checkInMs = new Date(attendance.checkInTime).getTime();
    const checkOutMs = serverNow.getTime();
    const diffHours = (checkOutMs - checkInMs) / (1000 * 60 * 60);
    const diffMinutes = Math.floor((checkOutMs - checkInMs) / (1000 * 60));

    attendance.checkOutTime = serverNow;
    attendance.totalHours = parseFloat(diffHours.toFixed(2));
    attendance.workMinutes = diffMinutes;

    // Half day rule: if worked < halfDayHours (e.g. 5 hours)
    if (diffHours < (settings.halfDayHours || 5)) {
      attendance.status = 'half_day';
    }

    await attendance.save();

    await recordAudit({
      req,
      action: 'CHECK_OUT',
      entity: 'Attendance',
      entityId: attendance._id,
      afterJson: {
        checkOutTime: serverNow,
        totalHours: attendance.totalHours,
        status: attendance.status
      }
    });

    return attendance;
  }

  async getDailyBoard(dateStr) {
    const targetDate = dateStr || this.getTodayDateString();
    const activeEmployees = await Employee.find({ status: { $in: ['active', 'probation'] } })
      .populate('departmentId', 'name code')
      .populate('designationId', 'title')
      .sort({ firstName: 1 });

    const attendanceRecords = await Attendance.find({ date: targetDate });
    const attendanceMap = new Map();
    attendanceRecords.forEach(att => attendanceMap.set(att.employeeId.toString(), att));

    // Approved leaves for this date
    const approvedLeaves = await LeaveRequest.find({
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate },
      status: 'approved'
    }).populate('leaveTypeId', 'name code');
    const leaveMap = new Map();
    approvedLeaves.forEach(l => leaveMap.set(l.employeeId.toString(), l));

    // Settings for weekend check
    const settings = (await Settings.findOne()) || { weekendDays: [0, 6] };
    const d = new Date(targetDate);
    const isWeekend = (settings.weekendDays || [0, 6]).includes(d.getDay());
    const isHoliday = await Holiday.findOne({ date: targetDate });

    const board = activeEmployees.map(emp => {
      const empIdStr = emp._id.toString();
      const att = attendanceMap.get(empIdStr);
      const leave = leaveMap.get(empIdStr);

      let status = 'absent';
      let checkIn = null;
      let checkOut = null;
      let hours = 0;
      let anomaly = false;

      if (att) {
        status = att.status;
        checkIn = att.checkInTime;
        checkOut = att.checkOutTime;
        hours = att.totalHours || 0;
        anomaly = att.anomalyFlag;

        // If today is past work hours and no checkout
        if (!att.checkOutTime && targetDate < this.getTodayDateString()) {
          status = 'missing_checkout';
        }
      } else if (leave) {
        status = 'on_leave';
      } else if (isWeekend || isHoliday) {
        status = 'holiday_weekend';
      }

      return {
        employee: {
          id: emp._id,
          employeeCode: emp.employeeCode,
          fullName: `${emp.firstName} ${emp.lastName}`,
          department: emp.departmentId?.name || '',
          designation: emp.designationId?.title || ''
        },
        date: targetDate,
        status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        totalHours: hours,
        leaveInfo: leave ? { type: leave.leaveTypeId?.name, reason: leave.reason } : null,
        anomaly
      };
    });

    const summary = {
      total: activeEmployees.length,
      present: board.filter(b => b.status === 'present').length,
      late: board.filter(b => b.status === 'late').length,
      halfDay: board.filter(b => b.status === 'half_day').length,
      onLeave: board.filter(b => b.status === 'on_leave').length,
      absent: board.filter(b => b.status === 'absent').length,
      missingCheckout: board.filter(b => b.status === 'missing_checkout').length
    };

    return { date: targetDate, summary, board };
  }

  async getCalendar({ employeeId, month }) {
    // month is 'YYYY-MM'
    const query = { employeeId };
    if (month) {
      query.date = { $regex: `^${month}` };
    }

    const records = await Attendance.find(query).sort({ date: 1 });
    const leaves = await LeaveRequest.find({
      employeeId,
      status: 'approved',
      $or: [
        { startDate: { $regex: `^${month}` } },
        { endDate: { $regex: `^${month}` } }
      ]
    }).populate('leaveTypeId', 'name code');

    return { records, leaves };
  }

  async requestCorrection({ employeeId, date, requestedCheckIn, requestedCheckOut, reason }, req = null) {
    if (!date || !requestedCheckIn || !requestedCheckOut || !reason) {
      const err = new Error('All fields are required for correction request.');
      err.statusCode = 422;
      throw err;
    }

    const correction = new AttendanceCorrection({
      employeeId,
      date,
      requestedCheckIn,
      requestedCheckOut,
      reason,
      status: 'pending'
    });
    await correction.save();

    await recordAudit({
      req,
      action: 'REQUEST_ATTENDANCE_CORRECTION',
      entity: 'AttendanceCorrection',
      entityId: correction._id,
      afterJson: { date, reason }
    });

    return correction;
  }

  async reviewCorrection({ correctionId, status, reviewComment }, req = null) {
    if (!['approved', 'rejected'].includes(status)) {
      const err = new Error('Status must be approved or rejected');
      err.statusCode = 400;
      throw err;
    }

    const correction = await AttendanceCorrection.findById(correctionId).populate('employeeId');
    if (!correction) {
      const err = new Error('Correction request not found');
      err.statusCode = 404;
      throw err;
    }

    if (correction.status !== 'pending') {
      const err = new Error('Correction request has already been reviewed');
      err.statusCode = 400;
      throw err;
    }

    correction.status = status;
    correction.reviewComment = reviewComment || '';
    correction.reviewedBy = req.user._id;
    correction.reviewedAt = new Date();
    await correction.save();

    if (status === 'approved') {
      // Find or create attendance record
      let att = await Attendance.findOne({
        employeeId: correction.employeeId._id,
        date: correction.date
      });

      const [inH, inM] = correction.requestedCheckIn.split(':').map(Number);
      const [outH, outM] = correction.requestedCheckOut.split(':').map(Number);

      const inDate = new Date(`${correction.date}T${correction.requestedCheckIn}:00Z`);
      const outDate = new Date(`${correction.date}T${correction.requestedCheckOut}:00Z`);
      const hours = Math.max(0, (outH - inH) + (outM - inM) / 60);

      const settings = (await Settings.findOne()) || { halfDayHours: 5, workStartTime: '09:00', gracePeriodMinutes: 15 };
      let newStatus = hours < (settings.halfDayHours || 5) ? 'half_day' : 'present';
      if (inH > 9 || (inH === 9 && inM > 15)) {
        newStatus = 'late';
      }

      if (!att) {
        att = new Attendance({
          employeeId: correction.employeeId._id,
          date: correction.date,
          checkInTime: inDate,
          checkOutTime: outDate,
          totalHours: hours,
          workMinutes: Math.floor(hours * 60),
          status: newStatus,
          notes: `Corrected by HR approval (${correction.reason})`
        });
      } else {
        att.checkInTime = inDate;
        att.checkOutTime = outDate;
        att.totalHours = hours;
        att.workMinutes = Math.floor(hours * 60);
        att.status = newStatus;
        att.notes = `Corrected: ${correction.reason}`;
      }
      await att.save();
    }

    // Notify employee
    if (correction.employeeId?.userId) {
      await Notification.create({
        recipientUserId: correction.employeeId.userId,
        title: `Attendance Correction ${status.toUpperCase()}`,
        message: `Your correction request for ${correction.date} was ${status}. Comment: ${reviewComment || 'None'}`,
        type: 'attendance'
      });
    }

    await recordAudit({
      req,
      action: status === 'approved' ? 'APPROVE_ATTENDANCE_CORRECTION' : 'REJECT_ATTENDANCE_CORRECTION',
      entity: 'AttendanceCorrection',
      entityId: correction._id,
      afterJson: { status, reviewComment }
    });

    return correction;
  }

  async getPendingCorrections() {
    return AttendanceCorrection.find({ status: 'pending' })
      .populate('employeeId', 'employeeCode firstName lastName departmentId')
      .populate({
        path: 'employeeId',
        populate: { path: 'departmentId', select: 'name code' }
      })
      .sort({ createdAt: -1 });
  }
}

module.exports = new AttendanceService();
