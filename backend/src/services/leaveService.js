const LeaveRequest = require('../models/LeaveRequest');
const LeaveType = require('../models/LeaveType');
const Holiday = require('../models/Holiday');
const Settings = require('../models/Settings');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { recordAudit } = require('../middleware/audit');

class LeaveService {
  async calculateWorkingDays(startDateStr, endDateStr) {
    const settings = (await Settings.findOne()) || { weekendDays: [0, 6] };
    const weekends = settings.weekendDays || [0, 6];

    // Fetch all holidays
    const holidays = await Holiday.find();
    const holidayDates = new Set(holidays.map(h => h.date));

    let count = 0;
    const current = new Date(startDateStr);
    const end = new Date(endDateStr);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayOfWeek = current.getDay();

      if (!weekends.includes(dayOfWeek) && !holidayDates.has(dateStr)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  async getLeaveBalances(employeeId, year = new Date().getFullYear()) {
    const leaveTypes = await LeaveType.find();
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const approvedLeaves = await LeaveRequest.find({
      employeeId,
      status: 'approved',
      startDate: { $gte: yearStart, $lte: yearEnd }
    });

    const pendingLeaves = await LeaveRequest.find({
      employeeId,
      status: 'pending',
      startDate: { $gte: yearStart, $lte: yearEnd }
    });

    const balances = leaveTypes.map(lt => {
      const usedApproved = approvedLeaves
        .filter(l => l.leaveTypeId.toString() === lt._id.toString())
        .reduce((sum, l) => sum + l.workingDaysCount, 0);

      const usedPending = pendingLeaves
        .filter(l => l.leaveTypeId.toString() === lt._id.toString())
        .reduce((sum, l) => sum + l.workingDaysCount, 0);

      const quota = lt.yearlyQuota;
      const isUnlimited = quota < 0 || quota >= 999;
      const remaining = isUnlimited ? 999 : Math.max(0, quota - usedApproved);

      return {
        leaveTypeId: lt._id,
        leaveTypeName: lt.name,
        leaveTypeCode: lt.code,
        yearlyQuota: isUnlimited ? 'Unlimited' : quota,
        usedDays: usedApproved,
        pendingDays: usedPending,
        remainingDays: isUnlimited ? 'Unlimited' : remaining,
        isPaid: lt.isPaid
      };
    });

    return balances;
  }

  async applyLeave({ employeeId, leaveTypeId, startDate, endDate, reason }, req = null) {
    if (!startDate || !endDate || !leaveTypeId || !reason) {
      const err = new Error('All fields (leave type, start date, end date, reason) are required.');
      err.statusCode = 422;
      throw err;
    }

    if (startDate > endDate) {
      const err = new Error('Start date cannot be after end date.');
      err.statusCode = 422;
      throw err;
    }

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      const err = new Error('Invalid leave type.');
      err.statusCode = 404;
      throw err;
    }

    // Check overlap with pending or approved requests
    const overlapping = await LeaveRequest.findOne({
      employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
      ]
    });

    if (overlapping) {
      const err = new Error(`Overlapping leave request already exists from ${overlapping.startDate} to ${overlapping.endDate}.`);
      err.statusCode = 422;
      throw err;
    }

    const workingDays = await this.calculateWorkingDays(startDate, endDate);
    if (workingDays === 0) {
      const err = new Error('Selected period has 0 working days (falls entirely on weekends/holidays).');
      err.statusCode = 422;
      throw err;
    }

    // Check balance if not unlimited
    const year = new Date(startDate).getFullYear();
    const balances = await this.getLeaveBalances(employeeId, year);
    const balance = balances.find(b => b.leaveTypeId.toString() === leaveTypeId.toString());

    if (balance && balance.yearlyQuota !== 'Unlimited') {
      if (workingDays > balance.remainingDays) {
        const err = new Error(`Insufficient leave balance. Requested: ${workingDays} days, Available: ${balance.remainingDays} days.`);
        err.statusCode = 422;
        throw err;
      }
    }

    const leaveRequest = new LeaveRequest({
      employeeId,
      leaveTypeId,
      startDate,
      endDate,
      workingDaysCount: workingDays,
      reason: reason.trim(),
      status: 'pending'
    });

    await leaveRequest.save();

    await recordAudit({
      req,
      action: 'APPLY_LEAVE',
      entity: 'LeaveRequest',
      entityId: leaveRequest._id,
      afterJson: {
        startDate,
        endDate,
        workingDays,
        leaveType: leaveType.name,
        reason
      }
    });

    return leaveRequest.populate('leaveTypeId', 'name code');
  }

  async cancelLeave(leaveRequestId, employeeId, req = null) {
    const leave = await LeaveRequest.findById(leaveRequestId);
    if (!leave) {
      const err = new Error('Leave request not found');
      err.statusCode = 404;
      throw err;
    }

    if (leave.employeeId.toString() !== employeeId.toString()) {
      const err = new Error('You can only cancel your own leave requests.');
      err.statusCode = 403;
      throw err;
    }

    if (leave.status !== 'pending' && leave.status !== 'approved') {
      const err = new Error(`Cannot cancel leave with status '${leave.status}'.`);
      err.statusCode = 400;
      throw err;
    }

    const before = leave.toObject();
    leave.status = 'cancelled';
    await leave.save();

    await recordAudit({
      req,
      action: 'CANCEL_LEAVE',
      entity: 'LeaveRequest',
      entityId: leave._id,
      beforeJson: before,
      afterJson: { status: 'cancelled' }
    });

    return leave;
  }

  async reviewLeave({ leaveRequestId, status, reviewComment }, req = null) {
    if (!['approved', 'rejected'].includes(status)) {
      const err = new Error('Status must be approved or rejected');
      err.statusCode = 400;
      throw err;
    }

    const leave = await LeaveRequest.findById(leaveRequestId).populate('employeeId');
    if (!leave) {
      const err = new Error('Leave request not found');
      err.statusCode = 404;
      throw err;
    }

    if (leave.status !== 'pending') {
      const err = new Error(`Leave request has already been ${leave.status}.`);
      err.statusCode = 400;
      throw err;
    }

    const before = leave.toObject();
    leave.status = status;
    leave.reviewComment = reviewComment || '';
    leave.reviewedBy = req.user._id;
    leave.reviewedAt = new Date();
    await leave.save();

    // Create In-App Notification for employee
    if (leave.employeeId?.userId) {
      await Notification.create({
        recipientUserId: leave.employeeId.userId,
        title: `Leave Request ${status.toUpperCase()}`,
        message: `Your leave request for ${leave.startDate} to ${leave.endDate} was ${status}. Comment: ${reviewComment || 'None'}`,
        type: 'leave'
      });
    }

    await recordAudit({
      req,
      action: status === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
      entity: 'LeaveRequest',
      entityId: leave._id,
      beforeJson: before,
      afterJson: { status, reviewComment }
    });

    return leave.populate('leaveTypeId', 'name code');
  }

  async getLeaveRequests({ employeeId, status, departmentId, year }) {
    const query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (status) {
      query.status = status;
    }

    if (year) {
      query.startDate = { $regex: `^${year}` };
    }

    let requests = await LeaveRequest.find(query)
      .populate('leaveTypeId', 'name code isPaid')
      .populate({
        path: 'employeeId',
        select: 'employeeCode firstName lastName departmentId designationId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'designationId', select: 'title' }
        ]
      })
      .sort({ createdAt: -1 });

    if (departmentId) {
      requests = requests.filter(r => r.employeeId?.departmentId?._id?.toString() === departmentId.toString());
    }

    return requests;
  }
}

module.exports = new LeaveService();
