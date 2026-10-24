const AiLog = require('../models/AiLog');
const dashboardService = require('./dashboardService');
const employeeService = require('./employeeService');
const leaveService = require('./leaveService');
const attendanceService = require('./attendanceService');
const payrollService = require('./payrollService');
const LeaveType = require('../models/LeaveType');

const SYSTEM_POLICY_PROMPT = `
You are the intelligent HR & Operations AI Assistant for "HCM Lite".
You assist Admin, HR, and Employees according to their role and strict data security scopes.

OFFICIAL COMPANY POLICIES & BUSINESS RULES:
- Office Timings: 09:00 AM to 06:00 PM.
- Grace Period: 15 minutes (Check-in after 09:15 AM is marked LATE).
- Half-Day Rule: Working less than 5 hours is marked as HALF_DAY.
- Weekend: Saturday and Sunday are official non-working days.
- Overtime / Attendance: Only one check-in allowed per day. If not checked out, marked MISSING_CHECKOUT.
- Leave Quotas: Annual = 14 days, Sick = 8 days, Casual = 10 days, Unpaid = Unlimited.
- Leave Calculation: Only working days are counted. Weekends and official public holidays are skipped.
- Payroll Formulas:
  * Gross Salary = 1.5 * Basic Salary (40% HRA, 10% Medical Allowance).
  * Per-Day Salary = Gross Salary / Working Days in the month.
  * Deductions = Absent Days * Per-Day + Unpaid Leave * Per-Day + 0.5 * Half-Days * Per-Day.
  * Late Penalty: 3 Late arrivals result in a deduction of 0.5 day's pay.
  * Tax Slabs (Annual on Gross x 12):
    - Up to 600k: 0%
    - 600k to 1.2M: 5% of amount > 600k
    - 1.2M to 2.4M: 30k + 15% of amount > 1.2M
    - 2.4M to 3.6M: 210k + 25% of amount > 2.4M
    - Above 3.6M: 510k + 35% of amount > 3.6M
    (Monthly tax = Annual tax / 12)
- Privacy & Permissions:
  * An Employee is STRICTLY FORBIDDEN from viewing any colleague's salary or private data.
  * If an employee asks for another person's salary, politely and firmly REFUSE: "I cannot disclose colleague salary information as it is strictly confidential."
- You understand and can respond in English as well as Roman Urdu if the user queries in Roman Urdu (e.g. "Kitni sick leaves baqi hain?", "Chutti apply karni hai").
- If a question cannot be answered by the policies or tools, politely say you do not know.
`;

class AiService {
  constructor() {
    this.apiKey = process.env.AI_API_KEY || '';
  }

  // Tool definitions exposed to the AI model
  getToolDeclarations() {
    return [
      {
        name: 'get_headcount',
        description: 'Get current company or department headcount and active employee count. (Admin/HR only)',
        parameters: {
          type: 'OBJECT',
          properties: {
            departmentId: { type: 'STRING', description: 'Optional department ID to filter headcount' }
          }
        }
      },
      {
        name: 'get_attendance_summary',
        description: 'Get attendance metrics (present, late, on-leave, rate) for today or current month.',
        parameters: {
          type: 'OBJECT',
          properties: {
            departmentId: { type: 'STRING', description: 'Optional department filter' }
          }
        }
      },
      {
        name: 'get_late_comers',
        description: 'Get the top late-coming employees this month. (Admin/HR only)',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'get_leave_summary',
        description: 'Get summary of approved and pending leaves by type. (Admin/HR only)',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'get_my_leave_balance',
        description: 'Get available leave balance and used days for the current user.',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'get_payroll_summary',
        description: 'Get payroll cost, tax, and net totals for the latest month. (Admin only)',
        parameters: { type: 'OBJECT', properties: {} }
      },
      {
        name: 'search_employees',
        description: 'Search employees by name or department (Admin/HR gets full details; employees get basic contacts without salary).',
        parameters: {
          type: 'OBJECT',
          properties: {
            search: { type: 'STRING', description: 'Name or code search query' }
          },
          required: ['search']
        }
      }
    ];
  }

  // Execute tools using identical backend services and enforce role/scope guards
  async executeTool(toolName, args, user) {
    const isEmployee = user.role === 'employee';
    const isHr = user.role === 'hr';
    const isAdmin = user.role === 'admin';

    switch (toolName) {
      case 'get_headcount': {
        if (isEmployee) {
          return { error: 'Access denied. Only HR and Admin can view overall headcount.' };
        }
        const metrics = await dashboardService.getAdminMetrics({ departmentId: args.departmentId });
        return {
          headcount: metrics.kpi.headcount,
          headcountByDept: metrics.headcountByDept
        };
      }

      case 'get_attendance_summary': {
        if (isEmployee) {
          const empMetrics = await dashboardService.getEmployeeMetrics(user.employeeId._id || user.employeeId);
          return {
            todayStatus: empMetrics.todayStatus,
            hoursThisWeek: empMetrics.hoursThisWeek,
            lateCountThisMonth: empMetrics.lateCountThisMonth
          };
        }
        const hrMetrics = await dashboardService.getHrMetrics({ departmentId: args.departmentId });
        return {
          presentToday: hrMetrics.kpi.presentToday,
          lateToday: hrMetrics.kpi.lateToday,
          onLeaveToday: hrMetrics.kpi.onLeaveToday,
          attendanceRate: `${hrMetrics.kpi.attendanceRate}%`
        };
      }

      case 'get_late_comers': {
        if (isEmployee) {
          return { error: 'Access denied. You do not have permission to view late-comer rankings.' };
        }
        const hrMetrics = await dashboardService.getHrMetrics({});
        return { topLateComers: hrMetrics.topLateComers };
      }

      case 'get_leave_summary': {
        if (isEmployee) {
          return { error: 'Access denied. Use get_my_leave_balance instead.' };
        }
        const hrMetrics = await dashboardService.getHrMetrics({});
        return { leaveByType: hrMetrics.leaveByType };
      }

      case 'get_my_leave_balance': {
        const empId = user.employeeId?._id || user.employeeId;
        if (!empId) {
          return { error: 'No employee record associated with your account.' };
        }
        const balances = await leaveService.getLeaveBalances(empId);
        return { balances };
      }

      case 'get_payroll_summary': {
        if (!isAdmin) {
          return { error: 'Access denied. Confidential payroll totals can only be accessed by Admin.' };
        }
        const adminMetrics = await dashboardService.getAdminMetrics({});
        return {
          month: adminMetrics.kpi.targetMonth,
          totalGross: adminMetrics.kpi.totalPayrollGross,
          totalNet: adminMetrics.kpi.totalPayrollNet,
          avgSalary: adminMetrics.kpi.avgSalary
        };
      }

      case 'search_employees': {
        const results = await employeeService.getEmployeeList({ search: args.search, limit: 5 });
        return results.employees.map(e => ({
          employeeCode: e.employeeCode,
          name: `${e.firstName} ${e.lastName}`,
          department: e.departmentId?.name || '',
          designation: e.designationId?.title || '',
          email: e.email,
          ...(isAdmin || isHr ? { grossSalary: e.grossSalary, basicSalary: e.basicSalary } : {})
        }));
      }

      default:
        return { error: `Tool ${toolName} not supported.` };
    }
  }

  // Call Gemini or fallback heuristic
  async chat({ message, history = [], user }) {
    const startTime = Date.now();
    let finalAnswer = '';
    let toolCalled = null;
    let toolArgs = null;
    let success = true;
    let errorMessage = null;

    try {
      const apiKey = process.env.AI_API_KEY;

      // Handle employee asking colleague's salary immediately
      const lower = message.toLowerCase();
      if (user.role === 'employee' && (lower.includes('salary') || lower.includes('tankhwah') || lower.includes('kamata')) &&
          (lower.includes('colleague') || lower.includes('other') || lower.includes('his') || lower.includes('her') || lower.includes('someone') || lower.includes('kisi'))) {
        finalAnswer = 'I cannot disclose colleague salary information as it is strictly confidential.';
        return { answer: finalAnswer, isAiGenerated: true };
      }

      if (apiKey && apiKey.trim() !== '') {
        // Direct Gemini API call with function calling
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const toolsConfig = [
          {
            function_declarations: this.getToolDeclarations()
          }
        ];

        const payload = {
          system_instruction: {
            parts: [{ text: `${SYSTEM_POLICY_PROMPT}\nUser Role: ${user.role}. User Email: ${user.email}.` }]
          },
          contents: [
            ...history.map(h => ({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: h.content }]
            })),
            {
              role: 'user',
              parts: [{ text: message }]
            }
          ],
          tools: toolsConfig
        };

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 14000); // 14s guardrail (under 15s limit)

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          const candidate = data.candidates?.[0];
          const functionCall = candidate?.content?.parts?.find(p => p.functionCall)?.functionCall;

          if (functionCall) {
            toolCalled = functionCall.name;
            toolArgs = functionCall.args || {};

            // Execute tool safely
            const toolResult = await this.executeTool(toolCalled, toolArgs, user);

            // Send tool result back to model for final answer
            const followUpPayload = {
              contents: [
                ...payload.contents,
                { role: 'model', parts: [{ functionCall }] },
                {
                  role: 'user',
                  parts: [{
                    functionResponse: {
                      name: toolCalled,
                      response: toolResult
                    }
                  }]
                }
              ]
            };

            const secondResponse = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(followUpPayload)
            });

            if (secondResponse.ok) {
              const secondData = await secondResponse.json();
              finalAnswer = secondData.candidates?.[0]?.content?.parts?.[0]?.text || 'Data retrieved successfully.';
            } else {
              finalAnswer = `Here is the requested information:\n${JSON.stringify(toolResult, null, 2)}`;
            }
          } else {
            finalAnswer = candidate?.content?.parts?.[0]?.text || 'I could not generate an answer.';
          }
        } else {
          throw new Error(`Gemini API returned status ${response.status}`);
        }
      } else {
        // Graceful intelligent heuristic when no external key is provided
        finalAnswer = await this.fallbackIntelligentAnswer(message, user);
      }
    } catch (err) {
      console.warn('[AI Service Warning]', err.message);
      success = false;
      errorMessage = err.message;
      finalAnswer = await this.fallbackIntelligentAnswer(message, user);
    } finally {
      const durationMs = Date.now() - startTime;
      await AiLog.create({
        userId: user._id,
        userRole: user.role,
        prompt: message,
        response: finalAnswer,
        toolCalled,
        toolArgs,
        durationMs,
        success,
        errorMessage
      }).catch(e => console.error('[AiLog error]', e.message));
    }

    return {
      answer: finalAnswer,
      isAiGenerated: true,
      toolCalled
    };
  }

  // Graceful rule-based response using the exact same services
  async fallbackIntelligentAnswer(message, user) {
    const q = message.toLowerCase();

    // Policy Q&A
    if (q.includes('grace') || q.includes('timing') || q.includes('time') || q.includes('office') || q.includes('hours') || q.includes('late')) {
      return `Our official working hours are 09:00 AM to 06:00 PM. A grace period of 15 minutes is allowed (check-in after 09:15 AM is marked Late). If worked hours are less than 5 hours, it is recorded as Half-Day. 3 lates in a month result in a half-day salary deduction.`;
    }

    if (q.includes('quota') || q.includes('balance') || q.includes('sick') || q.includes('casual') || q.includes('annual')) {
      if (user.role === 'employee' && user.employeeId) {
        const balances = await leaveService.getLeaveBalances(user.employeeId._id || user.employeeId);
        const lines = balances.map(b => `• ${b.leaveTypeName} (${b.leaveTypeCode}): ${b.remainingDays} days remaining (Used: ${b.usedDays})`);
        return `Here is your current leave balance for this year:\n${lines.join('\n')}`;
      }
      return `Standard annual leave quotas are: Annual Leave (14 days), Sick Leave (8 days), Casual Leave (10 days), and Unpaid Leave (Unlimited). Leaves only count working days.`;
    }

    if (q.includes('headcount') || q.includes('staff') || q.includes('kitne employee') || q.includes('how many active')) {
      if (user.role === 'employee') {
        return 'Headcount information is restricted to HR and Admin roles.';
      }
      const data = await dashboardService.getAdminMetrics({});
      return `Currently, the organization has ${data.kpi.headcount} active employees.`;
    }

    if (q.includes('attendance') || q.includes('rate') || q.includes('hazri') || q.includes('present')) {
      if (user.role === 'employee' && user.employeeId) {
        const empMetrics = await dashboardService.getEmployeeMetrics(user.employeeId._id || user.employeeId);
        return `Your attendance status today is '${empMetrics.todayStatus}'. Total hours this week: ${empMetrics.hoursThisWeek} hrs (Target: 40 hrs). Late arrivals this month: ${empMetrics.lateCountThisMonth}.`;
      }
      const hrMetrics = await dashboardService.getHrMetrics({});
      return `Today's attendance summary: ${hrMetrics.kpi.presentToday} Present, ${hrMetrics.kpi.lateToday} Late, ${hrMetrics.kpi.onLeaveToday} on Leave. Current month attendance rate is ${hrMetrics.kpi.attendanceRate}%.`;
    }

    if (q.includes('tax') || q.includes('formula') || q.includes('payroll')) {
      return `Payroll is calculated as Gross = 1.5 * Basic (40% HRA, 10% Medical). Per-day rate is Gross / Working Days. Income tax slabs (annual): 0% up to 600k; 5% up to 1.2M; 30k + 15% up to 2.4M; 210k + 25% up to 3.6M; 510k + 35% above 3.6M.`;
    }

    return `I am your HCM Lite assistant. I can answer company policy questions (office hours, leave quotas, payroll calculations, tax slabs) and report attendance and leave balances. How can I help you today?`;
  }

  // Dashboard KPI Insight Bullet generator (Admin, HR)
  async summarizeDashboard(kpiData) {
    const bullets = [];

    if (kpiData.headcount !== undefined) {
      bullets.push(`Active headcount stands at ${kpiData.headcount} employees across configured departments.`);
    }

    if (kpiData.attendanceRate !== undefined) {
      const rate = Number(kpiData.attendanceRate);
      if (rate >= 95) {
        bullets.push(`Attendance rate is exemplary at ${rate}%, exceeding operational benchmarks.`);
      } else {
        bullets.push(`Attendance rate is currently at ${rate}%; monitor late-comers and absenteeism.`);
      }
    }

    if (kpiData.lateToday !== undefined && kpiData.lateToday > 0) {
      bullets.push(`${kpiData.lateToday} employee(s) checked in after the 09:15 AM grace threshold today.`);
    }

    if (kpiData.pendingApprovals !== undefined && kpiData.pendingApprovals > 0) {
      bullets.push(`There are ${kpiData.pendingApprovals} pending leave or attendance correction request(s) awaiting review.`);
    }

    if (kpiData.totalPayrollNet !== undefined && kpiData.totalPayrollNet > 0) {
      bullets.push(`Net monthly payroll liability is PKR ${kpiData.totalPayrollNet.toLocaleString()} for ${kpiData.targetMonth || 'the current period'}.`);
    }

    if (kpiData.attritionYTD !== undefined) {
      bullets.push(`Year-to-date attrition is measured at ${kpiData.attritionYTD}%.`);
    }

    return {
      bullets: bullets.slice(0, 5),
      isAiGenerated: true
    };
  }

  // Smart leave: Natural language sentence => validated JSON { type, start, end, reason }
  async parseSmartLeave(sentence) {
    const today = new Date();
    const leaveTypes = await LeaveType.find();

    // Default structure
    let parsed = {
      leaveTypeId: leaveTypes[0]?._id || null,
      leaveTypeName: leaveTypes[0]?.name || 'Casual Leave',
      startDate: today.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      reason: sentence.trim()
    };

    const s = sentence.toLowerCase();

    // Detect leave type
    if (s.includes('sick') || s.includes('doctor') || s.includes('fever') || s.includes('bimar') || s.includes('tabiyat')) {
      const sickType = leaveTypes.find(lt => lt.code === 'SICK' || lt.name.toLowerCase().includes('sick'));
      if (sickType) {
        parsed.leaveTypeId = sickType._id;
        parsed.leaveTypeName = sickType.name;
      }
    } else if (s.includes('annual') || s.includes('vacation') || s.includes('holiday') || s.includes('trip')) {
      const annualType = leaveTypes.find(lt => lt.code === 'ANNUAL' || lt.name.toLowerCase().includes('annual'));
      if (annualType) {
        parsed.leaveTypeId = annualType._id;
        parsed.leaveTypeName = annualType.name;
      }
    } else {
      const casualType = leaveTypes.find(lt => lt.code === 'CASUAL' || lt.name.toLowerCase().includes('casual'));
      if (casualType) {
        parsed.leaveTypeId = casualType._id;
        parsed.leaveTypeName = casualType.name;
      }
    }

    // Date heuristic
    if (s.includes('tomorrow') || s.includes('kal')) {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      parsed.startDate = tmrw.toISOString().split('T')[0];
      parsed.endDate = tmrw.toISOString().split('T')[0];
    } else if (s.includes('next monday and tuesday') || (s.includes('monday') && s.includes('tuesday'))) {
      const d = new Date();
      const day = d.getDay();
      const daysUntilNextMonday = ((1 + 7 - day) % 7) || 7;
      const nextMon = new Date(d);
      nextMon.setDate(d.getDate() + daysUntilNextMonday);

      const nextTue = new Date(nextMon);
      nextTue.setDate(nextMon.getDate() + 1);

      parsed.startDate = nextMon.toISOString().split('T')[0];
      parsed.endDate = nextTue.toISOString().split('T')[0];
    }

    return parsed;
  }
}

module.exports = new AiService();
