const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const Designation = require('../models/Designation');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');
const Payslip = require('../models/Payslip');
const { recordAudit } = require('../middleware/audit');

class EmployeeService {
  async registerEmployee(data, req = null) {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      address,
      gender,
      dateOfBirth,
      joiningDate,
      status = 'probation',
      departmentId,
      designationId,
      basicSalary,
      otherAllowances = 0,
      temporaryPassword
    } = data;

    // Check unique email and code
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      const err = new Error('A user or employee with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    const existingCode = await Employee.findOne({ employeeCode: employeeCode.toUpperCase().trim() });
    if (existingCode) {
      const err = new Error('An employee with this employee code already exists.');
      err.statusCode = 409;
      throw err;
    }

    // Verify dept and designation
    const dept = await Department.findById(departmentId);
    if (!dept) {
      const err = new Error('Selected department does not exist.');
      err.statusCode = 404;
      throw err;
    }

    const desig = await Designation.findById(designationId);
    if (!desig) {
      const err = new Error('Selected designation does not exist.');
      err.statusCode = 404;
      throw err;
    }

    const numBasic = Number(basicSalary);
    if (isNaN(numBasic) || numBasic <= 0) {
      const err = new Error('Basic salary must be greater than zero.');
      err.statusCode = 422;
      throw err;
    }

    const hra = numBasic * 0.40;
    const medical = numBasic * 0.10;
    const grossSalary = numBasic * 1.5 + Number(otherAllowances || 0);

    const tempPassword = temporaryPassword || 'Welcome@123';

    // Create User first
    const user = new User({
      email: email.toLowerCase().trim(),
      password: tempPassword,
      role: 'employee',
      status: 'active',
      mustChangePassword: true
    });
    await user.save();

    // Create Employee record
    const employee = new Employee({
      employeeCode: employeeCode.toUpperCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || '',
      address: address || '',
      gender: gender || 'Male',
      dateOfBirth: dateOfBirth || null,
      joiningDate: joiningDate || new Date(),
      status,
      departmentId,
      designationId,
      basicSalary: numBasic,
      hra,
      medical,
      otherAllowances: Number(otherAllowances || 0),
      grossSalary,
      userId: user._id
    });
    await employee.save();

    user.employeeId = employee._id;
    await user.save();

    await recordAudit({
      req,
      action: 'REGISTER_EMPLOYEE',
      entity: 'Employee',
      entityId: employee._id,
      afterJson: {
        employeeCode: employee.employeeCode,
        fullName: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        department: dept.name,
        grossSalary
      }
    });

    return {
      employee: await employee.populate(['departmentId', 'designationId']),
      temporaryPassword: tempPassword
    };
  }

  async updateEmployee(id, updateData, req = null) {
    const employee = await Employee.findById(id);
    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    const isEmployeeSelf = req.user.role === 'employee';
    const before = employee.toObject();

    if (isEmployeeSelf) {
      // Employee self-service: edit only phone and address
      if (updateData.phone !== undefined) employee.phone = updateData.phone;
      if (updateData.address !== undefined) employee.address = updateData.address;
    } else {
      // HR or Admin
      if (updateData.firstName) employee.firstName = updateData.firstName.trim();
      if (updateData.lastName) employee.lastName = updateData.lastName.trim();
      if (updateData.phone !== undefined) employee.phone = updateData.phone;
      if (updateData.address !== undefined) employee.address = updateData.address;
      if (updateData.gender) employee.gender = updateData.gender;
      if (updateData.dateOfBirth) employee.dateOfBirth = updateData.dateOfBirth;
      if (updateData.joiningDate) employee.joiningDate = updateData.joiningDate;
      if (updateData.exitDate !== undefined) employee.exitDate = updateData.exitDate;
      if (updateData.status) employee.status = updateData.status;
      if (updateData.departmentId) employee.departmentId = updateData.departmentId;
      if (updateData.designationId) employee.designationId = updateData.designationId;

      if (updateData.basicSalary !== undefined) {
        const numBasic = Number(updateData.basicSalary);
        employee.basicSalary = numBasic;
        employee.hra = numBasic * 0.40;
        employee.medical = numBasic * 0.10;
        employee.grossSalary = numBasic * 1.5 + (employee.otherAllowances || 0);
      }
      if (updateData.otherAllowances !== undefined) {
        employee.otherAllowances = Number(updateData.otherAllowances);
        employee.grossSalary = employee.basicSalary * 1.5 + employee.otherAllowances;
      }
    }

    await employee.save();
    await employee.populate(['departmentId', 'designationId']);

    await recordAudit({
      req,
      action: isEmployeeSelf ? 'UPDATE_SELF_PROFILE' : 'UPDATE_EMPLOYEE_DETAILS',
      entity: 'Employee',
      entityId: employee._id,
      beforeJson: before,
      afterJson: employee.toObject()
    });

    return employee;
  }

  async getEmployeeList({ search, departmentId, status, page = 1, limit = 20 }) {
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { employeeCode: searchRegex }
      ];
    }

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (status) {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [total, employees] = await Promise.all([
      Employee.countDocuments(query),
      Employee.find(query)
        .populate('departmentId', 'name code')
        .populate('designationId', 'title level')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
    ]);

    return {
      employees,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    };
  }

  async getEmployee360(id) {
    const employee = await Employee.findById(id)
      .populate('departmentId', 'name code')
      .populate('designationId', 'title level')
      .populate('userId', 'email role status lastLogin mustChangePassword');

    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      throw err;
    }

    // Recent attendance records (last 30 days)
    const recentAttendance = await Attendance.find({ employeeId: id })
      .sort({ date: -1 })
      .limit(30);

    // Leave history
    const leaveHistory = await LeaveRequest.find({ employeeId: id })
      .populate('leaveTypeId', 'name code')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent payslips
    const recentPayslips = await Payslip.find({ employeeId: id })
      .sort({ month: -1 })
      .limit(6);

    return {
      employee,
      recentAttendance,
      leaveHistory,
      recentPayslips
    };
  }

  async dryRunCsv(fileBuffer) {
    const records = parse(fileBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    const departments = await Department.find();
    const deptMap = new Map();
    departments.forEach(d => {
      deptMap.set(d.name.toLowerCase(), d);
      deptMap.set(d.code.toLowerCase(), d);
    });

    const designations = await Designation.find();
    const desigMap = new Map();
    designations.forEach(d => {
      desigMap.set(d.title.toLowerCase(), d);
    });

    const existingUsers = await User.find().select('email');
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

    const existingEmployees = await Employee.find().select('employeeCode email');
    const existingCodes = new Set(existingEmployees.map(e => e.employeeCode.toUpperCase()));

    const seenEmails = new Set();
    const seenCodes = new Set();

    const errors = [];
    const validRows = [];

    records.forEach((row, index) => {
      const rowNum = index + 2; // considering 1-based index with header line
      const rowErrors = [];

      // Validate required fields
      const requiredFields = ['employeeCode', 'firstName', 'lastName', 'email', 'department', 'designation', 'basicSalary'];
      for (const field of requiredFields) {
        if (!row[field] || !row[field].trim()) {
          rowErrors.push({ row: rowNum, field, reason: `Field '${field}' is required and cannot be empty.` });
        }
      }

      // Check unique code
      const code = (row.employeeCode || '').trim().toUpperCase();
      if (code) {
        if (existingCodes.has(code) || seenCodes.has(code)) {
          rowErrors.push({ row: rowNum, field: 'employeeCode', reason: `Employee code '${code}' is already in use.` });
        } else {
          seenCodes.add(code);
        }
      }

      // Check email
      const email = (row.email || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email) {
        if (!emailRegex.test(email)) {
          rowErrors.push({ row: rowNum, field: 'email', reason: `Invalid email address format '${email}'.` });
        } else if (existingEmails.has(email) || seenEmails.has(email)) {
          rowErrors.push({ row: rowNum, field: 'email', reason: `Email address '${email}' is already registered.` });
        } else {
          seenEmails.add(email);
        }
      }

      // Check department
      const deptName = (row.department || '').trim().toLowerCase();
      const matchedDept = deptMap.get(deptName);
      if (deptName && !matchedDept) {
        rowErrors.push({ row: rowNum, field: 'department', reason: `Unknown department '${row.department}'. Must match an existing department.` });
      }

      // Check designation
      const desigTitle = (row.designation || '').trim().toLowerCase();
      const matchedDesig = desigMap.get(desigTitle);
      if (desigTitle && !matchedDesig) {
        rowErrors.push({ row: rowNum, field: 'designation', reason: `Unknown designation '${row.designation}'. Must match an existing designation.` });
      }

      // Check basicSalary
      const salary = Number(row.basicSalary);
      if (isNaN(salary) || salary <= 0) {
        rowErrors.push({ row: rowNum, field: 'basicSalary', reason: 'Salary must be a valid positive number greater than 0.' });
      }

      // Check joiningDate
      if (row.joiningDate) {
        const d = new Date(row.joiningDate);
        if (isNaN(d.getTime())) {
          rowErrors.push({ row: rowNum, field: 'joiningDate', reason: 'Joining date must be a valid ISO format (YYYY-MM-DD).' });
        }
      }

      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        validRows.push({
          rowNum,
          data: {
            employeeCode: code,
            firstName: row.firstName.trim(),
            lastName: row.lastName.trim(),
            email,
            phone: row.phone || '',
            address: row.address || '',
            gender: row.gender || 'Male',
            joiningDate: row.joiningDate ? new Date(row.joiningDate) : new Date(),
            departmentId: matchedDept._id,
            designationId: matchedDesig._id,
            basicSalary: salary,
            otherAllowances: Number(row.otherAllowances || 0)
          }
        });
      }
    });

    return {
      totalRows: records.length,
      validCount: validRows.length,
      errorCount: errors.length,
      errors,
      canImport: errors.length === 0 && validRows.length > 0
    };
  }

  async executeCsvImport(fileBuffer, req = null) {
    const dryRun = await this.dryRunCsv(fileBuffer);
    if (!dryRun.canImport) {
      const err = new Error('CSV validation failed. Please fix all errors before importing.');
      err.statusCode = 422;
      err.errors = dryRun.errors;
      throw err;
    }

    const createdEmployees = [];
    for (const validItem of dryRun.validRows) {
      const { data } = validItem;
      const res = await this.registerEmployee(data, req);
      createdEmployees.push(res.employee);
    }

    await recordAudit({
      req,
      action: 'CSV_IMPORT_EMPLOYEES',
      entity: 'Employee',
      afterJson: { count: createdEmployees.length }
    });

    return {
      message: `Successfully imported ${createdEmployees.length} employees.`,
      count: createdEmployees.length
    };
  }

  async exportCsv() {
    const employees = await Employee.find()
      .populate('departmentId', 'name code')
      .populate('designationId', 'title')
      .sort({ employeeCode: 1 });

    const rows = employees.map(emp => ({
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      address: emp.address || '',
      gender: emp.gender,
      department: emp.departmentId?.name || '',
      designation: emp.designationId?.title || '',
      status: emp.status,
      basicSalary: emp.basicSalary,
      hra: emp.hra,
      medical: emp.medical,
      otherAllowances: emp.otherAllowances,
      grossSalary: emp.grossSalary,
      joiningDate: emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : ''
    }));

    return stringify(rows, { header: true });
  }
}

module.exports = new EmployeeService();
