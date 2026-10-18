-- ============================================================
-- access_queries.sql
-- Albahri Incentives System - SQLite Views
-- ============================================================

PRAGMA foreign_keys = OFF;

-- ------------------------------------------------------------
-- 1) qryRptRew : تقرير كشف الحوافز والمكافآت
-- ------------------------------------------------------------
CREATE VIEW IF NOT EXISTS qryRptRew AS
SELECT
  R.RewardDate,
  E.EmpCode,
  E.FullName,
  RC.CategoryName,
  T.RewardDesc,
  R.Points,
  R.Amount,
  R.Status
FROM tblRewards AS R
INNER JOIN tblEmployees AS E ON R.EmpID = E.EmpID
LEFT JOIN tblRewardTypes AS T ON R.RewardTypeID = T.RewardTypeID
LEFT JOIN tblRewardCategories AS RC ON T.CategoryID = RC.CategoryID
ORDER BY R.RewardDate DESC;

-- ------------------------------------------------------------
-- 2) qryRptEmpPerf : ملخص أداء الموظفين
-- ------------------------------------------------------------
CREATE VIEW IF NOT EXISTS qryRptEmpPerf AS
SELECT
  E.EmpCode,
  E.FullName,
  B.BranchName,
  D.DeptName,
  IFNULL((SELECT COUNT(*) FROM tblViolations V WHERE V.EmpID = E.EmpID), 0) AS VioCount,
  IFNULL((SELECT SUM(V2.PenaltyAmount) FROM tblViolations V2 WHERE V2.EmpID = E.EmpID), 0) AS VioAmt,
  IFNULL((SELECT COUNT(*) FROM tblRewards R WHERE R.EmpID = E.EmpID), 0) AS RewCount,
  IFNULL((SELECT SUM(R2.Amount) FROM tblRewards R2 WHERE R2.EmpID = E.EmpID), 0) AS RewAmt,
  IFNULL((SELECT SUM(R3.Points) FROM tblRewards R3 WHERE R3.EmpID = E.EmpID), 0) AS Points
FROM tblEmployees AS E
LEFT JOIN tblBranches AS B ON E.BranchID = B.BranchID
LEFT JOIN tblDepartments AS D ON E.DeptID = D.DeptID
WHERE E.IsActive = 1
ORDER BY VioCount DESC, Points DESC;

-- ------------------------------------------------------------
-- 3) qryStats : إحصائيات شهرية عامة
-- ------------------------------------------------------------
CREATE VIEW IF NOT EXISTS qryStats AS
SELECT
  strftime('%Y-%m', R.RewardDate) AS YearMonth,
  COUNT(DISTINCT R.EmpID) AS EmployeesWithRewards,
  COUNT(R.RewardID) AS RewardsCount,
  IFNULL(SUM(R.Amount), 0) AS RewardsAmount,
  IFNULL(SUM(R.Points), 0) AS TotalPoints,
  (SELECT COUNT(*) FROM tblViolations V WHERE strftime('%Y-%m', V.ViolationDate) = strftime('%Y-%m', R.RewardDate)) AS ViolationsCount,
  (SELECT IFNULL(SUM(V2.PenaltyAmount), 0) FROM tblViolations V2 WHERE strftime('%Y-%m', V2.ViolationDate) = strftime('%Y-%m', R.RewardDate)) AS ViolationsAmount
FROM tblRewards AS R
GROUP BY strftime('%Y-%m', R.RewardDate)
ORDER BY YearMonth DESC;

PRAGMA foreign_keys = ON;
