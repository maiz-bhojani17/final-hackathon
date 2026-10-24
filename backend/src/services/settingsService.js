const Settings = require('../models/Settings');
const { recordAudit } = require('../middleware/audit');

class SettingsService {
  async getSettings() {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    return settings;
  }

  async updateSettings(updateData, req = null) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings(updateData);
    }

    const before = settings.toObject();

    if (updateData.companyName !== undefined) settings.companyName = updateData.companyName;
    if (updateData.workStartTime !== undefined) settings.workStartTime = updateData.workStartTime;
    if (updateData.workEndTime !== undefined) settings.workEndTime = updateData.workEndTime;
    if (updateData.gracePeriodMinutes !== undefined) settings.gracePeriodMinutes = Number(updateData.gracePeriodMinutes);
    if (updateData.halfDayHours !== undefined) settings.halfDayHours = Number(updateData.halfDayHours);
    if (updateData.weekendDays !== undefined) settings.weekendDays = updateData.weekendDays;
    if (updateData.officeLocation !== undefined) {
      settings.officeLocation = {
        lat: Number(updateData.officeLocation.lat ?? settings.officeLocation.lat),
        lng: Number(updateData.officeLocation.lng ?? settings.officeLocation.lng),
        radiusMeters: Number(updateData.officeLocation.radiusMeters ?? settings.officeLocation.radiusMeters),
        address: updateData.officeLocation.address ?? settings.officeLocation.address
      };
    }
    if (updateData.latePenaltyEnabled !== undefined) settings.latePenaltyEnabled = Boolean(updateData.latePenaltyEnabled);
    if (updateData.currency !== undefined) settings.currency = updateData.currency;

    await settings.save();

    await recordAudit({
      req,
      action: 'UPDATE_COMPANY_SETTINGS',
      entity: 'Settings',
      entityId: settings._id,
      beforeJson: before,
      afterJson: settings.toObject()
    });

    return settings;
  }
}

module.exports = new SettingsService();
