const Department = require('../models/Department');
const Designation = require('../models/Designation');
const LeaveType = require('../models/LeaveType');
const Holiday = require('../models/Holiday');
const { recordAudit } = require('../middleware/audit');

class OrgService {
  // Departments
  async getDepartments() {
    return Department.find().sort({ name: 1 });
  }

  async createDepartment(data, req = null) {
    const department = new Department(data);
    await department.save();

    await recordAudit({
      req,
      action: 'CREATE_DEPARTMENT',
      entity: 'Department',
      entityId: department._id,
      afterJson: department.toObject()
    });
    return department;
  }

  async updateDepartment(id, data, req = null) {
    const department = await Department.findById(id);
    if (!department) throw new Error('Department not found');

    const before = department.toObject();
    Object.assign(department, data);
    await department.save();

    await recordAudit({
      req,
      action: 'UPDATE_DEPARTMENT',
      entity: 'Department',
      entityId: department._id,
      beforeJson: before,
      afterJson: department.toObject()
    });
    return department;
  }

  async deleteDepartment(id, req = null) {
    const department = await Department.findById(id);
    if (!department) throw new Error('Department not found');

    await Department.findByIdAndDelete(id);

    await recordAudit({
      req,
      action: 'DELETE_DEPARTMENT',
      entity: 'Department',
      entityId: id,
      beforeJson: department.toObject()
    });
    return { message: 'Department removed successfully' };
  }

  // Designations
  async getDesignations(departmentId = null) {
    const filter = departmentId ? { departmentId } : {};
    return Designation.find(filter).populate('departmentId', 'name code').sort({ title: 1 });
  }

  async createDesignation(data, req = null) {
    const designation = new Designation(data);
    await designation.save();
    await designation.populate('departmentId', 'name code');

    await recordAudit({
      req,
      action: 'CREATE_DESIGNATION',
      entity: 'Designation',
      entityId: designation._id,
      afterJson: designation.toObject()
    });
    return designation;
  }

  async updateDesignation(id, data, req = null) {
    const designation = await Designation.findById(id);
    if (!designation) throw new Error('Designation not found');

    const before = designation.toObject();
    Object.assign(designation, data);
    await designation.save();
    await designation.populate('departmentId', 'name code');

    await recordAudit({
      req,
      action: 'UPDATE_DESIGNATION',
      entity: 'Designation',
      entityId: designation._id,
      beforeJson: before,
      afterJson: designation.toObject()
    });
    return designation;
  }

  async deleteDesignation(id, req = null) {
    const designation = await Designation.findById(id);
    if (!designation) throw new Error('Designation not found');

    await Designation.findByIdAndDelete(id);

    await recordAudit({
      req,
      action: 'DELETE_DESIGNATION',
      entity: 'Designation',
      entityId: id,
      beforeJson: designation.toObject()
    });
    return { message: 'Designation removed successfully' };
  }

  // Leave Types
  async getLeaveTypes() {
    return LeaveType.find().sort({ name: 1 });
  }

  async createLeaveType(data, req = null) {
    const leaveType = new LeaveType(data);
    await leaveType.save();

    await recordAudit({
      req,
      action: 'CREATE_LEAVE_TYPE',
      entity: 'LeaveType',
      entityId: leaveType._id,
      afterJson: leaveType.toObject()
    });
    return leaveType;
  }

  async updateLeaveType(id, data, req = null) {
    const leaveType = await LeaveType.findById(id);
    if (!leaveType) throw new Error('Leave type not found');

    const before = leaveType.toObject();
    Object.assign(leaveType, data);
    await leaveType.save();

    await recordAudit({
      req,
      action: 'UPDATE_LEAVE_TYPE',
      entity: 'LeaveType',
      entityId: leaveType._id,
      beforeJson: before,
      afterJson: leaveType.toObject()
    });
    return leaveType;
  }

  async deleteLeaveType(id, req = null) {
    const leaveType = await LeaveType.findById(id);
    if (!leaveType) throw new Error('Leave type not found');

    await LeaveType.findByIdAndDelete(id);

    await recordAudit({
      req,
      action: 'DELETE_LEAVE_TYPE',
      entity: 'LeaveType',
      entityId: id,
      beforeJson: leaveType.toObject()
    });
    return { message: 'Leave type removed successfully' };
  }

  // Holidays
  async getHolidays(year = null) {
    let query = {};
    if (year) {
      query.date = { $regex: `^${year}` };
    }
    return Holiday.find(query).sort({ date: 1 });
  }

  async createHoliday(data, req = null) {
    const holiday = new Holiday(data);
    await holiday.save();

    await recordAudit({
      req,
      action: 'CREATE_HOLIDAY',
      entity: 'Holiday',
      entityId: holiday._id,
      afterJson: holiday.toObject()
    });
    return holiday;
  }

  async updateHoliday(id, data, req = null) {
    const holiday = await Holiday.findById(id);
    if (!holiday) throw new Error('Holiday not found');

    const before = holiday.toObject();
    Object.assign(holiday, data);
    await holiday.save();

    await recordAudit({
      req,
      action: 'UPDATE_HOLIDAY',
      entity: 'Holiday',
      entityId: holiday._id,
      beforeJson: before,
      afterJson: holiday.toObject()
    });
    return holiday;
  }

  async deleteHoliday(id, req = null) {
    const holiday = await Holiday.findById(id);
    if (!holiday) throw new Error('Holiday not found');

    await Holiday.findByIdAndDelete(id);

    await recordAudit({
      req,
      action: 'DELETE_HOLIDAY',
      entity: 'Holiday',
      entityId: id,
      beforeJson: holiday.toObject()
    });
    return { message: 'Holiday removed successfully' };
  }
}

module.exports = new OrgService();
