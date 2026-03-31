-- Bổ sung điểm tin cậy cho user. Dữ liệu cũ được backfill theo số rescue đã hoàn tất.
IF COL_LENGTH('dbo.Users', 'TrustScore') IS NULL
BEGIN
    ALTER TABLE dbo.Users
    ADD TrustScore INT NOT NULL
        CONSTRAINT DF_Users_TrustScore DEFAULT (0);
END;
GO

UPDATE u
SET u.TrustScore = completed.CompletedCount
FROM dbo.Users u
CROSS APPLY
(
    SELECT COUNT(1) AS CompletedCount
    FROM dbo.RescueRequests r
    WHERE r.CustomerID = u.UserID
      AND r.Status = 'COMPLETED'
) completed
WHERE ISNULL(u.TrustScore, 0) <> completed.CompletedCount;
GO

-- Bổ sung dữ liệu đặt cọc ở mức rescue để backend có thể enforce và hiển thị quy tắc trả trước.
IF COL_LENGTH('dbo.RescueRequests', 'RequiresDeposit') IS NULL
BEGIN
    ALTER TABLE dbo.RescueRequests
    ADD RequiresDeposit BIT NOT NULL
            CONSTRAINT DF_RescueRequests_RequiresDeposit DEFAULT (0),
        DepositAmount DECIMAL(18, 2) NOT NULL
            CONSTRAINT DF_RescueRequests_DepositAmount DEFAULT (0),
        IsDepositPaid BIT NOT NULL
            CONSTRAINT DF_RescueRequests_IsDepositPaid DEFAULT (0),
        DepositPaidDate DATETIME NULL,
        DepositPaymentMethod NVARCHAR(20) NULL,
        DepositTransactionReference NVARCHAR(100) NULL;
END;
GO

-- Chỉ backfill các rescue đang còn hiệu lực. Rescue đã hoàn tất hoặc đã hủy giữ nguyên vòng đời cũ.
UPDATE rr
SET rr.RequiresDeposit = CASE WHEN ISNULL(u.TrustScore, 0) = 0 THEN 1 ELSE 0 END,
    rr.DepositAmount = CASE WHEN ISNULL(u.TrustScore, 0) = 0 THEN 500000 ELSE 0 END,
    rr.IsDepositPaid = CASE WHEN ISNULL(u.TrustScore, 0) = 0 THEN 0 ELSE 1 END
FROM dbo.RescueRequests rr
INNER JOIN dbo.Users u
    ON u.UserID = rr.CustomerID
WHERE rr.Status IN
(
    'PENDING',
    'REVIEWING',
    'PROPOSED_ROADSIDE',
    'PROPOSED_TOWING',
    'DISPATCHED',
    'EN_ROUTE',
    'ON_SITE',
    'DIAGNOSING',
    'REPAIRING',
    'REPAIR_COMPLETE',
    'TOWING_DISPATCHED',
    'TOWING_ACCEPTED',
    'TOWED',
    'INVOICED',
    'INVOICE_SENT',
    'PAYMENT_PENDING',
    'INVOICE_DISPUTED'
)
AND rr.DepositAmount = 0
AND rr.IsDepositPaid = 0;
GO
