import mongoose from "mongoose";
import asyncHandler from "../middlewares/asyncHandler.js";
import User from "../modals/user.js";
import Facility from "../modals/facility.js";
import FacilityAuditor from "../modals/facilityAuditor.js";
import UtilityAccount from "../modals/utilityAccount.js";
import PresenceLog from "../modals/presenceLog.js";
import RecentActivity from "../modals/recentActivity.js";
import { isUtilityAuditCompleted } from "../helpers/auditState.js";
import { isAdmin as isPlatformAdmin } from "../services/authorization/index.js";

const IST_OFFSET_MINUTES = 330;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

const getISTDateParts = (date = new Date()) => {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
  };
};

const getISTDayRange = (daysAgo = 0) => {
  const now = new Date();
  const { year, month, day } = getISTDateParts(now);
  const baseMidnightUtcMs =
    Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS;
  const startMs = baseMidnightUtcMs - daysAgo * 24 * 60 * 60 * 1000;
  return {
    dayStart: new Date(startMs),
    dayEnd: new Date(startMs + 24 * 60 * 60 * 1000),
  };
};

const getISTDateKey = (date = new Date()) => {
  const { year, month, day } = getISTDateParts(date);
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
};

const assertAccessAndGetUser = async (requester, userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error("Invalid user id");
    err.statusCode = 400;
    throw err;
  }

  const requesterId = String(requester?._id || "");
  const adminUser = isPlatformAdmin(requester);
  if (!adminUser && requesterId !== String(userId)) {
    const err = new Error("Access denied");
    err.statusCode = 403;
    throw err;
  }

  const user = await User.findById(userId).select("name email role status").lean();
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }
  return user;
};

const applyHttpError = (res, error) => {
  if (error?.statusCode) {
    res.status(error.statusCode);
  }
  throw error;
};

const getConnectedFacilityIds = async (userId) => {
  const assignedFacilityIds = await FacilityAuditor.find({
    user_id: userId,
  }).distinct("facility_id");
  const facilities = await Facility.find({
    $or: [
      { _id: { $in: assignedFacilityIds } },
      { owner_user_id: userId },
      { auditor_id: userId },
    ],
  })
    .select("_id")
    .lean();
  return [...new Set(facilities.map((f) => String(f._id)))];
};

const getConnectedUtilities = async (userId, facilityIds) => {
  return UtilityAccount.find({
    $or: [{ facility_id: { $in: facilityIds } }, { auditor_id: userId }],
  })
    .populate("facility_id", "name city")
    .select(
      "account_number connection_type category is_active facility_id audit_step_submissions",
    )
    .sort({ created_at: -1, createdAt: -1 })
    .lean();
};

const getPresenceFilter = (query) => {
  const filterType =
    query?.filter_type === "date" || query?.filter_type === "month"
      ? query.filter_type
      : "date";
  return {
    filterType,
    selectedDateRaw: query?.date,
    selectedMonthRaw: query?.month,
    selectedYearRaw: query?.year,
  };
};

const buildPresenceDays = ({ filterType, selectedDateRaw, selectedMonthRaw, selectedYearRaw }) => {
  const days = [];
  if (filterType === "month") {
    const nowIST = getISTDateParts(new Date());
    const monthNum = Number(selectedMonthRaw);
    const yearNum = Number(selectedYearRaw);
    const month =
      Number.isInteger(monthNum) && monthNum >= 1 && monthNum <= 12
        ? monthNum
        : nowIST.month + 1;
    const year =
      Number.isInteger(yearNum) && yearNum >= 1970 && yearNum <= 9999
        ? yearNum
        : nowIST.year;

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayStart = new Date(
        Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS,
      );
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      days.push({ dayStart, dayEnd });
    }
    return {
      days,
      presenceFilter: { filter_type: "month", date: null, month, year },
    };
  }

  let dayStart;
  let dayEnd;
  if (
    typeof selectedDateRaw === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(selectedDateRaw)
  ) {
    const [y, m, d] = selectedDateRaw.split("-").map(Number);
    const startMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS;
    dayStart = new Date(startMs);
    dayEnd = new Date(startMs + 24 * 60 * 60 * 1000);
  } else {
    const range = getISTDayRange(0);
    dayStart = range.dayStart;
    dayEnd = range.dayEnd;
  }

  return {
    days: [{ dayStart, dayEnd }],
    presenceFilter: {
      filter_type: "date",
      date:
        typeof selectedDateRaw === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(selectedDateRaw)
          ? selectedDateRaw
          : getISTDateKey(new Date()),
      month: null,
      year: null,
    },
  };
};

const getUserPerformanceSummary = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await assertAccessAndGetUser(req.user, userId);
    const facilityIds = await getConnectedFacilityIds(userId);
    const connectedFacilityCount = facilityIds.length;

    const utilities = await UtilityAccount.find({
      $or: [{ facility_id: { $in: facilityIds } }, { auditor_id: userId }],
    })
      .select("audit_step_submissions")
      .lean();

    const connectedUtilitiesCount = utilities.length;
    const completedUtilitiesCount = utilities.filter((u) =>
      isUtilityAuditCompleted(u),
    ).length;

    res.status(200).json({
      success: true,
      data: {
        user,
        widgets: {
          connected_facilities: connectedFacilityCount,
          connected_utility_accounts: connectedUtilitiesCount,
          completed_utility_account_audits: completedUtilitiesCount,
          completion_percent:
            connectedUtilitiesCount > 0
              ? Number(
                  ((completedUtilitiesCount / connectedUtilitiesCount) * 100).toFixed(2),
                )
              : 0,
        },
      },
    });
  } catch (error) {
    applyHttpError(res, error);
  }
});

const getUserPerformanceFacilities = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    await assertAccessAndGetUser(req.user, userId);

    const assignedFacilityIds = await FacilityAuditor.find({
      user_id: userId,
    }).distinct("facility_id");

    const facilities = await Facility.find({
      $or: [
        { _id: { $in: assignedFacilityIds } },
        { owner_user_id: userId },
        { auditor_id: userId },
      ],
    })
      .select("name city status facility_type audit_closure")
      .sort({ created_at: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: facilities.length,
      data: facilities.map((facility) => ({
        _id: String(facility._id),
        name: facility.name || "",
        city: facility.city || "",
        status: facility.status || "",
        facility_type: facility.facility_type || "",
        audit_closed: Boolean(facility?.audit_closure?.closed_at),
      })),
    });
  } catch (error) {
    applyHttpError(res, error);
  }
});

const getUserPerformanceUtilityAccounts = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    await assertAccessAndGetUser(req.user, userId);
    const facilityIds = await getConnectedFacilityIds(userId);
    const utilities = await getConnectedUtilities(userId, facilityIds);

    res.status(200).json({
      success: true,
      count: utilities.length,
      data: utilities.map((utility) => ({
        _id: String(utility._id),
        account_number: utility.account_number || "",
        connection_type: utility.connection_type || "",
        category: utility.category || "",
        is_active: Boolean(utility.is_active),
        facility: utility.facility_id
          ? {
              _id: String(utility.facility_id?._id || ""),
              name: utility.facility_id?.name || "",
              city: utility.facility_id?.city || "",
            }
          : null,
        audit_completed: isUtilityAuditCompleted(utility),
      })),
    });
  } catch (error) {
    applyHttpError(res, error);
  }
});

const getUserPerformanceCompletedAudits = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    await assertAccessAndGetUser(req.user, userId);
    const facilityIds = await getConnectedFacilityIds(userId);
    const utilities = await getConnectedUtilities(userId, facilityIds);
    const completed = utilities.filter((utility) => isUtilityAuditCompleted(utility));

    const completedByIds = [
      ...new Set(
        completed
          .map((utility) => {
            const submittedBy =
              utility?.audit_step_submissions?.["preview-and-submit"]?.submitted_by ||
              utility?.audit_step_submissions?.preview_and_submit?.submitted_by;
            if (!submittedBy) return "";
            if (typeof submittedBy === "string") return submittedBy;
            if (submittedBy?._id) return String(submittedBy._id);
            return String(submittedBy);
          })
          .filter(Boolean),
      ),
    ];
    const completedByUsers = completedByIds.length
      ? await User.find({ _id: { $in: completedByIds } }).select("name email").lean()
      : [];
    const completedByMap = new Map(
      completedByUsers.map((u) => [String(u._id), u.name || u.email || "Unknown User"]),
    );

    res.status(200).json({
      success: true,
      count: completed.length,
      data: completed.map((utility) => {
        const submittedBy =
          utility?.audit_step_submissions?.["preview-and-submit"]?.submitted_by ||
          utility?.audit_step_submissions?.preview_and_submit?.submitted_by;
        const submittedById =
          typeof submittedBy === "string"
            ? submittedBy
            : submittedBy?._id
              ? String(submittedBy._id)
              : submittedBy
                ? String(submittedBy)
                : "";
        return {
          _id: String(utility._id),
          account_number: utility.account_number || "",
          facility: utility.facility_id
            ? {
                _id: String(utility.facility_id?._id || ""),
                name: utility.facility_id?.name || "",
                city: utility.facility_id?.city || "",
              }
            : null,
          completed_at:
            utility?.audit_step_submissions?.["preview-and-submit"]?.submitted_at ||
            utility?.audit_step_submissions?.preview_and_submit?.submitted_at ||
            null,
          completed_by: completedByMap.get(submittedById) || "",
        };
      }),
    });
  } catch (error) {
    applyHttpError(res, error);
  }
});

const getUserPerformancePresence = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    await assertAccessAndGetUser(req.user, userId);
    const { filterType, selectedDateRaw, selectedMonthRaw, selectedYearRaw } =
      getPresenceFilter(req.query || {});
    const { days, presenceFilter } = buildPresenceDays({
      filterType,
      selectedDateRaw,
      selectedMonthRaw,
      selectedYearRaw,
    });

    const summaries = await Promise.all(
      days.map(async ({ dayStart, dayEnd }) => {
        // Run presence summary and mode-split activity counts in parallel
        const [summary, activityModes] = await Promise.all([
          PresenceLog.getDailySummary({ userId: String(userId), dayStart, dayEnd }),
          RecentActivity.aggregate([
            {
              $match: {
                actor_id: new mongoose.Types.ObjectId(String(userId)),
                createdAt: { $gte: dayStart, $lt: dayEnd },
              },
            },
            { $group: { _id: "$mode", count: { $sum: 1 } } },
          ]),
        ]);

        let totalActivities = 0;
        let onsiteActivities = 0;
        let offsiteActivities = 0;
        for (const item of activityModes) {
          const cnt = item.count || 0;
          totalActivities += cnt;
          if (item._id === "onsite") onsiteActivities += cnt;
          else if (item._id === "offsite") offsiteActivities += cnt;
        }

        return {
          date: getISTDateKey(dayStart),
          first_login_at: summary.firstLoginAt,
          last_logout_at: summary.lastLogoutAt,
          onsite_login_at: summary.onsiteLoginAt,
          offsite_login_at: summary.offsiteLoginAt,
          screen_time_minutes: summary.screenTimeMinutes,
          screen_time_hours: summary.screenTimeHours,
          onsite_screen_time_minutes: summary.onsiteScreenTimeMinutes,
          onsite_screen_time_hours: summary.onsiteScreenTimeHours,
          offsite_screen_time_minutes: summary.offsiteScreenTimeMinutes,
          offsite_screen_time_hours: summary.offsiteScreenTimeHours,
          activity_count: totalActivities,
          onsite_activity_count: onsiteActivities,
          offsite_activity_count: offsiteActivities,
        };
      }),
    );


    res.status(200).json({
      success: true,
      data: {
        daywise_presence: summaries,
        presence_filter: presenceFilter,
      },
    });
  } catch (error) {
    applyHttpError(res, error);
  }
});

const getUserPerformancePresenceActivities = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    await assertAccessAndGetUser(req.user, userId);
    const { date: selectedDateRaw } = req.query || {};

    let dayStart;
    let dayEnd;
    if (
      typeof selectedDateRaw === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(selectedDateRaw)
    ) {
      const [y, m, d] = selectedDateRaw.split("-").map(Number);
      const startMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - IST_OFFSET_MS;
      dayStart = new Date(startMs);
      dayEnd = new Date(startMs + 24 * 60 * 60 * 1000);
    } else {
      const range = getISTDayRange(0);
      dayStart = range.dayStart;
      dayEnd = range.dayEnd;
    }

    const summary = await PresenceLog.getDailySummary({
      userId: String(userId),
      dayStart,
      dayEnd,
    });

    if (!summary.firstLoginAt) {
      return res.status(200).json({
        success: true,
        data: {
          date: getISTDateKey(dayStart),
          first_login_at: null,
          last_logout_at: null,
          onsite_login_at: null,
          offsite_login_at: null,
          screen_time_minutes: 0,
          screen_time_hours: 0,
          onsite_screen_time_minutes: 0,
          onsite_screen_time_hours: 0,
          offsite_screen_time_minutes: 0,
          offsite_screen_time_hours: 0,
          activity_count: 0,
          onsite_activity_count: 0,
          offsite_activity_count: 0,
          activities: [],
        },
      });
    }

    const periodStart = new Date(summary.firstLoginAt);
    const periodEnd = new Date(summary.lastLogoutAt || dayEnd);
    const activities = await RecentActivity.find({
      actor_id: userId,
      createdAt: {
        $gte: periodStart,
        $lte: periodEnd,
      },
    })
      .sort({ createdAt: -1 })
      .select(
        "action entity_type entity_name message createdAt facility_id utility_account_id mode",
      )
      .lean();

    const onsiteActivities = activities.filter((a) => a.mode === "onsite").length;
    const offsiteActivities = activities.filter((a) => a.mode === "offsite").length;

    res.status(200).json({
      success: true,
      data: {
        date: getISTDateKey(dayStart),
        first_login_at: summary.firstLoginAt,
        last_logout_at: summary.lastLogoutAt,
        onsite_login_at: summary.onsiteLoginAt,
        offsite_login_at: summary.offsiteLoginAt,
        screen_time_minutes: summary.screenTimeMinutes,
        screen_time_hours: summary.screenTimeHours,
        onsite_screen_time_minutes: summary.onsiteScreenTimeMinutes,
        onsite_screen_time_hours: summary.onsiteScreenTimeHours,
        offsite_screen_time_minutes: summary.offsiteScreenTimeMinutes,
        offsite_screen_time_hours: summary.offsiteScreenTimeHours,
        activity_count: activities.length,
        onsite_activity_count: onsiteActivities,
        offsite_activity_count: offsiteActivities,
        activities: activities.map((item) => ({
          _id: String(item._id),
          action: item.action || "",
          entity_type: item.entity_type || "",
          entity_name: item.entity_name || "",
          message: item.message || "",
          mode: item.mode || null,
          created_at: item.createdAt || null,
          facility_id: item.facility_id ? String(item.facility_id) : null,
          utility_account_id: item.utility_account_id
            ? String(item.utility_account_id)
            : null,
        })),
      },
    });
  } catch (error) {
    applyHttpError(res, error);
  }
});

export {
  getUserPerformanceSummary,
  getUserPerformanceFacilities,
  getUserPerformanceUtilityAccounts,
  getUserPerformanceCompletedAudits,
  getUserPerformancePresence,
  getUserPerformancePresenceActivities,
};
